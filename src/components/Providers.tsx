"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ViewProvider } from "@/context/ViewContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ViewProvider>
        {children}
      </ViewProvider>
    </AuthProvider>
  );
}