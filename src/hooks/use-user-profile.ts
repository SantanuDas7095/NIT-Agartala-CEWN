
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useUser, useFirestore } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export function useUserProfile() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }
    if (!user || !db) {
      setLoading(false);
      setUserProfile(null);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, "userProfile", user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, 
      (error) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setUserProfile(null);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userLoading, db]);

  return { userProfile, loading: userLoading || loading };
}
