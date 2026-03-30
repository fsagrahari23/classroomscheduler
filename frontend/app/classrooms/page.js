"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout.js";
import StatCard from "@/components/StatCard.js";
import FilterTabs from "@/components/FilterTabs.js";
import {
  deleteClassroom,
  fetchClassrooms,
} from "../../lib/store/classroomsSlice.js";
import { Loader, Plus, Edit2, Trash2, BookOpen, Users } from "lucide-react";
import CreateClassroomModal from "@/components/CreateClassRoomModal.js";

export default function ClassroomsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const {
    items: classrooms,
    loading,
    filters,
  } = useSelector((state) => state.classrooms);
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    dispatch(fetchClassrooms({ token }));
  }, [token, user, dispatch, router]);

  const tabs = [
    { id: "all", label: "All Classrooms", count: classrooms.length },
    { id: "active", label: "Active", count: classrooms.length },
    { id: "archived", label: "Archived", count: 0 },
  ];

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <DashboardLayout activeTab="classrooms">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">FACILITY MANAGEMENT</p>
            <h1 className="text-4xl font-bold text-slate-100">
              Classroom Management
            </h1>
            <p className="text-slate-400 mt-2">
              Add, edit, and manage classroom information and allocations
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Classroom
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Classrooms"
            value={classrooms.length}
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            label="Active"
            value={classrooms.length}
            icon={Users}
            variant="success"
          />
          <StatCard
            label="Faculty Members"
            value={new Set(classrooms.map((c) => c.facultyId)).size}
            icon={Users}
            variant="info"
          />
        </div>

        {/* Classrooms Table */}
        <div className="card">
          {/* Filter Tabs */}
          <FilterTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />

          {/* Search and Filters */}
          <div className="p-6 border-b border-slate-700 flex gap-4">
            <input
              type="text"
              placeholder="Search by classroom name or subject..."
              className="input flex-1"
            />
            <button className="btn btn-secondary">Filter</button>
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
            <div className="p-12 text-center">
              <BookOpen className="mx-auto mb-4 text-slate-500" size={40} />
              <p className="text-slate-400">No classrooms found</p>
            </div>
          )}

          {/* Classrooms Table */}
          {!loading && classrooms.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Classroom
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {classrooms.map((classroom) => (
                    <tr
                      key={classroom._id}
                      className="hover:bg-slate-800/50 transition-colors border-l-4 border-l-transparent hover:border-l-indigo-600"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center font-bold text-indigo-400">
                            {classroom.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-100">
                              {classroom.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-400">
                          {classroom.createdAt
                            ? new Date(classroom.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedClassroom(classroom);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-indigo-600/20 rounded-lg transition-colors text-indigo-400 hover:text-indigo-300"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this classroom?",
                                )
                              ) {
                                dispatch(
                                  deleteClassroom({ id: classroom._id, token }),
                                );
                              }
                            }}
                            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <CreateClassroomModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClassroom(null);
          }}
          initialData={selectedClassroom}
        />
      </div>
    </DashboardLayout>
  );
}
