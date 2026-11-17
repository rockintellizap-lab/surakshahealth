"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getAllProfiles, approveProfile, rejectProfile, getAuditLogs } from "@/lib/profileService";

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [profiles, setProfiles] = useState<(any & { uid: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProfiles();
      setProfiles(data);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin, loadProfiles]);

  const handleLogout = async () => {
    await logout();
    setView("auth");
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveProfile(uid, user?.email || "admin");
      await loadProfiles();
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Failed to approve profile");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    
    setActionLoading(uid);
    try {
      await rejectProfile(uid, user?.email || "admin", reason);
      await loadProfiles();
    } catch (err) {
      console.error("Reject failed:", err);
      alert("Failed to reject profile");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (uid: string) => {
    if (showLogs === uid) {
      setShowLogs(null);
      return;
    }
    setShowLogs(uid);
    try {
      const logs = await getAuditLogs(uid, 50);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setAuditLogs([]);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: "var(--saffron-l)", color: "var(--saffron-d)", border: "#f5c488" },
      approved: { bg: "rgba(19, 136, 8, 0.1)", color: "var(--green)", border: "var(--green)" },
      rejected: { bg: "rgba(179, 38, 30, 0.1)", color: "var(--danger)", border: "var(--danger)" },
    };
    const s = styles[status || "pending"] || styles.pending;
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)"
      }}>
        {status || "pending"}
      </span>
    );
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const name = [p.fn, p.mn, p.ln].filter(Boolean).join(" ").toLowerCase();
    const email = (p.email || "").toLowerCase();
    const abha = (p.abha || p.abhaId || "").toLowerCase();
    const matchesSearch = searchQuery === "" || 
      name.includes(searchQuery.toLowerCase()) || 
      email.includes(searchQuery.toLowerCase()) ||
      abha.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = profiles.filter(p => p.status === "pending").length;
  const approvedCount = profiles.filter(p => p.status === "approved").length;
  const rejectedCount = profiles.filter(p => p.status === "rejected").length;

  if (adminLoading || loading) {
    return (
      <main id="admin" className="single" style={{ maxWidth: "1160px" }}>
        <section className="card">
          <div className="sh"><h2>Admin Dashboard</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ width: "24px", height: "24px", border: "3px solid var(--saffron)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <span style={{ color: "var(--navy)", fontWeight: 600 }}>Loading profiles...</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main id="admin" className="single" style={{ maxWidth: "1160px" }}>
        <section className="card">
          <div className="sh"><h2>Access Denied</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ margin: "0 0 8px", color: "var(--navy)" }}>Unauthorized Access</h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>You are not authorized to access the admin dashboard.</p>
            <button type="button" className="btn" onClick={handleLogout} style={{ padding: "12px 28px" }}>
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="admin" className="single" style={{ maxWidth: "1160px" }}>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <section className="card" style={{ marginBottom: "24px" }}>
        <div className="sh" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: "12px",
          padding: "16px 24px",
          borderBottom: "2px solid var(--saffron)"
        }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: "var(--navy)", fontFamily: "var(--font-serif)" }}>
              Admin Dashboard
            </h2>
            <p className="sub" style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
              {profiles.length} total profiles · 
              <span style={{ color: "var(--saffron-d)", fontWeight: 600 }}>{pendingCount} pending</span> · 
              <span style={{ color: "var(--green)", fontWeight: 600 }}>{approvedCount} approved</span> · 
              <span style={{ color: "var(--danger)", fontWeight: 600 }}>{rejectedCount} rejected</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "var(--navy)", borderRadius: "6px" }}>
              <span style={{ fontSize: "16px" }}>🛡️</span>
              <div>
                <small style={{ color: "var(--left-muted)", display: "block", fontSize: "10px" }}>Signed in as</small>
                <b style={{ color: "#fff", fontSize: "12px" }}>{user?.email}</b>
              </div>
            </div>
            <button type="button" className="link" onClick={handleLogout} style={{ color: "#ffc680", fontWeight: 600, fontSize: "12px" }}>
              Sign out
            </button>
          </div>
        </div>
        <div className="sb" style={{ padding: "16px 24px" }}>
          {/* Toolbar */}
          <div style={{ 
            display: "flex", 
            gap: "12px", 
            flexWrap: "wrap", 
            alignItems: "center", 
            marginBottom: "16px", 
            paddingBottom: "16px", 
            borderBottom: "1px solid var(--line)",
            background: "linear-gradient(135deg, rgba(255, 153, 51, 0.03) 0%, transparent 100%)",
            margin: "0 -24px 16px",
            padding: "12px 24px 16px"
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "320px" }}>
              <input
                type="text"
                placeholder="Search by name, email, ABHA ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px 14px 10px 38px", 
                  border: "1.5px solid var(--line)", 
                  borderRadius: "6px", 
                  fontSize: "13px", 
                  background: "var(--surface)", 
                  color: "var(--text)",
                  fontFamily: "var(--font-sans)",
                  boxShadow: "0 1px 3px rgba(15,33,89,.05)",
                  transition: "border-color .15s, box-shadow .15s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--navy-2)"}
                onBlur={(e) => e.target.style.borderColor = "var(--line)"}
              />
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "14px" }}>🔍</span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["all", "pending", "approved", "rejected"].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f as any)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    border: "1.5px solid",
                    background: statusFilter === f ? "var(--navy)" : "var(--surface)",
                    color: statusFilter === f ? "#fff" : "var(--text)",
                    borderColor: statusFilter === f ? "var(--navy)" : "var(--line)",
                    cursor: "pointer",
                    boxShadow: statusFilter === f ? "0 2px 8px rgba(15,33,89,.2)" : "0 1px 3px rgba(15,33,89,.05)",
                    transition: "all .15s"
                  }}
                  onMouseEnter={(e) => {
                    if (statusFilter !== f) {
                      e.currentTarget.style.borderColor = "var(--saffron)";
                      e.currentTarget.style.background = "var(--saffron-l)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (statusFilter !== f) {
                      e.currentTarget.style.borderColor = "var(--line)";
                      e.currentTarget.style.background = "var(--surface)";
                    }
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span style={{ 
                    marginLeft: "6px", 
                    padding: "1px 7px", 
                    background: statusFilter === f ? "rgba(255,255,255,0.2)" : "var(--line)", 
                    borderRadius: "999px", 
                    fontSize: "10px",
                    fontWeight: 700
                  }}>
                    {f === "all" ? profiles.length : profiles.filter(p => p.status === f).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ 
            overflowX: "auto", 
            border: "1px solid var(--line)", 
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(15,33,89,.05)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "var(--font-sans)" }}>
              <thead>
                <tr style={{ background: "#f5f7fc", borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "200px" }}>
                    Citizen
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "180px" }}>
                    Email
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "120px" }}>
                    Submitted
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "140px" }}>
                    ABHA ID
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "100px" }}>
                    Status
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "160px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)" }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy)", marginBottom: "4px" }}>
                        No profiles found
                      </div>
                      <div style={{ fontSize: "13px" }}>
                        {searchQuery || statusFilter !== "all" 
                          ? "Try adjusting your search or filters"
                          : "No citizen profiles submitted yet"
                        }
                      </div>
                    </td>
                  </tr>
                )}
                {filteredProfiles.map((p, index) => (
                  <tr key={p.uid} style={{ 
                    borderBottom: index === filteredProfiles.length - 1 ? "none" : "1px solid var(--line)",
                    background: index % 2 === 0 ? "transparent" : "rgba(15, 33, 89, 0.02)",
                    transition: "background .15s"
                  }}>
                    <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: "13px", marginBottom: "2px" }}>
                        {[p.fn, p.mn, p.ln].filter(Boolean).join(" ") || "Unnamed"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "9px", color: "var(--saffron-d)", background: "var(--saffron-l)", padding: "1px 5px", borderRadius: "3px", fontWeight: 600 }}>
                          {p.abha || p.abhaId ? "ABHA Linked" : "No ABHA"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--text)", fontSize: "12px", verticalAlign: "middle", fontFamily: "var(--font-sans)" }}>
                      {p.email || <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--muted)", fontSize: "11px", verticalAlign: "middle", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "10px", fontFamily: "monospace", color: "var(--navy)", verticalAlign: "middle", letterSpacing: "0.02em" }}>
                      {p.abha || p.abhaId || <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
                      {getStatusBadge(p.status)}
                    </td>
                    <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {p.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => handleApprove(p.uid)}
                              disabled={actionLoading === p.uid}
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "11px", 
                                fontWeight: 600,
                                background: "var(--green)",
                                boxShadow: "inset 0 -2px 0 var(--saffron)",
                                minWidth: "80px",
                                height: "32px"
                              }}
                              title="Approve profile"
                            >
                              {actionLoading === p.uid ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ width: "12px", height: "12px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                                  <span>Approving</span>
                                </span>
                              ) : (
                                "✓ Approve"
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => handleReject(p.uid)}
                              disabled={actionLoading === p.uid}
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "11px", 
                                fontWeight: 600,
                                background: "var(--danger)",
                                boxShadow: "inset 0 -2px 0 #8a1e16",
                                minWidth: "75px",
                                height: "32px"
                              }}
                              title="Reject profile"
                            >
                              {actionLoading === p.uid ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ width: "12px", height: "12px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                                  <span>Rejecting</span>
                                </span>
                              ) : (
                                "✗ Reject"
                              )}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => handleViewLogs(p.uid)}
                          style={{ 
                            padding: "6px 10px", 
                            fontSize: "11px", 
                            fontWeight: 500,
                            borderColor: showLogs === p.uid ? "var(--navy)" : "var(--line)",
                            color: showLogs === p.uid ? "var(--navy)" : "var(--text)",
                            background: showLogs === p.uid ? "#f5f7fc" : "transparent",
                            minWidth: "70px",
                            height: "32px"
                          }}
                          title={showLogs === p.uid ? "Hide audit logs" : "View audit logs"}
                        >
                          {showLogs === p.uid ? "📋 Hide" : "📋 Logs"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Logs Panel */}
          {showLogs && (
            <div style={{ 
              marginTop: "16px", 
              padding: "16px 20px", 
              background: "#f5f7fc", 
              border: "1px solid var(--line)", 
              borderTop: "3px solid var(--navy)",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(15,33,89,.08)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--navy)", fontFamily: "var(--font-serif)" }}>
                  📋 Audit Logs
                </h3>
                <button type="button" className="link" onClick={() => setShowLogs(null)} style={{ fontSize: "12px", fontWeight: 600 }}>
                  Close
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "var(--font-sans)" }}>
                  <thead>
                    <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--line)" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "140px" }}>Timestamp</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "120px" }}>Action</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", width: "140px" }}>Performed By</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--navy)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                          <div style={{ fontSize: "20px", marginBottom: "6px" }}>📝</div>
                          <div style={{ fontSize: "12px" }}>No audit logs for this profile</div>
                        </td>
                      </tr>
                    )}
                    {auditLogs.map((log, index) => (
                      <tr key={log.id} style={{ 
                        borderBottom: index === auditLogs.length - 1 ? "none" : "1px solid var(--line)",
                        background: index % 2 === 0 ? "transparent" : "rgba(15, 33, 89, 0.02)"
                      }}>
                        <td style={{ padding: "8px 10px", color: "var(--muted)", fontSize: "10px", whiteSpace: "nowrap" }}>
                          {formatDateTime(log.performedAt)}
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--navy)", textTransform: "capitalize", fontSize: "11px" }}>
                          {log.action.replace("_", " ")}
                        </td>
                        <td style={{ padding: "8px 10px", color: "var(--text)", fontSize: "11px" }}>
                          {log.performedBy}
                        </td>
                        <td style={{ padding: "8px 10px", color: "var(--muted)", fontSize: "10px", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}