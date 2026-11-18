"use client";

import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { useEffect } from "react";
import { AdminProvider } from "@/context/AdminContext";
import Header from "@/components/layout/Header";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import IntroSection from "@/components/auth/IntroSection";
import AuthSection from "@/components/auth/AuthSection";
import ProfileView from "@/components/profile/ProfileView";
import StatusView from "@/components/status/StatusView";
import QRView from "@/components/qr/QRView";
import AdminDashboard from "@/app/admin/page";

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const { view, setView } = useView();
  console.log("HomeContent render", { user: !!user, authLoading, view });

  useEffect(() => {
    if (!authLoading && !user && view !== "auth") {
      setView("auth");
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <Nav isLoggedIn={!!user} />
        <main id="main" className="flex-1" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>Loading...</div>
        </main>
        <Footer isLoggedIn={!!user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Nav isLoggedIn={!!user} />

      {view === "auth" && (
        <main id="main" className="flex-1">
          <section className="intro">
            <IntroSection />
          </section>
          <AuthSection />
        </main>
      )}

      {user && view === "profile" && (
        <main id="main" className="flex-1 profile-view">
          <ProfileView />
        </main>
      )}

      {user && view === "status" && <StatusView />}

      {user && view === "qr" && <QRView />}

      {view === "admin" && <AdminDashboard />}

      {!user && view !== "auth" && view !== "admin" && (
        <main id="main" className="flex-1">
          <AuthSection />
        </main>
      )}

      <Footer isLoggedIn={!!user} />
    </div>
  );
}

export default function Home() {
  return (
    <AdminProvider>
      <HomeContent />
    </AdminProvider>
  );
}