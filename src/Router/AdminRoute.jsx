/* eslint-disable react/prop-types */
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext, isAdminUser } from "../context/AuthProvider";

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen min-w-full items-center justify-center bg-gray-50">
        <span className="loading loading-dots loading-lg text-blue-500"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">অননুমোদিত প্রবেশ</h1>
        <p className="mt-3 text-gray-600">
          অ্যাডমিন প্যানেলে প্রবেশের অনুমতি কেবল আল আহসান ফাউন্ডেশনের দায়িত্বশীল অ্যাকাউন্টের জন্য নির্ধারিত।
        </p>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
