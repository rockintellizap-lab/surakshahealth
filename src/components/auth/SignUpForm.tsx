"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { SignUpFormData, validateSignUp, PASSWORD_RULES, formatAbha, formatAadhaar } from "@/types/forms";

export default function SignUpForm({ active }: { active: boolean }) {
  const [email, setEmail] = useState("");
  const [abha, setAbha] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const { setView } = useView();

  useEffect(() => {
    const handleReset = () => {
      setEmail("");
      setAbha("");
      setAadhaar("");
      setPassword("");
      setPassword2("");
      setConsent(false);
      setErrors({});
      setMsg({ text: "", hidden: true, error: false });
    };

    window.addEventListener("suraksha:reset-forms", handleReset);
    return () => window.removeEventListener("suraksha:reset-forms", handleReset);
  }, []);

  const handleAbhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAbha(formatAbha(e.target.value));
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAadhaar(formatAadhaar(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData: SignUpFormData = { email, abha, aadhaar, password, password2, consent };
    const validationErrors = validateSignUp(formData);
    setErrors(validationErrors as Record<string, string>);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitting(true);
      setMsg({ text: "", hidden: true, error: false });
      try {
        const redirectPath = await signUp(email, password);
        setMsg({ text: "Account created successfully!", hidden: false, error: false });
        setView(redirectPath as any);
      } catch (err: any) {
        const message = err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err.code === "auth/weak-password"
          ? "Password is too weak."
          : err.code === "auth/invalid-email"
          ? "Invalid email address."
          : "Registration failed. Please try again.";
        setMsg({ text: message, hidden: false, error: true });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <form
      className="panel"
      id="p-signup"
      role="tabpanel"
      aria-labelledby="t-signup"
      noValidate
      onSubmit={handleSubmit}
      hidden={!active}
    >
      <div className="head">
        <div>
          <h2>Citizen Emergency Vault Registration</h2>
          <p className="sub">
            UX4G 3.0 & DPDP Act 2023 Compliant
          </p>
        </div>
      </div>

      <label htmlFor="su-email">
        Email ID <span className="req">*</span>
      </label>
      <input
        id="su-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={!!errors.email}
        disabled={submitting}
      />
      {errors.email && <div className="err" data-for="su-email">{errors.email}</div>}

      <label htmlFor="su-abha">
        ABHA ID <small>(optional, 14 digits)</small>
      </label>
      <input
        id="su-abha"
        inputMode="numeric"
        maxLength={17}
        placeholder="91-8840-2219-4401"
        value={abha}
        onChange={handleAbhaChange}
        aria-invalid={!!errors.abha}
        disabled={submitting}
      />
      {errors.abha && <div className="err" data-for="su-abha">{errors.abha}</div>}

      <label htmlFor="su-aadhaar">
        Aadhaar number <small>(optional, 12 digits)</small>
      </label>
      <input
        id="su-aadhaar"
        inputMode="numeric"
        maxLength={14}
        placeholder="1234 5678 9012"
        value={aadhaar}
        onChange={handleAadhaarChange}
        aria-invalid={!!errors.aadhaar}
        disabled={submitting}
      />
      {errors.aadhaar && <div className="err" data-for="su-aadhaar">{errors.aadhaar}</div>}

      <label htmlFor="su-pass">
        Password <span className="req">*</span>
      </label>
      <div className="pw">
        <input
          id="su-pass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          disabled={submitting}
        />
        <button
          type="button"
          data-toggle="su-pass"
          aria-label="Show password"
          disabled={submitting}
        >
          Show
        </button>
      </div>
      <ul className="rules" id="rules" aria-live="polite">
        {PASSWORD_RULES.map((rule) => (
          <li key={rule.name} data-r={rule.name} className={rule.test(password) ? "ok" : ""}>
            {rule.message}
          </li>
        ))}
      </ul>
      {errors.password && <div className="err" data-for="su-pass">{errors.password}</div>}

      <label htmlFor="su-pass2">
        Retype password <span className="req">*</span>
      </label>
      <div className="pw">
        <input
          id="su-pass2"
          type="password"
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          aria-invalid={!!errors.password2}
          disabled={submitting}
        />
        <button
          type="button"
          data-toggle="su-pass2"
          aria-label="Show password"
          disabled={submitting}
        >
          Show
        </button>
      </div>
      {errors.password2 && <div className="err" data-for="su-pass2">{errors.password2}</div>}

      <label className="consent" htmlFor="su-consent">
        <input
          type="checkbox"
          id="su-consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={submitting}
        />
        <span>
          <b>Explicit Purpose-Limited Consent (DPDP Act, 2023):</b> I consent to
          store my critical allergies, blood group, and emergency documents in
          SurakshaHealth India and permit verified ER doctors to retrieve them
          during a life-threatening medical emergency.<br />
          <a href="#signup">Read Full DPDP Act 2023 Sec. 6 & 7(c) Notice</a>
        </span>
      </label>

      <button className="btn" id="su-btn" type="submit" disabled={!consent || submitting}>
        {submitting ? "Creating account..." : "Create account"}
      </button>

      <div className="row">
        <span>Already registered?</span>
        <button type="button" className="link" onClick={() => setView("auth")} data-tab="signin">
          Sign in
        </button>
      </div>

      <div className="msg" hidden={msg.hidden} role="status" style={{ borderLeftColor: msg.error ? "var(--danger)" : "var(--green)" }}>
        {msg.text}
      </div>
    </form>
  );
}