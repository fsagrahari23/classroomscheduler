import axios from "axios";
import store from "./store/index.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_URL,
});

// Add token to requests
client.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
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

export const authAPI = {
  register: (data) => client.post("/auth/register", data),
  login: (data) => client.post("/auth/login", data),
  getMe: () => client.get("/auth/me"),
};

export const classroomAPI = {
  getAll: () => client.get("/classrooms"),
  getById: (id) => client.get(`/classrooms/${id}`),
  create: (data) => client.post("/classrooms", data),
  update: (id, data) => client.put(`/classrooms/${id}`, data),
  delete: (id) => client.delete(`/classrooms/${id}`),
};

export const scheduleAPI = {
  getAll: (params) => client.get("/schedules", { params }),
  getById: (id) => client.get(`/schedules/${id}`),
  create: (data) => client.post("/schedules", data),
  update: (id, data) => client.put(`/schedules/${id}`, data),
  request: (id, data) => client.post(`/schedules/${id}/request`, data),
  approve: (id) => client.post(`/schedules/${id}/approve`),
  reject: (id) => client.post(`/schedules/${id}/reject`),
};

export default client;
