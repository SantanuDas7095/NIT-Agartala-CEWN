
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client-side only component that should be used in development
// It will listen for permission errors and throw them to be caught by the Next.js overlay
function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // Throwing the error here will cause it to be caught by Next.js's error overlay
      // This is useful for debugging permission errors in development
      // The error includes a JSON payload with the context of the Firestore request
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  return null;
}

// Only include this component in development
export default process.env.NODE_ENV === 'development' ? FirebaseErrorListener : () => null;
