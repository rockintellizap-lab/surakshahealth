import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function createFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!appInstance) {
    appInstance = createFirebaseApp();
  }
  return appInstance;
}

function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getApp());
  }
  return authInstance;
}

function getDbInstance(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getApp());
  }
  return dbInstance;
}

export const app = typeof window !== "undefined" ? getApp() : null;
export const auth = typeof window !== "undefined" ? getAuthInstance() : null;
export const db = typeof window !== "undefined" ? getDbInstance() : null;

export function getFirebaseApp(): FirebaseApp | null {
  return typeof window !== "undefined" ? getApp() : null;
}

export function getFirebaseAuth(): Auth | null {
  return typeof window !== "undefined" ? getAuthInstance() : null;
}

export function getFirebaseDb(): Firestore | null {
  return typeof window !== "undefined" ? getDbInstance() : null;
}