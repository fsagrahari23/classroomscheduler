import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const fetchClassrooms = createAsyncThunk(
  "classrooms/fetchClassrooms",
  async ({ search, facultyId, token }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (facultyId && facultyId !== "all")
        params.append("facultyId", facultyId);

      const response = await axios.get(
        `${API_URL}/classrooms?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch classrooms",
      );
    }
  },
);

export const fetchFaculties = createAsyncThunk(
  "classrooms/fetchFaculties",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/auth/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch faculties",
      );
    }
  },
);

export const createClassroom = createAsyncThunk(
  "classrooms/createClassroom",
  async ({ data, token }, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log(token);
      const response = await axios.post(`${API_URL}/classrooms`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { search, facultyId } = getState().classrooms.filters;
      dispatch(fetchClassrooms({ search, facultyId, token }));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create classroom",
      );
    }
  },
);

// ✅ Update Classroom
export const updateClassroom = createAsyncThunk(
  "classrooms/updateClassroom",
  async ({ id, data, token }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await axios.put(`${API_URL}/classrooms/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { search, facultyId } = getState().classrooms.filters;
      dispatch(fetchClassrooms({ search, facultyId }));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update classroom",
      );
    }
  },
);
export const deleteClassroom = createAsyncThunk(
  "classrooms/deleteClassroom",
  async ({ id, token }, { rejectWithValue, dispatch, getState }) => {
    try {
      await axios.delete(`${API_URL}/classrooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // refresh list
      const { search, facultyId } = getState().classrooms.filters;
      dispatch(fetchClassrooms({ search, facultyId, token }));

      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete classroom",
      );
    }
  },
);
const classroomsSlice = createSlice({
  name: "classrooms",
  initialState: {
    items: [],
    faculties: [],
    loading: false,
    error: null,
    filters: {
      search: "",
      facultyId: "all",
    },
    actionLoading: false, // 🔥 for create/update
  },
  reducers: {
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },
    setFacultyFilter: (state, action) => {
      state.filters.facultyId = action.payload;
    },
    clearFilters: (state) => {
      state.filters = { search: "" };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch classrooms
      .addCase(fetchClassrooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch faculties
      .addCase(fetchFaculties.fulfilled, (state, action) => {
        state.faculties = action.payload;
      })

      // Create classroom
      .addCase(createClassroom.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createClassroom.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createClassroom.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update classroom
      .addCase(updateClassroom.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateClassroom.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateClassroom.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});
export const { setSearchFilter, setFacultyFilter, clearFilters } =
  classroomsSlice.actions;
export default classroomsSlice.reducer;
