/**
 * Safe Public Firebase Configuration & Service Initialization
 * Technology Stack: Firebase Authentication, Firebase Firestore, Firebase Storage
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

import firebaseAppletConfig from '../../firebase-applet-config.json';

// Safe environment or public config for client-side Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Provisioned Firestore Database ID
export const FIRESTORE_DATABASE_ID = firebaseAppletConfig.firestoreDatabaseId || "ai-studio-bangladeshtouris-f1470a1c-bd36-4ff0-915f-d2c78f8a06c2";

// Initialize Firestore with specific database ID
export const db = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);

// Initialize Firebase Authentication & Google Provider
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Storage
export const storage = getStorage(firebaseApp);

export default firebaseApp;
