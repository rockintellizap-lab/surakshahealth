"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, getAuth } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string>; // returns redirect path
  signUp: (email: string, password: string) => Promise<string>; // returns redirect path
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@surakshahealth.in";

  const getAuthInstance = () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth not initialized");
    return auth;
  };

  const getRedirectPath = (email: string | null | undefined): string => {
    return email === ADMIN_EMAIL ? "admin" : "profile";
  };

  const signIn = async (email: string, password: string): Promise<string> => {
    await signInWithEmailAndPassword(getAuthInstance(), email, password);
    return getRedirectPath(email);
  };

  const signUp = async (email: string, password: string): Promise<string> => {
    await createUserWithEmailAndPassword(getAuthInstance(), email, password);
    return getRedirectPath(email);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(getAuthInstance(), email);
  };

  const logout = async () => {
    await signOut(getAuthInstance());
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}