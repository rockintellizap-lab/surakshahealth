import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export async function uploadReportFile(userId: string, file: File): Promise<UploadedFile> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File type not allowed. Use PDF, JPG, or PNG.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be under 5 MB.");
  }

  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage not initialized");

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `reports/${userId}/${timestamp}_${sanitizedName}`;
  const fileRef = ref(storage, path);

  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    name: file.name,
    url: downloadURL,
    size: file.size,
    type: file.type,
  };
}

export async function deleteReportFile(url: string): Promise<void> {
  const storage = getFirebaseStorage();
  if (!storage) return;

  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
}

export function validateReportFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Use PDF, JPG, or PNG." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File must be under 5 MB." };
  }
  return { valid: true };
}