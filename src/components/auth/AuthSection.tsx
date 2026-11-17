"use client";

import { useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

type TabName = "signin" | "signup" | "forgot";

const TABS: Record<TabName, { id: string; label: string }> = {
  signin: { id: "t-signin", label: "Sign in" },
  signup: { id: "t-signup", label: "Sign up" },
  forgot: { id: "t-forgot", label: "Forgot password" },
};

function getInitialTab(): TabName {
  if (typeof window === "undefined") return "signin";
  const hash = window.location.hash.slice(1);
  if (hash && Object.keys(TABS).includes(hash)) {
    return hash as TabName;
  }
  return "signin";
}

export default function AuthSection() {
  const [activeTab, setActiveTab] = useState<TabName>(getInitialTab);

  return (
    <section className="card">
      <div className="tabs" role="tablist" aria-label="Account">
        {Object.entries(TABS).map(([key, tab]) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              role="tab"
              id={tab.id}
              aria-controls={`p-${key}`}
              aria-selected={active}
              onClick={() => {
                setActiveTab(key as TabName);
                if (typeof history !== "undefined") {
                  history.replaceState(null, "", `#${key}`);
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <SignInForm active={activeTab === "signin"} />
      <SignUpForm active={activeTab === "signup"} />
      <ForgotPasswordForm active={activeTab === "forgot"} />
    </section>
  );
}