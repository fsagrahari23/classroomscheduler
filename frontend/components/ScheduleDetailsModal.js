"use client";

import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function ScheduleDetailsModal({ schedule, onClose }) {
  if (!schedule) return null;

  const getStatusInfo = (status) => {
    switch (status) {
      case "BOOKED":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-900/30",
          borderColor: "border-green-700/50",
          label: "Approved",
        };
      case "REQUESTED":
        return {
          icon: AlertCircle,
          color: "text-amber-400",
          bgColor: "bg-amber-900/30",
          borderColor: "border-amber-700/50",
          label: "Pending",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-slate-400",
          bgColor: "bg-slate-800",
          borderColor: "border-slate-700",
          label: status,
        };
    }
  };

  const statusInfo = getStatusInfo(schedule.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-2xl font-bold text-slate-100">
            Schedule Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
          >
            <StatusIcon className={statusInfo.color} size={24} />
            <div>
              <p className="text-sm text-slate-400">Current Status</p>
              <p className={`text-lg font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </p>
            </div>
          </div>

          {/* Classroom Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Classroom
              </p>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-100">
                  {schedule.classroom?.name}
                </p>
                <p className="text-slate-400">{schedule.classroom?.subject}</p>
                {schedule.classroom?.facultyId?.name && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <User size={14} />
                    Faculty: {schedule.classroom.facultyId.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <Clock size={16} />
                Time Slot
              </p>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-100">
                  {schedule.startTime} - {schedule.endTime}
                </p>
                <p className="text-slate-400">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ][schedule.dayOfWeek] || `Day ${schedule.dayOfWeek}`}
                </p>
              </div>
            </div>
          </div>

          {/* Course & Notes */}
          <div className="space-y-4">
            {schedule.course && (
              <div>
                <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Course Name
                </p>
                <p className="text-lg font-semibold text-slate-100">
                  {schedule.course}
                </p>
              </div>
            )}

            {schedule.notes && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Notes</p>
                <p className="text-slate-300 bg-slate-700/30 p-3 rounded border border-slate-700">
                  {schedule.notes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-slate-700 space-y-2 text-sm text-slate-400">
            {schedule.requestedBy && (
              <p>Requested by: {schedule.requestedBy.name}</p>
            )}
            {schedule.bookedBy && <p>Booked by: {schedule.bookedBy.name}</p>}
            <p>
              Created: {new Date(schedule.createdAt).toLocaleDateString()} at{" "}
              {new Date(schedule.createdAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Close Button */}
          <button onClick={onClose} className="btn btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
