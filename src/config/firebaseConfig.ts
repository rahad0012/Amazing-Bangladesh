/**
 * Safe Public Firebase Configuration & Service Initialization
 * Technology Stack: Firebase Authentication, Firebase Firestore, Firebase Storage
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Safe environment or public config for client-side Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForPublicClientBuild",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "starlit-airship-r07pf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "starlit-airship-r07pf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "starlit-airship-r07pf.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "283579461638",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:283579461638:web:f1470a1cbd364ff0915fd2"
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Provisioned Firestore Database ID
export const FIRESTORE_DATABASE_ID = "ai-studio-bangladeshtouris-f1470a1c-bd36-4ff0-915f-d2c78f8a06c2";

// Initialize Firestore with specific database ID
export const db = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);

// Initialize Firebase Authentication & Google Provider
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Storage
export const storage = getStorage(firebaseApp);

export default firebaseApp;
