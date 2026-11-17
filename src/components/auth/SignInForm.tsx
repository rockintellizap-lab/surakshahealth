"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { SignInFormData, validateSignIn } from "@/types/forms";

export default function SignInForm({ active }: { active: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<SignInFormData>>({});
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const { setView } = useView();

  useEffect(() => {
    const handleReset = () => {
      setEmail("");
      setPassword("");
      setErrors({});
      setMsg({ text: "", hidden: true, error: false });
      setShowPass(false);
    };

    window.addEventListener("suraksha:reset-forms", handleReset);
    return () => window.removeEventListener("suraksha:reset-forms", handleReset);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData: SignInFormData = { email, password };
    const validationErrors = validateSignIn(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitting(true);
      setMsg({ text: "", hidden: true, error: false });
      try {
        await signIn(email, password);
        setMsg({ text: "Signed in successfully!", hidden: false, error: false });
        setView("profile");
      } catch (err: any) {
        const message = err.code === "auth/invalid-credential" 
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
    }
  };

  return (
    <form
      className="panel"
      id="p-signin"
      role="tabpanel"
      aria-labelledby="t-signin"
      noValidate
      onSubmit={handleSubmit}
      hidden={!active}
    >
      <h2>Welcome back</h2>
      <p className="sub">Sign in with your email and password.</p>

      <label htmlFor="si-email">
        Email ID <span className="req">*</span>
      </label>
      <input
        id="si-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={!!errors.email}
        disabled={submitting}
      />
      {errors.email && <div className="err" data-for="si-email">{errors.email}</div>}

      <label htmlFor="si-pass">
        Password <span className="req">*</span>
      </label>
      <div className="pw">
        <input
          id="si-pass"
          type={showPass ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          disabled={submitting}
        />
        <button
          type="button"
          data-toggle="si-pass"
          onClick={() => setShowPass(!showPass)}
          aria-label={showPass ? "Hide password" : "Show password"}
          disabled={submitting}
        >
          {showPass ? "Hide" : "Show"}
        </button>
      </div>
      {errors.password && <div className="err" data-for="si-pass">{errors.password}</div>}

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in securely"}
      </button>

      <div className="row">
        <button type="button" className="link" onClick={() => setView("auth")} data-tab="forgot">
          Forgot password?
        </button>
        <button type="button" className="link" onClick={() => setView("auth")} data-tab="signup">
          Create an account
        </button>
      </div>

      <div className="msg" hidden={msg.hidden} role="status" style={{ borderLeftColor: msg.error ? "var(--danger)" : "var(--green)" }}>
        {msg.text}
      </div>
    </form>
  );
}