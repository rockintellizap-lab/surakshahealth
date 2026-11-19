"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getAllProfiles, approveProfile, rejectProfile, getAuditLogs } from "@/lib/profileService";

interface ProfileData {
  uid: string;
  fn?: string;
  mn?: string;
  ln?: string;
  email?: string;
  abha?: string;
  abhaId?: string;
  status?: string;
  createdAt?: unknown;
  [key: string]: unknown;
}

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedAt: unknown;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

type Timestamp = { toDate?: () => Date } | string | number | Date | null | undefined;
type Status = "pending" | "approved" | "rejected";
type Busy = { uid: string; type: "approve" | "reject" } | null;

const ACTION_LABELS: Record<string, { label: string; chip: string }> = {
  view: { label: "Profile viewed", chip: "" },
  qr_scan: { label: "QR scanned", chip: "qr" },
  qr_download: { label: "QR downloaded", chip: "qr" },
  qr_print: { label: "QR printed", chip: "qr" },
  regenerate_qr: { label: "QR regenerated", chip: "qr" },
  approve: { label: "Approved", chip: "dec" },
  reject: { label: "Rejected", chip: "rej" },
  submit: { label: "Profile submitted", chip: "" },
};

const toDate = (ts: Timestamp): Date | null => {
  if (!ts) return null;
  const maybe = ts as { toDate?: () => Date };
  const d = typeof maybe.toDate === "function" ? maybe.toDate() : new Date(ts as string | number | Date);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (ts: Timestamp) => {
  const d = toDate(ts);
  return d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
};

const formatTime = (ts: Timestamp) => {
  const d = toDate(ts);
  return d ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
};

const formatDateTime = (ts: Timestamp) => (toDate(ts) ? `${formatDate(ts)}, ${formatTime(ts)}` : "—");

const detail = (obj: unknown) => {
  if (!obj || typeof obj !== "object") return "–";
  const keys = Object.keys(obj as Record<string, unknown>);
  if (keys.length === 0) return "–";
  return keys
    .map((k) => {
      const v = String((obj as Record<string, unknown>)[k]).replace(/_/g, " ");
      return k.charAt(0).toUpperCase() + k.slice(1) + ": " + v.charAt(0).toUpperCase() + v.slice(1);
    })
    .join(", ");
};

const getInitials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const statusOf = (p: ProfileData): Status => {
  const s = (p.status || "pending").toLowerCase();
  return s === "approved" || s === "rejected" ? s : "pending";
};

const fullName = (p: ProfileData) => [p.fn, p.mn, p.ln].filter(Boolean).join(" ");
const ipOf = (l: AuditLog) => l.ipAddress || (l.details?.ip ? String(l.details.ip) : "");

const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`pill ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/* === EXACT REFERENCE DESIGN CSS (scoped to #admin) === */
const ADMIN_CSS = `
/* Kill globals.css background on body */
body:has(#admin) {
  background: var(--bg) !important;
  background-image: none !important;
  margin: 0 !important;
  padding: 0 !important;
  min-width: 100vw;
  width: 100%;
}
html:has(#admin) {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  overflow-x: hidden;
}

/* Force our fonts */
#admin,
#admin *,
#admin *::before,
#admin *::after {
  font-family: var(--font-sans) !important;
}

/* Reset only known conflicting utility classes from globals.css */
#admin .btn,
#admin .card,
#admin .pill,
#admin .stats,
#admin .badge,
#admin .chip,
#admin .tag,
#admin .link,
#admin .icon,
#admin .row,
#admin .col,
#admin .grid,
#admin .flex,
#admin .block,
#admin .hidden,
#admin .sr,
#admin .wrap,
#admin .container,
#admin .panel,
#admin .toolbar,
#admin .search,
#admin .seg,
#admin .scroll {
  all: initial;
  box-sizing: border-box;
}

