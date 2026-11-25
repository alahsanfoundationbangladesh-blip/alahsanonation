import crypto from "crypto";
import {
  isSupabaseConfigured,
  dbGetSetting,
  dbSetSetting,
  dbGetDonations,
  dbGetDonationById,
  dbCheckTrxExists,
  dbInsertDonation,
  dbUpdateDonation,
  dbGetExpenses,
  dbInsertExpense,
} from "./supabase.js";

export const ADMIN_EMAILS = [
  "alahsanfoundationbangladesh@gmail.com",
  "fakenewsbd.tv@gmail.com",
  "muhiussunnahfoundation.bd.2@gmail.com",
  "muhiussunnahfoundation.bd@gmail.com",
];

export function isAdminEmail(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === clean);
}

const ADMIN_EMAIL = ADMIN_EMAILS[0];

// In-memory fallback stores when Supabase is not yet configured in environment variables
const memoryDonations = new Map();
const memoryExpenses = new Map();
const memoryContent = new Map();
const memoryTrx = new Set();

const methods = new Set(["bKash", "Nagad", "Rocket"]);

const cleanText = (value, max = 160) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const validImage = (value) => {
  if (!value) return true;
  if (typeof value !== "string" || value.length > 3_000_000) return false;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};


function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 })).toString("base64url");
  const secret = process.env.ADMIN_SECRET_KEY || "ahf-secret-key-2026";
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

async function verifyAdmin(authHeader, adminEmailHeader, clientUser) {
  // 1. Client context / Netlify Identity (if enabled)
  if (clientUser?.email && isAdminEmail(clientUser.email)) {
    return { ok: true, email: clientUser.email };
  }

  // 2. Authorization Bearer Token
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();

    // Check with Supabase Auth first (for real Google OAuth tokens)
    if (useSupabase) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.auth.getUser(token);
          if (!error && data?.user?.email) {
            if (isAdminEmail(data.user.email)) {
              return { ok: true, email: data.user.email };
            }
            return { ok: false, error: "এই গুগল অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।" };
          }
        } catch { /* proceed to JWT check */ }
      }
    }

    // Check signed internal JWT
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if (payload?.exp && payload.exp * 1000 < Date.now()) {
          return { ok: false, error: "সেশনের মেয়াদ শেষ হয়েছে। আবার লগইন করুন।" };
        }
        if (isAdminEmail(payload?.email) && payload?.role === "admin") {
          return { ok: true, email: payload.email };
        }
      }
    } catch { /* ignore */ }
  }

  // 3. Secret token fallback (optional ADMIN_SECRET_KEY in server env)
  const envSecret = process.env.ADMIN_SECRET_KEY;
  if (envSecret && authHeader === `Bearer ${envSecret}`) {
    return { ok: true, email: ADMIN_EMAIL };
  }

  return { ok: false, error: "অ্যাডমিন অনুমতি নেই। সঠিক অ্যাকাউন্টে লগইন করুন।" };
}

async function sendReceiptEmail(donation, attemptKey = "initial") {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("ইমেইল পাঠানোর সেটআপ সম্পূর্ণ নয়। Vercel/হোস্টিং সেটিংসে RESEND_API_KEY ও RESEND_FROM_EMAIL সেট করতে হবে।");
  }
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const invoiceNumber = `AHF-${String(donation.id).slice(-10).toUpperCase()}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `donation-invoice/${donation.id}/${attemptKey}`,
    },
    body: JSON.stringify({
      from,
      to: [donation.email],
      subject: `অনুদানের রসিদ ${invoiceNumber} | আল আহসান ফাউন্ডেশন`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17324d"><h1>অনুদানের রসিদ</h1><p>প্রিয় ${escapeHtml(donation.name)},</p><p>আপনার অনুদান যাচাই করে গ্রহণ করা হয়েছে। পাশে থাকার জন্য আন্তরিক ধন্যবাদ।</p><table style="border-collapse:collapse;width:100%"><tr><td>রসিদ নম্বর</td><td>${invoiceNumber}</td></tr><tr><td>অনুদানের পরিমাণ</td><td>৳${Number(donation.amount).toLocaleString("bn-BD")}</td></tr><tr><td>মাধ্যম</td><td>${escapeHtml(donation.method)}</td></tr><tr><td>TrxID</td><td>${escapeHtml(donation.trxId)}</td></tr><tr><td>কার্যক্রম</td><td>${escapeHtml(donation.campaignTitle || "সাধারণ অনুদান")}</td></tr></table><p>আল আহসান ফাউন্ডেশন</p></div>`,
      text: `অনুদানের রসিদ ${invoiceNumber}\nপরিমাণ: ৳${donation.amount}\nমাধ্যম: ${donation.method}\nTrxID: ${donation.trxId}\nকার্যক্রম: ${donation.campaignTitle || "সাধারণ অনুদান"}`,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "ইমেইল পাঠানো যায়নি।");
  return { invoiceNumber, emailId: result.id };
}

