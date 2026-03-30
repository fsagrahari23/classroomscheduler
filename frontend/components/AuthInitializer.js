"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe } from "@/lib/store/authSlice";

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [token, user, dispatch]);

  return children;
}
