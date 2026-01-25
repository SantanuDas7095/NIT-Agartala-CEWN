
"use client";

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import React, { createContext, useContext } from "react";
import FirebaseErrorListener from "@/components/FirebaseErrorListener";

const FirebaseContext = createContext<{
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
} | null>(null);

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth, storage }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirebaseApp() {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error("useFirebaseApp must be used within a FirebaseProvider");
    }
    return context.firebaseApp;
}

export function useFirestore() {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error("useFirestore must be used within a FirebaseProvider");
    }
    return context.firestore;
}

export function useAuth() {
    const context = useContext(FirebaseContext);
     if (!context) {
        throw new Error("useAuth must be used within a FirebaseProvider");
    }
    return context.auth;
}

export function useStorage() {
    const context = useContext(FirebaseContext);
    if (!context) {
      throw new Error('useStorage must be used within a FirebaseProvider');
    }
    return context.storage;
}
