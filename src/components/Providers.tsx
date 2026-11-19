"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { ViewProvider } from "@/context/ViewContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminProvider>
        <ViewProvider>
          {children}
        </ViewProvider>
      </AdminProvider>
    </AuthProvider>
  );
}