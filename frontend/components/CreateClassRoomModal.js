"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createClassroom,
  fetchFaculties,
  updateClassroom,
} from "@/lib/store/classroomsSlice";
import { toast } from "sonner";

export default function CreateClassroomModal({
  isOpen,
  onClose,
  initialData = null,
}) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.classrooms);
  const { token } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
      });
    }
  }, [initialData]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let res;
      if (initialData) {
        res = await dispatch(
          updateClassroom({ id: initialData._id, data: form, token }).unwrap(),
        );
      } else {
        res = await dispatch(createClassroom({ data: form, token }));
      }

      if (res?.meta?.requestStatus === "fulfilled") {
        onClose();
      }
      toast.success("Classroom created sucessfully");
    } catch (err) {
      console.log(err);
      toast.error("Classroom createion failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 p-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {initialData ? "Edit Classroom" : "Create Classroom"}
          </h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm text-slate-400">Classroom Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Room A101"
              className="mt-1 w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-indigo-500 outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Subject */}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Cancel
            </button>

            <button>
              {actionLoading ? "Saving..." : initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
