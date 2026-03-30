"use client";

import { useDispatch } from "react-redux";
import {
  createSchedule,
  createRequest,
  approveRequest,
  rejectRequest,
} from "@/lib/store/schedulesSlice";

export default function ScheduleActionModal({ data, user, onClose }) {
  const dispatch = useDispatch();

  if (!data) return null;

  const { schedule, dayOfWeek, startTime, classroomId } = data;

  const isAdmin = user?.role === "admin";

  const handleCreate = () => {
    dispatch(
      createSchedule({
        classroom: classroomId,
        dayOfWeek,
        startTime,
        endTime: addOneHour(startTime),
      }),
    );
    onClose();
  };

  const handleRequest = () => {
    dispatch(
      createRequest({
        classroomId,
        startTime,
        endTime: addOneHour(startTime),
        courseName: "My Course",
      }),
    );
    onClose();
  };

  const handleApprove = () => {
    dispatch(approveRequest({ requestId: schedule._id }));
    onClose();
  };

  const handleReject = () => {
    dispatch(rejectRequest({ requestId: schedule._id }));
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl w-80 space-y-4">
        <h2 className="text-lg font-semibold">Schedule Action</h2>

        {/* ADMIN */}
        {isAdmin && !schedule && (
          <button onClick={handleCreate} className="btn btn-primary w-full">
            Create Slot
          </button>
        )}

        {isAdmin && schedule?.status === "REQUESTED" && (
          <>
            <button onClick={handleApprove} className="btn btn-success w-full">
              Approve
            </button>
            <button onClick={handleReject} className="btn btn-danger w-full">
              Reject
            </button>
          </>
        )}

        {/* USER */}
        {!isAdmin && schedule?.status === "FREE" && (
          <button onClick={handleRequest} className="btn btn-primary w-full">
            Request Booking
          </button>
        )}

        <button onClick={onClose} className="btn w-full">
          Close
        </button>
      </div>
    </div>
  );
}

function addOneHour(time) {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${m}`;
}
