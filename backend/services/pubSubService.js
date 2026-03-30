import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const publisher = createClient({ url: redisUrl });
const subscriber = createClient({ url: redisUrl });

const listeners = new Map();

export const initializePubSub = async () => {
  try {
    await publisher.connect();
    await subscriber.connect();
    console.log(" Redis Pub/Sub connected");
  } catch (error) {
    console.error(" Redis Pub/Sub connection error:", error);
    throw error;
  }
};

export const publishEvent = async (channel, message) => {
  try {
    const payload = {
      ...message,
      timestamp: Date.now(),
    };

    await publisher.publish(channel, JSON.stringify(payload));
    console.log(`Event → ${channel}`, payload);
  } catch (error) {
    console.error("Publish error:", error);
  }
};
export const subscribe = async (channel, callback) => {
  try {
    if (listeners.has(channel)) {
      console.log(`Already subscribed to ${channel}`);
      return;
    }

    const handler = (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch {
        callback(message);
      }
    };

    listeners.set(channel, handler);
    await subscriber.subscribe(channel, handler);

    console.log(`Subscribed to ${channel}`);
  } catch (error) {
    console.error("Subscribe error:", error);
  }
};

export const unsubscribe = async (channel) => {
  try {
    if (listeners.has(channel)) {
      const handler = listeners.get(channel);
      await subscriber.unsubscribe(channel, handler);
      listeners.delete(channel);
      console.log(` Unsubscribed from ${channel}`);
    }
  } catch (error) {
    console.error(" Unsubscribe error:", error);
  }
};

export const closePubSub = async () => {
  try {
    await publisher.quit();
    await subscriber.quit();
    console.log(" Redis Pub/Sub connections closed");
  } catch (error) {
    console.error(" Close error:", error);
  }
};

// Events
export const EVENTS = {
  SCHEDULE_CREATED: "schedule:created",
  SCHEDULE_UPDATED: "schedule:updated",
  SCHEDULE_DELETED: "schedule:deleted",

  REQUEST_CREATED: "request:created",
  REQUEST_APPROVED: "request:approved",
  REQUEST_REJECTED: "request:rejected",

  // 🔥 ADD THESE
  CANCEL_REQUESTED: "schedule:cancel_requested",
  CANCEL_APPROVED: "schedule:cancel_approved",
  CANCEL_REJECTED: "schedule:cancel_rejected",

  CLASSROOM_UPDATED: "classroom:updated",
};
