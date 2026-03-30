import { Queue, Worker } from "bullmq";
import { createClient } from "redis";
import {
  sendEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendRequestNotificationEmail,
} from "./emailService.js";

const redisConnection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_URL?.split(":")[2]) || 6379,
};

console.log(" Redis connection config:", redisConnection);

export const emailQueue = new Queue("emails", { connection: redisConnection });

// Email Worker
export const emailWorker = new Worker(
  "emails",
  async (job) => {
    console.log(" Processing email job:", job.id, job.data.type);

    try {
      const { type, to, data } = job.data;

      switch (type) {
        case "APPROVAL":
          await sendApprovalEmail(to, data.classroomName, data.time);
          break;
        case "REJECTION":
          await sendRejectionEmail(to, data.classroomName, data.reason);
          break;
        case "REQUEST_NOTIFICATION":
          await sendRequestNotificationEmail(
            to,
            data.classroomName,
            data.requesterName,
            data.course,
          );
          break;
        default:
          await sendEmail(to, data.subject, data.html);
      }

      return { success: true };
    } catch (error) {
      console.error(" Email job failed:", error);
      throw error;
    }
  },
  { connection: redisConnection },
);

emailWorker.on("failed", (job, err) => {
  console.error(" Email job failed:", job.id, err.message);
});

emailWorker.on("completed", (job) => {
  console.log(" Email job completed:", job.id);
});

export const addEmailJob = async (type, to, data, delay = 0) => {
  await emailQueue.add(
    "send-email",
    { type, to, data },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      delay,
    },
  );
};
