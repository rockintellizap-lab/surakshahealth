"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ViewType = "auth" | "profile" | "status" | "qrpage";

interface ViewContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

function getInitialView(): ViewType {
  if (typeof window === "undefined") return "auth";
  const hash = window.location.hash.slice(1);
  if (hash === "profile") return "profile";
  if (hash === "status") return "status";
  if (hash === "qrpage") return "qrpage";
  return "auth";
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewType>(getInitialView);

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    if (typeof window !== "undefined") {
      window.location.hash = newView;
    }
  };

  return (
    <ViewContext.Provider value={{ view, setView: handleSetView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useView must be used within a ViewProvider");
  }
  return context;
}