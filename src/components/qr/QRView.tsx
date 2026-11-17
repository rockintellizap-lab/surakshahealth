"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getProfile } from "@/lib/profileService";
import { QRCodeCanvas } from "qrcode.react";

export default function QRView() {
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [qrData, setQrData] = useState("");
  const [showData, setShowData] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProfile(user.uid);
      setProfile(data);
      if (data) {
        const emergencyUrl = `${window.location.origin}/status?uid=${user.uid}`;
        setQrData(emergencyUrl);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `suraksha-emergency-qr-${user?.uid?.slice(0, 8)}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const shareQR = async () => {
    if (canvasRef.current) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "suraksha-emergency-qr.png", { type: "image/png" });
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: "SurakshaHealth Emergency QR" });
            } else {
              // Fallback: copy to clipboard
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              alert("QR code copied to clipboard!");
            }
          }
        }, "image/png");
      } catch (err) {
        console.error("Share failed:", err);
        downloadQR();
      }
    }
  };

  if (loading) {
    return (
      <section id="qr" className="pf">
        <div className="side">
          <div className="who">
            <small>Signed in as</small>
            <b>{user?.email}</b>
          </div>
        </div>
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading QR code...
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section id="qr" className="pf">
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
            Create your emergency profile first to generate a QR code.
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
    <section id="qr" className="pf">
      <div className="side">
        <div className="who">
          <small>Signed in as</small>
          <b>{user?.email}</b>
          <button type="button" className="link" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <div className="card" style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "28px" }}>Emergency Access QR Code</h2>
          <p className="sub" style={{ margin: "0 0 24px" }}>
            Scan this code or share the link below to give verified ER staff instant access to your emergency profile.
          </p>

          <div style={{ 
            background: "white", 
            padding: "24px", 
            borderRadius: "16px",
            display: "inline-block",
            boxShadow: "var(--shadow)",
          }}>
            <QRCodeCanvas
              value={qrData}
              size={256}
              level="M"
              includeMargin={true}
              ref={canvasRef}
            />
          </div>

          <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
            This QR code contains a secure link to your emergency profile.
            It does <strong>not</strong> store your medical data directly.
          </p>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Emergency Link</h2>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>
              <input type="checkbox" checked={showData} onChange={e => setShowData(e.target.checked)} />
              Show link
            </label>
          </div>
          <div className="sb">
            {showData && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ 
                  background: "var(--bg-2)", 
                  padding: "12px 16px", 
                  borderRadius: "10px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  wordBreak: "break-all",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <span style={{ flex: 1 }}>{qrData}</span>
                  <button type="button" className="btn" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={copyLink}>
                    {copied ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
                <p className="hint" style={{ marginTop: "8px" }}>
                  Anyone with this link can view your emergency profile. Share only with trusted contacts.
                </p>
              </div>
            )}
            {!showData && (
              <p className="sub" style={{ margin: 0 }}>
                Enable "Show link" to reveal and copy your unique emergency access URL.
              </p>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>Quick Actions</h2></div>
          <div className="sb" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            <button type="button" className="btn" onClick={downloadQR} style={{ background: "var(--primary)" }}>
              📥 Download PNG
            </button>
            <button type="button" className="btn" onClick={shareQR} style={{ background: "var(--green)" }}>
              📤 Share QR
            </button>
            <button type="button" className="btn" onClick={() => setView("status")} style={{ background: "var(--primary-700)" }}>
              👁️ View Status
            </button>
            <button type="button" className="btn" onClick={() => setView("profile")} style={{ background: "var(--muted)" }}>
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="sh"><h2>Profile Preview</h2></div>
          <div className="sb">
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {profile.photo && (
                <img src={profile.photo} alt="Profile photo" style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--primary)",
                }} />
              )}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>{fullName || "Unnamed"}</div>
                <div style={{ display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap", fontSize: "14px" }}>
                  {profile.bg && (
                    <span style={{
                      background: "rgba(220, 38, 38, 0.1)",
                      color: "var(--danger)",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontWeight: 700,
                    }}>
                      {profile.bg}
                    </span>
                  )}
                  {profile.dob && (
                    <span style={{ color: "var(--muted)" }}>
                      Born {new Date(profile.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px", color: "var(--muted)" }}>
              <span>📞 {profile.pc_name ? `${profile.pc_name}: ${profile.pc_mob}` : "No emergency contact"}</span>
              {profile.pc_email && <span>✉️ {profile.pc_email}</span>}
            </div>
          </div>
        </div>

        <div className="card" style={{ borderColor: "var(--warning)", background: "rgba(234, 179, 8, 0.05)" }}>
          <div className="sh" style={{ borderBottomColor: "var(--warning)" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span> Important
            </h2>
          </div>
          <div className="sb">
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.8, fontSize: "14px" }}>
              <li>This QR code gives access to your <strong>full emergency profile</strong> including medical history, allergies, medications, and emergency contacts.</li>
              <li>Only share with <strong>trusted family members, caregivers, or your primary physician</strong>.</li>
              <li>In a real emergency, first responders can scan this code without needing your phone unlocked.</li>
              <li>You can <strong>regenerate the QR code</strong> anytime by editing your profile — the old link will stop working.</li>
              <li>Keep a <strong>printed copy</strong> in your wallet, car, or on your fridge for true offline access.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
          <p>SurakshaHealth — Your health, your safety, your control.</p>
          <p style={{ marginTop: "4px" }}>Made with ❤️ for India's emergency readiness.</p>
        </div>
      </div>
    </section>
  );
}