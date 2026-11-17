"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getProfile } from "@/lib/profileService";

const BG = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const LANGS = ["English", "हिन्दी", "ਪੰਜਾਬੀ", "Other"];
const RELATIONS = ["Self", "Spouse", "Parent", "Child", "Sibling", "Friend", "Other"];
const SEVERITY = ["Mild", "Moderate", "Severe", "Life-threatening"];
const REPORT_TYPES = ["Lab Report", "Imaging", "Prescription", "Discharge Summary", "Other"];

export default function StatusView() {
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProfile(user.uid);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleLogout = async () => {
    await logout();
    setView("auth");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleEmergency = () => {
    setEmergencyMode(!emergencyMode);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getAllergies = () => {
    if (!profile?.allergies) return [];
    try {
      return JSON.parse(profile.allergies);
    } catch {
      return [];
    }
  };

  const getMedications = () => {
    if (!profile?.medications) return [];
    try {
      return JSON.parse(profile.medications);
    } catch {
      return [];
    }
  };

  const getReports = () => {
    if (!profile?.reports) return [];
    try {
      return JSON.parse(profile.reports);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <section id="status" className="pf">
        <div className="side">
          <div className="who">
            <small>Signed in as</small>
            <b>{user?.email}</b>
          </div>
        </div>
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading emergency status...
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section id="status" className="pf">
        <div className="side">
          <div className="who">
            <small>Signed in as</small>
            <b>{user?.email}</b>
            <button type="button" className="link" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2 style={{ marginBottom: "16px" }}>No emergency profile found</h2>
          <p style={{ marginBottom: "24px", color: "var(--muted)" }}>
            Create your emergency profile first so ER staff can access it.
          </p>
          <button type="button" className="btn" onClick={() => setView("profile")}>
            Create profile
          </button>
        </div>
      </section>
    );
  }

  const fullName = [profile.fn, profile.mn, profile.ln].filter(Boolean).join(" ");

  return (
    <section id="status" className="pf">
      <div className="side">
        <div className="who">
          <small>Signed in as</small>
          <b>{user?.email}</b>
          <button type="button" className="link" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div className="emergency-banner" style={{
          background: emergencyMode ? "var(--danger)" : "var(--green)",
          color: "white",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px",
          textAlign: "center",
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: emergencyMode ? "32px" : "24px",
              fontWeight: 800,
              letterSpacing: "2px",
              animation: emergencyMode ? "pulse 1s infinite" : "none",
            }}>
              {emergencyMode ? "🚨 EMERGENCY MODE ACTIVE" : "✅ STATUS: STABLE"}
            </span>
            <button
              type="button"
              className="btn"
              style={{
                background: emergencyMode ? "white" : "var(--green-700)",
                color: emergencyMode ? "var(--danger)" : "white",
                border: "none",
                fontWeight: 600,
              }}
              onClick={toggleEmergency}
            >
              {emergencyMode ? "Deactivate Emergency" : "Activate Emergency"}
            </button>
          </div>
          {!emergencyMode && (
            <p style={{ marginTop: "12px", opacity: 0.9, fontSize: "14px" }}>
              Click "Activate Emergency" to show this profile to first responders.
              Your location will be shared with emergency contacts.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button type="button" className="btn" onClick={copyLink} style={{ flex: 1, minWidth: "180px" }}>
            {copied ? "✓ Copied!" : "📋 Copy Emergency Link"}
          </button>
          <button type="button" className="btn" style={{ background: "var(--green)", flex: 1, minWidth: "180px" }} onClick={() => setView("profile")}>
            ✏️ Edit Profile
          </button>
          <button type="button" className="btn" style={{ background: "var(--primary)", flex: 1, minWidth: "180px" }} onClick={() => setView("qr")}>
            📱 View QR Code
          </button>
        </div>

        {profile.photo && (
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img src={profile.photo} alt="Profile photo" style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid var(--primary)",
            }} />
          </div>
        )}

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>A. Personal information</h2></div>
          <div className="sb">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="fld">
                <label>Full name</label>
                <div className="view-val" style={{ fontWeight: 600, fontSize: "18px" }}>{fullName || "—"}</div>
              </div>
              <div className="fld">
                <label>Gender</label>
                <div className="view-val">{profile.gender || "—"}</div>
              </div>
              <div className="fld">
                <label>Date of birth</label>
                <div className="view-val">{formatDate(profile.dob)}</div>
              </div>
              <div className="fld">
                <label>Blood group</label>
                <div className="view-val" style={{
                  fontWeight: 700,
                  fontSize: "20px",
                  color: profile.bg ? "var(--danger)" : "",
                  background: profile.bg ? "rgba(220, 38, 38, 0.1)" : "",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  display: "inline-block",
                }}>
                  {profile.bg || "—"}
                </div>
              </div>
              <div className="fld">
                <label>Weight (kg)</label>
                <div className="view-val">{profile.wt || "—"}</div>
              </div>
              <div className="fld">
                <label>Preferred language</label>
                <div className="view-val">{profile.lang || "—"}</div>
              </div>
              <div className="fld wide">
                <label>Primary email</label>
                <div className="view-val"><a href={`mailto:${profile.email}`}>{profile.email || "—"}</a></div>
              </div>
              <div className="fld wide">
                <label>Mobile number</label>
                <div className="view-val"><a href={`tel:${profile.mob}`}>{profile.mob || "—"}</a></div>
              </div>
              <div className="fld wide">
                <label>ABHA ID</label>
                <div className="view-val">{profile.abha || "—"}</div>
              </div>
              <div className="fld wide">
                <label>Aadhaar (last 4)</label>
                <div className="view-val">{profile.aadhaarLast4 || "—"}</div>
              </div>
              <div className="fld wide">
                <label>Address</label>
                <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{profile.addr || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>B. Emergency contacts</h2></div>
          <div className="sb">
            <div className="grid">
              <div className="fld wide">
                <label>Primary contact</label>
                <div className="view-val" style={{ fontWeight: 600 }}>
                  {profile.pc_name || "—"}
                  {profile.pc_rel && <span style={{ marginLeft: "8px", color: "var(--muted)" }}>({profile.pc_rel})</span>}
                </div>
                <div className="view-val" style={{ marginTop: "4px" }}>
                  <a href={`tel:${profile.pc_mob}`}>{profile.pc_mob || "—"}</a>
                  {profile.pc_alt && <span style={{ marginLeft: "12px" }}><a href={`tel:${profile.pc_alt}`}>{profile.pc_alt}</a></span>}
                </div>
                <div className="view-val" style={{ marginTop: "4px" }}>
                  {profile.pc_email && <a href={`mailto:${profile.pc_email}`}>{profile.pc_email}</a>}
                </div>
                <div className="view-val" style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>
                  {profile.pc_addr || "—"}
                </div>
              </div>
              <div className="fld wide">
                <label>Secondary contact</label>
                <div className="view-val" style={{ fontWeight: 600 }}>
                  {profile.sc_name || "—"}
                  {profile.sc_rel && <span style={{ marginLeft: "8px", color: "var(--muted)" }}>({profile.sc_rel})</span>}
                </div>
                <div className="view-val" style={{ marginTop: "4px" }}>
                  <a href={`tel:${profile.sc_mob}`}>{profile.sc_mob || "—"}</a>
                  {profile.sc_alt && <span style={{ marginLeft: "12px" }}><a href={`tel:${profile.sc_alt}`}>{profile.sc_alt}</a></span>}
                </div>
                <div className="view-val" style={{ marginTop: "4px" }}>
                  {profile.sc_email && <a href={`mailto:${profile.sc_email}`}>{profile.sc_email}</a>}
                </div>
                <div className="view-val" style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>
                  {profile.sc_addr || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>C. Medical history</h2></div>
          <div className="sb">
            <div className="grid">
              <div className="fld wide">
                <label>Previous illnesses</label>
                <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{profile.ill || "None reported"}</div>
              </div>
              <div className="fld wide">
                <label>Chronic diseases</label>
                <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{profile.chronic || "None reported"}</div>
              </div>
              <div className="fld wide">
                <label>Long-term treatments</label>
                <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{profile.ltt || "None reported"}</div>
              </div>
              <div className="fld wide">
                <label>Previous infections</label>
                <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{profile.inf || "None reported"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>D. Allergies</h2></div>
          <div className="sb">
            {getAllergies().length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No allergies recorded</p>
            ) : (
              getAllergies().map((a: any, i: number) => (
                <div key={i} className="card" style={{ marginBottom: "12px", background: "var(--bg-2)" }}>
                  <div className="grid">
                    <div className="fld">
                      <label>Allergy name / type</label>
                      <div className="view-val">{a.name || "—"}</div>
                    </div>
                    <div className="fld">
                      <label>Reaction</label>
                      <div className="view-val">{a.react || "—"}</div>
                    </div>
                    <div className="fld">
                      <label>Severity</label>
                      <div className="view-val" style={{
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: "999px",
                        display: "inline-block",
                        background: a.sev === "Life-threatening" ? "rgba(220, 38, 38, 0.15)" :
                                    a.sev === "Severe" ? "rgba(249, 115, 22, 0.15)" :
                                    a.sev === "Moderate" ? "rgba(234, 179, 8, 0.15)" :
                                    "rgba(34, 197, 94, 0.15)",
                        color: a.sev === "Life-threatening" ? "var(--danger)" :
                               a.sev === "Severe" ? "var(--warning)" :
                               a.sev === "Moderate" ? "#b45309" : "#166534",
                      }}>
                        {a.sev || "—"}
                      </div>
                    </div>
                    <div className="fld wide">
                      <label>Treatment / precautions</label>
                      <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{a.tx || "—"}</div>
                    </div>
                    <div className="fld wide">
                      <label>Notes</label>
                      <div className="view-val" style={{ whiteSpace: "pre-wrap" }}>{a.note || "—"}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>E. Medication history</h2></div>
          <div className="sb">
            {getMedications().length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No medications recorded</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border)" }}>
                    <th style={{ padding: "12px" }}>Medicine</th>
                    <th style={{ padding: "12px" }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {getMedications().map((m: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: 500 }}>{m.name || "—"}</td>
                      <td style={{ padding: "12px" }}>{m.purpose || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>F. Vaccinations & immunization</h2></div>
          <div className="sb">
            <div className="view-val" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {profile.vaccinations || "None recorded"}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>G. Medical reports</h2></div>
          <div className="sb">
            {getReports().length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No medical reports uploaded</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {getReports().map((r: any, i: number) => (
                  <div key={i} className="card" style={{ background: "var(--bg-2)", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 600 }}>{r.name || `Report ${i + 1}`}</div>
                      {r.file && (
                        <a href={r.file} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: "var(--primary)" }}>
                          📄 View Report
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--muted)" }}>
          <p>This page shows your emergency profile as it would appear to verified ER staff.</p>
          <p style={{ marginTop: "8px", fontSize: "14px" }}>
            Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </section>
  );
}