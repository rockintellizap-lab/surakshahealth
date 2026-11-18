import { doc, setDoc, getDoc, updateDoc, serverTimestamp, getFirestore, collection, query, where, getDocs, orderBy, limit, addDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { EmergencyProfile, EmergencyProfileFormData, AuditLog } from "./profile";

const PROFILES_COLLECTION = "profiles";
const AUDIT_LOGS_COLLECTION = "audit_logs";

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

    // Admin status - default to pending for new profiles, preserve existing for updates
    status: existing.exists() ? (existing.data().status || "pending") : "pending",

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

// Audit logging
export async function logAudit(entry: Omit<AuditLog, "id" | "performedAt">): Promise<void> {
  const db = getDb();
  const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
  // Filter out undefined values
  const cleanEntry: Record<string, any> = {};
  Object.entries(entry).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanEntry[key] = value;
    }
  });
  await addDoc(logsRef, {
    ...cleanEntry,
    performedAt: serverTimestamp(),
  });
}

export async function logProfileAccess(profileId: string, action: "view" | "qr_scan" | "qr_download" | "qr_print" | "regenerate_qr" | "report_view" | "report_download" | "report_delete" | "report_replace", performedBy: string, details?: Record<string, any>): Promise<void> {
  await logAudit({
    profileId,
    action,
    performedBy,
    details: details || {},
  });
}

// Admin functions
export async function getAllProfiles(): Promise<(EmergencyProfile & { uid: string })[]> {
  const db = getDb();
  const profilesRef = collection(db, PROFILES_COLLECTION);
  const q = query(profilesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    // Default status to "pending" for backward compatibility
    return { ...data, status: data.status || "pending", uid: d.id } as EmergencyProfile & { uid: string };
  });
}

export async function getProfilesByStatus(status: "pending" | "approved" | "rejected"): Promise<(EmergencyProfile & { uid: string })[]> {
  const db = getDb();
  const profilesRef = collection(db, PROFILES_COLLECTION);
  const q = query(profilesRef, where("status", "==", status), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), uid: d.id } as EmergencyProfile & { uid: string }));
}

export async function approveProfile(uid: string, adminEmail: string): Promise<void> {
  const db = getDb();
  const profileRef = doc(db, PROFILES_COLLECTION, uid);
  await updateDoc(profileRef, {
    status: "approved",
    approvedAt: serverTimestamp(),
  });
  await logAudit({
    profileId: uid,
    action: "approve",
    performedBy: adminEmail,
  });
}

export async function rejectProfile(uid: string, adminEmail: string, reason: string): Promise<void> {
  const db = getDb();
  const profileRef = doc(db, PROFILES_COLLECTION, uid);
  await updateDoc(profileRef, {
    status: "rejected",
    rejectedAt: serverTimestamp(),
    rejectedReason: reason,
  });
  await logAudit({
    profileId: uid,
    action: "reject",
    performedBy: adminEmail,
    details: { reason },
  });
}

export async function logResponderAccess(profileId: string, details: {
  responderName: string;
  responderEmail: string;
  responderPhone: string;
  ip: string;
  userAgent: string;
}): Promise<void> {
  await logAudit({
    profileId,
    action: "responder_view",
    performedBy: details.responderEmail,
    details: {
      responderName: details.responderName,
      responderPhone: details.responderPhone,
      ip: details.ip,
      userAgent: details.userAgent,
    },
  });
}

export async function getAuditLogs(profileId?: string, limitCount = 100): Promise<(AuditLog & { id: string })[]> {
  const db = getDb();
  const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
  // Query without where clause to avoid composite index requirement
  // Filter by profileId client-side if provided
  const q = query(logsRef, orderBy("performedAt", "desc"), limit(limitCount * (profileId ? 10 : 1)));
  const snap = await getDocs(q);
  let logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog & { id: string }));
  
  if (profileId) {
    logs = logs.filter(log => log.profileId === profileId).slice(0, limitCount);
  }
  return logs;
}