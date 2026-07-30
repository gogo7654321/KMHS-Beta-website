// Firebase web configuration, loaded from the environment so no keys live in
// the repo. Provide NEXT_PUBLIC_FIREBASE_CONFIG as the web app config JSON:
//   - Local dev:   .env.local            (gitignored)
//   - App Hosting: a Secret Manager secret referenced in apphosting.yaml
//
// Firebase App Hosting also auto-injects FIREBASE_WEBAPP_CONFIG at runtime for
// server-side code, which is used as a fallback.

type FirebaseWebConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
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

  return {};
}

export const firebaseConfig = loadFirebaseConfig();
