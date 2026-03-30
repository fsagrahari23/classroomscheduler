"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout.js";
import {
  fetchUsers,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  bulkImportUsers,
  clearImportResult,
} from "@/lib/store/usersSlice.js";
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ROLE_OPTIONS = ["admin", "teacher", "cr"];

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-50">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-slate-100">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function emptyForm() {
  return {
    name: "",
    email: "",
    password: "",
    role: "teacher",
    department: "",
    isActive: true,
  };
}

function parseBulkRows(rawText) {
  const normalized = rawText.replace(/\r/g, "").trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiter =
    lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const rows = lines.map((line) =>
    line.split(delimiter).map((cell) => cell.trim()),
  );

  const [headerRow, ...dataRows] = rows;
  const normalizedHeaders = headerRow.map((header) =>
    header.toLowerCase().replace(/\s+/g, ""),
  );
  const hasHeader = normalizedHeaders.some((header) =>
    ["name", "email", "role", "department", "password", "isactive"].includes(
      header,
    ),
  );

  const finalRows = hasHeader ? dataRows : rows;
  const headers = hasHeader
    ? normalizedHeaders
    : ["name", "email", "role", "department", "isactive"];

  return finalRows
    .map((row) => {
      const mapped = {};
      headers.forEach((header, index) => {
        mapped[header] = row[index] || "";
      });

      return {
        name: mapped.name || "",
        email: mapped.email || "",
        role: mapped.role || "teacher",
        department: mapped.department || "",
        password: mapped.password || "",
        isActive:
          mapped.isactive === ""
            ? true
            : String(mapped.isactive).toLowerCase() === "true",
      };
    })
    .filter((row) => row.name || row.email);
}