/* === DESIGN TOKENS (from reference) === */
#admin {
  --bg: #f2f4f8;
  --surface: #ffffff;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --navy: #0f172a;
  --navy-soft: #eef0f6;
  --saffron: #f59e0b;
  --saffron-soft: #fdf3e3;
  --green: #15803d;
  --ok-bg: #ecfdf5;
  --ok: #166534;
  --warn-bg: #fef3c7;
  --warn: #92400e;
  --bad-bg: #fee2e2;
  --bad: #b91c1c;
  --info-bg: #eff6ff;
  --info: #1d4ed8;
  --ring: #3b82f6;
  --shadow: 0 1px 3px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.06);
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.06);
  --radius: 12px;
  --radius-lg: 16px;
  --font-sans: "Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: "Source Serif 4", Georgia, serif;

  max-width: none;
  margin: 0 auto;
  padding: 0 0 56px;
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.55;
  background: var(--bg);
  min-height: 100vh;
  box-sizing: border-box;
  display: block;
  width: 100%;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) #admin {
    --bg: #0b1226;
    --surface: #121b36;
    --ink: #e8edf9;
    --muted: #9aa7c7;
    --line: #243055;
    --navy: #070d1f;
    --ok-bg: #12331a;
    --ok: #6fd37a;
    --warn-bg: #3a2a10;
    --warn: #f5b45c;
    --bad-bg: #3d1a19;
    --bad: #ff8f87;
    --info-bg: #16264f;
    --info: #8fb0ff;
    --ring: #7aa2ff;
    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3);
  }
}
:root[data-theme="dark"] #admin {
  --bg: #0b1226;
  --surface: #121b36;
  --ink: #e8edf9;
  --muted: #9aa7c7;
  --line: #243055;
  --navy: #070d1f;
  --ok-bg: #12331a;
  --ok: #6fd37a;
  --warn-bg: #3a2a10;
  --warn: #f5b45c;
  --bad-bg: #3d1a19;
  --bad: #ff8f87;
  --info-bg: #16264f;
  --info: #8fb0ff;
  --ring: #7aa2ff;
  --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3);
}

@keyframes adm-spin { to { transform: rotate(360deg); } }
#admin :focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; border-radius: 6px; }

/* === PAGE HEADER (exact from reference) === */
#admin .wrap {
  max-width: none;
  margin: 0 auto;
  padding: 24px 64px 56px;
}
#admin .admin-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}
#admin .page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}
#admin h2 {
  font: 700 26px/1.2 var(--font-serif);
  margin: 0;
  letter-spacing: -0.02em;
}
#admin .page-head p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}
#admin .who {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
}
#admin .who small {
  display: block;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.3;
}
#admin .who strong {
  font-size: 13px;
  color: var(--ink);
}

/* === BUTTONS === */
#admin .btn,
#admin .seg button,
#admin .x,
#admin select {
  font-family: var(--font-sans) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
}
#admin .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
#admin .btn:hover:not(:disabled) { background: var(--navy-soft); border-color: var(--line); }
#admin .btn:active:not(:disabled) { transform: translateY(0.5px); }
#admin .btn:disabled { opacity: .6; cursor: not-allowed; }
#admin .btn.sm { height: 32px; padding: 0 12px; }
#admin .btn.ok { background: var(--green); border-color: var(--green); color: #fff; }
#admin .btn.ok:hover:not(:disabled) { background: #14532d; }
#admin .btn.no { border-color: var(--bad); color: var(--bad); background: transparent; }
#admin .btn.no:hover:not(:disabled) { background: var(--bad-bg); }
#admin .spin { width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: adm-spin .8s linear infinite; display: inline-block; }

/* === STATS (exact from reference) === */
#admin .stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 40px;
  margin-bottom: 32px;
}
#admin .stat {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 4px solid var(--c);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#admin .stat:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
#admin .stat b { display: block; font: 700 32px/1.1 var(--font-serif); margin-bottom: 2px; }
#admin .stat span { color: var(--muted); font-size: 12.5px; }

