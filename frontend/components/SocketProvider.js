"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function SocketProvider({ children }) {
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [token]);

  return children;
}
