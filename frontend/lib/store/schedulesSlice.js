import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const fetchSchedules = createAsyncThunk(
  "schedules/fetchSchedules",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch schedules",
      );
    }
  },
);

export const createSchedule = createAsyncThunk(
  "schedules/createSchedule",
  async ({ data, token }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${API_URL}/schedules`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(fetchSchedules({ token }));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create schedule",
      );
    }
  },
);

export const createFreeSlot = createAsyncThunk(
  "schedules/createFreeSlot",
  async ({ data, token }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${API_URL}/schedules/free`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(fetchSchedules({ token }));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create schedule",
      );
    }
  },
);

export const fetchUserSchedules = createAsyncThunk(
  "schedules/fetchUserSchedules",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/schedules/my/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user schedules",
      );
    }
  },
);

export const createRequest = createAsyncThunk(
  "schedules/createRequest",
  async (
    {
      classroomId,
      startTime,
      endTime,
      courseName,
      token,
      facultyId,
      scheduleId,
      note,
      slotDate,
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/schedules/${scheduleId}/request`,
        {
          classroomId,
          startTime,
          endTime,
          courseName,
          facultyId,
          note,
          slotDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("✅ RESPONSE:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ ERROR:", error.response?.data);

      return rejectWithValue(
        error.response?.data?.message || "Failed to create request",
      );
    }
  },
);
export const editRequest = createAsyncThunk(
  "schedules/editRequest",
  async (
    { courseName, facultyId, scheduleId, note, token },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(
        `${API_URL}/schedules/${scheduleId}/request`,
        { courseName, facultyId, note },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create request",
      );
    }
  },
);

export const approveRequest = createAsyncThunk(
  "schedules/approveRequest",
  async ({ requestId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/schedules/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve request",
      );
    }
  },
);

export const cancelRequest = createAsyncThunk(
  "schedules/cancelRequest",
  async ({ scheduleId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_URL}/schedules/${scheduleId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data.schedule;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const approveCancel = createAsyncThunk(
  "schedules/approveCancel",
  async ({ scheduleId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_URL}/schedules/${scheduleId}/cancel/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data.schedule;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const rejectCancel = createAsyncThunk(
  "schedules/rejectCancel",
  async ({ scheduleId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_URL}/schedules/${scheduleId}/cancel/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data.schedule;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const rejectRequest = createAsyncThunk(
  "schedules/rejectRequest",
  async ({ requestId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/schedules/${requestId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject request",
      );
    }
  },
);

const schedulesSlice = createSlice({
  name: "schedules",
  initialState: {
    items: [],
    userSchedules: [],
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSchedule.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.userSchedules = action.payload;
      })
      .addCase(fetchUserSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests.push(action.payload);
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests.push(action.payload);
      })
      .addCase(editRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveRequest.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(rejectRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectRequest.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = schedulesSlice.actions;
export default schedulesSlice.reducer;
