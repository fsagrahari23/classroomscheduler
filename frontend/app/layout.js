"use client";

import "./globals.css";
import { Provider } from "react-redux";
import store from "../lib/store/index.js";
import AuthInitializer from "@/components/AuthInitializer"; // adjust path
import SocketProvider from "@/components/SocketProvider";
import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100">
        <Provider store={store}>
          <AuthInitializer>
            <SocketProvider>{children}</SocketProvider>
          </AuthInitializer>
        </Provider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
