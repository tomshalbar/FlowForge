import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';

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

export async function getEmailNameTimes() {
  const curUser = auth.currentUser;
  if (curUser) {
    const curUserId = curUser.uid;
    const userDocRef = doc(db, 'users', curUserId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const name = userData.name ? userData.name : '';
      const age = userData.age ? userData.age : '';
      const wakeUpTime = userData.wake_up_time ? userData.wake_up_time : '';
      const sleepTime = userData.sleep_time ? userData.sleep_time : '';

      const returnData: Map<string, string> = new Map([
        ['name', name],
        ['age', age],
        ['wakeUpTime', wakeUpTime],
        ['sleepTime', sleepTime],
      ]);

      return returnData;
    }
  }
}

export async function updateUserPersonalInfo(
  name: string,
  age: string,
  wakeUpTime: string,
  sleepTime: string,
  userId: string,
) {
  const docRef = doc(db, 'users', userId);
  const data = {
    name: name,
    age: parseInt(age, 10),
    wake_up_time: wakeUpTime,
    sleep_time: sleepTime,
  };
  await setDoc(docRef, data, { merge: true })
    .then(() => {
      console.log('Document successfully written or updated!');
    })
    .catch((error) => {
      console.error('Error writing or updating document: ', error);
    });
}

export async function updateUserPreferences(
  exercise: number,
  study: number,
  relax: number,
  userId: string,
) {
  const docRef = doc(db, 'users', userId);
  const data = {
    exercise_preference: exercise,
    study_preference: study,
    relax_preference: relax,
  };
  await setDoc(docRef, data, { merge: true })
    .then(() => {
      console.log('Document successfully written or updated!');
    })
    .catch((error) => {
      console.error('Error writing or updating document: ', error);
    });
}

export async function setDoneOnboarding(userId: string) {
  const docRef = doc(db, 'users', userId);
  const data = {
    completed_onboarding: true,
  };
  await setDoc(docRef, data, { merge: true })
    .then(() => {
      console.log('Document successfully written or updated!');
    })
    .catch((error) => {
      console.error('Error writing or updating document: ', error);
    });
}
