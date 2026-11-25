import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import { FaEyeSlash } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext, authErrorMessage, isAdminUser } from "../context/AuthProvider";
import { useBranding } from "../context/BrandingContext";

const Login = () => {
  const { loginUser, googleLogin, user } = useContext(AuthContext);
  const { settings } = useBranding();
  const [type, setType] = useState("password");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect automatically when user is logged in (including Google OAuth redirect)
  useEffect(() => {
    if (user) {
      if (isAdminUser(user)) {
        navigate("/admin", { replace: true });
      } else {
        navigate(location?.state?.from || "/", { replace: true });
      }
    }
  }, [user, navigate, location]);

  const handelGoogle = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await googleLogin();
      // Browser redirects to Google OAuth
    } catch (error) {
      toast.error(authErrorMessage(error));
      setLoading(false);
    }
  };

  const handelSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const emailVal = form.get("email");
    const password = form.get("password");

    setLoading(true);
    loginUser(emailVal, password)
      .then((res) => {
        toast.success("সফলভাবে লগইন হয়েছে।");
        e.target.reset();
        if (isAdminUser(res?.user)) {
          navigate("/admin");
        } else {
          navigate(location?.state?.from || "/");
        }
      })
      .catch((error) => {
        toast.error(authErrorMessage(error));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleToggle = () => {
    setType(type === "password" ? "text" : "password");
  };

  return (
    <div className="flex justify-center items-center my-10 px-4">
      <Helmet>
        <title>লগইন | {settings?.siteName || "আল আহসান ফাউন্ডেশন"}</title>
      </Helmet>
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl p-6">
        <h2 className="text-2xl font-bold text-center">আপনার একাউন্টে লগইন করুন</h2>
        <form onSubmit={handelSubmit} className="card-body">
          <div className="form-control">
            <label className="label">
              <span className="label-text">ই-মেইল</span>
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="আপনার ইমেইল লিখুন"
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">পাসওয়ার্ড</span>
            </label>
            <div className="relative">
              <input
                type={type}
                name="password"
                placeholder="আপনার পাসওয়ার্ড লিখুন"
                className="input input-bordered w-full"
                required
              />
              <button
                type="button"
                onClick={handleToggle}
                className="absolute top-4 right-3 text-gray-500"
              >
                {type === "password" ? <FaEyeSlash /> : <IoEyeSharp />}
              </button>
            </div>
            <label className="label">
              <Link
                to="/forgot-password"
                state={{ email: email }}
                className="label-text-alt link link-hover text-primary font-semibold"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </label>
          </div>
          <div className="form-control mt-6">
            <button disabled={loading} className="btn btn-primary text-white">
              {loading ? "অপেক্ষা করুন..." : "লগইন করুন"}
            </button>
          </div>
        </form>

        <p className="text-center">
          একাউন্ট নেই?{" "}
          <Link to="/register" className="text-red-500 font-bold">
            রেজিস্টার করুন
          </Link>
        </p>

        <div className="flex items-center justify-between mt-4">
          <span className="w-1/5 border-b lg:w-1/5"></span>
          <p className="text-xs text-center text-gray-500 uppercase">অথবা গুগল দিয়ে প্রবেশ</p>
          <span className="w-1/5 border-b lg:w-1/5"></span>
        </div>

        <button
          onClick={handelGoogle}
          disabled={loading}
          type="button"
          className="flex items-center justify-center gap-2 mt-4 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 40 40">
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
          <span className="text-sm font-semibold">গুগল দিয়ে সরাসরি প্রবেশ</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
