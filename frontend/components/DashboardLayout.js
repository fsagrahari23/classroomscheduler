"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { logout } from "@/lib/store/authSlice.js";
import {
  Menu,
  X,
  LogOut,
  Home,
  Calendar,
  Settings,
  FileText,
  Users,
} from "lucide-react";

export default function DashboardLayout({ children, activeTab = "dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems =
    user?.role === "admin"
      ? [
          {
            id: "admin",
            label: "Requests",
            icon: Calendar,
            href: "/admin/dashboard",
          },
          {
            id: "classrooms",
            label: "Classrooms",
            icon: Settings,
            href: "/classrooms",
          },
          {
            id: "users",
            label: "Users",
            icon: Users,
            href: "/admin/users",
          },
          {
            id: "schedules",
            label: "Schedules",
            icon: Calendar,
            href: "/schedules",
          },
        ]
      : [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: Home,
            href: "/dashboard",
          },
          {
            id: "schedules",
            label: "Schedules",
            icon: Calendar,
            href: "/schedules",
          },
        ];

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-indigo-400">ClassMate</h1>
              <p className="text-xs text-slate-400">Scheduler</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          {menuItems.map(({ id, label, icon: Icon, href }) => (
            <Link key={id} href={href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {menuItems.find((item) => item.id === activeTab)?.label ||
                "Dashboard"}
            </h2>
          </div>
          <div className="text-slate-400 text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
