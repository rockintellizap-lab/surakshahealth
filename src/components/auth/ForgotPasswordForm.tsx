"use client";

import { useState, useEffect } from "react";
import { ForgotPasswordFormData, validateForgotPassword } from "@/types/forms";

export default function ForgotPasswordForm({ active }: { active: boolean }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [submitting, setSubmitting] = useState(false);

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
      // Simulate sending - just show success message without actually sending
      setTimeout(() => {
        setMsg({ text: "Password reset link sent! Check your email.", hidden: false, error: false });
        setSubmitting(false);
      }, 1000);
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

      <div className="msg" hidden={msg.hidden} role="status" style={{ borderLeftColor: msg.error ? "var(--danger)" : "var(--green)" }}>
        {msg.text}
      </div>
    </form>
  );
}