"use client";

import { useView } from "@/context/ViewContext";

const NAV_LINKS = [
  { view: "auth" as const, hash: "#signin", label: "Citizen login" },
  { view: "auth" as const, hash: "#signup", label: "Register" },
  { view: "auth" as const, hash: "#forgot", label: "Account recovery" },
];

export default function Nav() {
  const { setView } = useView();

  return (
    <nav className="gnav" aria-label="Primary">
      <div>
        {NAV_LINKS.map((link) => (
          <a
            key={link.hash}
            href={link.hash}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = link.hash.replace("#", "");
              setView(link.view);
            }}
            className="cur-link"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}