import { describe, it, expect } from "vitest";
import {
  validateSignIn,
  validateSignUp,
  validateForgotPassword,
  formatAbha,
  formatAadhaar,
  PASSWORD_RULES,
} from "@/types/forms";

describe("Form validation", () => {
  describe("validateSignIn", () => {
    it("returns errors for empty fields", () => {
      const errors = validateSignIn({ email: "", password: "" });
      expect(errors.email).toBe("Enter your email ID.");
      expect(errors.password).toBe("Enter your password.");
    });

    it("returns error for invalid email", () => {
      const errors = validateSignIn({ email: "invalid", password: "password123" });
      expect(errors.email).toBe("Enter a valid email ID.");
    });

    it("returns no errors for valid data", () => {
      const errors = validateSignIn({ email: "test@example.com", password: "password123" });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("validateSignUp", () => {
    it("returns errors for empty required fields", () => {
      const errors = validateSignUp({
        email: "",
        abha: "",
        aadhaar: "",
        password: "",
        password2: "",
        consent: false,
      });
      expect(errors.email).toBe("Enter your email ID.");
      expect(errors.password).toBe("Create a password.");
      expect(errors.password2).toBe("Retype your password.");
    });

    it("returns error for invalid email", () => {
      const errors = validateSignUp({
        email: "invalid",
        abha: "",
        aadhaar: "",
        password: "Password123!",
        password2: "Password123!",
        consent: true,
      });
      expect(errors.email).toBe("Enter a valid email ID.");
    });

    it("returns error for invalid ABHA length", () => {
      const errors = validateSignUp({
        email: "test@example.com",
        abha: "1234567890123",
        aadhaar: "",
        password: "Password123!",
        password2: "Password123!",
        consent: true,
      });
      expect(errors.abha).toBe("ABHA ID must have 14 digits.");
    });

    it("returns error for invalid Aadhaar length", () => {
      const errors = validateSignUp({
        email: "test@example.com",
        abha: "",
        aadhaar: "12345678901",
        password: "Password123!",
        password2: "Password123!",
        consent: true,
      });
      expect(errors.aadhaar).toBe("Aadhaar number must have 12 digits.");
    });

    it("returns error for weak password", () => {
      const errors = validateSignUp({
        email: "test@example.com",
        abha: "",
        aadhaar: "",
        password: "weak",
        password2: "weak",
        consent: true,
      });
      expect(errors.password).toBe("Password does not meet all the rules above.");
    });

    it("returns error for mismatched passwords", () => {
      const errors = validateSignUp({
        email: "test@example.com",
        abha: "",
        aadhaar: "",
        password: "Password123!",
        password2: "Different123!",
        consent: true,
      });
      expect(errors.password2).toBe("Passwords do not match.");
    });

    it("returns no errors for valid data", () => {
      const errors = validateSignUp({
        email: "test@example.com",
        abha: "91-8840-2219-4401",
        aadhaar: "1234 5678 9012",
        password: "Password123!",
        password2: "Password123!",
        consent: true,
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("validateForgotPassword", () => {
    it("returns error for empty email", () => {
      const errors = validateForgotPassword({ email: "" });
      expect(errors.email).toBe("Enter your registered email.");
    });

    it("returns error for invalid email", () => {
      const errors = validateForgotPassword({ email: "invalid" });
      expect(errors.email).toBe("Enter a valid email ID.");
    });

    it("returns no errors for valid email", () => {
      const errors = validateForgotPassword({ email: "test@example.com" });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("formatAbha", () => {
    it("formats 14 digits with dashes", () => {
      expect(formatAbha("91884022194401")).toBe("91-8840-2219-4401");
    });

    it("handles partial input", () => {
      expect(formatAbha("918840")).toBe("91-8840");
    });

    it("strips non-digits", () => {
      expect(formatAbha("91-8840-2219-4401")).toBe("91-8840-2219-4401");
    });
  });

  describe("formatAadhaar", () => {
    it("formats 12 digits with spaces", () => {
      expect(formatAadhaar("123456789012")).toBe("1234 5678 9012");
    });

    it("handles partial input", () => {
      expect(formatAadhaar("12345678")).toBe("1234 5678");
    });

    it("strips non-digits", () => {
      expect(formatAadhaar("1234 5678 9012")).toBe("1234 5678 9012");
    });
  });

  describe("PASSWORD_RULES", () => {
    it("has 6 rules", () => {
      expect(PASSWORD_RULES).toHaveLength(6);
    });

    it("each rule has name, test, and message", () => {
      PASSWORD_RULES.forEach((rule) => {
        expect(rule).toHaveProperty("name");
        expect(rule).toHaveProperty("test");
        expect(rule).toHaveProperty("message");
        expect(typeof rule.test).toBe("function");
      });
    });
  });
});