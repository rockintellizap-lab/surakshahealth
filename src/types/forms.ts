export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  abha: string;
  aadhaar: string;
  password: string;
  password2: string;
  consent: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

export interface ValidationRule {
  name: string;
  test: (value: string) => boolean;
  message: string;
}

export const PASSWORD_RULES: ValidationRule[] = [
  { name: "len", test: (p: string) => p.length >= 8, message: "At least 8 characters" },
  { name: "up", test: (p: string) => /[A-Z]/.test(p), message: "One uppercase letter" },
  { name: "lo", test: (p: string) => /[a-z]/.test(p), message: "One lowercase letter" },
  { name: "num", test: (p: string) => /\d/.test(p), message: "One number" },
  { name: "sp", test: (p: string) => /[^A-Za-z0-9\s]/.test(p), message: "One special character" },
  { name: "ns", test: (p: string) => p.length > 0 && !/\s/.test(p), message: "No spaces" },
];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function formatAbha(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 6),
    digits.slice(6, 10),
    digits.slice(10, 14),
  ].filter(Boolean);
  return parts.join("-");
}

export function formatAadhaar(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return (digits.match(/.{1,4}/g) || []).join(" ");
}

export function validateSignIn(data: SignInFormData): FormErrors<SignInFormData> {
  const errors: FormErrors<SignInFormData> = {};

  if (!data.email) {
    errors.email = "Enter your email ID.";
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = "Enter a valid email ID.";
  }

  if (!data.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function validateSignUp(data: SignUpFormData): FormErrors<SignUpFormData> {
  const errors: FormErrors<SignUpFormData> = {};

  if (!data.email) {
    errors.email = "Enter your email ID.";
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = "Enter a valid email ID.";
  }

  const abhaDigits = data.abha.replace(/\D/g, "");
  if (abhaDigits && abhaDigits.length !== 14) {
    errors.abha = "ABHA ID must have 14 digits.";
  }

  const aadhaarDigits = data.aadhaar.replace(/\D/g, "");
  if (aadhaarDigits && aadhaarDigits.length !== 12) {
    errors.aadhaar = "Aadhaar number must have 12 digits.";
  }

  if (!data.password) {
    errors.password = "Create a password.";
  } else if (!PASSWORD_RULES.every((rule) => rule.test(data.password))) {
    errors.password = "Password does not meet all the rules above.";
  }

  if (!data.password2) {
    errors.password2 = "Retype your password.";
  } else if (data.password !== data.password2) {
    errors.password2 = "Passwords do not match.";
  }

  return errors;
}

export function validateForgotPassword(data: ForgotPasswordFormData): FormErrors<ForgotPasswordFormData> {
  const errors: FormErrors<ForgotPasswordFormData> = {};

  if (!data.email) {
    errors.email = "Enter your registered email.";
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = "Enter a valid email ID.";
  }

  return errors;
}