/* === PANEL / TABLE (exact from reference) === */
#admin .panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
#admin .toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 18px 22px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
#admin .search {
  position: relative;
  flex: 1 1 280px;
  max-width: 420px;
  display: block;
}
#admin .search svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}
#admin .search input,
#admin .afilters select {
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans) !important;
  font-size: 14px !important;
  padding: 0 12px;
  width: 100%;
}
#admin .search input { padding-left: 40px; }
#admin .search input:focus { outline: 2px solid var(--ring); border-color: var(--ring); background: #fff; }
#admin .afilters select { padding: 0 10px; font-size: 13px !important; }
#admin .sr { position: absolute; left: -9999px; }
#admin .seg {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
#admin .seg button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}
#admin .seg .n {
  background: rgba(15,23,42,0.08);
  border-radius: 999px;
  font-size: 11px;
  padding: 1px 8px;
  color: var(--muted);
}
#admin .seg button[aria-pressed="true"] {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
}
#admin .seg button[aria-pressed="true"] .n {
  background: rgba(255,255,255,.18);
  color: #fff;
}
#admin .seg button:not([aria-pressed="true"]):hover { background: #e2e8f0; color: var(--ink); }

#admin .scroll { overflow-x: auto; }
#admin table { width: 100%; border-collapse: collapse; }
#admin th {
  text-align: left;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted);
  padding: 14px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
#admin td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}
#admin tbody tr { transition: background 0.12s ease; }
#admin tbody tr:hover { background: var(--navy-soft); }
#admin tbody tr:last-child td { border-bottom: 0; }
#admin .r { text-align: right; }
#admin td.nw { white-space: nowrap; }
#admin .muted { color: var(--muted); }
#admin .empty { padding: 60px 20px; text-align: center; color: var(--muted); }
#admin .person { display: flex; align-items: center; gap: 12px; min-width: 0; }
#admin .av {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--bg);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  flex: none;
  color: var(--muted);
}
#admin .person strong { display: block; font-size: 14px; }
#admin .person small { color: var(--muted); font-size: 12px; }
#admin .pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 600;
  font-size: 11.5px;
  white-space: nowrap;
}
#admin .pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
#admin .pill.pending { background: var(--warn-bg); color: var(--warn); }
#admin .pill.approved { background: var(--ok-bg); color: var(--ok); }
#admin .pill.rejected { background: var(--bad-bg); color: var(--bad); }
#admin .acts { display: flex; gap: 8px; justify-content: flex-end; }

/* === AUDIT MODAL (overlay) === */
#admin .overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6vh 16px;
  animation: adm-fade-in 0.2s ease;
}
#admin .sheet {
  width: min(1080px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(15,23,42,0.25);
  overflow: hidden;
  animation: adm-slide-up 0.25s ease;
}
#admin .sheet-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: var(--navy);
  color: #fff;
}
#admin .sheet-head h3 { margin: 0; font: 700 20px/1.2 var(--font-serif); }
#admin .sheet-head p { margin: 4px 0 0; font-size: 13px; color: #b9c5e6; }
#admin .x { background: transparent; border: 1px solid #3b4a78; color: #fff; border-radius: 10px; height: 34px; padding: 0 12px; cursor: pointer; transition: background 0.15s ease; }
#admin .x:hover { background: rgba(255,255,255,.12); }
#admin .meta {
  display: flex;
  gap: 10px 24px;
  flex-wrap: wrap;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}
