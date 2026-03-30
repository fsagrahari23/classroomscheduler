"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout.js";
import { toast, Toaster } from "sonner";
import {
  fetchSchedules,
  fetchUserSchedules,
  createSchedule,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest as cancelScheduleRequest,
  editRequest,
  createFreeSlot,
  approveCancel,
} from "@/lib/store/schedulesSlice.js";
import {
  fetchClassrooms,
  fetchFaculties,
} from "@/lib/store/classroomsSlice.js";
import {
  CalendarDays,
  Clock3,
  Building2,
  Users,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutGrid,
  ListChecks,
  Circle,
  ShieldCheck,
  BookOpen,
  GraduationCap,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "08:45",
  "09:45",
  "11:00",
  "12:00",
  "14:15",
  "15:15",
  "16:30",
  "17:30",
];

const STATUS_META = {
  FREE: {
    label: "Free",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
    dot: "bg-emerald-400",
  },
  REQUESTED: {
    label: "Requested",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15",
    dot: "bg-amber-400",
  },
  BOOKED: {
    label: "Booked",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15",
    dot: "bg-rose-400",
  },
  CANCEL_REQUESTED: {
    label: "Cancel requested",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/15",
    dot: "bg-orange-400",
  },
};

function addOneHour(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const newHour = (h + 1) % 24;
  return `${String(newHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getStartOfWeek(input = new Date()) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
}

function formatDateParts(slotDate) {
  if (!slotDate) return null;
  const [year, month, day] = slotDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(slotDate) {
  const date = formatDateParts(slotDate);
  if (!date) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(slotDate) {
  const date = formatDateParts(slotDate);
  if (!date) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildWeekDates(weekStart) {
  return DAYS.map((day, dayIndex) => {
    const date = addDays(weekStart, dayIndex);
    const dateKey = formatDateKey(date);

    return {
      day,
      dayIndex,
      date,
      dateKey,
      shortDate: formatShortDate(dateKey),
      longDate: formatLongDate(dateKey),
    };
  });
}

function getScheduleDateKey(schedule) {
  if (!schedule) return "";
  if (schedule.slotDate) return schedule.slotDate;

  if (!schedule.isPermanent && schedule.validTill) {
    return formatDateKey(new Date(schedule.validTill));
  }

  return "";
}

function statusBadge(status) {
  return STATUS_META[status] || STATUS_META.FREE;
}

function getErrorMessage(error, fallback = "Something went wrong") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error?.data?.message || error?.message || error?.error || fallback;
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
          {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-slate-200">
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

function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center">
      <Icon className="mx-auto text-slate-500" size={36} />
      <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function ScheduleModal({
  open,
  onClose,
  mode,
  data,
  classrooms,
  faculties,
  token,
  dispatch,
  refreshSchedules,
  openModal,
  isAdmin,
}) {
  const scheduleData = data?.schedule ?? data ?? null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    classroom: "",
    facultyId: "",
    dayOfWeek: "",
    slotDate: "",
    startTime: "",
    endTime: "",
    courseName: "",
    note: "",
  });
  const [isFreeSlot, setIsFreeSlot] = useState(false);
  const isCreate = mode === "create";
  const isRequest = mode === "request";
  const isReview = mode === "review";
  const isView = mode === "view";
  const isEditRequest = mode === "editRequest";

  useEffect(() => {
    if (!open) return;

    const classroomId =
      data?.classroomId ||
      scheduleData?.classroom?._id ||
      scheduleData?.classroom ||
      "";

    const facultyId =
      scheduleData?.faculty?._id ||
      scheduleData?.facultyId?._id ||
      scheduleData?.facultyId ||
      "";

    const dayValue =
      data?.dayOfWeek !== undefined && data?.dayOfWeek !== null
        ? String(data.dayOfWeek)
        : scheduleData?.dayOfWeek !== undefined &&
            scheduleData?.dayOfWeek !== null
          ? String(scheduleData.dayOfWeek)
          : "";
    const slotDateValue =
      data?.slotDate ||
      data?.selectedSlotDate ||
      scheduleData?.slotDate ||
      scheduleData?.selectedSlotDate ||
      "";

    const startValue = data?.startTime || scheduleData?.startTime || "";
    const endValue = data?.endTime || scheduleData?.endTime || "";

    if (isCreate) {
      setForm({
        classroom: classroomId,
        facultyId: facultyId,
        dayOfWeek: dayValue,
        slotDate: slotDateValue,
        startTime: startValue,
        endTime: endValue || (startValue ? addOneHour(startValue) : ""),
        courseName: scheduleData?.courseName || scheduleData?.course || "",
        note: scheduleData?.note || "",
      });
      setIsFreeSlot(false);
      return;
    }

    if (isRequest || isEditRequest) {
      setForm({
        classroom: classroomId,
        facultyId,
        dayOfWeek: dayValue,
        slotDate: slotDateValue,
        startTime: startValue,
        endTime: endValue,
        courseName: scheduleData?.courseName || scheduleData?.course || "",
        note: scheduleData?.note || "",
      });
      return;
    }

    setForm({
      classroom: "",
      facultyId: "",
      dayOfWeek: "",
      slotDate: "",
      startTime: "",
      endTime: "",
      courseName: "",
      note: "",
    });
  }, [open, mode, data, scheduleData, isCreate, isRequest, isEditRequest]);

  const close = () => {
    if (loading) return;
    onClose();
  };

  const validateForm = (fields) => {
    const missing = fields.filter((field) => !field);
    if (missing.length) {
      toast.error("Please fill all required fields.");
      return false;
    }
    return true;
  };

  const handleCreateFreeSlot = async (e) => {
    e.preventDefault();

    if (
      !validateForm([
        form.classroom,
        form.dayOfWeek,
        form.startTime,
        form.endTime,
      ])
    ) {
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        createFreeSlot({
          data: {
            classroom: form.classroom,
            dayOfWeek: Number(form.dayOfWeek),
            slotDate: form.slotDate || undefined,
            startTime: form.startTime,
            endTime: form.endTime,
          },
          token,
        }),
      ).unwrap();

      toast.success("Free slot created successfully.");
      await refreshSchedules();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create free slot."));
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();

    if (
      !validateForm([
        form.classroom,
        form.facultyId,
        form.dayOfWeek,
        form.startTime,
        form.endTime,
        form.courseName,
      ])
    ) {
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        createSchedule({
          data: {
            classroom: form.classroom,
            facultyId: form.facultyId,
            dayOfWeek: Number(form.dayOfWeek),
            slotDate: form.slotDate || undefined,
            course: form.courseName,
            startTime: form.startTime,
            endTime: form.endTime,
            note: form.note,
          },
          token,
        }),
      ).unwrap();

      toast.success("Schedule created successfully.");
      await refreshSchedules();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create schedule."));
    } finally {
      setLoading(false);
    }
  };

  const appCancel = async () => {
    try {
      await dispatch(
        approveCancel({ scheduleId: scheduleData?._id, token }),
      ).unwrap();
      toast.success("Approves Cancelled Request");
      await refreshSchedules();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel request."));
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();

    if (
      !validateForm([
        scheduleData?.classroom?._id || scheduleData?.classroomId,
        form.facultyId,
        form.courseName,
      ])
    ) {
      return;
    }

    setLoading(true);

    try {
      if (isEditRequest) {
        await dispatch(
          editRequest({
            courseName: form.courseName,
            facultyId: form.facultyId,
            scheduleId: scheduleData?._id,
            note: form.note,
            token,
          }),
        ).unwrap();

        toast.success("Request updated successfully");
        await refreshSchedules();
        onClose();
        return;
      }

      await dispatch(
        createRequest({
          classroomId:
            scheduleData?.classroom?._id ||
            scheduleData?.classroomId ||
            form.classroom,
          startTime: scheduleData?.startTime || form.startTime,
          endTime: scheduleData?.endTime || form.endTime,
          courseName: form.courseName,
          facultyId: form.facultyId,
          token,
          scheduleId: scheduleData?._id,
          note: form.note,
          slotDate:
            form.slotDate ||
            scheduleData?.slotDate ||
            data?.selectedSlotDate ||
            "",
        }),
      ).unwrap();

      toast.success("Booking request sent.");
      await refreshSchedules();
      onClose();
    } catch (err) {
      console.error("❌ ERROR:", err);
      toast.error(getErrorMessage(err, "Failed to send request."));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!scheduleData?._id) {
      toast.error("Missing request details.");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        approveRequest({ requestId: scheduleData._id, token }),
      ).unwrap();

      toast.success("Request approved.");
      await refreshSchedules();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve request."));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!scheduleData?._id) {
      toast.error("Missing request details.");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        rejectRequest({ requestId: scheduleData._id, token }),
      ).unwrap();

      toast.success("Request rejected.");
      await refreshSchedules();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject request."));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!scheduleData?._id) {
      toast.error("Missing request details.");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        cancelScheduleRequest({ scheduleId: scheduleData._id, token }),
      ).unwrap();
      toast.success("Request cancelled.");
      await refreshSchedules();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel request."));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selectedClassroom = classrooms.find((c) => c._id === form.classroom);
  const selectedFaculty = faculties.find((f) => f._id === form.facultyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={close}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950 shadow-2xl shadow-black/60"
      >
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-200">
                {isCreate ? (
                  <Plus size={22} />
                ) : isRequest || isEditRequest ? (
                  <BookOpen size={22} />
                ) : isReview ? (
                  <ShieldCheck size={22} />
                ) : (
                  <ListChecks size={22} />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {isCreate
                    ? "Create Schedule Slot"
                    : isRequest
                      ? "Request This Slot"
                      : isEditRequest
                        ? "Edit Request"
                        : isReview
                          ? "Review Booking Request"
                          : "Slot Details"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isCreate
                    ? "Assign classroom, faculty, day and time"
                    : isRequest
                      ? "Book this free slot for your course"
                      : isEditRequest
                        ? "Update course or faculty details"
                        : isReview
                          ? "Approve or reject the request"
                          : "View complete schedule information"}
                </p>
              </div>
            </div>

            <button
              onClick={close}
              className="rounded-2xl p-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1.1fr]">
          <div className="p-8">
            <form
              onSubmit={
                isCreate
                  ? isFreeSlot
                    ? handleCreateFreeSlot
                    : handleCreate
                  : isRequest || isEditRequest
                    ? handleRequest
                    : undefined
              }
              className="space-y-8"
            >
              {(isCreate || isRequest || isEditRequest) && (
                <div className="space-y-6">
                  {isCreate && (
                    <div className="flex rounded-3xl border border-slate-700 bg-slate-900 p-1">
                      <button
                        type="button"
                        onClick={() => setIsFreeSlot(false)}
                        className={`flex-1 rounded-[22px] py-3 text-sm font-semibold transition-all ${
                          !isFreeSlot
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Booked Slot
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFreeSlot(true)}
                        className={`flex-1 rounded-[22px] py-3 text-sm font-semibold transition-all ${
                          isFreeSlot
                            ? "bg-emerald-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Free Slot
                      </button>
                    </div>
                  )}
                  {(isCreate || isEditRequest) && (
                    <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                      <p className="text-sm text-slate-400">Selected Slot</p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {scheduleData?.classroom?.name ||
                          selectedClassroom?.name ||
                          "N/A"}{" "}
                        •{" "}
                        {DAYS[Number(form.dayOfWeek)] ||
                          DAYS[scheduleData?.dayOfWeek] ||
                          "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {form.slotDate ||
                        scheduleData?.slotDate ||
                        data?.selectedSlotDate
                          ? formatLongDate(
                              form.slotDate ||
                                scheduleData?.slotDate ||
                                data?.selectedSlotDate,
                            )
                          : "Recurring weekly slot"}
                      </p>
                      <p className="text-slate-400">
                        {form.startTime || scheduleData?.startTime || "—"} –{" "}
                        {form.endTime || scheduleData?.endTime || "—"}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {isCreate && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Classroom
                        </label>
                        <select
                          value={form.classroom}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              classroom: e.target.value,
                            }))
                          }
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          required
                        >
                          <option value="">Select classroom</option>
                          {classrooms.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name} {c.subject ? `• ${c.subject}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!isFreeSlot && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Faculty
                        </label>
                        <select
                          value={form.facultyId}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              facultyId: e.target.value,
                            }))
                          }
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          required
                        >
                          <option value="">Select faculty</option>
                          {faculties.map((f) => (
                            <option key={f._id} value={f._id}>
                              {f.name} {f.email ? `• ${f.email}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {isCreate && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Day
                        </label>
                        <select
                          value={form.dayOfWeek}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              dayOfWeek: e.target.value,
                            }))
                          }
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          required
                        >
                          <option value="">Select day</option>
                          {DAYS.map((day, i) => (
                            <option key={i} value={i}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Start Time
                        </label>
                        <select
                          value={form.startTime}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              startTime: e.target.value,
                              endTime: addOneHour(e.target.value),
                            }))
                          }
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          required
                        >
                          <option value="">Select start time</option>
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              endTime: e.target.value,
                            }))
                          }
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {!isFreeSlot && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Course Name
                        </label>
                        <input
                          type="text"
                          value={form.courseName}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              courseName: e.target.value,
                            }))
                          }
                          placeholder="e.g. Data Structures and Algorithms"
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Note
                        </label>
                        <textarea
                          value={form.note}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              note: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Optional note"
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {isReview && (
                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-7 space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Classroom</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.classroom?.name || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Faculty</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.faculty?.name ||
                          scheduleData?.facultyId?.name ||
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Course</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.courseName ||
                          scheduleData?.course ||
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Date</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.slotDate
                          ? formatLongDate(scheduleData.slotDate)
                          : data?.selectedSlotDate
                            ? formatLongDate(data.selectedSlotDate)
                            : "Recurring weekly slot"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Time</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.startTime || "—"} –{" "}
                        {scheduleData?.endTime || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isView && (
                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-7 space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Classroom</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.classroom?.name ||
                          scheduleData?.classroom?.name ||
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Faculty</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.faculty?.name ||
                          scheduleData?.facultyId?.name ||
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Course</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.courseName ||
                          scheduleData?.course ||
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Status</p>
                      <p className="mt-1 font-medium text-white">
                        {statusBadge(scheduleData?.status || "FREE").label}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-slate-500">Date</p>
                      <p className="mt-1 font-medium text-white">
                        {scheduleData?.slotDate
                          ? formatLongDate(scheduleData.slotDate)
                          : data?.selectedSlotDate
                            ? formatLongDate(data.selectedSlotDate)
                            : "Recurring weekly slot"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm">
                    <p className="text-slate-500">Timing</p>
                    <p className="mt-1 font-medium text-white">
                      {scheduleData?.startTime || "—"} –{" "}
                      {scheduleData?.endTime || "—"}
                    </p>
                  </div>
                </div>
              )}

              {(isCreate || isRequest || isEditRequest) && (
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-3xl border border-slate-700 px-8 py-3.5 font-medium text-slate-300 transition-all hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-3 rounded-3xl bg-indigo-600 px-8 py-3.5 font-semibold text-white transition-all shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Saving...
                      </>
                    ) : isCreate ? (
                      isFreeSlot ? (
                        <>
                          <Plus size={20} /> Create Free Slot
                        </>
                      ) : (
                        <>
                          <Plus size={20} /> Create Booked Slot
                        </>
                      )
                    ) : isEditRequest ? (
                      <>
                        <BookOpen size={20} /> Update Request
                      </>
                    ) : (
                      <>
                        <BookOpen size={20} /> Request Booking
                      </>
                    )}
                  </button>
                </div>
              )}

              {isReview && (
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-3xl border border-slate-700 px-8 py-3.5 font-medium text-slate-300 transition-all hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={loading}
                    className="flex items-center gap-3 rounded-3xl border border-rose-600/30 bg-rose-500/10 px-8 py-3.5 font-semibold text-rose-300 transition-all hover:bg-rose-500/15 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <X size={20} />
                    )}
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex items-center gap-3 rounded-3xl bg-emerald-600 px-8 py-3.5 font-semibold text-white transition-all shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    Approve Request
                  </button>
                </div>
              )}

              {isView && (
                <div className="flex flex-wrap justify-end gap-3 pt-6">
                  {!isAdmin &&
                    (scheduleData?.status === "REQUESTED" ||
                      scheduleData?.status === "BOOKED") && (
                    <button
                      type="button"
                      onClick={handleCancelRequest}
                      disabled={loading}
                      className="rounded-3xl border border-orange-600/30 bg-orange-500/10 px-8 py-3.5 font-medium text-orange-300 transition-all hover:bg-orange-500/15 disabled:opacity-60"
                    >
                      {loading ? "Processing..." : "Request to Cancel"}
                    </button>
                  )}

                  {!isAdmin && scheduleData?.status === "REQUESTED" && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose(); // close current modal

                        setTimeout(() => {
                          openModal("editRequest", scheduleData);
                        }, 100);
                      }}
                      className="rounded-3xl bg-slate-800 px-8 py-3.5 font-medium text-white hover:bg-slate-700"
                    >
                      Edit
                    </button>
                  )}
                  {isAdmin && scheduleData?.status === "REQUESTED" && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          openModal("review", scheduleData);
                        }, 100);
                      }}
                      className="rounded-3xl bg-emerald-600 px-8 py-3.5 font-medium text-white hover:bg-emerald-500"
                    >
                      Review Request
                    </button>
                  )}
                  {scheduleData?.status === "CANCEL_REQUESTED" && (
                    <button
                      type="button"
                      className="rounded-3xl bg-slate-800 px-8 py-3.5 font-medium text-white hover:bg-slate-700"
                      onClick={appCancel}
                    >
                      Approve Cancel Request
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={close}
                    className="rounded-3xl bg-slate-800 px-8 py-3.5 font-medium text-white transition-all hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="hidden border-l border-slate-800 bg-slate-900/60 p-8 lg:block">
            <div className="sticky top-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Preview
              </p>
              <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-950 p-6 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Classroom</span>
                  <span className="font-medium text-slate-100">
                    {selectedClassroom?.name ||
                      scheduleData?.classroom?.name ||
                      "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Faculty</span>
                  <span className="font-medium text-slate-100">
                    {selectedFaculty?.name ||
                      scheduleData?.faculty?.name ||
                      scheduleData?.facultyId?.name ||
                      "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Date</span>
                  <span className="font-medium text-slate-100">
                    {form.slotDate || scheduleData?.slotDate || data?.selectedSlotDate
                      ? formatLongDate(
                          form.slotDate ||
                            scheduleData?.slotDate ||
                            data?.selectedSlotDate,
                        )
                      : form.dayOfWeek !== ""
                        ? DAYS[Number(form.dayOfWeek)]
                        : DAYS[scheduleData?.dayOfWeek] || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Time</span>
                  <span className="font-medium text-slate-100">
                    {form.startTime || scheduleData?.startTime || "—"} –{" "}
                    {form.endTime || scheduleData?.endTime || "—"}
                  </span>
                </div>
                {form.courseName || scheduleData?.courseName ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Course</span>
                    <span className="font-medium text-slate-100">
                      {form.courseName || scheduleData?.courseName}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const {
    items: schedules = [],
    userSchedules = [],
    loading,
  } = useSelector((state) => state.schedules);
  const { items: classrooms = [], faculties = [] } = useSelector(
    (state) => state.classrooms,
  );

  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    getStartOfWeek(),
  );
  const [modal, setModal] = useState({
    open: false,
    mode: "view",
    data: null,
  });

  const refreshAll = async () => {
    await Promise.all([
      dispatch(fetchSchedules({ token })),
      dispatch(fetchClassrooms({ search: "", facultyId: "all", token })),
      dispatch(fetchFaculties({ token })),
      dispatch(fetchUserSchedules({ token })),
    ]);
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    refreshAll();
  }, [token, dispatch, router]);

  useEffect(() => {
    if (!selectedClassroomId && classrooms.length > 0) {
      setSelectedClassroomId(classrooms[0]._id);
    }
  }, [classrooms, selectedClassroomId]);

  const visibleClassrooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classrooms;

    return classrooms.filter((c) => {
      const name = c.name?.toLowerCase() || "";
      const subject = c.subject?.toLowerCase() || "";
      const facultyName = c.facultyId?.name?.toLowerCase() || "";
      return name.includes(q) || subject.includes(q) || facultyName.includes(q);
    });
  }, [classrooms, search]);

  const selectedClassroom = classrooms.find(
    (c) => c._id === selectedClassroomId,
  );
  const weekDates = useMemo(
    () => buildWeekDates(selectedWeekStart),
    [selectedWeekStart],
  );
  const weekDateKeys = useMemo(
    () => weekDates.map((entry) => entry.dateKey),
    [weekDates],
  );
  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return "";

    const first = weekDates[0].date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const last = weekDates[weekDates.length - 1].date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );

    return `${first} - ${last}`;
  }, [weekDates]);

  const classroomSchedules = useMemo(() => {
    if (!selectedClassroomId) return [];
    return schedules.filter(
      (s) =>
        s.classroom?._id === selectedClassroomId ||
        s.classroom === selectedClassroomId,
    );
  }, [schedules, selectedClassroomId]);

  const mySchedules = useMemo(() => {
    const sourceSchedules = isAdmin ? schedules : userSchedules;
    const inSelectedWeek = sourceSchedules.filter(
      (schedule) => weekDateKeys.includes(getScheduleDateKey(schedule)),
    );

    if (inSelectedWeek.length > 0) {
      return inSelectedWeek;
    }

    return sourceSchedules;
  }, [isAdmin, schedules, userSchedules, weekDateKeys]);
  const sidePanelSchedules = useMemo(() => {
    if (!isAdmin) return mySchedules;

    const actionableSchedules = schedules.filter((schedule) => {
      const scheduleDateKey = getScheduleDateKey(schedule);
      const isInSelectedWeek = !scheduleDateKey || weekDateKeys.includes(scheduleDateKey);
      return (
        isInSelectedWeek &&
        (schedule.status === "REQUESTED" ||
          schedule.status === "CANCEL_REQUESTED")
      );
    });

    if (actionableSchedules.length > 0) {
      return actionableSchedules;
    }

    return schedules.filter((schedule) => {
      const scheduleDateKey = getScheduleDateKey(schedule);
      return !scheduleDateKey || weekDateKeys.includes(scheduleDateKey);
    });
  }, [isAdmin, mySchedules, schedules, weekDateKeys]);

  const grid = useMemo(() => {
    return weekDates.map(({ day, dayIndex, dateKey, shortDate, longDate }) => ({
      day,
      dayIndex,
      dateKey,
      shortDate,
      longDate,
      slots: TIME_SLOTS.map((time) => {
        const weekSchedule = classroomSchedules.find(
          (s) =>
            getScheduleDateKey(s) === dateKey &&
            String(s.startTime).slice(0, 5) === time &&
            (s.classroom?._id === selectedClassroomId ||
              s.classroom === selectedClassroomId),
        );

        const recurringSchedule = classroomSchedules.find(
          (s) =>
            !getScheduleDateKey(s) &&
            Number(s.dayOfWeek) === dayIndex &&
            String(s.startTime).slice(0, 5) === time,
        );

        return {
          time,
          slotDate: dateKey,
          schedule: weekSchedule || recurringSchedule || null,
        };
      }),
    }));
  }, [classroomSchedules, selectedClassroomId, weekDates]);

  const visibleSchedules = useMemo(
    () =>
      grid.flatMap((day) =>
        day.slots.map((slot) => ({
          ...slot,
          schedule: slot.schedule,
        })),
      ),
    [grid],
  );

  const requestedCount = visibleSchedules.filter(
    (slot) => slot.schedule?.status === "REQUESTED",
  ).length;
  const bookedCount = visibleSchedules.filter(
    (slot) => slot.schedule?.status === "BOOKED",
  ).length;
  const freeCount = visibleSchedules.filter(
    (slot) => slot.schedule?.status === "FREE",
  ).length;
  const selectedWeekRequestedSchedules = useMemo(() => {
    return classroomSchedules
      .filter((schedule) => {
        const scheduleDateKey = getScheduleDateKey(schedule);
        const isInSelectedWeek = !scheduleDateKey || weekDateKeys.includes(scheduleDateKey);
        return isInSelectedWeek && schedule.status === "REQUESTED";
      })
      .sort((left, right) => {
        const leftDate = getScheduleDateKey(left) || "";
        const rightDate = getScheduleDateKey(right) || "";

        if (leftDate !== rightDate) {
          return leftDate.localeCompare(rightDate);
        }

        return String(left.startTime || "").localeCompare(
          String(right.startTime || ""),
        );
      });
  }, [classroomSchedules, weekDateKeys]);

  const openModal = (mode, data) => {
    setModal({ open: true, mode, data });
  };

  const onCellClick = (schedule, dayIndex, time, slotDate) => {
    if (isAdmin) {
      if (!schedule) {
        openModal("create", {
          classroomId: selectedClassroomId,
          dayOfWeek: dayIndex,
          slotDate,
          startTime: time,
          endTime: addOneHour(time),
        });
        return;
      }

      if (schedule.status === "REQUESTED") {
        openModal("review", { ...schedule, selectedSlotDate: slotDate });
        return;
      }

      openModal("view", { ...schedule, selectedSlotDate: slotDate });
      return;
    }

    if (schedule && schedule.status === "FREE") {
      openModal("request", { ...schedule, selectedSlotDate: slotDate });
      return;
    }

    if (schedule) {
      openModal("view", { ...schedule, selectedSlotDate: slotDate });
    }
  };

  const renderCell = (schedule, dayIndex, time, slotDate) => {
    const meta = statusBadge(schedule?.status || "FREE");

    if (schedule) {
      return (
        <button
          type="button"
          onClick={() => onCellClick(schedule, dayIndex, time, slotDate)}
          className={`group flex h-full min-h-[92px] w-full flex-col justify-between rounded-2xl border px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${meta.className}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <ChevronRight
              size={14}
              className="opacity-0 transition group-hover:opacity-100"
            />
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-sm font-semibold text-slate-50">
              {schedule.classroom?.name ||
                selectedClassroom?.name ||
                "Classroom"}
            </p>
            <p className="text-xs text-slate-200/80">
              {schedule.classroom?.subject || schedule.course || "Slot"}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
            <Clock3 size={12} />
            {schedule.startTime} - {schedule.endTime}
          </div>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onCellClick(null, dayIndex, time, slotDate)}
        className={`flex h-full min-h-[92px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-3 py-3 text-slate-600 transition hover:border-indigo-500/40 hover:bg-slate-900/80 hover:text-slate-300 ${
          isAdmin ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {isAdmin ? (
          <div className="flex flex-col items-center gap-1">
            <Plus size={16} />
            <span className="text-xs font-medium">Add slot</span>
          </div>
        ) : (
          <span className="text-xs">No slot</span>
        )}
      </button>
    );
  };

  if (!user || !token) return null;

  return (
    <DashboardLayout activeTab="schedules">
      <Toaster position="top-right" richColors />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 px-6 py-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <Pill className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                  <LayoutGrid size={12} className="mr-1" />
                  Scheduling management
                </Pill>
                <Pill
                  className={
                    isAdmin
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                  }
                >
                  {isAdmin ? "Admin" : user.role?.toUpperCase()}
                </Pill>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-50 md:text-5xl">
                Classroom timetable
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Manage classroom slots, review booking requests, and view live
                scheduling updates in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                <CalendarDays size={16} />
                Refresh
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    openModal("create", {
                      classroomId: selectedClassroomId,
                      dayOfWeek: 0,
                      slotDate: weekDates[0]?.dateKey || "",
                      startTime: "08:00",
                      endTime: "09:00",
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  <Plus size={16} />
                  Create schedule
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Classrooms"
            value={classrooms.length}
            hint="Available rooms in system"
          />
          <StatCard
            icon={LayoutGrid}
            label="Free slots"
            value={freeCount}
            hint="In selected classroom"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending requests"
            value={requestedCount}
            hint="Awaiting review"
          />
          <StatCard
            icon={CheckCircle2}
            label="Booked slots"
            value={bookedCount}
            hint="Confirmed schedules"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr_340px]">
          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Search classrooms
                </h2>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by room, subject, faculty..."
                className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Classroom list
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a room to open its timetable
                  </p>
                </div>
                <Pill className="border-slate-700 bg-slate-900 text-slate-300">
                  {visibleClassrooms.length}
                </Pill>
              </div>

              <div className="mt-4 space-y-3">
                {visibleClassrooms.map((room) => {
                  const count = schedules.filter(
                    (s) =>
                      s.classroom?._id === room._id || s.classroom === room._id,
                  ).length;

                  const active = room._id === selectedClassroomId;

                  return (
                    <button
                      key={room._id}
                      type="button"
                      onClick={() => setSelectedClassroomId(room._id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                          : "border-slate-700 bg-slate-900/60 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">
                            {room.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {room.subject || "No subject"}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className={
                            active ? "text-indigo-300" : "text-slate-500"
                          }
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <Pill className="border-slate-700 bg-slate-950 text-slate-300">
                          <Users size={12} className="mr-1" />
                          {count} slots
                        </Pill>
                        {room.facultyId?.name && (
                          <Pill className="border-slate-700 bg-slate-950 text-slate-300">
                            <GraduationCap size={12} className="mr-1" />
                            {room.facultyId.name}
                          </Pill>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Legend
                </h2>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                {Object.entries(STATUS_META).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${value.dot}`}
                      />
                      {value.label}
                    </div>
                    <span className="text-slate-500">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5 shadow-2xl shadow-black/10">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-300" />
                  <h2 className="text-2xl font-bold text-slate-100">
                    {selectedClassroom?.name || "Select a classroom"}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedClassroom?.subject ||
                    "Timetable and slot management"}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Week of {weekRangeLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedWeekStart((prev) => addDays(prev, -7))
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeekStart(getStartOfWeek())}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  <CalendarDays size={16} />
                  Current week
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeekStart((prev) => addDays(prev, 7))}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Pill className="border-slate-700 bg-slate-900 text-slate-300">
                <Circle
                  size={10}
                  className="mr-1 fill-emerald-400 text-emerald-400"
                />
                Free
              </Pill>
              <Pill className="border-slate-700 bg-slate-900 text-slate-300">
                <Circle
                  size={10}
                  className="mr-1 fill-amber-400 text-amber-400"
                />
                Requested
              </Pill>
              <Pill className="border-slate-700 bg-slate-900 text-slate-300">
                <Circle
                  size={10}
                  className="mr-1 fill-rose-400 text-rose-400"
                />
                Booked
              </Pill>
            </div>

            {loading && (
              <div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-indigo-400" size={30} />
                  <p className="text-sm text-slate-400">Loading schedules...</p>
                </div>
              </div>
            )}

            {!loading && !selectedClassroom && (
              <EmptyState
                icon={LayoutGrid}
                title="No classroom selected"
                description="Pick a classroom from the left panel to open its timetable."
              />
            )}

            {!loading && selectedClassroom && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="w-24 px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Time
                      </th>
                      {weekDates.map((day) => (
                        <th
                          key={day.dateKey}
                          className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          <div>{day.day}</div>
                          <div className="mt-1 text-[11px] font-medium normal-case tracking-normal text-slate-400">
                            {day.shortDate}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((time) => (
                      <tr key={time}>
                        <td className="px-2 py-2 align-top">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm font-semibold text-slate-200">
                            <Clock3 size={14} className="mb-1 text-slate-500" />
                            {time}
                          </div>
                        </td>

                        {weekDates.map((day, dayIndex) => {
                          const schedule = grid
                            .find((g) => g.dayIndex === dayIndex)
                            ?.slots.find(
                              (slot) => slot.time === time,
                            )?.schedule;
                          const slotDate = grid
                            .find((g) => g.dayIndex === dayIndex)
                            ?.slots.find((slot) => slot.time === time)?.slotDate;

                          return (
                            <td
                              key={`${day.dateKey}-${time}`}
                              className="px-2 py-2 align-top"
                            >
                              {renderCell(schedule, dayIndex, time, slotDate)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {isAdmin ? "Admin queue" : "My schedules"}
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {sidePanelSchedules.length === 0 ? (
                  <EmptyState
                    icon={ListChecks}
                    title={isAdmin ? "No requests pending" : "No schedules yet"}
                    description={
                      isAdmin
                        ? "Requests and cancel approvals will appear here."
                        : "Bookings and approvals will appear here."
                    }
                  />
                ) : (
                  sidePanelSchedules.slice(0, 6).map((schedule) => {
                    const meta = statusBadge(schedule.status);
                    return (
                      <button
                        key={schedule._id}
                        type="button"
                        onClick={() => {
                          if (isAdmin && schedule.status === "REQUESTED") {
                            openModal("review", schedule);
                            return;
                          }

                          openModal("view", schedule);
                        }}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-left transition hover:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-100">
                              {schedule.classroom?.name || "Classroom"}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {schedule.courseName ||
                                schedule.course ||
                                schedule.classroom?.subject ||
                                "Schedule"}
                            </p>
                          </div>
                          <Pill className={meta.className}>{meta.label}</Pill>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {getScheduleDateKey(schedule)
                            ? formatLongDate(getScheduleDateKey(schedule))
                            : "Recurring weekly slot"}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <Clock3 size={12} />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Selected week summary
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
                  <span className="text-sm text-slate-400">Total slots</span>
                  <span className="font-semibold text-slate-100">
                    {classroomSchedules.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
                  <span className="text-sm text-slate-400">Booked</span>
                  <span className="font-semibold text-rose-300">
                    {bookedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
                  <span className="text-sm text-slate-400">Requested</span>
                  <span className="font-semibold text-amber-300">
                    {requestedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
                  <span className="text-sm text-slate-400">Free</span>
                  <span className="font-semibold text-emerald-300">
                    {freeCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Requested for this class/week
                </h2>
                <Pill className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                  {selectedWeekRequestedSchedules.length}
                </Pill>
              </div>

              <div className="mt-4 space-y-3">
                {selectedWeekRequestedSchedules.length === 0 ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="No requested schedules"
                    description="Pending requests for the selected classroom and week will appear here."
                  />
                ) : (
                  selectedWeekRequestedSchedules.map((schedule) => (
                    <button
                      key={schedule._id}
                      type="button"
                      onClick={() =>
                        openModal(
                          isAdmin ? "review" : "view",
                          schedule,
                        )
                      }
                      className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left transition hover:bg-amber-500/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">
                            {schedule.courseName || schedule.course || "Requested slot"}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {getScheduleDateKey(schedule)
                              ? formatLongDate(getScheduleDateKey(schedule))
                              : DAYS[schedule.dayOfWeek] || "Recurring weekly slot"}
                          </p>
                        </div>
                        <Pill className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                          Requested
                        </Pill>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Clock3 size={12} />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      {(schedule.faculty?.name || schedule.facultyId?.name) && (
                        <div className="mt-2 text-xs text-slate-500">
                          Faculty: {schedule.faculty?.name || schedule.facultyId?.name}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ScheduleModal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "view", data: null })}
        mode={modal.mode}
        data={modal.data}
        classrooms={classrooms}
        faculties={faculties}
        token={token}
        dispatch={dispatch}
        refreshSchedules={refreshAll}
        openModal={openModal}
        isAdmin={isAdmin}
      />
    </DashboardLayout>
  );
}
