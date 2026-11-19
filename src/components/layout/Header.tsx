"use client";

import { useState } from "react";
import LogoSvg from "@/components/common/LogoSvg";

export default function Header() {
  const [lang, setLang] = useState("EN");

  return (
    <>
      <div className="tri" />
      <div className="util">
        <div>
          <span>🇮🇳 CSR initiative by NIPER, ABDM aligned portal for citizens</span>
          <span className="fs">
            <a href="#main">Skip to main content</a> | Text size{" "}
            <button
              type="button"
              data-fs="-1"
              aria-label="Decrease text size"
              onClick={() => {
                document.documentElement.style.fontSize = "87.5%";
              }}
            >
              A−
            </button>
            <button
              type="button"
              data-fs="0"
              aria-label="Normal text size"
              onClick={() => {
                document.documentElement.style.fontSize = "";
              }}
            >
              A
            </button>
            <button
              type="button"
              data-fs="1"
              aria-label="Increase text size"
              onClick={() => {
                document.documentElement.style.fontSize = "112.5%";
              }}
            >
              A+
            </button>
          </span>
        </div>
      </div>
      <header>
        <div className="brand">
          <div className="logo">
            <LogoSvg />
          </div>
          <div className="bt">
            <b>
              SurakshaHealth India
              <em className="badge">CSR initiative by NIPER, ABDM aligned portal for citizens</em>
            </b>
            <span className="tag">
              National Emergency Health Locker & Trauma Access Portal • UX4G 3.0 & ABDM Aligned
            </span>
          </div>
          <div className="tools">
            <div className="lang" role="group" aria-label="Language">
              <button
                type="button"
                className={lang === "EN" ? "on" : ""}
                aria-pressed={lang === "EN"}
                onClick={() => setLang("EN")}
              >
                EN
              </button>
              <button
                type="button"
                aria-pressed={lang === "HI"}
                onClick={() => setLang("HI")}
              >
                हिन्दी
              </button>
              <button
                type="button"
                aria-pressed={lang === "PA"}
                onClick={() => setLang("PA")}
              >
                ਪੰਜਾਬੀ
              </button>
            </div>
            <button type="button" className="wa">
              💬 WhatsApp / SMS Alerts <i>1</i>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}