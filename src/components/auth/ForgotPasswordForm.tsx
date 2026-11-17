"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { ForgotPasswordFormData, validateForgotPassword } from "@/types/forms";

export default function ForgotPasswordForm({ active }: { active: boolean }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [submitting, setSubmitting] = useState(false);
  const { resetPassword } = useAuth();
  const { setView } = useView();

  useEffect(() => {
    const handleReset = () => {
      setEmail("");
      setErrors({});
      setMsg({ text: "", hidden: true, error: false });
    };

    window.addEventListener("suraksha:reset-forms", handleReset);
    return () => window.removeEventListener("suraksha:reset-forms", handleReset);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData: ForgotPasswordFormData = { email };
    const validationErrors = validateForgotPassword(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitting(true);
      setMsg({ text: "", hidden: true, error: false });
      try {
        await resetPassword(email);
        setMsg({ text: "Password reset link sent! Check your email.", hidden: false, error: false });
      } catch (err: any) {
        const message = err.code === "auth/user-not-found"
          ? "If this email is registered, a password reset link has been sent to it."
          : err.code === "auth/invalid-email"
          ? "Invalid email address."
          : "Failed to send reset link. Please try again.";
        setMsg({ text: message, hidden: false, error: true });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <form
      className="panel"
      id="p-forgot"
      role="tabpanel"
      aria-labelledby="t-forgot"
      noValidate
      onSubmit={handleSubmit}
      hidden={!active}
    >
      <h2>Reset your password</h2>
      <p className="sub">
        Enter your registered email. You will receive a password reset link on that email.
      </p>

      <label htmlFor="fp-email">
        Registered email <span className="req">*</span>
      </label>
      <input
        id="fp-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={!!errors.email}
        disabled={submitting}
      />
      {errors.email && <div className="err" data-for="fp-email">{errors.email}</div>}

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send reset link"}
      </button>

      <div className="row">
        <button type="button" className="link" onClick={() => setView("auth")} data-tab="signin">
          Back to sign in
        </button>
      </div>

      <div className="msg" hidden={msg.hidden} role="status" style={{ borderLeftColor: msg.error ? "var(--danger)" : "var(--green)" }}>
        {msg.text}
      </div>
    </form>
  );
}