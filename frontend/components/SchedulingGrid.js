"use client";

import { useState, useEffect } from "react";
import { scheduleAPI } from "@/lib/api";
import {
  getSocket,
  joinClassroom,
  leaveClassroom,
  offScheduleUpdate,
  onScheduleUpdate,
} from "@/lib/socket";
import { useSelector } from "react-redux";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const STATUS_COLORS = {
  FREE: "bg-green-100 text-green-800 border-green-300",
  REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  BOOKED: "bg-red-100 text-red-800 border-red-300",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800 border-orange-300",
};

export default function SchedulingGrid({
  classroomId,
  schedules,
  onScheduleSelect,
}) {
  const { user } = useSelector((state) => state.user);
  const [gridData, setGridData] = useState([]);
  const [isAdmin] = useState(user?.role === "admin");

  useEffect(() => {
    // Build grid data
    const grid = DAYS.map((day, dayIndex) => ({
      day,
      dayIndex,
      slots: TIME_SLOTS.map((time) => {
        const schedule = schedules.find(
          (s) =>
            s.dayOfWeek === dayIndex &&
            s.startTime === time &&
            s.classroom?._id === classroomId,
        );
        return { time, schedule };
      }),
    }));
    setGridData(grid);
  }, [schedules, classroomId]);

  useEffect(() => {
    if (classroomId) {
      joinClassroom(classroomId);
      onScheduleUpdate((updatedSchedule) => {
        if (updatedSchedule.classroom === classroomId) {
          setGridData((prev) =>
            prev.map((day) => ({
              ...day,
              slots: day.slots.map((slot) =>
                slot.schedule?._id === updatedSchedule._id
                  ? { ...slot, schedule: updatedSchedule }
                  : slot,
              ),
            })),
          );
        }
      });

      return () => {
        leaveClassroom(classroomId);
        offScheduleUpdate();
      };
    }
  }, [classroomId]);

  const handleSlotClick = (dayIndex, time, schedule) => {
    if (onScheduleSelect) {
      onScheduleSelect({
        schedule,
        dayOfWeek: dayIndex,
        startTime: time,
        classroomId,
        facultyId,
      });
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      FREE: "Available",
      REQUESTED: "Requested",
      BOOKED: "Booked",
      CANCEL_REQUESTED: "Cancel Requested",
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">
                Time
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-4 py-3 text-center font-semibold text-gray-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr
                key={time}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">
                  {time}
                </td>
                {DAYS.map((day, dayIndex) => {
                  const slot = gridData
                    .find((d) => d.dayIndex === dayIndex)
                    ?.slots.find((s) => s.time === time);
                  const schedule = slot?.schedule;

                  return (
                    <td
                      key={`${day}-${time}`}
                      className="px-2 py-2 text-center"
                    >
                      {schedule ? (
                        <button
                          onClick={() => handleSlotClick(schedule)}
                          className={`w-full p-3 rounded border-2 text-xs font-medium transition-transform hover:scale-105 cursor-pointer ${
                            STATUS_COLORS[schedule.status]
                          }`}
                        >
                          <div>{getStatusLabel(schedule.status)}</div>
                          {schedule.course && (
                            <div className="text-xs mt-1 opacity-75">
                              {schedule.course}
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="p-3 text-gray-400 text-sm">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
