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
  status?: string;
}

export default function ResponderPage({ params }: { params: Promise<{ uid: string }> }) {
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    params.then((p) => setUid(p.uid));
  }, [params]);

  useEffect(() => {
    if (!uid) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/responder/profile/${uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
          } else {
            setError("Profile not found");
          }
        } else if (res.status === 404) {
          setError("Profile not found");
        } else if (res.status === 403) {
          setError("Profile is not approved for emergency access");
        } else {
          setError("Failed to load profile");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const handleVerified = (verifiedProfile: EmergencyProfile) => {
    setProfile(verifiedProfile);
    setVerified(true);
    setError(null);
  };

  const handleClose = () => {
    setVerified(false);
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f5f7fc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>?</div>
          <h2 style={{ color: "#0f2159", marginBottom: 12 }}>Loading profile...</h2>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f5f7fc" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>??</div>
          <h1 style={{ color: "#0f2159", marginBottom: 12 }}>Profile Not Accessible</h1>
          <p style={{ color: "#59627c", marginBottom: 24 }}>{error}</p>
          <a href="/" style={{ color: "#0f2159", textDecoration: "underline" }}>Back to SurakshaHealth</a>
        </div>
      </main>
    );
  }

  if (!verified) {
    return <ResponderVerification uid={uid} onVerified={handleVerified} />;
  }

  if (!profile) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f5f7fc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>??</div>
          <h1 style={{ color: "#0f2159", marginBottom: 12 }}>Unable to Load Profile</h1>
          <p style={{ color: "#59627c" }}>Profile data not available</p>
        </div>
      </main>
    );
  }

  return <EmergencyCard profile={profile} onClose={handleClose} />;
}
