// Firebase web configuration.
//
// These are PUBLIC client-side identifiers — they ship in the browser bundle no
// matter what, and access is protected by Firestore/Storage security rules, not
// by keeping them secret (see https://firebase.google.com/docs/projects/api-keys).
//
// Resolution order:
//   1. NEXT_PUBLIC_FIREBASE_CONFIG env var (e.g. .env.local for local dev)
//   2. FIREBASE_WEBAPP_CONFIG, which App Hosting auto-injects (server-side)
//   3. The committed fallback below — guarantees the client always initializes.

type FirebaseWebConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const FALLBACK_CONFIG: FirebaseWebConfig = {
  apiKey: 'AIzaSyAM8UvIJVMBONoElzR8rlWiGTqN-SupXOE',
  authDomain: 'studio-8652128073-34949.firebaseapp.com',
  projectId: 'studio-8652128073-34949',
  storageBucket: 'studio-8652128073-34949.firebasestorage.app',
  messagingSenderId: '995999291856',
  appId: '1:995999291856:web:8c9095806b561bd831c1d5',
};

function loadFirebaseConfig(): FirebaseWebConfig {
  const explicit = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (explicit) {
    try {
      return JSON.parse(explicit);
    } catch (e) {
      console.error('Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG:', e);
    }
  }

  // Firebase App Hosting auto-injects the linked web app config (server-side).
  const autoInjected = process.env.FIREBASE_WEBAPP_CONFIG;
  if (autoInjected) {
    try {
      return JSON.parse(autoInjected);
    } catch (e) {
      console.error('Failed to parse FIREBASE_WEBAPP_CONFIG:', e);
    }
  }

  return FALLBACK_CONFIG;
}

export const firebaseConfig = loadFirebaseConfig();
