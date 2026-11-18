"use client";

import { useEffect, useRef } from "react";

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
}

export default function EmergencyCard({
  profile,
  onClose,
}: {
  profile: EmergencyProfile;
  onClose?: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const fullName = [profile.fn, profile.mn, profile.ln].filter(Boolean).join(" ") || "Unknown";
  const dob = profile.dob ? new Date(profile.dob + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const abha = profile.abha?.replace(/\D/g, "") || "";
  const abhaDisplay = abha.length === 14 ? `ABHA XX-XXXX-XXXX-${abha.slice(10)}` : "ABHA not linked";

  const parseJSON = (data?: string) => {
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const allergies = parseJSON(profile.allergies);
  const medications = parseJSON(profile.medications);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Emergency Medical Card - ${fullName}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: "Noto Sans", system-ui; background: #fff; font-size: 14px; }
            .card { max-width: 700px; margin: 0 auto; border: 1px solid #d3d9e8; border-left: 6px solid #ff9933; border-radius: 14px; overflow: hidden; box-shadow: 0 14px 34px rgba(15,33,89,.14); }
            .banner { background: #c62828; color: #fff; padding: 12px 20px; text-align: center; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; }
            .top { display: flex; justify-content: space-between; align-items: center; background: #0f2159; color: #fff; padding: 16px 20px; border-bottom: 4px solid #ff9933; }
            .top .left b { display: block; font-size: 18px; }
            .top .left span { font-size: 12px; color: #c5cff0; }
            .top .verified { font-style: normal; font-size: 11px; font-weight: 700; background: #138808; color: #fff; border-radius: 3px; padding: 4px 12px; }
            .body { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 20px; }
            @media (max-width: 600px) { .body { grid-template-columns: 1fr; } }
            .section { background: #fafbfd; border: 1px solid #e8ecf3; border-radius: 10px; padding: 16px; }
            .section h3 { margin: 0 0 12px; font-size: 14px; color: #0f2159; border-bottom: 2px solid #ff9933; padding-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
            @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
            .grid dt { font-size: 12px; color: #59627c; font-weight: 500; }
            .grid dd { margin: 0; font-weight: 700; color: #0f2159; font-size: 14px; word-break: break-word; }
            .blood { color: #c62828; font-size: 28px; line-height: 1; font-weight: 800; }
            .list { margin: 0; padding-left: 18px; color: #0f2159; font-size: 13px; line-height: 1.8; }
            .contacts { display: flex; flex-direction: column; gap: 12px; }
            .contact { background: #fff; border: 1px solid #e8ecf3; border-radius: 8px; padding: 12px; }
            .contact .name { font-weight: 700; color: #0f2159; }
            .contact .meta { font-size: 12px; color: #59627c; margin-top: 4px; }
            .foot { background: #f5f7fc; border-top: 1px solid #d3d9e8; padding: 12px 20px; font-size: 12px; color: #59627c; text-align: center; }
            .no-print { display: none; }
            @media print { .no-print { display: none !important; } body * { visibility: hidden; } .card, .card * { visibility: visible; } .card { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:center;padding:12px;"><button onclick="window.print()" style="padding:10px 20px;background:#0f2159;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print Card</button></div>
          ${printRef.current.outerHTML}
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", background: "#f5f7fc" }}>
      <div ref={printRef} className="emergency-card" style={{ fontFamily: "'Public Sans', system-ui", width: "100%", maxWidth: 900 }}>
      <div className="banner" style={{ background: "#c62828", color: "#fff", padding: "12px 20px", textAlign: "center", fontWeight: 700, fontSize: 16, letterSpacing: "0.5px" }}>
        🚨 EMERGENCY MEDICAL INFORMATION — VERIFIED ACCESS ONLY
      </div>

      <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f2159", color: "#fff", padding: "16px 20px", borderBottom: "4px solid #ff9933" }}>
        <div className="left">
          <b style={{ display: "block", fontSize: 18 }}>Emergency Health Card</b>
          <span style={{ fontSize: 12, color: "#c5cff0" }}>SurakshaHealth India · ABDM Aligned</span>
        </div>
        <em className="verified" style={{ fontStyle: "normal", fontSize: 11, fontWeight: 700, background: "#138808", color: "#fff", borderRadius: 3, padding: "4px 12px" }}>VERIFIED</em>
      </div>

      <div className="body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: "24px 20px" }}>
        <div>
          <div className="section">
            <h3>Patient Identity</h3>
            <dl className="grid">
              <div><dt>Full Name</dt><dd style={{ fontSize: 20, fontWeight: 800 }}>{fullName}</dd></div>
              <div><dt>Date of Birth</dt><dd>{dob}</dd></div>
              <div><dt>Gender</dt><dd>{profile.gender || "—"}</dd></div>
              <div><dt>Blood Group</dt><dd className="blood">{profile.bg || "—"}</dd></div>
              <div><dt>ABHA ID</dt><dd style={{ fontFamily: "monospace", fontSize: 13 }}>{abhaDisplay}</dd></div>
            </dl>
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3>Emergency Contacts</h3>
            <div className="contacts">
              <div className="contact">
                <div className="name">{profile.pc_name || "—"} <span style={{ fontWeight: 400, color: "#59627c", fontSize: 13 }}>({profile.pc_rel || "Primary"})</span></div>
                <div className="meta">
                  <a href={`tel:${profile.pc_mob}`} style={{ color: "#0f2159", textDecoration: "none" }}>{profile.pc_mob}</a>
                  {profile.pc_alt && <span style={{ marginLeft: 12 }}><a href={`tel:${profile.pc_alt}`} style={{ color: "#0f2159" }}>{profile.pc_alt}</a></span>}
                </div>
              </div>
              {profile.sc_name && profile.sc_mob && (
                <div className="contact">
                  <div className="name">{profile.sc_name} <span style={{ fontWeight: 400, color: "#59627c", fontSize: 13 }}>({profile.sc_rel || "Secondary"})</span></div>
                  <div className="meta"><a href={`tel:${profile.sc_mob}`} style={{ color: "#0f2159", textDecoration: "none" }}>{profile.sc_mob}</a></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="section">
            <h3>Allergies</h3>
            {allergies.length > 0 ? (
              <ul className="list">
                {allergies.map((a: any, i: number) => (
                  <li key={i}><b>{a.name}</b> — {a.react || "Reaction not specified"} {a.sev && `• Severity: ${a.sev}`}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#59627c", margin: 0 }}>No allergies reported</p>
            )}
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3>Current Medications</h3>
            {medications.length > 0 ? (
              <ul className="list">
                {medications.map((m: any, i: number) => (
                  <li key={i}><b>{m.name}</b> — {m.purpose || "Purpose not specified"}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#59627c", margin: 0 }}>No medications reported</p>
            )}
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3>Medical History</h3>
            <dl className="grid" style={{ fontSize: 13 }}>
              {profile.chronic && <div><dt>Chronic Conditions</dt><dd>{profile.chronic}</dd></div>}
              {profile.ill && <div><dt>Previous Illnesses</dt><dd>{profile.ill}</dd></div>}
              {profile.ltt && <div><dt>Long-term Treatments</dt><dd>{profile.ltt}</dd></div>}
              {profile.inf && <div><dt>Infections</dt><dd>{profile.inf}</dd></div>}
              {!profile.chronic && !profile.ill && !profile.ltt && !profile.inf && (
                <p style={{ color: "#59627c", margin: 0 }}>No significant history reported</p>
              )}
            </dl>
          </div>
        </div>
      </div>

      <div className="foot" style={{ background: "#f5f7fc", borderTop: "1px solid #d3d9e8", padding: "12px 20px", fontSize: 12, color: "#59627c", textAlign: "center" }}>
        This information was accessed by an authorized first responder for emergency medical purposes only. Access is logged and audited. Data source: Citizen's SurakshaHealth Emergency Profile.
      </div>

      <div className="no-print" style={{ display: "flex", gap: 12, padding: 16, background: "#f5f7fc", borderTop: "1px solid #d3d9e8", justifyContent: "center" }}>
        <button onClick={handlePrint} style={{ padding: "10px 20px", background: "#0f2159", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
          🖨 Print Card
        </button>
        {onClose && (
          <button onClick={onClose} style={{ padding: "10px 20px", background: "#fff", color: "#0f2159", border: "1px solid #d3d9e8", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
            Close
          </button>
        )}
      </div>
    </div>
  </div>
  );
}