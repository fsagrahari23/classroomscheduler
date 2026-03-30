import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ token, role = "all" }, { rejectWithValue }) => {
    try {
      const query = role && role !== "all" ? `?role=${role}` : "";
      const response = await axios.get(`${API_URL}/auth/users${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const createManagedUser = createAsyncThunk(
  "users/createManagedUser",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/users`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user",
      );
    }
  },
);

export const updateManagedUser = createAsyncThunk(
  "users/updateManagedUser",
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/auth/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

export const deleteManagedUser = createAsyncThunk(
  "users/deleteManagedUser",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

export const bulkImportUsers = createAsyncThunk(
  "users/bulkImportUsers",
  async ({ users, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/users/bulk`,
        { users },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to import users",
      );
    }
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    loading: false,
    error: null,
    importResult: null,
  },
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
    clearImportResult: (state) => {
      state.importResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createManagedUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManagedUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createManagedUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateManagedUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateManagedUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((user) =>
          user._id === action.payload._id ? action.payload : user,
        );
      })
      .addCase(updateManagedUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteManagedUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteManagedUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteManagedUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(bulkImportUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.importResult = null;
      })
      .addCase(bulkImportUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.importResult = action.payload;
        state.items = [...action.payload.created, ...state.items];
      })
      .addCase(bulkImportUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUsersError, clearImportResult } = usersSlice.actions;
export default usersSlice.reducer;
