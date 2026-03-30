// lib/api.js
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_URL,
});

// Add token interceptor (best practice)
client.interceptors.request.use((config) => {
  // We'll get token from Redux inside thunks instead of here
  // to avoid circular dependency
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Export APIs
export const authAPI = {
  register: (data) => client.post("/auth/register", data),
  login: (data) => client.post("/auth/login", data),
  getMe: () => client.get("/auth/me"),
};

export const classroomAPI = {
  getAll: () => client.get("/classrooms"),
  create: (data) => client.post("/classrooms", data),
  update: (id, data) => client.put(`/classrooms/${id}`, data),
  delete: (id) => client.delete(`/classrooms/${id}`),
  // Add this if needed
  getFaculties: () => client.get("/auth/users?"),
};
export const scheduleAPI = {
  getAll: () => client.get("/schedules"),
  getById: (id) => client.get(`/schedules/${id}`),
  create: (data) => client.post("/schedules", data),
  createFreeSlot: (data) => client.post("/schedules/free", data), // ← NEW
  request: (scheduleId, data) =>
    client.post(`/schedules/${scheduleId}/request`, data),
  approve: (id) => client.post(`/schedules/${id}/approve`),
  reject: (id) => client.post(`/schedules/${id}/reject`),
  cancel: (id) => client.post(`/schedules/${id}/cancel`),
  approveCancel: (id) => client.post(`/schedules/${id}/cancel/approve`),
};

export default client;
