import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Classroom name is required"],
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Classroom", classroomSchema);
