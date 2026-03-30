import express from "express";
import Schedule from "../models/Schedule.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { publishEvent, EVENTS } from "../services/pubSubService.js";

const router = express.Router();
const SLOT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidSlotDate(slotDate) {
  return typeof slotDate === "string" && SLOT_DATE_PATTERN.test(slotDate);
}

function getDayIndexFromSlotDate(slotDate) {
  const [year, month, day] = slotDate.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (utcDay + 6) % 7;
}

function buildSlotDateTime(slotDate, time) {
  const [year, month, day] = slotDate.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}

// Get all schedules
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { classroom, dayOfWeek, slotDate, isPermanent } = req.query;
    const filter = {};

    if (classroom) filter.classroom = classroom;
    if (dayOfWeek !== undefined) filter.dayOfWeek = parseInt(dayOfWeek);
    if (slotDate) filter.slotDate = slotDate;
    if (isPermanent !== undefined) filter.isPermanent = isPermanent === "true";

    const schedules = await Schedule.find(filter)
      .populate("classroom", "name building")
      .populate("bookedBy", "name email")
      .populate("requestedBy", "name email")
      .populate("faculty", "name email");

    res.json(schedules);
  } catch (error) {
    console.error(" Get schedules error:", error);
    res
      .status(500)
      .json({ message: "Error fetching schedules", error: error.message });
  }
});

// Get schedule by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("classroom")
      .populate("bookedBy", "name email")
      .populate("requestedBy", "name email");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.json(schedule);
  } catch (error) {
    console.error(" Get schedule error:", error);
    res
      .status(500)
      .json({ message: "Error fetching schedule", error: error.message });
  }
});

// Create schedule (admin only)
router.post(
  "/",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const {
        classroom,
        dayOfWeek,
        startTime,
        endTime,
        facultyId,
        course,
        slotDate,
      } =
        req.body;

      if (!classroom || dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({
          message: "Classroom, dayOfWeek, startTime, and endTime are required",
        });
      }
      if (startTime >= endTime) {
        return res.status(400).json({
          message: "End time must be greater than start time",
        });
      }
      if (slotDate && !isValidSlotDate(slotDate)) {
        return res.status(400).json({
          message: "slotDate must be in YYYY-MM-DD format",
        });
      }

      const schedule = new Schedule({
        classroom,
        dayOfWeek,
        startTime,
        endTime,
        slotDate: slotDate || null,
        course,
        faculty: facultyId,
        status: "BOOKED",
        isPermanent: !slotDate,
      });
      await schedule.save();
      await schedule.populate("classroom", "name");

      await publishEvent(EVENTS.SCHEDULE_CREATED, { schedule });

      res.status(201).json(schedule);
    } catch (error) {
      console.error(" Create schedule error:", error);
      res
        .status(500)
        .json({ message: "Error creating schedule", error: error.message });
    }
  },
);

// Create free schedule (admin only)
router.post(
  "/free",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { classroom, dayOfWeek, startTime, endTime, slotDate } = req.body;

      if (!classroom || dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({
          message: "Classroom, dayOfWeek, startTime, and endTime are required",
        });
      }
      if (startTime >= endTime) {
        return res.status(400).json({
          message: "End time must be greater than start time",
        });
      }
      if (slotDate && !isValidSlotDate(slotDate)) {
        return res.status(400).json({
          message: "slotDate must be in YYYY-MM-DD format",
        });
      }

      const schedule = new Schedule({
        classroom,
        dayOfWeek,
        startTime,
        endTime,
        slotDate: slotDate || null,
        status: "FREE",
        isPermanent: !slotDate,
      });

      await schedule.save();
      await schedule.populate("classroom", "name");

      await publishEvent(EVENTS.SCHEDULE_CREATED, { schedule });

      res.status(201).json(schedule);
    } catch (error) {
      console.error(" Create schedule error:", error);
      res
        .status(500)
        .json({ message: "Error creating schedule", error: error.message });
    }
  },
);

