import { Timestamp } from "firebase/firestore";

export interface EmergencyProfile {
  bloodGroup: string;
  dateOfBirth: string;
  allergies: string;
  emergencyContact: string;
  abhaId?: string;
  aadhaarLast4?: string;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface EmergencyProfileFormData {
  bloodGroup: string;
  dateOfBirth: string;
  allergies: string;
  emergencyContact: string;
  abhaId?: string;
  aadhaarLast4?: string;
}

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
] as const;