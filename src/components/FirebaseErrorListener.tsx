'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const SUPER_ADMIN_UID = 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Shows a toast notification instead of crashing the app via error boundary.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Suppress toast entirely for super admin — these are timing artifacts
      // from queries firing before guards settle, not real permission issues.
      if (user?.uid === SUPER_ADMIN_UID) {
        console.warn('[Firestore] Suppressed expected denial for super admin:', error.request.path);
        return;
      }

      console.warn('[Firestore] Permission denied:', error.request.path);

      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: `You don't have permission to access this data. Please contact an administrator.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, user?.uid]);

  // This component renders nothing.
  return null;
}
