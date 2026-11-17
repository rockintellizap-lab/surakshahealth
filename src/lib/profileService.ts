import { doc, setDoc, getDoc, updateDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { EmergencyProfile, EmergencyProfileFormData } from "./profile";

const PROFILES_COLLECTION = "profiles";

function getDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export async function saveProfile(userId: string, data: EmergencyProfileFormData): Promise<void> {
  const db = getDb();
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  const existing = await getDoc(profileRef);

  const profileData: EmergencyProfile = {
    // Section A
    fn: data.fn || "",
    mn: data.mn || "",
    ln: data.ln || "",
    gender: data.gender || "",
    dob: data.dob || "",
    bg: data.bg || "",
    wt: data.wt || "",
    lang: data.lang || "",
    email: data.email || "",
    mob: data.mob || "",
    abha: data.abha || "",
    aadhaar: data.aadhaar || "",
    addr: data.addr || "",
    photo: data.photo || "",

    // Section B
    pc_name: data.pc_name || "",
    pc_rel: data.pc_rel || "",
    pc_mob: data.pc_mob || "",
    pc_alt: data.pc_alt || "",
    pc_email: data.pc_email || "",
    pc_addr: data.pc_addr || "",
    sc_name: data.sc_name || "",
    sc_rel: data.sc_rel || "",
    sc_mob: data.sc_mob || "",
    sc_alt: data.sc_alt || "",
    sc_email: data.sc_email || "",
    sc_addr: data.sc_addr || "",

    // Section C
    ill: data.ill || "",
    chronic: data.chronic || "",
    ltt: data.ltt || "",
    inf: data.inf || "",

    // Section D (JSON)
    allergies: data.allergies || "[]",

    // Section E (JSON)
    medications: data.medications || "[]",

    // Section F
    vaccinations: data.vaccinations || "",

    // Section G (JSON)
    reports: data.reports || "[]",

    // Legacy fields
    bloodGroup: data.bloodGroup || data.bg || "",
    dateOfBirth: data.dateOfBirth || data.dob || "",
    emergencyContact: data.emergencyContact || `${data.pc_name || ""} - ${data.pc_mob || ""}`,
    abhaId: data.abhaId || data.abha || "",
    aadhaarLast4: data.aadhaarLast4 || data.aadhaar?.slice(-4) || "",

    updatedAt: serverTimestamp() as any,
    createdAt: existing.exists() ? (existing.data().createdAt as any) : serverTimestamp() as any,
  };

  await setDoc(profileRef, profileData, { merge: true });
}

export async function getProfile(userId: string): Promise<EmergencyProfile | null> {
  const db = getDb();
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  const snap = await getDoc(profileRef);
  return snap.exists() ? (snap.data() as EmergencyProfile) : null;
}

export async function updateProfile(userId: string, data: Partial<EmergencyProfileFormData>): Promise<void> {
  const db = getDb();
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  await updateDoc(profileRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}