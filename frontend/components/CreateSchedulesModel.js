"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSchedule } from "@/lib/store/schedulesSlice";
import { fetchClassrooms, fetchFaculties } from "@/lib/store/classroomsSlice";
import { X } from "lucide-react";

export default function CreateScheduleModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { items: classrooms, faculties } = useSelector(
    (state) => state.classrooms,
  );

  const [form, setForm] = useState({
    classroom: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    facultyId: "",
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchClassrooms({}));
      dispatch(fetchFaculties());
    }
  }, [isOpen, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await dispatch(createSchedule(form));

    if (res.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* modal */}
      <div className="relative bg-slate-900 w-full max-w-xl p-6 rounded-2xl border border-slate-700">
        <div className="flex justify-between mb-5">
          <h2 className="text-xl font-semibold">Create Schedule Slot</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Classroom */}
          <select
            required
            className="w-full p-3 bg-slate-800 rounded"
            onChange={(e) => setForm({ ...form, classroom: e.target.value })}
          >
            <option value="">Select Classroom</option>
            {classrooms.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} - {c.subject}
              </option>
            ))}
          </select>

          {/* Faculty */}
          <select
            className="w-full p-3 bg-slate-800 rounded"
            onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
          >
            <option value="">Assign Faculty (optional)</option>
            {faculties.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Day */}
          <select
            required
            className="w-full p-3 bg-slate-800 rounded"
            onChange={(e) =>
              setForm({ ...form, dayOfWeek: Number(e.target.value) })
            }
          >
            <option value="">Select Day</option>
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
          </select>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              required
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="p-3 bg-slate-800 rounded"
            />
            <input
              type="time"
              required
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="p-3 bg-slate-800 rounded"
            />
          </div>

          <button className="w-full bg-indigo-600 py-3 rounded">
            Create Slot
          </button>
        </form>
      </div>
    </div>
  );
}
