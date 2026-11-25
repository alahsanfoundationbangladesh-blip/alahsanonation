/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";
import { getApiUrl } from "../utils/apiConfig";
import { getSupabaseClient } from "../supabaseClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const STORAGE_KEY = "ahf_user_session";

export const ADMIN_EMAILS = [
  "alahsanfoundationbangladesh@gmail.com",
  "fakenewsbd.tv@gmail.com",
  "muhiussunnahfoundation.bd.2@gmail.com",
  "muhiussunnahfoundation.bd@gmail.com",
];

export const isAdminEmail = (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === clean);
};

export const isAdminUser = (user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isAdminEmail(user.email);
};

// Turn error objects into readable Bengali messages.
// eslint-disable-next-line react-refresh/only-export-components
export const authErrorMessage = (error) => {
  if (!error) return "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  if (typeof error === "string") return error;
  const msg = error.message || "";
  if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
    return "Supabase-এ Google Provider এখনও চালু করা হয়নি। অনুগ্রহ করে Supabase Authentication > Providers > Google এ গিয়ে Enable করুন।";
  }
  if (msg.includes("Invalid login credentials") || msg.includes("সঠিক নয়")) {
    return "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।";
  }
  return msg || "লগইন সেবা এখন পাওয়া যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।";
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRecovery, setPendingRecovery] = useState(false);

  const saveUserSession = (userData) => {
    if (userData && isAdminEmail(userData.email)) {
      userData.role = "admin";
    }
    setUser(userData);
    try {
      if (userData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Could not save session to localStorage:", e);
    }
  };

  const syncSupabaseSession = (session) => {
    if (!session?.user) return null;
    const sUser = session.user;
    const email = (sUser.email || "").toLowerCase().trim();
    const isAdm = isAdminEmail(email);
    const meta = sUser.user_metadata || {};

    let displayName = meta.full_name || meta.name || "";
    let photoURL = meta.avatar_url || meta.picture || "";

    if (isAdm) {
      if (email === "fakenewsbd.tv@gmail.com") {
        displayName = displayName || "মো. শামীম এহসান";
        photoURL = photoURL || "https://i.ibb.co.com/nsgmKpH/Shamsh-Hadi.jpg";
      } else if (email.startsWith("muhiussunnah")) {
        displayName = displayName || "মুফতি মুহিউস সুন্নাহ";
        photoURL = photoURL || "https://i.ibb.co.com/xLVb14x/website-photos-2.webp";
      } else {
        displayName = displayName || "আল আহসান অ্যাডমিন";
        photoURL = photoURL || "/Warm-Hearts-Initiative.png";
      }
    } else {
      displayName = displayName || email.split("@")[0];
      photoURL = photoURL || "/Warm-Hearts-Initiative.png";
    }

    const appUser = {
      id: sUser.id,
      email,
      displayName,
      photoURL,
      role: isAdm ? "admin" : "user",
      provider: sUser.app_metadata?.provider || "google",
      token: session.access_token,
    };

    saveUserSession(appUser);
    return appUser;
  };

  // Initialize Auth & Supabase listener
  useEffect(() => {
    let isMounted = true;

    // First load from localStorage for instant render
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          if (isAdminEmail(parsed.email)) parsed.role = "admin";
          if (isMounted) setUser(parsed);
        }
      }
    } catch (e) {
      console.warn("Local storage parse error:", e);
    }

    // Connect real Supabase session
    (async () => {
      try {
        const supabase = await getSupabaseClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && isMounted) {
            syncSupabaseSession(session);
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, currentSession) => {
              if (!isMounted) return;
              if (currentSession?.user) {
                syncSupabaseSession(currentSession);
              } else if (event === "SIGNED_OUT") {
                saveUserSession(null);
              }
            }
          );

          return () => {
            authListener?.subscription?.unsubscribe();
          };
        }
      } catch (err) {
        console.warn("Supabase auth init warning:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Real Google OAuth via Supabase
  const googleLogin = async () => {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      throw new Error(
        "গুগল লগইন সেবা চালু করতে Supabase URL ও Anon Key প্রয়োজন। অনুগ্রহ করে Vercel Environment Variables-এ VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY সেট করুন।"
      );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Password Login (API / Supabase)
  const loginUser = async (email, password) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!trimmedEmail || !cleanPassword) {
      throw new Error("ইমেইল ও পাসওয়ার্ড প্রদান করুন।");
    }

    const response = await fetch(getApiUrl("auth-login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, password: cleanPassword }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
    }

    const isAdm = data.user.role === "admin" || isAdminEmail(trimmedEmail);
    const appUser = {
      id: data.user.id || (isAdm ? `admin-${trimmedEmail.split("@")[0]}` : `user-${Date.now()}`),
      email: data.user.email,
      displayName: data.user.displayName || (isAdm ? "আল আহসান অ্যাডমিন" : trimmedEmail.split("@")[0]),
      photoURL: data.user.photoURL || "/Warm-Hearts-Initiative.png",
      role: isAdm ? "admin" : "user",
      token: data.token,
    };

    saveUserSession(appUser);
    return { user: appUser };
  };

  const createUser = async (email, password, name, photoURL) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!trimmedEmail || !cleanPassword || !name) {
      throw new Error("সকল প্রয়োজনীয় তথ্য প্রদান করুন।");
    }

    const response = await fetch(getApiUrl("auth-register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        password: cleanPassword,
        name,
        photoURL: photoURL || "",
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।");
    }

    const isAdm = isAdminEmail(trimmedEmail);
    const appUser = {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName || name,
      photoURL: data.user.photoURL || photoURL || "",
      role: isAdm ? "admin" : (data.user.role || "user"),
      token: data.token,
    };

    saveUserSession(appUser);
    return { user: appUser, confirmed: true };
  };

  const signOutUser = async () => {
    try {
      const supabase = await getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("Supabase signout warning:", e);
    }
    saveUserSession(null);
    return Promise.resolve();
  };

  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!user) throw new Error("লগইন করা নেই।");
    const updated = {
      ...user,
      ...(displayName !== undefined ? { displayName } : {}),
      ...(photoURL !== undefined ? { photoURL } : {}),
    };
    saveUserSession(updated);
    return updated;
  };

  const resetPassword = async (email) => {
    const trimmed = String(email || "").trim().toLowerCase();
    if (!trimmed) throw new Error("অনুগ্রহ করে ইমেইল লিখুন।");
    setPendingRecovery(true);
    return Promise.resolve();
  };

  const setNewPassword = async (password) => {
    if (!password || password.length < 8) {
      throw new Error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
    }

    await fetch(getApiUrl("auth-set-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: user?.token ? `Bearer ${user.token}` : undefined,
      },
      body: JSON.stringify({
        email: user?.email || ADMIN_EMAILS[0],
        password,
      }),
    });

    setPendingRecovery(false);
    return Promise.resolve();
  };

  const authInfo = {
    createUser,
    loginUser,
    signOutUser,
    loading,
    user,
    setUser: saveUserSession,
    updateUserProfile,
    googleLogin,
    resetPassword,
    setNewPassword,
    pendingRecovery,
    ADMIN_EMAILS,
    isAdmin: isAdminUser(user),
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
