/**
 * Pure Firestore Database Initialization
 * Separated from Firebase Auth & Storage so public portal routes never bundle Auth/Storage SDKs.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const FIRESTORE_DATABASE_ID =
  firebaseAppletConfig.firestoreDatabaseId ||
  'ai-studio-bangladeshtouris-f1470a1c-bd36-4ff0-915f-d2c78f8a06c2';

export const db = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);