// edit schedule (Admin only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const {
      classroom,
      dayOfWeek,
      startTime,
      endTime,
      facultyId,
      course,
      note,
    } = req.body;

    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be greater than start time",
      });
    }

    if (classroom) schedule.classroom = classroom;
    if (dayOfWeek !== undefined) schedule.dayOfWeek = dayOfWeek;
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;
    if (facultyId) schedule.faculty = facultyId;
    if (course) schedule.course = course;
    if (note !== undefined) schedule.note = note;
    if (course) schedule.course = course;
    if (note !== undefined) schedule.note = note;
    if (facultyId) schedule.faculty = facultyId;

    await schedule.save();

    await schedule.populate("classroom", "name");
    await schedule.populate("faculty", "name email");

    // 🔔 EVENT (optional)
    await publishEvent(EVENTS.SCHEDULE_UPDATED, { schedule });

    res.status(200).json({
      message: "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
    console.error(" Edit schedule error:", error);
    res.status(500).json({
      message: "Error updating schedule",
      error: error.message,
    });
  }
});
// Update schedule (admin only)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const schedule = await Schedule.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      ).populate("classroom", "name building");

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      await publishEvent(EVENTS.SCHEDULE_UPDATED, { schedule });

      res.json(schedule);
    } catch (error) {
      console.error(" Update schedule error:", error);
      res
        .status(500)
        .json({ message: "Error updating schedule", error: error.message });
    }
  },
);

// Get user's schedules (booked or requested)
router.get("/my/bookings", authenticateToken, async (req, res) => {
  try {
    const schedules = await Schedule.find({
      $or: [{ bookedBy: req.user.id }, { requestedBy: req.user.id }],
    })
      .populate("classroom", "name subject facultyId")
      .populate("faculty", "name email")
      .sort({ createdAt: -1 });

    res.json(schedules);
  } catch (error) {
    console.error(" Get user schedules error:", error);
    res
      .status(500)
      .json({ message: "Error fetching schedules", error: error.message });
  }
});

// Request classroom slot (teacher/cr)
router.post("/:id/request", authenticateToken, async (req, res) => {
  try {
    const { courseName, startTime, endTime, facultyId, slotDate } = req.body;

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.status !== "FREE") {
      return res.status(400).json({ message: "This slot is not available" });
    }

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be greater than start time",
      });
    }

    const finalStartTime = startTime || schedule.startTime;
    const finalEndTime = endTime || schedule.endTime;
    const resolvedSlotDate = slotDate || schedule.slotDate;

    if (!resolvedSlotDate || !isValidSlotDate(resolvedSlotDate)) {
      return res.status(400).json({
        message: "A valid slotDate in YYYY-MM-DD format is required",
      });
    }

    if (getDayIndexFromSlotDate(resolvedSlotDate) !== Number(schedule.dayOfWeek)) {
      return res.status(400).json({
        message: "slotDate does not match the selected day",
      });
    }

    const validTill = buildSlotDateTime(resolvedSlotDate, finalEndTime);
    if (validTill <= new Date()) {
      return res.status(400).json({
        message: "Cannot request a slot for a past date/time",
      });
    }

    let targetSchedule = schedule;

    if (schedule.isPermanent) {
      const existingSchedule = await Schedule.findOne({
        parentSchedule: schedule._id,
        slotDate: resolvedSlotDate,
      });

      if (
        existingSchedule &&
        ["REQUESTED", "BOOKED", "CANCEL_REQUESTED"].includes(
          existingSchedule.status,
        )
      ) {
        return res.status(400).json({ message: "This slot is not available" });
      }

      targetSchedule =
        existingSchedule ||
        new Schedule({
          classroom: schedule.classroom,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDate: resolvedSlotDate,
          status: "FREE",
          isPermanent: false,
          parentSchedule: schedule._id,
        });
    }

    targetSchedule.status = "REQUESTED";
    targetSchedule.requestedBy = req.user.id;
    targetSchedule.bookedBy = null;
    targetSchedule.course = courseName || targetSchedule.course;
    targetSchedule.startTime = finalStartTime;
    targetSchedule.endTime = finalEndTime;
    targetSchedule.faculty = facultyId || targetSchedule.faculty;
    targetSchedule.slotDate = resolvedSlotDate;
    targetSchedule.isPermanent = false;
    targetSchedule.validTill = validTill;

    await targetSchedule.save();

    await targetSchedule.populate("classroom", "name");
    await targetSchedule.populate("faculty", "name email");

    await publishEvent(EVENTS.REQUEST_CREATED, {
      schedule: targetSchedule,
      userId: req.user.id,
    });

    res.json({
      message: "Request submitted",
      schedule: targetSchedule,
    });
  } catch (error) {
    console.error("Request schedule error:", error);
    res.status(500).json({
      message: "Error requesting schedule",
      error: error.message,
    });
  }
});
//  Edit reuqest slot (teach/cr)