#admin .meta b { color: var(--ink); font-weight: 600; }
#admin .afilters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
}
#admin .afilters .search { max-width: 320px; }
#admin .afilters .btn { margin-left: auto; }
#admin .alog { overflow: auto; flex: 1; min-height: 140px; }
#admin .alog table { min-width: 860px; }
#admin .alog thead th { position: sticky; top: 0; z-index: 1; background: var(--bg); }
#admin .ts b { display: block; font-weight: 600; font-size: 13px; }
#admin .ts small { color: var(--muted); font-size: 12px; }
#admin .chip {
  display: inline-block;
  border-radius: 6px;
  padding: 3px 9px;
  font-weight: 600;
  font-size: 12px;
  background: var(--info-bg);
  color: var(--info);
  white-space: nowrap;
}
#admin .chip.qr { background: var(--warn-bg); color: var(--warn); }
#admin .chip.dec { background: var(--ok-bg); color: var(--ok); }
#admin .chip.rej { background: var(--bad-bg); color: var(--bad); }
#admin .ip { font: 500 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
#admin .sheet-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 24px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
}

/* === TOAST === */
#admin .toast {
  position: fixed;
  left: 50%;
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%) translateY(10px);
  background: var(--navy);
  color: #fff;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s ease, transform .2s ease;
  z-index: 60;
  box-shadow: var(--shadow);
}
#admin .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* === RESPONSIVE (exact from reference) === */
@media (max-width: 760px) {
  #admin { padding: 20px 16px 48px; }
  #admin .wrap { padding: 20px 0 40px; }
  #admin .stats { grid-template-columns: repeat(2, 1fr); }
  #admin h2 { font-size: 22px; }
  #admin .overlay { padding: 0; }
  #admin .sheet { max-height: 100%; height: 100%; border-radius: 0; }
  #admin .afilters .btn { margin-left: 0; }
  #admin .toolbar { flex-direction: column; align-items: stretch; gap: 12px; }
  #admin .search { max-width: none; }
  #admin table { font-size: 13px; }
  #admin th, #admin td { padding: 10px 12px; }
}
@media (prefers-reduced-motion: reduce) {
  #admin * { transition: none !important; animation: none !important; }
}
@keyframes adm-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes adm-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

const AdminStyles = () => <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />;

