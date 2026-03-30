"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold">
            Classroom Scheduler
          </Link>
          {user && (
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="hover:text-blue-200">
                Dashboard
              </Link>
              {user.role === "admin" && (
                <>
                  <Link href="/admin/dashboard" className="hover:text-blue-200">
                    Admin
                  </Link>
                  <Link
                    href="/admin/classrooms"
                    className="hover:text-blue-200"
                  >
                    Classrooms
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user.name} <span className="text-blue-200">({user.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
