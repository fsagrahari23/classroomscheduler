import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import classroomsReducer from './classroomsSlice.js';
import schedulesReducer from './schedulesSlice.js';
import usersReducer from './usersSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classrooms: classroomsReducer,
    schedules: schedulesReducer,
    users: usersReducer,
  },
});

export default store;
