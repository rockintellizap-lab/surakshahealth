"use client";

import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import IntroSection from "@/components/auth/IntroSection";
import AuthSection from "@/components/auth/AuthSection";
import ProfileView from "@/components/profile/ProfileView";
import StatusView from "@/components/status/StatusView";
import QRView from "@/components/qr/QRView";

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const { view, setView } = useView();

  useEffect(() => {
    if (!authLoading && !user && view !== "auth") {
      setView("auth");
    }
  }, [user, authLoading, view, setView]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <Nav />
        <main id="main" className="flex-1" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Nav />

      <main id="main" className="flex-1">
        {view === "auth" && (
          <>
            <section className="intro">
              <IntroSection />
            </section>
            <AuthSection />
          </>
        )}

        {user && view === "profile" && <ProfileView />}

        {user && view === "status" && <StatusView />}

        {user && view === "qrpage" && <QRView />}

        {!user && view !== "auth" && (
          <AuthSection />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}