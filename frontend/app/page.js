"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { Zap } from "lucide-react";
import { getMe } from "@/lib/store/authSlice";

export default function HomePage() {
  const router = useRouter();
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    if (token && !user) {
      dispatch(getMe(token));
    }
  }, [token, user, dispatch]);

  useEffect(() => {
    if (token && user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [token, user, router]);

  if (token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600/20 rounded-lg mb-6">
          <Zap className="text-indigo-400" size={40} />
        </div>
        <h1 className="text-5xl font-bold text-slate-100 mb-4">ClassMate</h1>
        <p className="text-xl text-slate-400 mb-8">
          Professional classroom scheduling system with real-time updates and
          role-based access control
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login" className="btn btn-primary px-8 py-3">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-outline px-8 py-3">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
