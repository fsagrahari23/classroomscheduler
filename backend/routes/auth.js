import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Schedule from "../models/Schedule.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function generateTemporaryPassword() {
  return `Temp@${Math.random().toString(36).slice(2, 10)}A1`;
}

function getEmailPrefixPassword(email = "") {
  const prefix = normalizeEmail(email).split("@")[0];
  return prefix || generateTemporaryPassword();
}

function escapeCsvValue(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(rows) {
  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

function parseBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || "teacher",
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error(" Register error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error(" Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.toJSON());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

router.get("/users", authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    const users = await User.find(query).select("_id name email role").lean();
    res.json(users);
  } catch (error) {
    console.error(" Get users error:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

router.get("/teachers", authenticateToken, async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("_id name email role department isActive")
      .lean();
    res.json(teachers);
  } catch (error) {
    console.error(" Get teachers error:", error);
    res.status(500).json({
      message: "Error fetching teachers",
      error: error.message,
    });
  }
});

router.get("/crs", authenticateToken, async (req, res) => {
  try {
    const crUsers = await User.find({ role: "cr" })
      .select("_id name email role department isActive")
      .lean();
    res.json(crUsers);
  } catch (error) {
    console.error(" Get CR users error:", error);
    res.status(500).json({
      message: "Error fetching CR users",
      error: error.message,
    });
  }
});

router.post(
  "/users",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = "teacher",
        department = null,
        isActive = true,
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, email, and password are required",
        });
      }

      const normalizedEmail = normalizeEmail(email);
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = new User({
        name: String(name).trim(),
        email: normalizedEmail,
        password,
        role,
        department,
        isActive: parseBoolean(isActive, true),
      });

      await user.save();

      res.status(201).json({
        message: "User created successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error(" Create user error:", error);
      res.status(500).json({
        message: "Failed to create user",
        error: error.message,
      });
    }
  },
);

router.put(
  "/users/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, role, department, isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (email) {
        const normalizedEmail = normalizeEmail(email);
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: id },
        });

        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }

        user.email = normalizedEmail;
      }

      if (name) user.name = String(name).trim();
      if (password) user.password = password;
      if (role) user.role = role;
      if (department !== undefined) user.department = department || null;
      if (isActive !== undefined) user.isActive = parseBoolean(isActive, true);

      await user.save();

      res.json({
        message: "User updated successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error(" Update user error:", error);
      res.status(500).json({
        message: "Failed to update user",
        error: error.message,
      });
    }
  },
);

router.delete(
  "/users/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (req.user.id === id) {
        return res.status(400).json({
          message: "You cannot delete your own admin account",
        });
      }

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(" Delete user error:", error);
      res.status(500).json({
        message: "Failed to delete user",
        error: error.message,
      });
    }
  },
);

router.post(
  "/users/bulk",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { users } = req.body;

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          message: "users must be a non-empty array",
        });
      }

      const results = {
        created: [],
        skipped: [],
      };

      for (const entry of users) {
        const name = String(entry?.name || "").trim();
        const email = normalizeEmail(entry?.email || "");
        const role = entry?.role || "teacher";
        const department = entry?.department || null;
        const password = entry?.password || getEmailPrefixPassword(email);
        const isActive = parseBoolean(entry?.isActive, true);

        if (!name || !email) {
          results.skipped.push({
            email,
            reason: "Missing name or email",
          });
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.skipped.push({
            email,
            reason: "User already exists",
          });
          continue;
        }

        const user = new User({
          name,
          email,
          password,
          role,
          department,
          isActive,
        });

        await user.save();

        results.created.push({
          ...user.toJSON(),
          temporaryPassword: entry?.password ? undefined : password,
        });
      }

      res.status(201).json({
        message: "Bulk import completed",
        ...results,
      });
    } catch (error) {
      console.error(" Bulk import users error:", error);
      res.status(500).json({
        message: "Failed to import users",
        error: error.message,
      });
    }
  },
);

router.get(
  "/export/users.csv",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const users = await User.find({})
        .select("name email role department isActive createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();

      const csv = buildCsv([
        [
          "Name",
          "Email",
          "Role",
          "Department",
          "Active",
          "Created At",
          "Updated At",
        ],
        ...users.map((user) => [
          user.name,
          user.email,
          user.role,
          user.department,
          user.isActive,
          user.createdAt,
          user.updatedAt,
        ]),
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
      res.send(csv);
    } catch (error) {
      console.error(" Export users error:", error);
      res.status(500).json({
        message: "Failed to export users",
        error: error.message,
      });
    }
  },
);

router.get(
  "/export/classrooms.csv",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const classrooms = await Classroom.find({})
        .sort({ createdAt: -1 })
        .lean();

      const csv = buildCsv([
        ["Name", "Created At", "Updated At"],
        ...classrooms.map((classroom) => [
          classroom.name,
          classroom.createdAt,
          classroom.updatedAt,
        ]),
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="classrooms.csv"',
      );
      res.send(csv);
    } catch (error) {
      console.error(" Export classrooms error:", error);
      res.status(500).json({
        message: "Failed to export classrooms",
        error: error.message,
      });
    }
  },
);

router.get(
  "/export/schedules.csv",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const schedules = await Schedule.find({})
        .populate("classroom", "name")
        .populate("faculty", "name email")
        .populate("requestedBy", "name email")
        .populate("bookedBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const csv = buildCsv([
        [
          "Classroom",
          "Slot Date",
          "Day Of Week",
          "Start Time",
          "End Time",
          "Status",
          "Course",
          "Faculty",
          "Faculty Email",
          "Requested By",
          "Booked By",
          "Permanent",
          "Valid Till",
          "Created At",
        ],
        ...schedules.map((schedule) => [
          schedule.classroom?.name || "",
          schedule.slotDate || "",
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
          schedule.status,
          schedule.course,
          schedule.faculty?.name || "",
          schedule.faculty?.email || "",
          schedule.requestedBy?.email || schedule.requestedBy?.name || "",
          schedule.bookedBy?.email || schedule.bookedBy?.name || "",
          schedule.isPermanent,
          schedule.validTill || "",
          schedule.createdAt,
        ]),
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="schedules.csv"',
      );
      res.send(csv);
    } catch (error) {
      console.error(" Export schedules error:", error);
      res.status(500).json({
        message: "Failed to export schedules",
        error: error.message,
      });
    }
  },
);

export default router;
