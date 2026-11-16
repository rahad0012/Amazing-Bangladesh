/**
 * Admins Collection Service (admins)
 * Manages authorized administrator records stored in Firestore `admins/{uid}`.
 * Read/Write operations are strictly enforced by Firestore Security Rules and backend verification.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import {
  COLLECTIONS,
  OperationType,
  deleteCollectionDoc,
  getCollectionDocById,
  handleFirestoreError,
  invalidateFirestoreCache,
  isPermissionDeniedError,
  isValidDocId,
  listCollectionDocs,
  stripUndefined
} from './firestoreBase';

export type AdminRole = 'admin' | 'super_admin' | 'editor';

export interface AdminRecord {
  uid: string;
  email: string;
  role: AdminRole;
  created_at?: string;
  updated_at?: string;
}

const VALID_ROLES: readonly AdminRole[] = ['admin', 'super_admin', 'editor'];

function normalizeAdminRecord(raw: Partial<AdminRecord> & { uid: string; email: string }): AdminRecord {
  const role: AdminRole = VALID_ROLES.includes(raw.role as AdminRole) ? (raw.role as AdminRole) : 'admin';
  return {
    uid: raw.uid.trim(),
    email: raw.email.trim().toLowerCase(),
    role,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}

export const AdminsService = {
  async getByUid(uid: string): Promise<AdminRecord | null> {
    if (!isValidDocId(uid)) return null;
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.ADMINS, uid));
      if (!docSnap.exists()) return null;
      const data = docSnap.data() as AdminRecord;
      return { ...data, uid: data.uid || docSnap.id };
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.ADMINS}/${uid}`);
      }
      throw error;
    }
  },

  async listAll(bypassCache: boolean = false): Promise<AdminRecord[]> {
    const docs = await listCollectionDocs<AdminRecord & { id?: string }>(COLLECTIONS.ADMINS, {
      publishedOnly: false,
      bypassCache
    });
    return docs.map(d => ({
      uid: d.uid || d.id || '',
      email: d.email || '',
      role: VALID_ROLES.includes(d.role) ? d.role : 'admin',
      created_at: d.created_at,
      updated_at: d.updated_at
    }));
  },

  async create(input: { uid: string; email: string; role?: AdminRole }): Promise<AdminRecord> {
    const uid = input.uid.trim();
    const email = input.email.trim().toLowerCase();
    if (!isValidDocId(uid)) {
      throw new Error('Firebase Auth UID must contain 1-128 alphanumeric, underscore, or hyphen characters.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
      throw new Error('Please enter a valid administrator email address.');
    }

    const now = new Date().toISOString();
    const payload = stripUndefined(
      normalizeAdminRecord({
        uid,
        email,
        role: input.role || 'admin',
        created_at: now,
        updated_at: now
      })
    );

    try {
      await setDoc(doc(db, COLLECTIONS.ADMINS, uid), payload);
      invalidateFirestoreCache(`col:${COLLECTIONS.ADMINS}`);
      invalidateFirestoreCache(`doc:${COLLECTIONS.ADMINS}:${uid}`);
      return payload;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.ADMINS}/${uid}`);
      }
      throw error;
    }
  },

  async update(uid: string, updates: { email?: string; role?: AdminRole }): Promise<AdminRecord> {
    const existing = await getCollectionDocById<AdminRecord & { id: string }>(COLLECTIONS.ADMINS, uid, {
      bypassCache: true
    });
    if (!existing) {
      throw new Error('Administrator record not found.');
    }

    const email = (updates.email ?? existing.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
      throw new Error('Please enter a valid administrator email address.');
    }

    const now = new Date().toISOString();
    const payload = stripUndefined(
      normalizeAdminRecord({
        uid,
        email,
        role: updates.role ?? existing.role,
        created_at: existing.created_at || now,
        updated_at: now
      })
    );

    try {
      await setDoc(doc(db, COLLECTIONS.ADMINS, uid), payload, { merge: true });
      invalidateFirestoreCache(`col:${COLLECTIONS.ADMINS}`);
      invalidateFirestoreCache(`doc:${COLLECTIONS.ADMINS}:${uid}`);
      return payload;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.ADMINS}/${uid}`);
      }
      throw error;
    }
  },

  async remove(uid: string, currentActorUid?: string): Promise<void> {
    if (currentActorUid && uid === currentActorUid) {
      throw new Error('You cannot remove your own active administrator record.');
    }
    await deleteCollectionDoc(COLLECTIONS.ADMINS, uid);
  }
};
