import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext, authErrorMessage, isAdminEmail } from "../context/AuthProvider";

const GOOGLE_ACCOUNTS = [
  {
    name: "মো. শামীম এহসান",
    email: "fakenewsbd.tv@gmail.com",
    role: "সমন্বয়ক ও প্রশাসন (অ্যাডমিন)",
    photoURL: "https://i.ibb.co.com/nsgmKpH/Shamsh-Hadi.jpg",
  },
  {
    name: "আল আহসান ফাউন্ডেশন",
    email: "alahsanfoundationbangladesh@gmail.com",
    role: "অফিসিয়াল (প্রধান অ্যাডমিন)",
    photoURL: "/Warm-Hearts-Initiative.png",
  },
  {
    name: "মুফতি মুহিউস সুন্নাহ",
    email: "muhiussunnahfoundation.bd.2@gmail.com",
    role: "প্রধান উপদেষ্টা (অ্যাডমিন)",
    photoURL: "https://i.ibb.co.com/xLVb14x/website-photos-2.webp",
  },
];

export default function GoogleAuthModal({ isOpen, onClose, onSuccess }) {
  const { googleLogin } = useContext(AuthContext);
  const [customEmail, setCustomEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = async (account) => {
    setLoading(true);
    try {
      await googleLogin(account);
      toast.success(`${account.name || account.email} হিসেবে সফলভাবে প্রবেশ করেছেন!`);
      onClose();
      if (onSuccess) onSuccess(account);
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("অনুগ্রহ করে একটি সঠিক জিমেইল/ইমেইল লিখুন।");
      return;
    }
    setLoading(true);
    try {
      const isAdm = isAdminEmail(cleanEmail);
      const acc = {
        email: cleanEmail,
        name: isAdm ? "আল আহসান অ্যাডমিন" : cleanEmail.split("@")[0],
        photoURL: "/Warm-Hearts-Initiative.png",
      };
      await googleLogin(acc);
      toast.success("গুগল অ্যাকাউন্ট দিয়ে সফলভাবে প্রবেশ করেছেন!");
      onClose();
      if (onSuccess) onSuccess(acc);
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-full hover:bg-gray-100 transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <svg className="h-7 w-7" viewBox="0 0 40 40">
            <path
              d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
              fill="#FFC107"
            />
            <path
              d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z"
              fill="#FF3D00"
            />
            <path
              d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z"
              fill="#4CAF50"
            />
            <path
              d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
              fill="#1976D2"
            />
          </svg>
          <div>
            <h3 className="text-lg font-bold text-gray-800">গুগল অ্যাকাউন্ট দিয়ে প্রবেশ</h3>
            <p className="text-xs text-gray-500">একটি অ্যাকাউন্ট বেছে নিন বা জিমেইল লিখুন</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            দায়িত্বশীলদের এক-ক্লিকে লগইন:
          </p>
          {GOOGLE_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={loading}
              onClick={() => handleSelectAccount(acc)}
              className="w-full flex items-center gap-3 p-3 text-left rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition group disabled:opacity-50"
            >
              <img
                src={acc.photoURL}
                alt={acc.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 truncate">
                    {acc.name}
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0 ml-1">
                    অ্যাডমিন
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{acc.email}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">অথবা অন্য যেকোনো গুগল ইমেইল</span>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <input
            type="email"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            placeholder="আপনার_ইমেইল@gmail.com"
            disabled={loading}
            className="w-full text-sm border border-gray-300 px-3 py-2.5 rounded-lg outline-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !customEmail}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "প্রবেশ হচ্ছে..." : "এই গুগল অ্যাকাউন্টে প্রবেশ করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}
