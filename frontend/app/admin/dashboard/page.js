"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout.js";
import StatCard from "@/components/StatCard.js";
import RequestsTable from "@/components/RequestsTable.js";
import FilterTabs from "@/components/FilterTabs.js";
import ReviewActivity from "@/components/ReviewActivity.js";
import {
  fetchSchedules,
  approveRequest,
  rejectRequest,
} from "../../../lib/store/schedulesSlice.js";
import { Loader, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const classroom = useSelector((state) => state.schedules);
  const schedules = classroom?.items || [];
  const loading = classroom?.loading;
  const [activeTab, setActiveTab] = useState("all");
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      router.push("/login");
      return;
    }

    dispatch(fetchSchedules({ token }));
  }, [token, user, dispatch, router]);

  const pendingRequests = schedules.filter((s) => s.status === "REQUESTED");
  const approvedRequests = schedules.filter((s) => s.status === "BOOKED");
  const rejectedRequests = schedules.filter((s) => s.status === "REJECTED");

  const filteredRequests = () => {
    switch (activeTab) {
      case "pending":
        return pendingRequests;
      case "approved":
        return approvedRequests;
      case "rejected":
        return rejectedRequests;
      default:
        return schedules;
    }
  };

  const handleApprove = async (requestId) => {
    await dispatch(approveRequest({ requestId, token }));
    setActivities((prev) => [
      {
        type: "approved",
        message: `Admin approved request #${requestId.slice(-4)}`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      },
      ...prev,
    ]);
    dispatch(fetchSchedules({ token }));
  };

  const handleReject = async (requestId) => {
    await dispatch(rejectRequest({ requestId, token }));
    setActivities((prev) => [
      {
        type: "rejected",
        message: `Admin rejected request #${requestId.slice(-4)}`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "short",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
    dispatch(fetchSchedules({ token }));
  };

  const tabs = [
    { id: "all", label: "All Requests", count: schedules.length },
    { id: "pending", label: "Pending", count: pendingRequests.length },
    { id: "approved", label: "Approved", count: approvedRequests.length },
    { id: "rejected", label: "Rejected", count: rejectedRequests.length },
  ];
  console.log(user);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <DashboardLayout activeTab="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">ADMINISTRATIVE PORTAL</p>
            <h1 className="text-4xl font-bold text-slate-100">
              Scheduling Requests
            </h1>
            <p className="text-slate-400 mt-2">
              Review and manage faculty requests for classroom allocations
            </p>
          </div>
          <button className="btn btn-primary">Export CSV</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Pending"
            value={pendingRequests.length}
            icon={AlertCircle}
            variant="warning"
          />
          <StatCard
            label="Approved"
            value={approvedRequests.length}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            label="Rejected"
            value={rejectedRequests.length}
            icon={XCircle}
            variant="danger"
          />
          <StatCard
            label="Utilization"
            value={
              schedules.length > 0
                ? `${Math.round((approvedRequests.length / schedules.length) * 100)}%`
                : "0%"
            }
            icon={Clock}
            variant="primary"
          />
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="flex items-center gap-4 p-6 border-b border-slate-700">
            <input
              type="text"
              placeholder="Search by professor, room, or course..."
              className="input flex-1"
            />
            <button className="btn btn-secondary">Filter</button>
          </div>

          {/* Filter Tabs */}
          <FilterTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader className="animate-spin text-indigo-400" size={32} />
                <p className="text-slate-400">Loading requests...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredRequests().length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-slate-500" size={40} />
              <p className="text-slate-400">No requests found</p>
            </div>
          )}

          {/* Requests Table */}
          {!loading && filteredRequests().length > 0 && (
            <RequestsTable
              requests={filteredRequests()}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
            />
          )}
        </div>

        {/* Bottom Section: Pagination and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pagination Info */}
          <div className="lg:col-span-2 card flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing 1 to {Math.min(10, filteredRequests().length)} of{" "}
              {filteredRequests().length} requests
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded transition-colors disabled:opacity-50">
                ←
              </button>
              <span className="text-sm text-slate-300">1</span>
              <button className="p-2 hover:bg-slate-700 rounded transition-colors disabled:opacity-50">
                →
              </button>
            </div>
          </div>

          {/* Review Activity */}
          <ReviewActivity activities={activities.slice(0, 5)} />
        </div>
      </div>
    </DashboardLayout>
  );
}
