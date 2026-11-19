"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<{ email: string; password: string }>>({});
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      window.location.href = "/admin";
    }
  }, [isAdmin, adminLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<{ email: string; password: string }> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setMsg({ text: "", hidden: true, error: false });
    try {
      await signIn(email, password);
      setMsg({ text: "Signed in successfully!", hidden: false, error: false });
      setTimeout(() => { window.location.href = "/admin"; }, 800);
    } catch (err: any) {
      const message =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err.code === "auth/user-not-found"
            ? "No account found with this email."
            : err.code === "auth/wrong-password"
              ? "Incorrect password."
              : "Sign in failed. Please try again.";
      setMsg({ text: message, hidden: false, error: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fc", padding: 24 }}>
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ background: "#fff", border: "1px solid #d3d9e8", borderRadius: 14, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 8px 24px rgba(15,33,89,.08)" }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#0f2159" }}>Admin Sign In</h2>
        <p style={{ margin: "0 0 24px", color: "#59627c", fontSize: 14 }}>SurakshaHealth administrator access</p>

        <label htmlFor="admin-email" style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f2159" }}>
          Email ID <span style={{ color: "#c62828" }}>*</span>
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          placeholder="admin@surakshahealth.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          disabled={submitting}
          style={{ width: "100%", padding: "12px 14px", border: `1px solid ${errors.email ? "#c62828" : "#d3d9e8"}`, borderRadius: 8, fontSize: 16, boxSizing: "border-box" }}
        />
        {errors.email && <span style={{ color: "#c62828", fontSize: 13, marginTop: 4, display: "block" }}>{errors.email}</span>}

        <label htmlFor="admin-pass" style={{ display: "block", marginBottom: 6, marginTop: 16, fontWeight: 600, color: "#0f2159" }}>
          Password <span style={{ color: "#c62828" }}>*</span>
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="admin-pass"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            disabled={submitting}
            style={{ width: "100%", padding: "12px 14px", border: `1px solid ${errors.password ? "#c62828" : "#d3d9e8"}`, borderRadius: 8, fontSize: 16, boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            aria-label={showPass ? "Hide password" : "Show password"}
            disabled={submitting}
            style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: 13, color: "#59627c", padding: 4 }}
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <span style={{ color: "#c62828", fontSize: 13, marginTop: 4, display: "block" }}>{errors.password}</span>}

        <button
          type="submit"
          disabled={submitting}
          style={{ width: "100%", padding: "12px", marginTop: 20, background: "#0f2159", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Signing in..." : "Sign in to Admin"}
        </button>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a href="/" style={{ color: "#0f2159", textDecoration: "none", fontSize: 13 }}>← Back to citizen portal</a>
        </div>

        {(!msg.hidden) && (
          <div role="status" style={{ marginTop: 12, borderLeft: "4px solid " + (msg.error ? "#c62828" : "#138808"), paddingLeft: 10, color: msg.error ? "#c62828" : "#138808", fontSize: 13 }}>
            {msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
