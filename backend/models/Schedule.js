import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    slotDate: {
      type: String,
      default: null,
      match: [/^\d{4}-\d{2}-\d{2}$/, "slotDate must be in YYYY-MM-DD format"],
    },
    status: {
      type: String,
      enum: ["FREE", "REQUESTED", "BOOKED", "CANCEL_REQUESTED"],
      default: "FREE",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    course: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    parentSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      default: null,
    },
    validTill: {
      type: Date,
      default: null,
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index for efficient querying
scheduleSchema.index({ classroom: 1, dayOfWeek: 1, startTime: 1 });
scheduleSchema.index({ classroom: 1, slotDate: 1, startTime: 1 });
scheduleSchema.index({ parentSchedule: 1, slotDate: 1 });

export default mongoose.model("Schedule", scheduleSchema);
