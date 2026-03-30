import express from "express";
import Classroom from "../models/Classroom.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import Schedule from "../models/Schedule.js";

const router = express.Router();

// Get all classrooms with search and filter
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // Search by classroom name or subject
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { subject: searchRegex }];
    }

    const classrooms = await Classroom.find(query);
    res.json(classrooms);
  } catch (error) {
    console.error("Get classrooms error:", error);
    res
      .status(500)
      .json({ message: "Error fetching classrooms", error: error.message });
  }
});

// Get classroom by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    res.json(classroom);
  } catch (error) {
    console.error(" Get classroom error:", error);
    res
      .status(500)
      .json({ message: "Error fetching classroom", error: error.message });
  }
});

// Create classroom (admin only)
router.post(
  "/",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ message: "Name, subject, and facultyId are required" });
      }

      const classroom = new Classroom({
        name,
      });

      await classroom.save();
      const populatedClassroom = await Classroom.findById(classroom._id);
      res.status(201).json(populatedClassroom);
    } catch (error) {
      console.error(" Create classroom error:", error);
      res
        .status(500)
        .json({ message: "Error creating classroom", error: error.message });
    }
  },
);

// Update classroom (admin only)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const classroom = await Classroom.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      );

      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      res.json(classroom);
    } catch (error) {
      console.error(" Update classroom error:", error);
      res
        .status(500)
        .json({ message: "Error updating classroom", error: error.message });
    }
  },
);

// Delete classroom (admin only) + delete all related schedules
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const classroomId = req.params.id;

      // Check if classroom exists
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      await Schedule.deleteMany({
        $or: [{ classroom: classroomId }, { classroomId: classroomId }],
      });

      await Classroom.findByIdAndDelete(classroomId);

      res.json({
        message: "Classroom and all related schedules deleted successfully",
      });
    } catch (error) {
      console.error("Delete classroom error:", error);
      res.status(500).json({
        message: "Error deleting classroom",
        error: error.message,
      });
    }
  },
);

export default router;
