"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout.js";
import ClassroomSearch from "@/components/ClassroomSearch.js";
import FacultyFilter from "@/components/FacultyFilter.js";
import ClassroomCard from "@/components/ClassroomCard.js";
import { fetchClassrooms } from "../../lib/store/classroomsSlice.js";
import { Loader } from "lucide-react";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { token, user } = useSelector((state) => state.auth);
  const classroomsState = useSelector((state) => state.classrooms);

  const items = classroomsState?.items || [];
  const loading = classroomsState?.loading || false;
  const filters = classroomsState?.filters || {};
  const classrooms = items;
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }

    // Fetch classrooms on mount and when filters change
    dispatch(
      fetchClassrooms({
        search: filters.search,
        facultyId: filters.facultyId,
        token,
      }),
    );
  }, [token, user, dispatch, filters, router]);
  console.log(user);
  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Available Classrooms
          </h1>
          <p className="text-slate-400">
            Browse and request available classrooms for your courses
          </p>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClassroomSearch />
          <FacultyFilter />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="animate-spin text-indigo-400" size={32} />
              <p className="text-slate-400">Loading classrooms...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && classrooms.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-slate-400 mb-2">No classrooms found</p>
            <p className="text-sm text-slate-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Classrooms Grid */}
        {!loading && classrooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <ClassroomCard key={classroom._id} classroom={classroom} />
            ))}
          </div>
        )}

        {/* Results Counter */}
        {!loading && classrooms.length > 0 && (
          <div className="text-center pt-4">
            <p className="text-slate-400 text-sm">
              Showing {classrooms.length} classroom
              {classrooms.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
