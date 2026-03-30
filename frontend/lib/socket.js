import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (!socket) {
    socket = io("http://localhost:5005", {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket Error:", err.message);
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinClassroom = (classroomId) => {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("join-classroom", classroomId);
};

export const leaveClassroom = (classroomId) => {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("leave-classroom", classroomId);
};

export const onScheduleUpdate = (callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.off("schedule:updated");
  socket.on("schedule:updated", callback);
};

export const onScheduleCreated = (callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.off("schedule:created");
  socket.on("schedule:created", callback);
};

export const offScheduleUpdate = (callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.off("schedule:updated", callback);
};

export const offScheduleCreated = (callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.off("schedule:created", callback);
};
