import cron from "node-cron";
import Schedule from "../models/Schedule.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Resetting temporary schedules...");

  const now = new Date();

  await Schedule.updateMany(
    {
      isPermanent: false,
      validTill: { $lt: now },
      status: { $in: ["REQUESTED", "BOOKED", "CANCEL_REQUESTED"] },
    },
    {
      $set: {
        status: "FREE",
        requestedBy: null,
        bookedBy: null,
        faculty: null,
        course: null,
        notes: "",
        validTill: null,
      },
    },
  );
});