export async function handleApiRequest(req, res, context) {
  const isNode = Boolean(res && typeof res.status === "function");

  const send = (body, status = 200) => {
    if (isNode) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-email");
      return res.status(status).json(body);
    }
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
      },
    });
  };

  const getMethod = () => req.method?.toUpperCase() || "GET";

  const getUrl = () => {
    if (isNode) {
      const host = req.headers?.host || "localhost";
      return new URL(req.url, `https://${host}`);
    }
    return new URL(req.url);
  };

  const getHeader = (name) => {
    if (isNode) {
      const val = req.headers?.[name.toLowerCase()];
      return Array.isArray(val) ? val[0] : val;
    }
    return req.headers?.get(name);
  };

  const parseBody = async () => {
    if (isNode) {
      if (req.body) {
        return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      }
      return {};
    }
    try {
      return await req.json();
    } catch {
      return {};
    }
  };

  const method = getMethod();
  if (method === "OPTIONS") {
    if (isNode) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-email");
      return res.status(204).end();
    }
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
      },
    });
  }

  const url = getUrl();
  let action = url.searchParams.get("action");
  if (!action && isNode && req.query?.action) {
    action = req.query.action;
  }

  const useSupabase = isSupabaseConfigured();

  try {    // 0. Auth Login (POST)
    // 0. Public Auth Config (GET)
    if (action === "public-auth-config" && method === "GET") {
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
      const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
      return send({
        configured: Boolean(url && anonKey),
        supabaseUrl: url,
        supabaseAnonKey: anonKey,
      });
    }

    // 0. Auth Login (POST) - Strict credential verification
    if (action === "auth-login" && method === "POST") {
      const input = await parseBody();
      const email = cleanText(input?.email, 254).toLowerCase();
      const password = String(input?.password || "");

      if (!email || !password) {
        return send({ error: "ইমেইল ও পাসওয়ার্ড প্রদান করুন।" }, 400);
      }

      if (isAdminEmail(email)) {
        const envAdminPass = process.env.ADMIN_PASSWORD;
        let storedAuth = null;
        if (useSupabase) {
          storedAuth = await dbGetSetting("admin_auth");
        } else {
          storedAuth = memoryContent.get("admin_auth");
        }

        let isValid = false;
        if (envAdminPass && password === envAdminPass) {
          isValid = true;
        } else if (storedAuth && storedAuth.passwordHash) {
          const hash = crypto.createHash("sha256").update(password).digest("hex");
          isValid = (storedAuth.passwordHash === hash);
        }

        if (!isValid) {
          return send({ error: "পাসওয়ার্ড সঠিক নয়।" }, 401);
        }

        let displayName = "আল আহসান অ্যাডমিন";
        let photoURL = "/Warm-Hearts-Initiative.png";
        if (email === "fakenewsbd.tv@gmail.com") {
          displayName = "মো. শামীম এহসান";
          photoURL = "https://i.ibb.co.com/nsgmKpH/Shamsh-Hadi.jpg";
        } else if (email.startsWith("muhiussunnah")) {
          displayName = "মুফতি মুহিউস সুন্নাহ";
          photoURL = "https://i.ibb.co.com/xLVb14x/website-photos-2.webp";
        }

        const token = createToken({ email, role: "admin", name: displayName });
        return send({
          ok: true,
          user: {
            id: `admin-${email.split("@")[0]}`,
            email,
            displayName,
            role: "admin",
            photoURL,
            token,
          },
          token,
        });
      }

      // Regular user login
      let usersList = [];
      if (useSupabase) {
        usersList = (await dbGetSetting("registered_users")) || [];
      }
      const foundUser = usersList.find((u) => u.email?.toLowerCase() === email);
      if (!foundUser) {
        return send({ error: "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধন করুন।" }, 404);
      }
      const hash = crypto.createHash("sha256").update(password).digest("hex");
      if (foundUser.passwordHash !== hash && foundUser.password !== password) {
        return send({ error: "পাসওয়ার্ড সঠিক নয়।" }, 401);
      }

      const token = createToken({ email: foundUser.email, role: "user", name: foundUser.name });
      return send({
        ok: true,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          displayName: foundUser.name,
          role: "user",
          photoURL: foundUser.photoURL || "",
          token,
        },
        token,
      });
    }

    if (action === "auth-register" && method === "POST") {
      const input = await parseBody();
      const email = cleanText(input?.email, 254).toLowerCase();
      const password = String(input?.password || "");
      const name = cleanText(input?.name, 100);
      const photoURL = cleanText(input?.photoURL, 500);

      if (!email || !password || !name) {
        return send({ error: "সকল প্রয়োজনীয় তথ্য পূরণ করুন।" }, 400);
      }

      if (email === ADMIN_EMAIL.toLowerCase()) {
        return send({ error: "অ্যাডমিন অ্যাকাউন্টে সরাসরি লগইন করুন।" }, 400);
      }

      let usersList = [];
      if (useSupabase) {
        usersList = (await dbGetSetting("registered_users")) || [];
      }
      if (usersList.some((u) => u.email?.toLowerCase() === email)) {
        return send({ error: "এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।" }, 409);
      }

      const hash = crypto.createHash("sha256").update(password).digest("hex");
      const newUser = {
        id: `usr-${Date.now()}`,
        email,
        name,
        passwordHash: hash,
        photoURL: photoURL || "",
        createdAt: new Date().toISOString(),
      };

      usersList.push(newUser);
      if (useSupabase) {
        await dbSetSetting("registered_users", usersList);
      }

      const token = createToken({ email: newUser.email, role: "user", name: newUser.name });
      return send({
        ok: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.name,
          role: "user",
          photoURL: newUser.photoURL,
          token,
        },
        token,
      });
    }

    // 0.2 Auth Set Password (POST)
    if (action === "auth-set-password" && method === "POST") {
      const input = await parseBody();
      const email = cleanText(input?.email || ADMIN_EMAIL, 254).toLowerCase();
      const password = String(input?.password || "");

      if (!password || password.length < 8) {
        return send({ error: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" }, 400);
      }

      const hash = crypto.createHash("sha256").update(password).digest("hex");

      if (email === ADMIN_EMAIL.toLowerCase()) {
        if (useSupabase) {
          await dbSetSetting("admin_auth", {
            email: ADMIN_EMAIL,
            passwordHash: hash,
            updatedAt: new Date().toISOString(),
          });
        }
        return send({ ok: true, message: "অ্যাডমিন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      let usersList = [];
      if (useSupabase) {
        usersList = (await dbGetSetting("registered_users")) || [];
      }
      const idx = usersList.findIndex((u) => u.email?.toLowerCase() === email);
      if (idx !== -1) {
        usersList[idx].passwordHash = hash;
        if (useSupabase) {
          await dbSetSetting("registered_users", usersList);
        }
        return send({ ok: true, message: "পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে।" });
      }

      return send({ error: "ব্যবহারকারী পাওয়া যায়নি।" }, 404);
    }

    // 1. Public Settings (GET)
    if (action === "public-settings" && method === "GET") {
      let data = null;
      if (useSupabase) {
        data = await dbGetSetting("settings");
      }
      if (!data && memoryContent.has("settings")) {
        data = memoryContent.get("settings");
      }
      return send(data);
    }

    // 2. Public Campaigns (GET)
    if (action === "public-campaigns" && method === "GET") {
      let data = null;
      if (useSupabase) {
        data = await dbGetSetting("campaigns");
      }
      if (!data && memoryContent.has("campaigns")) {
        data = memoryContent.get("campaigns");
      }
      return send(data);
    }

    // 3. Donation Submission (POST)
    if (action === "donation" && method === "POST") {
      const input = await parseBody();
      const amount = Number(input.amount);
      const name = cleanText(input.name, 100);
      const email = cleanText(input.email, 254).toLowerCase();
      const phone = cleanText(input.phone, 24);
      const methodChoice = cleanText(input.method, 16);
      const trxId = cleanText(input.trxId, 80).replace(/\s/g, "").toUpperCase();

      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone || !methods.has(methodChoice) || !trxId || !Number.isFinite(amount) || amount < 1 || amount > 1000000) {
        return send({ error: "নাম, সঠিক ইমেইল, মোবাইল নম্বর, মাধ্যম, TrxID ও ১–১০,০০,০০০ টাকার বৈধ অনুদান দিন।" }, 400);
      }

      // Check TrxID uniqueness
      if (useSupabase) {
        const exists = await dbCheckTrxExists(trxId);
        if (exists) {
          return send({ error: "এই TrxID আগে জমা দেওয়া হয়েছে।" }, 409);
        }
      } else if (memoryTrx.has(trxId)) {
        return send({ error: "এই TrxID আগে জমা দেওয়া হয়েছে।" }, 409);
      }

      const id = input.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        id: String(id),
        name,
        email,
        phone,
        method: methodChoice,
        trxId,
        amount,
        campaignId: input.campaignId ? Number(input.campaignId) : null,
        campaignTitle: cleanText(input.campaignTitle, 140),
        note: cleanText(input.note, 500),
        status: "pending",
        invoiceNumber: null,
        emailStatus: null,
        emailError: null,
        emailId: null,
        emailAttempts: [],
        approvedAt: null,
        rejectedAt: null,
        createdAt: new Date().toISOString(),
      };

      if (useSupabase) {
        try {
          await dbInsertDonation(record);
        } catch (dbErr) {
          console.error("[Donation Save Error]", dbErr);
          // Also keep in memory as safety net
          memoryTrx.add(trxId);
          memoryDonations.set(`donation/${id}`, record);
        }
      } else {
        memoryTrx.add(trxId);
        memoryDonations.set(`donation/${id}`, record);
      }

      return send({ success: true, donationId: id, message: "অনুদানের তথ্য জমা হয়েছে। যাচাই শেষে ইমেইলে রসিদ পাঠানো হবে।" }, 201);
    }

    // 4. Admin Data (GET)
    if (action === "admin-data" && method === "GET") {
      const auth = await verifyAdmin(
        getHeader("authorization"),
        getHeader("x-admin-email"),
        context?.clientContext?.user
      );
      if (!auth.ok) return send({ error: auth.error }, 401);

      let donations = [];
      let expenses = [];
      let settings = null;
      let campaigns = null;

      if (useSupabase) {
        const [dbDonations, dbExpenses, dbSettings, dbCampaigns] = await Promise.all([
          dbGetDonations(),
          dbGetExpenses(),
          dbGetSetting("settings"),
          dbGetSetting("campaigns"),
        ]);
        donations = dbDonations || Array.from(memoryDonations.values());
        expenses = dbExpenses || Array.from(memoryExpenses.values());
        settings = dbSettings || memoryContent.get("settings") || null;
        campaigns = dbCampaigns || memoryContent.get("campaigns") || null;
      } else {
        donations = Array.from(memoryDonations.values());
        expenses = Array.from(memoryExpenses.values());
        settings = memoryContent.get("settings") || null;
        campaigns = memoryContent.get("campaigns") || null;
      }

      return send({
        donations: donations.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
        expenses: expenses.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
        settings,
        campaigns,
        database: useSupabase ? "supabase" : "memory_fallback",
      });
    }

    // 5. Admin Actions (POST)
    if (action === "admin" && method === "POST") {
      const auth = await verifyAdmin(
        getHeader("authorization"),
        getHeader("x-admin-email"),
        context?.clientContext?.user
      );
      if (!auth.ok) return send({ error: auth.error }, 401);
      const input = await parseBody();

      // 5.1 Verify Donation
      if (input.action === "verify-donation") {
        let donation = null;
        if (useSupabase) {
          donation = await dbGetDonationById(input.id);
        }
        if (!donation) {
          donation = memoryDonations.get(`donation/${input.id}`) || null;
        }

        if (!donation) return send({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, 404);
        if (donation.status === "approved") return send({ error: "এই অনুদান আগে যাচাই করা হয়েছে।" }, 409);
        if (donation.status !== "pending") return send({ error: "শুধুমাত্র অপেক্ষমাণ অনুদান অনুমোদন করা যাবে।" }, 409);

        const invoiceNumber = `AHF-${String(donation.id).slice(-10).toUpperCase()}`;
        let emailStatus = "pending";
        let emailError = null;
        let emailId = null;

        if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
          try {
            const receipt = await sendReceiptEmail(donation, "approval");
            emailStatus = "sent";
            emailId = receipt.emailId;
          } catch (err) {
            emailStatus = "failed";
            emailError = err.message || "ইমেইল পাঠানো যায়নি।";
          }
        } else {
          emailStatus = "failed";
          emailError = "Vercel বা সার্ভারে RESEND_API_KEY ও RESEND_FROM_EMAIL সেট করা নেই।";
        }

        const updated = {
          ...donation,
          status: "approved",
          invoiceNumber,
          approvedAt: new Date().toISOString(),
          emailStatus,
          emailError,
          emailId,
          lastEmailAttempt: new Date().toISOString(),
          emailAttempts: [...(donation.emailAttempts || []), {
            status: emailStatus,
            attemptedAt: new Date().toISOString(),
            emailId,
            error: emailError,
          }].slice(-10),
        };

        if (useSupabase) {
          await dbUpdateDonation(input.id, updated);
        }
        memoryDonations.set(`donation/${input.id}`, updated);

        const msg = emailStatus === "sent"
          ? "অনুদান যাচাই হয়েছে এবং রসিদ ইমেইলে পাঠানো হয়েছে।"
          : `অনুদান অনুমোদিত হয়েছে, কিন্তু রসিদ পাঠানো যায়নি (${emailError})। অ্যাডমিন প্যানেল থেকে পুনরায় পাঠাতে পারবেন।`;
        return send({ success: true, donation: updated, message: msg });
      }

      // 5.2 Resend Receipt
      if (input.action === "resend-receipt") {
        let donation = null;
        if (useSupabase) {
          donation = await dbGetDonationById(input.id);
        }
        if (!donation) {
          donation = memoryDonations.get(`donation/${input.id}`) || null;
        }

        if (!donation) return send({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, 404);
        if (donation.status !== "approved") return send({ error: "শুধুমাত্র অনুমোদিত অনুদানের রসিদ পুনরায় পাঠানো যাবে।" }, 400);

        const targetEmail = donation.email;
        if (!/^\S+@\S+\.\S+$/.test(targetEmail || "")) {
          return send({ error: "দাতার ইমেইল ঠিকানাটি সঠিক নয়।" }, 400);
        }

        const attemptId = /^[a-zA-Z0-9-]{8,100}$/.test(input.attemptId || "")
          ? input.attemptId
          : globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
        const attemptedAt = new Date().toISOString();
        const toSend = { ...donation, email: targetEmail };

        try {
          if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
            throw new Error("সার্ভারে ইমেইল পাঠানোর সেটিংস নেই।");
          }
          const receipt = await sendReceiptEmail(toSend, attemptId);
          const updated = {
            ...donation,
            emailStatus: "sent",
            emailError: null,
            emailId: receipt.emailId,
            lastEmailAttempt: attemptedAt,
            emailAttempts: [...(donation.emailAttempts || []), {
              status: "sent", attemptedAt, emailId: receipt.emailId, error: null,
            }].slice(-10),
          };

          if (useSupabase) {
            await dbUpdateDonation(input.id, updated);
          }
          memoryDonations.set(`donation/${input.id}`, updated);

          return send({ success: true, donation: updated, message: "রসিদ ইমেইল সফলভাবে পাঠানো হয়েছে।" });
        } catch (err) {
          const errorMessage = err.message || "ইমেইল পাঠানো যায়নি।";
          const updated = {
            ...donation,
            emailStatus: "failed",
            emailError: errorMessage,
            lastEmailAttempt: attemptedAt,
            emailAttempts: [...(donation.emailAttempts || []), {
              status: "failed", attemptedAt, emailId: null, error: errorMessage,
            }].slice(-10),
          };

          if (useSupabase) {
            await dbUpdateDonation(input.id, updated);
          }
          memoryDonations.set(`donation/${input.id}`, updated);

          return send({ error: `ইমেইল পাঠানো ব্যর্থ হয়েছে: ${errorMessage}`, donation: updated }, 502);
        }
      }

      // 5.3 Reject Donation
      if (input.action === "reject-donation") {
        let donation = null;
        if (useSupabase) {
          donation = await dbGetDonationById(input.id);
        }
        if (!donation) {
          donation = memoryDonations.get(`donation/${input.id}`) || null;
        }

        if (!donation) return send({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, 404);
        if (donation.status !== "pending") return send({ error: "শুধুমাত্র অপেক্ষমাণ অনুদান বাতিল করা যাবে।" }, 409);

        const updated = { ...donation, status: "rejected", rejectedAt: new Date().toISOString() };
        if (useSupabase) {
          await dbUpdateDonation(input.id, updated);
        }
        memoryDonations.set(`donation/${input.id}`, updated);
        return send({ success: true, donation: updated });
      }

      // 5.4 Add Expense
      if (input.action === "add-expense") {
        const amount = Number(input.amount);
        const title = cleanText(input.title, 140);
        if (!title || !Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
          return send({ error: "ব্যয়ের শিরোনাম ও সঠিক টাকার পরিমাণ দিন।" }, 400);
        }
        const record = {
          id: input.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          category: cleanText(input.category, 80),
          amount,
          note: cleanText(input.note, 500),
          createdAt: new Date().toISOString(),
          createdBy: auth.email,
        };

        if (useSupabase) {
          try {
            await dbInsertExpense(record);
          } catch (eErr) {
            console.error("[Expense Save Error]", eErr);
            memoryExpenses.set(`expense/${record.id}`, record);
          }
        } else {
          memoryExpenses.set(`expense/${record.id}`, record);
        }

        return send({ success: true, expense: record }, 201);
      }

      // 5.5 Save Content (Settings / Campaigns)
      if (input.action === "save-content") {
        const value = input.value;
        if (!value || typeof value !== "object") return send({ error: "সংরক্ষণের তথ্য সঠিক নয়।" }, 400);

        if (value.kind === "settings") {
          if (!validImage(value.settings?.logo) || !validImage(value.settings?.overviewImage)) {
            return send({ error: "লোগো বা ওভারভিউ ছবির ঠিকানা সঠিক নয়।" }, 400);
          }

          let heroSlides = null;
          if (Array.isArray(value.settings?.heroSlides)) {
            heroSlides = value.settings.heroSlides.slice(0, 10).map((s) => ({
              image: cleanText(s.image, 3_000_000),
              heading: cleanText(s.heading, 140),
              description: cleanText(s.description, 500),
              buttonLabel: cleanText(s.buttonLabel, 60),
              buttonLink: cleanText(s.buttonLink, 200) || "/donate",
            }));
            for (const slide of heroSlides) {
              const link = slide.buttonLink;
              if (!(link.startsWith("/") && !link.startsWith("//")) && !/^https:\/\//i.test(link)) {
                return send({ error: "স্লাইডের বোতামের ঠিকানা সাইটের পাতা অথবা HTTPS লিংক হতে হবে।" }, 400);
              }
            }
            for (const slide of heroSlides) {
              if (slide.image && !validImage(slide.image)) {
                return send({ error: "স্লাইডের ছবির ফরম্যাট সঠিক নয়।" }, 400);
              }
            }
          }

          const rawDelay = Number(value.settings?.sliderAutoplayDelay);
          const sliderAutoplayDelay = Number.isFinite(rawDelay) && rawDelay >= 1 && rawDelay <= 60 ? rawDelay : 5;

          const rawAbout = value.settings?.about && typeof value.settings.about === "object" ? value.settings.about : null;
          let about = null;
          if (rawAbout) {
            let teamMembers = null;
            if (Array.isArray(rawAbout.teamMembers)) {
              teamMembers = rawAbout.teamMembers.slice(0, 50).map((m, idx) => ({
                id: m.id || (idx + 1),
                name: cleanText(m.name, 100),
                role: cleanText(m.role, 120),
                image: cleanText(m.image, 3_000_000) || "",
                bio: cleanText(m.bio, 500) || "",
              }));
            }
            about = {
              headerTitle: cleanText(rawAbout.headerTitle, 140),
              headerSubtitle: cleanText(rawAbout.headerSubtitle, 300),
              missionTitle: cleanText(rawAbout.missionTitle, 140),
              missionText1: cleanText(rawAbout.missionText1, 2000),
              missionText2: cleanText(rawAbout.missionText2, 2000),
              missionImage: cleanText(rawAbout.missionImage, 3_000_000),
              visionTitle: cleanText(rawAbout.visionTitle, 140),
              visionText: cleanText(rawAbout.visionText, 2000),
              ctaTitle: cleanText(rawAbout.ctaTitle, 140),
              ctaSubtitle: cleanText(rawAbout.ctaSubtitle, 300),
              ctaButtonText: cleanText(rawAbout.ctaButtonText, 60),
              ctaButtonLink: cleanText(rawAbout.ctaButtonLink, 200) || "/donate",
              teamSectionTitle: cleanText(rawAbout.teamSectionTitle, 140),
              teamMembers,
            };
          }

          const rawHow = value.settings?.howItWorks && typeof value.settings.howItWorks === "object" ? value.settings.howItWorks : null;
          let howItWorks = null;
          if (rawHow) {
            let steps = null;
            if (Array.isArray(rawHow.steps)) {
              steps = rawHow.steps.slice(0, 20).map((s, idx) => ({
                id: s.id || (idx + 1),
                stepNumber: cleanText(s.stepNumber, 20) || String(idx + 1),
                title: cleanText(s.title, 140),
                description: cleanText(s.description, 600),
              }));
            }
            howItWorks = {
              title: cleanText(rawHow.title, 140),
              steps,
              divisionsTitle: cleanText(rawHow.divisionsTitle, 140),
              divisionsSubtitle: cleanText(rawHow.divisionsSubtitle, 300),
              divisions: cleanText(rawHow.divisions, 500),
              flowchartImage: cleanText(rawHow.flowchartImage, 3_000_000),
            };
          }

          const rawTestimonials = value.settings?.testimonials && typeof value.settings.testimonials === "object" ? value.settings.testimonials : null;
          let testimonials = null;
          if (rawTestimonials) {
            let items = null;
            if (Array.isArray(rawTestimonials.items)) {
              items = rawTestimonials.items.slice(0, 50).map((item, idx) => ({
                id: item.id || (idx + 1),
                name: cleanText(item.name, 100),
                role: cleanText(item.role, 100),
                image: cleanText(item.image, 3_000_000),
                message: cleanText(item.message, 1500),
                location: cleanText(item.location, 80),
                title: cleanText(item.title, 140),
              }));
            }
            testimonials = {
              title: cleanText(rawTestimonials.title, 140),
              items,
            };
          }

          const rawFaqs = value.settings?.faqs && typeof value.settings.faqs === "object" ? value.settings.faqs : null;
          let faqs = null;
          if (rawFaqs) {
            let items = null;
            if (Array.isArray(rawFaqs.items)) {
              items = rawFaqs.items.slice(0, 50).map((item, idx) => ({
                id: item.id || (idx + 1),
                question: cleanText(item.question, 300),
                answer: cleanText(item.answer, 2500),
              }));
            }
            faqs = {
              title: cleanText(rawFaqs.title, 140),
              items,
            };
          }

          const rawContact = value.settings?.contact && typeof value.settings.contact === "object" ? value.settings.contact : null;
          let contact = null;
          if (rawContact) {
            contact = {
              headerTitle: cleanText(rawContact.headerTitle, 140),
              headerSubtitle: cleanText(rawContact.headerSubtitle, 300),
              formTitle: cleanText(rawContact.formTitle, 140),
              formSubtitle: cleanText(rawContact.formSubtitle, 300),
              phone: cleanText(rawContact.phone, 40),
              email: cleanText(rawContact.email, 120),
              address: cleanText(rawContact.address, 200),
              ctaTitle: cleanText(rawContact.ctaTitle, 140),
              ctaSubtitle: cleanText(rawContact.ctaSubtitle, 300),
              ctaButtonText: cleanText(rawContact.ctaButtonText, 60),
              ctaButtonLink: cleanText(rawContact.ctaButtonLink, 200) || "/donate",
              facebookUrl: cleanText(rawContact.facebookUrl, 300),
              twitterUrl: cleanText(rawContact.twitterUrl, 300),
              instagramUrl: cleanText(rawContact.instagramUrl, 300),
              youtubeUrl: cleanText(rawContact.youtubeUrl, 300),
              linkedinUrl: cleanText(rawContact.linkedinUrl, 300),
              footerDescription: cleanText(rawContact.footerDescription, 600),
              bkashNumber: cleanText(rawContact.bkashNumber, 30),
              nagadNumber: cleanText(rawContact.nagadNumber, 30),
              rocketNumber: cleanText(rawContact.rocketNumber, 30),
            };
          }

          let rootTeam = null;
          if (Array.isArray(value.settings?.teamMembers)) {
            rootTeam = value.settings.teamMembers.slice(0, 50).map((m, idx) => ({
              id: m.id || (idx + 1),
              name: cleanText(m.name, 100),
              role: cleanText(m.role, 120),
              image: cleanText(m.image, 3_000_000) || "",
              bio: cleanText(m.bio, 500) || "",
            }));
          }

          const settings = {
            siteName: cleanText(value.settings?.siteName, 80) || "আল আহসান ফাউন্ডেশন",
            logo: cleanText(value.settings?.logo, 3_000_000) || "/Warm-Hearts-Initiative.png",
            primaryColor: /^#[0-9a-f]{6}$/i.test(value.settings?.primaryColor || "") ? value.settings.primaryColor : "#4A90E2",
            overviewTitle: cleanText(value.settings?.overviewTitle, 140) || "আল আহসান ফাউন্ডেশন সম্পর্কে",
            overview: cleanText(value.settings?.overview, 3000),
            overviewImage: cleanText(value.settings?.overviewImage, 3_000_000),
            sliderAutoplayDelay,
            heroSlides,
            about: about || (rootTeam ? { teamMembers: rootTeam } : null),
            howItWorks,
            testimonials,
            faqs,
            contact,
            teamMembers: rootTeam || about?.teamMembers || null,
          };

          if (useSupabase) {
            await dbSetSetting("settings", settings);
          }
          memoryContent.set("settings", settings);
          return send({ success: true, value: settings });
        }

        if (value.kind === "campaigns" && Array.isArray(value.campaigns) && value.campaigns.length <= 100) {
          if (value.campaigns.some((campaign) => !cleanText(campaign.title, 140))) {
            return send({ error: "প্রতিটি কার্যক্রমের নাম লিখুন।" }, 400);
          }
          if (value.campaigns.some((campaign) => !validImage(campaign.image))) {
            return send({ error: "কার্যক্রমের ছবি PNG, JPEG, WebP বা GIF হতে হবে, অথবা HTTPS ছবির ঠিকানা দিন।" }, 400);
          }
          const campaigns = value.campaigns.map((campaign, idx) => {
            const goal = Math.max(0, Number(campaign.goal) || 0);
            const current_funds = Math.max(0, Number(campaign.current_funds) || 0);
            const calculatedProgress = goal > 0 ? Math.min(100, Math.round((current_funds / goal) * 100)) : 0;
            const progress = goal > 0 ? calculatedProgress : 0;
            const rawStatus = cleanText(campaign.status, 40);
            const status = ["active", "চলমান"].includes(rawStatus.toLowerCase())
              ? "চলমান"
              : ["completed", "সম্পন্ন"].includes(rawStatus.toLowerCase())
                ? "সম্পন্ন"
                : ["paused", "স্থগিত"].includes(rawStatus.toLowerCase())
                  ? "স্থগিত"
                  : rawStatus || "চলমান";

            return {
              id: Number(campaign.id) || (idx + 1),
              title: cleanText(campaign.title, 140),
              description: cleanText(campaign.description, 2500),
              secondary_description: cleanText(campaign.secondary_description, 4000),
              image: cleanText(campaign.image, 3_000_000),
              division: cleanText(campaign.division, 60) || "বাংলাদেশ",
              status,
              goal,
              current_funds,
              progress,
              contactInfo: cleanText(campaign.contactInfo, 100) || "alahsanfoundationbangladesh@gmail.com",
            };
          });

          if (useSupabase) {
            await dbSetSetting("campaigns", campaigns);
          }
          memoryContent.set("campaigns", campaigns);
          return send({ success: true, campaigns });
        }

        return send({ error: "পরিচিতির ধরন সঠিক নয়।" }, 400);
      }

      return send({ error: "কাজটি শনাক্ত করা যায়নি।" }, 400);
    }

    return send({ error: "ঠিকানাটি পাওয়া যায়নি।" }, 404);
  } catch (error) {
    console.error("[API Error]", error);
    return send({ error: "সার্ভারে সাময়িক সমস্যা হয়েছে। আবার চেষ্টা করুন; প্রয়োজনে প্রশাসকের সঙ্গে যোগাযোগ করুন।" }, 500);
  }
}
