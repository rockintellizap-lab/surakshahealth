"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getProfile, logProfileAccess } from "@/lib/profileService";
import { QRCodeCanvas } from "qrcode.react";

export default function QRView() {
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [adminApprovedDate, setAdminApprovedDate] = useState<string>("");

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProfile(user.uid);
      setProfile(data);
      if (data) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const emergencyUrl = `${baseUrl}/responder/${user.uid}`;
        setQrData(emergencyUrl);
        
        // Use actual approvedAt from profile
        if (data.approvedAt?.toDate) {
          setAdminApprovedDate(data.approvedAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
        } else {
          setAdminApprovedDate(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
        }
        
        // Log QR view
        await logProfileAccess(user.uid, "view", user.email || "citizen");
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

  const copyLink = async () => {
    if (qrData) {
      try {
        await navigator.clipboard.writeText(qrData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        // Log copy action
        if (user) {
          await logProfileAccess(user.uid, "qr_scan", user.email || "citizen", { method: "copy_link" });
        }
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };

  const downloadQR = async () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      const fullName = [profile?.fn, profile?.mn, profile?.ln].filter(Boolean).join(" ") || "user";
      link.download = `suraksha-emergency-qr-${fullName.replace(/\s+/g, "-")}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
      // Log download
      if (user) {
        await logProfileAccess(user.uid, "qr_download", user.email || "citizen");
      }
    }
  };

  const printCard = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const fullName = [profile?.fn, profile?.mn, profile?.ln].filter(Boolean).join(" ") || "Citizen";
    const abha = profile?.abha?.replace(/\D/g, "") || "";
    const abhaDisplay = abha.length === 14 ? `ABHA XX-XXXX-XXXX-${abha.slice(10)}` : "ABHA not linked";
    const dob = profile?.dob ? new Date(profile.dob + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
    const allergies = profile?.allergies ? JSON.parse(profile.allergies).map((a: any) => a.name).filter(Boolean).join(", ") : "None reported";
    const emergencyContact = [profile?.pc_name, profile?.pc_mob].filter(Boolean).join(" · ") || "—";
    
    // Generate QR code as data URL from canvas
    let qrDataUrl = "";
    if (canvasRef.current) {
      qrDataUrl = canvasRef.current.toDataURL("image/png");
    }
    
    // Log print
    if (user) {
      await logProfileAccess(user.uid, "qr_print", user.email || "citizen");
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Emergency Health Card - ${fullName}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: "Noto Sans", system-ui; background: #fff; }
          .card { max-width: 480px; margin: 0 auto; border: 1px solid #d3d9e8; border-left: 6px solid #ff9933; border-radius: 14px; overflow: hidden; box-shadow: 0 14px 34px rgba(15,33,89,.14); }
          .top { display: flex; justify-content: space-between; align-items: center; background: #0f2159; color: #fff; padding: 12px 20px; border-bottom: 4px solid #ff9933; }
          .top b { display: block; font-size: 16px; }
          .top span { font-size: 12px; color: #c5cff0; }
          .top em { font-style: normal; font-size: 11px; font-weight: 700; background: #138808; color: #fff; border-radius: 3px; padding: 2px 10px; }
          .body { display: flex; gap: 22px; justify-content: space-between; align-items: center; padding: 22px 20px; }
          .left { flex: 1; }
          .name { font: 700 24px "Noto Serif", Georgia, serif; color: #0f2159; line-height: 1.2; }
          .id { font-size: 13px; color: #59627c; margin-bottom: 14px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; margin: 0; }
          .grid dt { font-size: 11px; color: #59627c; }
          .grid dd { margin: 0; font-weight: 700; color: #0f2159; font-size: 14px; word-break: break-word; }
          .grid dd.red { color: #c62828; font-size: 26px; line-height: 1; }
          .qr { text-align: center; flex: none; }
          .qrbox { width: 150px; height: 150px; border: 1px solid #d3d9e8; border-radius: 8px; padding: 8px; background: #fff; }
          .qrbox img { width: 100%; height: 100%; display: block; }
          .qr span { display: block; font-size: 11px; color: #59627c; margin-top: 6px; }
          .foot { background: #f5f7fc; border-top: 1px solid #d3d9e8; padding: 9px 20px; font-size: 12px; color: #59627c; }
          @media print { body * { visibility: hidden; } .card, .card * { visibility: visible; } .card { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="card" id="hcard">
          <div class="top"><div><b>Emergency Health Card</b><span>SurakshaHealth India · ABDM aligned</span></div><em>VERIFIED</em></div>
          <div class="body">
            <div>
              <div class="name">${fullName}</div>
              <div class="id">${abhaDisplay}</div>
              <dl class="grid">
                <div><dt>Blood group</dt><dd class="red">${profile?.bg || "—"}</dd></div>
                <div><dt>Date of birth</dt><dd>${dob}</dd></div>
                <div><dt>Allergies</dt><dd>${allergies}</dd></div>
                <div><dt>Emergency contact</dt><dd>${emergencyContact}</dd></div>
              </dl>
            </div>
            <div class="qr">
              <div class="qrbox" id="qrbox">${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ""}</div>
              <span>ID: ${qrData.slice(-12).match(/.{1,4}/g)?.join("-") || ""}</span>
            </div>
          </div>
          <div class="foot">Scan in an emergency · Access needs DOB + ID verification and is logged</div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <main id="qrpage" className="qrp">
        <section>
          <div style={{ padding: "40px", textAlign: "center" }}>
            Loading QR code...
          </div>
        </section>
        <aside className="card">
          <div className="sh"><h2>Your Emergency QR</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            Loading...
          </div>
        </aside>
      </main>
    );
  }

  if (!profile) {
    return (
      <main id="qrpage" className="qrp">
        <section>
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
        <aside className="card">
          <div className="sh"><h2>Your Emergency QR</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            No profile found.
          </div>
        </aside>
      </main>
    );
  }

  // Check if profile is approved
  if (profile.status !== "approved") {
    return (
      <main id="qrpage" className="qrp">
        <section>
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "16px", color: "var(--danger)" }}>QR Not Available</h2>
            <p style={{ marginBottom: "24px", color: "var(--muted)" }}>
              {profile.status === "rejected" 
                ? "Your profile was rejected. Please edit and resubmit." 
                : "Your profile is pending admin approval. QR will be available once approved."
              }
            </p>
            <button type="button" className="btn" onClick={() => setView("status")}>
              Back to Status
            </button>
            <button type="button" className="btn ghost" onClick={() => setView("profile")} style={{ marginLeft: "12px" }}>
              Edit Profile
            </button>
          </div>
        </section>
        <aside className="card">
          <div className="sh"><h2>Your Emergency QR</h2></div>
          <div className="sb" style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ color: "var(--muted)" }}>QR code only available after admin approval.</p>
          </div>
        </aside>
      </main>
    );
  }

  const fullName = [profile.fn, profile.mn, profile.ln].filter(Boolean).join(" ") || "Citizen";
  const abha = profile.abha?.replace(/\D/g, "") || "";
  const abhaDisplay = abha.length === 14 ? `ABHA XX-XXXX-XXXX-${abha.slice(10)}` : "ABHA not linked";
  const dob = profile.dob ? new Date(profile.dob + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const allergies = profile.allergies 
    ? JSON.parse(profile.allergies).map((a: any) => a.name).filter(Boolean).join(", ") 
    : "None reported";
  const emergencyContact = [profile.pc_name, profile.pc_mob].filter(Boolean).join(" · ") || "—";
  const qrId = qrData.slice(-12).match(/.{1,4}/g)?.join("-") || "";

  return (
    <main id="qrpage" className="qrp">
      <section>
        <div className="msg" role="status">
          ✓ Approved by SurakshaHealth admin on <span id="apdt">{adminApprovedDate}</span>. Your Emergency QR is ready.
        </div>
        <div className="hcard" id="hcard">
          <div className="hc-top">
            <div>
              <b>Emergency Health Card</b>
              <span>SurakshaHealth India · ABDM aligned</span>
            </div>
            <em>VERIFIED</em>
          </div>
          <div className="hc-body">
            <div>
              <div className="hc-name" id="hcName">{fullName}</div>
              <div className="hc-id" id="hcId">{abhaDisplay}</div>
              <dl className="hc-g">
                <div>
                  <dt>Blood group</dt>
                  <dd className="red" id="hcBg">{profile.bg || "—"}</dd>
                </div>
                <div>
                  <dt>Date of birth</dt>
                  <dd id="hcDob">{dob}</dd>
                </div>
                <div>
                  <dt>Allergies</dt>
                  <dd id="hcAl">{allergies}</dd>
                </div>
                <div>
                  <dt>Emergency contact</dt>
                  <dd id="hcEc">{emergencyContact}</dd>
                </div>
              </dl>
            </div>
            <div className="hc-qr">
              <div id="qrbox" style={{ 
                width: "150px", 
                height: "150px", 
                border: "1px solid var(--line)", 
                borderRadius: "8px", 
                padding: "8px", 
                background: "#fff" 
              }}>
                <QRCodeCanvas
                  value={qrData}
                  size={134}
                  level="M"
                  includeMargin={true}
                  ref={canvasRef}
                />
              </div>
              <span id="qrid">ID: {qrId}</span>
            </div>
          </div>
          <div className="hc-foot">Scan in an emergency · Access needs DOB + ID verification and is logged</div>
        </div>
      </section>
      <aside className="card">
        <div className="sh"><h2>Your Emergency QR</h2></div>
        <div className="sb">
          <p className="sub" style={{ marginTop: "16px" }}>
            The QR holds only a secure reference, never your medical data. Doctors see your details only after verification.
          </p>
          <div className="acts col">
            <button type="button" className="btn" onClick={downloadQR}>
              ⬇ Download QR (PNG)
            </button>
            <button type="button" className="btn ghost" onClick={printCard}>
              🖨 Print health card
            </button>
            <button type="button" className="btn ghost" onClick={copyLink}>
              🔗 Copy secure link {copied && <span style={{ color: "var(--green)" }}>✓ Copied</span>}
            </button>
          </div>
          <div className="msg" id="qmsg" hidden role="status"></div>
          <h3 style={{ marginTop: "24px", marginBottom: "12px", fontSize: "16px" }}>Where to keep it</h3>
          <ul className="tips" style={{ margin: "8px 0 0", paddingLeft: "20px", color: "var(--muted)", fontSize: "14px", lineHeight: 2 }}>
            <li>Helmet sticker or bike key tag</li>
            <li>Printed card in your wallet</li>
            <li>Phone lock-screen image</li>
          </ul>
          <div className="acts" style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button type="button" className="link" onClick={() => setView("profile")}>
              Back to profile
            </button>
            <button type="button" className="link" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}