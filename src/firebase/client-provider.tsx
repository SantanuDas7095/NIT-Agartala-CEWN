
"use client";

import React from "react";
import { FirebaseProvider, firebaseApp, firestore, auth, storage } from ".";

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseProvider
            firebaseApp={firebaseApp}
            firestore={firestore}
            auth={auth}
            storage={storage}
        >
            {children}
        </FirebaseProvider>
    );
}