async function downloadExportFile(path, filename, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Export failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function UserModal({ open, mode, value, loading, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && value) {
      setForm({
        name: value.name || "",
        email: value.email || "",
        password: "",
        role: value.role || "teacher",
        department: value.department || "",
        isActive: value.isActive ?? true,
      });
      return;
    }

    setForm(emptyForm());
  }, [open, mode, value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {mode === "create" ? "Create User" : "Edit User"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Manage faculty, CR, and admin accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-6 px-6 py-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Name
              </label>
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password {mode === "edit" ? "(optional)" : ""}
              </label>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required={mode === "create"}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role
              </label>
              <select
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Department
              </label>
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, department: e.target.value }))
                }
                placeholder="e.g. Computer Science"
              />
            </div>

            <label className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === "create" ? "Create User" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const { items: users = [], loading, error, importResult } = useSelector(
    (state) => state.users,
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState({ open: false, mode: "create", value: null });
  const [bulkText, setBulkText] = useState("");
  const [fileName, setFileName] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      router.push("/login");
      return;
    }

    dispatch(fetchUsers({ token, role: "all" }));
  }, [dispatch, router, token, user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!importResult) return;
    const createdCount = importResult.created?.length || 0;
    const skippedCount = importResult.skipped?.length || 0;
    toast.success(`Imported ${createdCount} users. Skipped ${skippedCount}.`);
  }, [importResult]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((managedUser) => {
      const matchesRole =
        roleFilter === "all" ? true : managedUser.role === roleFilter;
      const matchesQuery = query
        ? [managedUser.name, managedUser.email, managedUser.department]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true;
      return matchesRole && matchesQuery;
    });
  }, [roleFilter, search, users]);

  const activeCount = users.filter((managedUser) => managedUser.isActive).length;
  const adminCount = users.filter((managedUser) => managedUser.role === "admin").length;
  const teacherCount = users.filter(
    (managedUser) => managedUser.role === "teacher",
  ).length;

  const closeModal = () => setModal({ open: false, mode: "create", value: null });

  const handleSaveUser = async (form) => {
    try {
      if (modal.mode === "create") {
        await dispatch(createManagedUser({ data: form, token })).unwrap();
        toast.success("User created successfully.");
      } else {
        const payload = { ...form };
        if (!payload.password) {
          delete payload.password;
        }
        await dispatch(
          updateManagedUser({ id: modal.value._id, data: payload, token }),
        ).unwrap();
        toast.success("User updated successfully.");
      }

      closeModal();
    } catch (saveError) {
      toast.error(saveError || "Failed to save user.");
    }
  };

  const handleDeleteUser = async (managedUser) => {
    const confirmed = window.confirm(
      `Delete ${managedUser.name} (${managedUser.email})?`,
    );

    if (!confirmed) return;

    try {
      await dispatch(
        deleteManagedUser({ id: managedUser._id, token }),
      ).unwrap();
      toast.success("User deleted successfully.");
    } catch (deleteError) {
      toast.error(deleteError || "Failed to delete user.");
    }
  };

  const handleBulkFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setBulkText(text);
    setFileName(file.name);
  };

  const handleBulkImport = async () => {
    const rows = parseBulkRows(bulkText);
    if (rows.length === 0) {
      toast.error("Add CSV rows or pasted tabular text first.");
      return;
    }

    try {
      await dispatch(bulkImportUsers({ users: rows, token })).unwrap();
      setBulkText("");
      setFileName("");
    } catch (importError) {
      toast.error(importError || "Failed to import users.");
    }
  };

  const handleExport = async (mode) => {
    setExporting(true);
    try {
      if (mode === "all") {
        await downloadExportFile("/auth/export/users.csv", "users.csv", token);
        await downloadExportFile(
          "/auth/export/classrooms.csv",
          "classrooms.csv",
          token,
        );
        await downloadExportFile(
          "/auth/export/schedules.csv",
          "schedules.csv",
          token,
        );
      } else {
        await downloadExportFile(
          `/auth/export/${mode}.csv`,
          `${mode}.csv`,
          token,
        );
      }

      toast.success("Export started.");
    } catch (exportError) {
      toast.error(exportError.message || "Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <DashboardLayout activeTab="users">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 px-6 py-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <Pill className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                  <UserCog size={12} className="mr-1" />
                  Admin user management
                </Pill>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-50 md:text-5xl">
                Users, Import, and Export
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Create and manage user accounts, bulk import faculty or CR users,
                and export users, classrooms, and schedules as Excel-friendly CSV.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleExport("all")}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Export all data
              </button>
              <button
                type="button"
                onClick={() => setModal({ open: true, mode: "create", value: null })}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                <Plus size={16} />
                Create user
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total users"
            value={users.length}
            hint="All accounts in the system"
          />
          <StatCard
            icon={Shield}
            label="Admins"
            value={adminCount}
            hint="Administrative accounts"
          />
          <StatCard
            icon={Mail}
            label="Teachers"
            value={teacherCount}
            hint="Faculty user accounts"
          />
          <StatCard
            icon={AlertCircle}
            label="Active"
            value={activeCount}
            hint="Currently enabled accounts"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_2fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2">
                <Upload size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Bulk import
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Upload CSV or paste tabular text copied from Excel or a PDF. Columns:
                `name`, `email`, `role`, `department`, `isActive`. If password is
                not provided, we use the email prefix before `@`.
              </p>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 px-4 py-4 text-sm text-slate-300 transition hover:border-indigo-500/40 hover:bg-slate-900">
                <FileSpreadsheet size={16} />
                {fileName ? fileName : "Choose CSV/TXT file"}
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleBulkFile}
                />
              </label>

              <textarea
                rows={12}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"name,email,role,department,isActive\nJohn Doe,john@example.com,teacher,CSE,true"}
                className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Import users
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkText("");
                    setFileName("");
                    dispatch(clearImportResult());
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Clear
                </button>
              </div>

              {importResult ? (
                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm">
                  <p className="font-semibold text-slate-100">
                    Imported: {importResult.created?.length || 0}
                  </p>
                  <p className="mt-1 text-slate-400">
                    Skipped: {importResult.skipped?.length || 0}
                  </p>
                  {importResult.skipped?.length ? (
                    <div className="mt-3 max-h-32 space-y-2 overflow-auto text-xs text-amber-300">
                      {importResult.skipped.map((item, index) => (
                        <p key={`${item.email}-${index}`}>
                          {item.email || "Unknown"}: {item.reason}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2">
                <Download size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Export datasets
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { key: "users", label: "Export users" },
                  { key: "classrooms", label: "Export classrooms" },
                  { key: "schedules", label: "Export schedules" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleExport(item.key)}
                    disabled={exporting}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-slate-900 disabled:opacity-60"
                  >
                    <span>{item.label}</span>
                    <Download size={15} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5 shadow-2xl shadow-black/10">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">User directory</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search, filter, edit, and remove user accounts.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, department"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                >
                  <option value="all">All roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && users.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin text-indigo-400" />
                  <p className="text-sm text-slate-400">Loading users...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-16 text-center">
                <Users className="mx-auto text-slate-500" size={36} />
                <h3 className="mt-4 text-lg font-semibold text-slate-100">
                  No users found
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Try a different search or create a new account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      {["User", "Role", "Department", "Status", "Actions"].map((column) => (
                        <th
                          key={column}
                          className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((managedUser) => (
                      <tr key={managedUser._id}>
                        <td className="rounded-l-2xl border border-slate-800 bg-slate-900/80 px-4 py-4">
                          <p className="font-semibold text-slate-100">{managedUser.name}</p>
                          <p className="mt-1 text-sm text-slate-400">{managedUser.email}</p>
                        </td>
                        <td className="border-y border-slate-800 bg-slate-900/80 px-4 py-4">
                          <Pill className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                            {managedUser.role}
                          </Pill>
                        </td>
                        <td className="border-y border-slate-800 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
                          {managedUser.department || "Not set"}
                        </td>
                        <td className="border-y border-slate-800 bg-slate-900/80 px-4 py-4">
                          <Pill
                            className={
                              managedUser.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-slate-600 bg-slate-800 text-slate-400"
                            }
                          >
                            {managedUser.isActive ? "Active" : "Inactive"}
                          </Pill>
                        </td>
                        <td className="rounded-r-2xl border border-slate-800 bg-slate-900/80 px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  open: true,
                                  mode: "edit",
                                  value: managedUser,
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(managedUser)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-600/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>

      <UserModal
        open={modal.open}
        mode={modal.mode}
        value={modal.value}
        loading={loading}
        onClose={closeModal}
        onSave={handleSaveUser}
      />
    </DashboardLayout>
  );
}
