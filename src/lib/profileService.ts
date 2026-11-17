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
    bloodGroup: data.bloodGroup,
    dateOfBirth: data.dateOfBirth,
    allergies: data.allergies,
    emergencyContact: data.emergencyContact,
    abhaId: data.abhaId || "",
    aadhaarLast4: data.aadhaarLast4 || "",
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