router.put("/:id/request", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const { courseName, facultyId, note } = req.body;

    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.status !== "REQUESTED") {
      return res.status(400).json({
        message: "Only requested slots can be edited",
      });
    }

    if (user.role !== "admin" && schedule.requestedBy?.toString() !== user.id) {
      return res.status(403).json({
        message: "You can only edit your own request",
      });
    }

    if (courseName) schedule.course = courseName;
    if (facultyId) schedule.faculty = facultyId;
    if (note !== undefined) schedule.note = note || "";

    if (user.role === "admin") {
      const { startTime, endTime } = req.body;

      if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({
          message: "End time must be greater than start time",
        });
      }

      if (startTime) schedule.startTime = startTime;
      if (endTime) schedule.endTime = endTime;
    }

    await schedule.save();

    await schedule.populate("classroom", "name building");
    await schedule.populate("faculty", "name email");

    await publishEvent(EVENTS.REQUEST_UPDATED, {
      schedule,
      userId: user.id,
    });

    res.json({
      message: "Request updated successfully",
      schedule,
    });
  } catch (error) {
    console.error(" Edit request error:", error);
    res.status(500).json({
      message: "Error updating request",
      error: error.message,
    });
  }
});

// Approve request (admin only)
router.post(
  "/:id/approve",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const schedule = await Schedule.findById(req.params.id);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      if (schedule.status !== "REQUESTED") {
        return res
          .status(400)
          .json({ message: "Schedule is not in REQUESTED status" });
      }

      schedule.status = "BOOKED";
      schedule.bookedBy = schedule.requestedBy;

      await schedule.save();
      await schedule.populate("classroom", "name subject facultyId");
      await schedule.populate("requestedBy", "name email");

      await publishEvent(EVENTS.REQUEST_APPROVED, {
        schedule,
        userId: schedule.requestedBy,
      });

      res.json({ message: "Request approved", schedule });
    } catch (error) {
      console.error("Approve schedule error:", error);
      res
        .status(500)
        .json({ message: "Error approving schedule", error: error.message });
    }
  },
);

// Reject request (admin only)
router.post(
  "/:id/reject",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const schedule = await Schedule.findById(req.params.id);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      if (schedule.status !== "REQUESTED") {
        return res
          .status(400)
          .json({ message: "Schedule is not in REQUESTED status" });
      }

      const requestedUserId = schedule.requestedBy;
      schedule.status = "FREE";
      schedule.requestedBy = null;
      schedule.bookedBy = null;
      schedule.course = null;
      schedule.faculty = null;
      schedule.validTill = null;

      await schedule.save();
      await schedule.populate("classroom", "name subject facultyId");

      await publishEvent(EVENTS.REQUEST_APPROVED, {
        schedule,
        userId: requestedUserId,
        rejected: true,
      });

      res.json({ message: "Request rejected", schedule });
    } catch (error) {
      console.error("Reject schedule error:", error);
      res
        .status(500)
        .json({ message: "Error rejecting schedule", error: error.message });
    }
  },
);

// Request cancellation
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Only booked schedules can be cancelled
    if (schedule.status !== "BOOKED") {
      return res.status(400).json({
        message: "Only booked schedules can be cancelled",
      });
    }

    // Optional: only requester can cancel
    if (schedule.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to cancel this schedule",
      });
    }

    schedule.status = "CANCEL_REQUESTED";
    await schedule.save();

    await schedule.populate("classroom", "name");
    await schedule.populate("faculty", "name email");

    await publishEvent(EVENTS.CANCEL_REQUESTED, {
      schedule,
      userId: req.user.id,
    });

    res.json({ message: "Cancel request sent", schedule });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({
      message: "Error requesting cancellation",
      error: error.message,
    });
  }
});

router.post(
  "/:id/cancel/approve",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const schedule = await Schedule.findById(req.params.id);

      if (!schedule || schedule.status !== "CANCEL_REQUESTED") {
        return res.status(400).json({ message: "Invalid cancel request" });
      }

      // Reset slot
      schedule.status = "FREE";
      schedule.requestedBy = null;
      schedule.bookedBy = null;
      schedule.course = null;
      schedule.faculty = null;
      schedule.validTill = null;

      await schedule.save();

      await publishEvent(EVENTS.CANCEL_APPROVED, { schedule });

      res.json({ message: "Cancel approved", schedule });
    } catch (error) {
      res.status(500).json({ message: "Error approving cancel" });
    }
  },
);

router.post(
  "/:id/cancel/reject",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const schedule = await Schedule.findById(req.params.id);

      if (!schedule || schedule.status !== "CANCEL_REQUESTED") {
        return res.status(400).json({ message: "Invalid cancel request" });
      }

      schedule.status = "BOOKED"; // revert back
      await schedule.save();

      await publishEvent(EVENTS.CANCEL_REJECTED, { schedule });

      res.json({ message: "Cancel rejected", schedule });
    } catch (error) {
      res.status(500).json({ message: "Error rejecting cancel" });
    }
  },
);

export default router;
