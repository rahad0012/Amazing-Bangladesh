/**
 * Pure Firestore Database Initialization (Single App & Firestore Instance)
 * Separated from Firebase Auth & Storage so public portal routes never bundle Auth/Storage SDKs.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { doc, getDocFromServer, getFirestore, type Firestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const env = (import.meta as { env?: Record<string, string | undefined> }).env;
const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: env?.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: env?.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const FIRESTORE_DATABASE_ID: string =
  firebaseAppletConfig.firestoreDatabaseId || '(default)';

export const db: Firestore = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);

let connectionTestPromise: Promise<boolean> | null = null;

/**
 * Validate connectivity to Cloud Firestore on initial boot (deduplicated).
 */
export async function testConnection(): Promise<boolean> {
  if (!connectionTestPromise) {
    connectionTestPromise = getDocFromServer(doc(db, 'test', 'connection'))
      .then(() => true)
      .catch((error: unknown) => {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration: the client is offline.');
          return false;
        }
        return true;
      });
  }
  return connectionTestPromise;
}
