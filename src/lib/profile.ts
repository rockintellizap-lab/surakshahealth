import { Timestamp } from "firebase/firestore";

export interface EmergencyProfile {
  // Section A: Personal information
  fn?: string;
  mn?: string;
  ln?: string;
  gender?: string;
  dob?: string;
  bg?: string;
  wt?: string;
  lang?: string;
  email?: string;
  mob?: string;
  abha?: string;
  aadhaar?: string;
  addr?: string;
  photo?: string;

  // Section B: Emergency contacts
  pc_name?: string;
  pc_rel?: string;
  pc_mob?: string;
  pc_alt?: string;
  pc_email?: string;
  pc_addr?: string;
  sc_name?: string;
  sc_rel?: string;
  sc_mob?: string;
  sc_alt?: string;
  sc_email?: string;
  sc_addr?: string;

  // Section C: Medical history
  ill?: string;
  chronic?: string;
  ltt?: string;
  inf?: string;

  // Section D: Allergies (JSON string)
  allergies?: string;

  // Section E: Medication history (JSON string)
  medications?: string;

  // Section F: Vaccinations
  vaccinations?: string;

  // Section G: Medical reports (JSON string of UploadedFile array)
  reports?: string;

  // Legacy fields for backward compatibility
  bloodGroup: string;
  dateOfBirth: string;
  emergencyContact: string;
  abhaId?: string;
  aadhaarLast4?: string;

  // Admin approval status
  status?: "pending" | "approved" | "rejected";
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  rejectedReason?: string;

  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface AuditLog {
  id?: string;
  profileId: string;
  action: "view" | "qr_scan" | "qr_download" | "qr_print" | "approve" | "reject" | "regenerate_qr" | "responder_view" | "report_view" | "report_download" | "report_delete" | "report_replace";
  performedBy: string; // email or uid of admin/system
  performedAt: Timestamp;
  details?: Record<string, any>;
}

export interface EmergencyProfileFormData {
  // Section A
  fn?: string;
  mn?: string;
  ln?: string;
  gender?: string;
  dob?: string;
  bg?: string;
  wt?: string;
  lang?: string;
  email?: string;
  mob?: string;
  abha?: string;
  aadhaar?: string;
  addr?: string;
  photo?: string;

  // Section B
  pc_name?: string;
  pc_rel?: string;
  pc_mob?: string;
  pc_alt?: string;
  pc_email?: string;
  pc_addr?: string;
  sc_name?: string;
  sc_rel?: string;
  sc_mob?: string;
  sc_alt?: string;
  sc_email?: string;
  sc_addr?: string;

  // Section C
  ill?: string;
  chronic?: string;
  ltt?: string;
  inf?: string;

  // Section D (JSON)
  allergies?: string;

  // Section E (JSON)
  medications?: string;

  // Section F
  vaccinations?: string;

  // Section G (JSON)
  reports?: string;

  // Legacy
  bloodGroup: string;
  dateOfBirth: string;
  emergencyContact: string;
  abhaId?: string;
  aadhaarLast4?: string;
}

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
] as const;

export const GENDERS = [
  "Male", "Female", "Other", "Prefer not to say"
] as const;

export const LANGS = [
  "English", "हिन्दी", "ਪੰਜਾਬੀ", "Other"
] as const;

export const RELATIONS = [
  "Self", "Spouse", "Parent", "Child", "Sibling", "Friend", "Other"
] as const;

export const SEVERITY = [
  "Mild", "Moderate", "Severe", "Life-threatening"
] as const;

export const REPORT_TYPES = [
  "Lab Report", "Imaging", "Prescription", "Discharge Summary", "Other"
] as const;

export function validateABHA(abha: string): boolean {
  return /^\d{14}$/.test(abha.replace(/\D/g, ""));
}

export function validateAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar.replace(/\D/g, ""));
}

export function validateMobile(mob: string): boolean {
  return /^(\+?91)?[6-9]\d{9}$/.test(mob.replace(/[\s-]/g, ""));
}

export function wordCount(text: string): number {
  const s = text.trim();
  return s ? s.split(/\s+/).length : 0;
}