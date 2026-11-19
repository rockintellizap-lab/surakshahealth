"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Header from "@/components/layout/Header";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

export default function AdminPage() {
  const { isAdmin, isLoading } = useAdmin();
  const { user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      window.location.href = "/admin/login";
    }
  }, [isAdmin, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Nav isLoggedIn={!!user} />
      <div className="flex-1">
        <AdminDashboard />
      </div>
      <Footer isLoggedIn={!!user} />
    </div>
  );
}
