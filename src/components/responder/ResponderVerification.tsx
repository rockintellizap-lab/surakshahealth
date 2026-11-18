"use client";

import { useState, useEffect, FormEvent } from "react";

interface ResponderData {
  name: string;
  email: string;
  phone: string;
}

interface VerificationResult {
  success: boolean;
  profile?: any;
  error?: string;
}

export default function ResponderVerification({
  uid,
  onVerified,
}: {
  uid: string;
  onVerified: (profile: any) => void;
}) {
  const [formData, setFormData] = useState<ResponderData>({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<ResponderData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ip, setIp] = useState<string>("");

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIp(data.ip);
      } catch {
        setIp("unknown");
      }
    };
    fetchIP();
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<ResponderData> = {};
    const phoneRegex = /^(\+?91)?[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ""))) newErrors.phone = "Invalid Indian mobile number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/responder/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          responderName: formData.name,
          responderEmail: formData.email,
          responderPhone: formData.phone,
          ip,
          userAgent: navigator.userAgent,
        }),
      });

      const result: VerificationResult = await res.json();
      if (result.success && result.profile) {
        onVerified(result.profile);
      } else {
        setErrors({ email: result.error || "Verification failed" });
      }
    } catch {
      setErrors({ email: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="responder" className="resp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", background: "#f5f7fc" }}>
      <div className="resp-container" style={{ maxWidth: 480, width: "100%" }}>
        <div className="resp-header" style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ background: "#0f2159", color: "#fff", padding: "16px", borderRadius: 12, borderLeft: "6px solid #ff9933" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>First Responder Verification</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#c5cff0" }}>Enter your details to access emergency medical information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ background: "#fff", border: "1px solid #d3d9e8", borderRadius: 14, padding: 24, boxShadow: "0 4px 24px rgba(15,33,89,.08)" }}>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="r-name" style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f2159" }}>
              Full Name <span style={{ color: "#c62828" }}>*</span>
            </label>
            <input
              id="r-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Dr. Rajesh Kumar"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${errors.name ? "#c62828" : "#d3d9e8"}`,
                borderRadius: 8,
                fontSize: 16,
                boxSizing: "border-box",
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && <span style={{ color: "#c62828", fontSize: 13, marginTop: 4, display: "block" }}>{errors.name}</span>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="r-email" style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f2159" }}>
              Email <span style={{ color: "#c62828" }}>*</span>
            </label>
            <input
              id="r-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., responder@hospital.com"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${errors.email ? "#c62828" : "#d3d9e8"}`,
                borderRadius: 8,
                fontSize: 16,
                boxSizing: "border-box",
              }}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span style={{ color: "#c62828", fontSize: 13, marginTop: 4, display: "block" }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="r-phone" style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f2159" }}>
              Mobile Number <span style={{ color: "#c62828" }}>*</span>
            </label>
            <input
              id="r-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., +91 98765 43210"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${errors.phone ? "#c62828" : "#d3d9e8"}`,
                borderRadius: 8,
                fontSize: 16,
                boxSizing: "border-box",
              }}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <span style={{ color: "#c62828", fontSize: 13, marginTop: 4, display: "block" }}>{errors.phone}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "14px",
              background: "#0f2159",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Verifying..." : "Access Emergency Profile"}
          </button>

          <p style={{ marginTop: 16, fontSize: 13, color: "#59627c", textAlign: "center" }}>
            By submitting, you confirm you are an authorized first responder accessing this data for emergency medical purposes only.
          </p>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#59627c" }}>
          Powered by SurakshaHealth India · ABDM Aligned · CSR Initiated by NIPER
        </div>
      </div>
    </main>
  );
}