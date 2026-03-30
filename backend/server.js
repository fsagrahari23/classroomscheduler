import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  initializePubSub,
  subscribe,
  EVENTS,
} from "./services/pubSubService.js";
import authRoutes from "./routes/auth.js";
import classroomRoutes from "./routes/classrooms.js";
import scheduleRoutes from "./routes/schedules.js";
import "./services/cronjobservice.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("  MongoDB connected");
  } catch (error) {
    console.error("  MongoDB connection error:", error);
    process.exit(1);
  }
};

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("join-classroom", (classroomId) => {
    socket.join(`classroom:${classroomId}`);
    console.log(`User ${socket.id} joined classroom:${classroomId}`);
  });

  socket.on("leave-classroom", (classroomId) => {
    socket.leave(`classroom:${classroomId}`);
    console.log(`User ${socket.id} left classroom:${classroomId}`);
  });
});

// PubSub Event Listeners
const setupPubSubListeners = async () => {
  try {
    await subscribe(EVENTS.SCHEDULE_CREATED, (data) => {
      const { schedule } = data;
      io.to(`classroom:${schedule.classroom}`).emit(
        "schedule:created",
        schedule,
      );
    });

    await subscribe(EVENTS.SCHEDULE_UPDATED, (data) => {
      const { schedule } = data;
      io.to(`classroom:${schedule.classroom}`).emit(
        "schedule:updated",
        schedule,
      );
    });

    await subscribe(EVENTS.SCHEDULE_DELETED, (data) => {
      const { scheduleId, classroomId } = data;
      io.to(`classroom:${classroomId}`).emit("schedule:deleted", {
        scheduleId,
      });
    });

    await subscribe(EVENTS.REQUEST_CREATED, (data) => {
      io.emit("request:created", data);
    });

    await subscribe(EVENTS.REQUEST_APPROVED, (data) => {
      io.emit("request:approved", data);
    });
    await subscribe(EVENTS.CANCEL_REQUESTED, ({ schedule }) => {
      io.to(`classroom:${schedule.classroom}`).emit(
        "schedule:cancel_requested",
        schedule,
      );
    });

    await subscribe(EVENTS.CANCEL_APPROVED, ({ schedule }) => {
      io.to(`classroom:${schedule.classroom}`).emit(
        "schedule:cancel_approved",
        schedule,
      );
    });

    await subscribe(EVENTS.CANCEL_REJECTED, ({ schedule }) => {
      io.to(`classroom:${schedule.classroom}`).emit(
        "schedule:cancel_rejected",
        schedule,
      );
    });
    console.log("  PubSub listeners initialized");
  } catch (error) {
    console.error("  PubSub setup error:", error);
  }
};

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/schedules", scheduleRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("  Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development" ? err.message : "Unknown error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await initializePubSub();
    await setupPubSubListeners();

    httpServer.listen(PORT, () => {
      console.log(`  Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("  Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default { app, io };
