
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useUser, useFirestore } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export function useAdmin() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user || !db) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const adminDocRef = doc(db, "roles_admin", user.uid);
      
      getDoc(adminDocRef)
        .then((adminDocSnap) => {
          setIsAdmin(adminDocSnap.exists());
        })
        .catch((error) => {
          const permissionError = new FirestorePermissionError({
            path: adminDocRef.path,
            operation: 'get',
          }, error);
          errorEmitter.emit('permission-error', permissionError);
          setIsAdmin(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    if (!userLoading) {
      checkAdminStatus();
    }
  }, [user, userLoading, db]);

  return { isAdmin, loading: userLoading || loading };
}
