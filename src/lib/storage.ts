import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const FALLBACK_MAX_SIZE = 300 * 1024; // 300 KB for base64 in Firestore
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  isBase64?: boolean;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadReportFile(userId: string, file: File): Promise<UploadedFile> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File type not allowed. Use PDF, JPG, or PNG.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be under 5 MB.");
  }

  // Use base64 fallback directly (Spark plan - no Firebase Storage)
  // Firebase Storage requires Blaze (paid) plan
  console.log("Using base64 fallback (Spark plan)");
  
  // Fallback: base64 in Firestore (size limited)
  if (file.size > FALLBACK_MAX_SIZE) {
    throw new Error(`File too large for fallback storage (max ${FALLBACK_MAX_SIZE / 1024} KB). Use smaller files or upgrade Firebase plan.`);
  }

  const base64 = await fileToBase64(file);
  return {
    name: file.name,
    url: base64,
    size: file.size,
    type: file.type,
    isBase64: true,
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
  // Base64 fallback limit (Spark plan)
  if (file.size > FALLBACK_MAX_SIZE) {
    return { valid: false, error: `File too large for free tier (max ${FALLBACK_MAX_SIZE / 1024} KB).` };
  }
  return { valid: true };
}