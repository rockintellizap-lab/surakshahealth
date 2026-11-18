"use client";

import { useState, useEffect } from "react";
import ResponderVerification from "@/components/responder/ResponderVerification";
import EmergencyCard from "@/components/responder/EmergencyCard";

interface EmergencyProfile {
  fn: string;
  mn?: string;
  ln: string;
  dob: string;
  bg: string;
  gender: string;
  allergies?: string;
  medications?: string;
  chronic?: string;
  ill?: string;
  ltt?: string;
  inf?: string;
  pc_name: string;
  pc_rel: string;
  pc_mob: string;
  pc_alt?: string;
  sc_name?: string;
  sc_rel?: string;
  sc_mob?: string;
  abha?: string;
  approvedAt?: any;
  uid?: string;
}

declare global {
  interface Window {
    __EMERGENCY_PROFILE__?: EmergencyProfile;
  }
}

export default function ResponderClient({
  uid,
  initialProfile,
}: {
  uid: string;
  initialProfile: EmergencyProfile;
}) {
  const [verified, setVerified] = useState(false);
  const [profile, setProfile] = useState<EmergencyProfile | null>(initialProfile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__EMERGENCY_PROFILE__) {
      setProfile(window.__EMERGENCY_PROFILE__ as EmergencyProfile);
    }
  }, []);

  const handleVerified = (verifiedProfile: EmergencyProfile) => {
    setProfile(verifiedProfile);
    setVerified(true);
    setError(null);
  };

  const handleClose = () => {
    setVerified(false);
    setProfile(initialProfile);
  };

  if (!verified) {
    return <ResponderVerification uid={uid} onVerified={handleVerified} />;
  }

  if (!profile) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f5f7fc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: "#0f2159", marginBottom: 12 }}>Unable to Load Profile</h1>
          <p style={{ color: "#59627c" }}>{error || "Profile data not available"}</p>
        </div>
      </main>
    );
  }

  return <EmergencyCard profile={profile} onClose={handleClose} />;
}