/* ---------- component ---------- */

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [toast, setToast] = useState({ text: "", show: false });

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProfiles();
      setProfiles(data as unknown as ProfileData[]);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void loadProfiles();
  }, [isAdmin, loadProfiles]);

  useEffect(() => {
    if (!showLogs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowLogs(null); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [showLogs]);

  const showToast = (msg: string) => {
    setToast({ text: msg, show: true });
    setTimeout(() => setToast({ text: "", show: false }), 2200);
  };

  const handleLogout = async () => { await logout(); setView("auth"); };

  const handleApprove = async (uid: string) => {
    setBusy({ uid, type: "approve" });
    try {
      await approveProfile(uid, user?.email || "admin");
      await loadProfiles();
      showToast("Profile approved");
    } catch (err) {
      console.error("Approve failed:", err);
      showToast("Failed to approve profile");
    } finally { setBusy(null); }
  };

  const handleReject = async (uid: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setBusy({ uid, type: "reject" });
    try {
      await rejectProfile(uid, user?.email || "admin", reason);
      await loadProfiles();
      showToast("Profile rejected");
    } catch (err) {
      console.error("Reject failed:", err);
      showToast("Failed to reject profile");
    } finally { setBusy(null); }
  };

  const handleViewLogs = async (uid: string) => {
    setShowLogs(uid);
    setAuditSearch("");
    setAuditActionFilter("");
    setAuditLogs([]);
    setLogsLoading(true);
    try {
      setAuditLogs(await getAuditLogs(uid, 50));
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setAuditLogs([]);
    } finally { setLogsLoading(false); }
  };

  const count = (s: "all" | Status) => s === "all" ? profiles.length : profiles.filter((p) => statusOf(p) === s).length;

  const filteredProfiles = profiles.filter((p) => {
    const matchesStatus = statusFilter === "all" || statusOf(p) === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const haystack = [fullName(p), p.email || "", p.abha || p.abhaId || ""].join(" ").toLowerCase();
    return matchesStatus && (!q || haystack.includes(q));
  });

  if (adminLoading || loading) {
    return (
      <main id="admin">
        <AdminStyles />
        <div className="wrap">
          <section className="panel">
            <div className="state" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span className="spin" style={{ width: 24, height: 24, borderColor: "var(--saffron)", borderTopColor: "transparent" }} />
              <span style={{ fontWeight: 600 }}>Loading profiles…</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main id="admin">
        <AdminStyles />
        <div className="wrap">
          <section className="panel">
            <div className="state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h3 style={{ margin: "0 0 8px" }}>Unauthorized access</h3>
              <p className="muted" style={{ margin: "0 0 24px" }}>You are not authorized to access the admin dashboard.</p>
              <button type="button" className="btn" onClick={handleLogout}>Sign out</button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const renderAuditModal = () => {
    if (!showLogs) return null;
    const profile = profiles.find((p) => p.uid === showLogs);
    if (!profile) return null;

    const actions = Array.from(new Set(auditLogs.map((l) => l.action)));
    const q = auditSearch.trim().toLowerCase();
    const filteredLogs = auditLogs.filter((l) => {
      const matchesAction = !auditActionFilter || l.action === auditActionFilter;
      const text = [l.performedBy, (l.details as any)?.responderName || "", (l.details as any)?.responderPhone || "", ipOf(l), detail(l.details), ACTION_LABELS[l.action]?.label || l.action].join(" ").toLowerCase();
      return matchesAction && (!q || text.includes(q));
    });

    const uniqueIPs = new Set(auditLogs.map(ipOf).filter(Boolean)).size;
    const lastActivity = auditLogs[0] ? formatDateTime(auditLogs[0].performedAt as Timestamp) : "—";
    const st = statusOf(profile);

    return (
      <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLogs(null); }}>
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="atitle">
          <div className="sheet-head">
            <div>
              <h3 id="atitle">Audit logs</h3>
              <p>{fullName(profile) || "Unnamed"} · {profile.email}</p>
            </div>
            <button type="button" className="x" onClick={() => setShowLogs(null)}>Close</button>
          </div>
          <div className="meta">
            <span>Status: <b>{st.charAt(0).toUpperCase() + st.slice(1)}</b></span>
            <span>Total events: <b>{auditLogs.length}</b></span>
            <span>Unique IPs: <b>{uniqueIPs}</b></span>
            <span>Last activity: <b>{lastActivity}</b></span>
          </div>
          <div className="afilters">
            <label className="search">
              <span className="sr">Search logs</span>
              <SearchIcon />
              <input type="search" placeholder="Search by name, phone, IP or details" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
            </label>
            <label>
              <span className="sr">Filter by action</span>
              <select value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}>
                <option value="">All actions</option>
                {actions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>)}
              </select>
            </label>
            <button type="button" className="btn sm" onClick={() => showToast(`Exporting ${auditLogs.length} entries as CSV`)}>Export CSV</button>
          </div>
          <div className="alog">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed by</th>
                  <th>IP address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr><td colSpan={5} className="empty">Loading audit logs…</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="empty">No log entries match your filters.</td></tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="nw">
                        <div className="ts">
                          <b>{formatTime(log.performedAt as Timestamp)}</b>
                          <small>{formatDate(log.performedAt as Timestamp)}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${ACTION_LABELS[log.action]?.chip || ""}`}>
                          {ACTION_LABELS[log.action]?.label || log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                          <div style={{ color: "var(--ink)", fontWeight: 600 }}>{(log.details as any)?.responderName || log.performedBy || "—"}</div>
                          {(log.details as any)?.responderPhone && <div style={{ color: "var(--muted)", fontSize: 11 }}>📞 {(log.details as any).responderPhone}</div>}
                          <div style={{ color: "var(--muted)", fontSize: 11 }}>{log.performedBy || "—"}</div>
                        </div>
                      </td>
                      <td className="nw"><span className="ip">{ipOf(log) || "—"}</span></td>
                      <td className="muted">{detail(log.details)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="sheet-foot">
            <span>Showing {filteredLogs.length} of {auditLogs.length} entries</span>
            <span>Logs are read-only and retained as per the DPDP Act, 2023.</span>
          </div>
        </div>
      </div>
    );
  };

  const statCards: { label: string; value: number; color: string }[] = [
    { label: "Total profiles", value: count("all"), color: "var(--navy)" },
    { label: "Pending review", value: count("pending"), color: "var(--saffron)" },
    { label: "Approved", value: count("approved"), color: "var(--green)" },
    { label: "Rejected", value: count("rejected"), color: "#c62828" },
  ];

  return (
    <main id="admin">
      <AdminStyles />
      <div className="wrap">
        <div className="admin-card">
          <div className="page-head">
            <div>
              <h2>Admin dashboard</h2>
              <p>
                {count("all")} total profiles · {count("pending")} pending · {count("approved")} approved · {count("rejected")} rejected
              </p>
            </div>
            <div className="who">
              <div><small>Signed in as</small><strong>{user?.email}</strong></div>
              <button type="button" className="btn sm" onClick={handleLogout}>Sign out</button>
            </div>
          </div>

          <div className="stats">
            {statCards.map((s) => (
              <div key={s.label} className="stat" style={{ "--c": s.color } as React.CSSProperties}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <section className="panel" aria-label="Citizen profiles">
            <div className="toolbar">
              <label className="search">
                <span className="sr">Search profiles</span>
                <SearchIcon />
                <input type="search" placeholder="Search by name, email or ABHA ID" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </label>
              <div className="seg" role="group" aria-label="Filter by status">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button type="button" key={f} aria-pressed={statusFilter === f} onClick={() => setStatusFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="n">{count(f)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="scroll">
              <table style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Citizen</th>
                    <th>Email</th>
                    <th>Submitted</th>
                    <th>ABHA ID</th>
                    <th>Status</th>
                    <th className="r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.length === 0 ? (
                    <tr><td colSpan={6} className="empty">No profiles match. Try a different search or filter.</td></tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const name = fullName(p) || "Unnamed";
                      const abha = p.abha || p.abhaId;
                      const rowBusy = busy?.uid === p.uid;
                      return (
                        <tr key={p.uid}>
                          <td>
                            <div className="person">
                              <div className="av">{getInitials(name)}</div>
                              <div>
                                <strong>{name}</strong>
                                <small>{abha ? "ABHA linked" : "No ABHA"}</small>
                              </div>
                          </div>
                          </td>
                          <td>{p.email || "—"}</td>
                          <td className="muted nw">{formatDate(p.createdAt as Timestamp)}</td>
                          <td className="muted">{abha || "—"}</td>
                          <td><StatusBadge status={statusOf(p)} /></td>
                          <td className="nw">
                            <div className="acts">
                              {statusOf(p) === "pending" && (
                                <>
                                  <button type="button" className="btn sm ok" onClick={() => handleApprove(p.uid)} disabled={rowBusy}>
                                    {rowBusy && busy?.type === "approve" ? <><span className="spin" /> Approving…</> : "✓ Approve"}
                                  </button>
                                  <button type="button" className="btn sm no" onClick={() => handleReject(p.uid)} disabled={rowBusy}>
                                    {rowBusy && busy?.type === "reject" ? <><span className="spin" /> Rejecting…</> : "✗ Reject"}
                                  </button>
                                </>
                              )}
                              <button type="button" className="btn sm" onClick={() => handleViewLogs(p.uid)}>Audit logs</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {renderAuditModal()}

        <div className={`toast ${toast.show ? "show" : ""}`} role="status">{toast.text}</div>
      </div>
    </main>
  );
}