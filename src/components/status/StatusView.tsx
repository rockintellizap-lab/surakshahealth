"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getProfile, getAuditLogs, logProfileAccess } from "@/lib/profileService";

export default function StatusView() {
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [appId, setAppId] = useState("");
  const [submittedOn, setSubmittedOn] = useState("");
  const [targetUid, setTargetUid] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadAuditLogs = useCallback(async (uid: string) => {
    setLogsLoading(true);
    try {
      const logs = await getAuditLogs(uid, 50);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const data = await getProfile(uid);
      setProfile(data);
      if (data) {
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const idNum = Math.floor(Math.random() * 900000) + 100000;
        setAppId(`SHI-${createdAt.getFullYear()}-${idNum}`);
        setSubmittedOn(createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
        
        await logProfileAccess(uid, "view", user?.email || "anonymous");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlUid = searchParams.get("uid");
    
    if (urlUid) {
      setTargetUid(urlUid);
      loadProfile(urlUid);
    } else if (user) {
      setTargetUid(user.uid);
      loadProfile(user.uid);
    } else {
      setLoading(false);
    }
  }, [user, loadProfile]);

  const handleLogout = async () => {
    await logout();
    setView("auth");
  };

  const handleEditProfile = () => {
    setView("profile");
  };

  const handleViewQR = () => {
    setView("qr");
  };

  if (loading) {
    return (
      <main id="status" className="single">
        <section className="card">
          <div className="sh"><h2>Application status</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            Loading application status...
          </div>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main id="status" className="single">
        <section className="card">
          <div className="sh"><h2>Application status</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "16px", color: "var(--navy)" }}>No emergency profile found</h2>
            <p style={{ marginBottom: "24px", color: "var(--muted)" }}>
              Create your emergency profile first.
            </p>
            <button type="button" className="btn" onClick={() => setView("profile")}>
              Create profile
            </button>
          </div>
        </section>
      </main>
    );
  }

  const status = profile.status || "pending";

  if (status === "approved") {
    return (
      <main id="status" className="single">
        <section className="card">
          <div className="sh"><h2>Application status</h2></div>
          <div className="sb">
            <div className="stline">
              <div><small>Application ID</small><b id="appid">{appId}</b></div>
              <div><small>Submitted on</small><b id="subdt">{submittedOn}</b></div>
              <span className="pill" style={{ background: "rgba(19, 136, 8, 0.1)", color: "var(--green)", border: "1px solid var(--green)" }}>
                Approved
              </span>
            </div>
            <ol className="tl">
              <li className="done">
                <i>✓</i>
                <div>
                  <b>Profile submitted</b>
                  <span>Your emergency profile has been saved.</span>
                </div>
              </li>
              <li className="done">
                <i>✓</i>
                <div>
                  <b>Admin verification</b>
                  <span>Your details and ID have been verified.</span>
                </div>
              </li>
              <li className="done">
                <i>✓</i>
                <div>
                  <b>Emergency QR issued</b>
                  <span>Your Emergency QR is ready. Access it below.</span>
                </div>
              </li>
            </ol>
            <div className="acts">
              <button type="button" className="btn" onClick={handleViewQR}>
                View Emergency QR
              </button>
              <button type="button" className="btn ghost" onClick={handleEditProfile}>
                Edit profile
              </button>
              <button type="button" className="btn ghost" onClick={() => { loadAuditLogs(targetUid); setShowAuditLogs(true); }}>
                View Access Logs
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const renderAuditModal = () => {
    if (!showAuditLogs) return null;

    const actions = Array.from(new Set(auditLogs.map((l) => l.action)));

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,33,89,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          zIndex: 1000,
        }}
        onClick={() => setShowAuditLogs(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-title"
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            maxWidth: 900,
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 24px 48px rgba(15,33,89,.24)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <h3 id="audit-title" style={{ margin: 0, fontSize: 18 }}>Access logs for your profile</h3>
            <button
              type="button"
              onClick={() => setShowAuditLogs(false)}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: "var(--muted)",
                lineHeight: 1,
                padding: "0 8px",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: 20 }}>
            {logsLoading ? (
              <div style={{ padding: 32, textAlign: "center" }}>Loading access logs…</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No access logs found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "var(--saffron-l)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>Date & Time</th>
                      <th style={{ padding: "10px 12px" }}>Action</th>
                      <th style={{ padding: "10px 12px" }}>Performed By</th>
                      <th style={{ padding: "10px 12px" }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} style={{ borderTop: "1px solid var(--line)" }}>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          {log.performedAt?.toDate ? log.performedAt.toDate().toLocaleString("en-IN") : "—"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className="pill" style={{ background: "var(--saffron-l)", color: "var(--saffron-d)", fontSize: 11, textTransform: "capitalize" }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>{log.performedBy}</td>
                        <td style={{ padding: "10px 12px", color: "var(--muted)", fontSize: 13 }}>
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main id="status" className="single">
      <section className="card">
        <div className="sh"><h2>Application status</h2></div>
        <div className="sb">
          <div className="stline">
            <div><small>Application ID</small><b id="appid">{appId}</b></div>
            <div><small>Submitted on</small><b id="subdt">{submittedOn}</b></div>
            <span className="pill" style={{
              background: status === "rejected" ? "rgba(198, 40, 40, 0.1)" : "rgba(255, 153, 51, 0.1)",
              color: status === "rejected" ? "#c62828" : "#ff9933",
              border: `1px solid ${status === "rejected" ? "#c62828" : "#ff9933"}`
            }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <ol className="tl">
            <li className="done">
              <i>✓</i>
              <div>
                <b>Profile submitted</b>
                <span>Your emergency profile has been saved.</span>
              </div>
            </li>
            <li className={status === "rejected" ? "done" : "pending"}>
              <i>{status === "rejected" ? "✗" : "⏳"}</i>
              <div>
                <b>Admin verification</b>
                <span>
                  {status === "rejected"
                    ? `Rejected: ${profile.rejectedReason || "No reason provided"}`
                    : "Your details and ID are under review. This usually takes 1–2 business days."}
                </span>
              </div>
            </li>
            <li className="pending">
              <i>⏳</i>
              <div>
                <b>Emergency QR issuance</b>
                <span>QR will be available after admin approval.</span>
              </div>
            </li>
          </ol>
          <div className="acts">
            <button type="button" className="btn ghost" onClick={handleEditProfile}>
              Edit profile
            </button>
            <button type="button" className="btn ghost" onClick={() => { loadAuditLogs(targetUid); setShowAuditLogs(true); }}>
              View Access Logs
            </button>
          </div>
        </div>
      </section>
      {renderAuditModal()}
    </main>
  );
}