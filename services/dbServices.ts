import { db } from '@/config/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export interface UserProfile {
  email: string;
  completed_onboarding: boolean;

  name?: string;
  age?: number;
  wake_up_time?: string;
  sleep_time?: string;

  exercise_preference?: number;
  study_preference?: number;
  relax_preference?: number;

  class_schedule?: Record<string, string>;

  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function registerBaseUser(email: string, uid: string) {
  const userData: UserProfile = {
    email: email,
    completed_onboarding: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    return await setDoc(doc(db, 'users', uid), userData);
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e;
  }
}
