import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

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

export async function getNameAndAge(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    return {
      name: userData.name ?? '',
      age: userData.age ?? '',
    };
  }
}

export async function getWakeUpAndSleepTime(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    return {
      wakeUpTime: userData.wake_up_time ?? '',
      sleepTime: userData.sleep_time ?? '',
    };
  }
}

export async function getPreferences(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    return {
      exercise: userData.exercise_preference,
      study: userData.study_preference,
      relax: userData.relax_preference,
    };
  }
}

export async function getSchedule(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    return userData.schedule;
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
      console.log('presonal info successfully written or updated!');
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
      console.log('user preferences successfully written or updated!');
    })
    .catch((error) => {
      console.error('Error writing or updating document: ', error);
    });
}

export async function updateUserSchedule(userId: string, schedule: string) {
  const docRef = doc(db, 'users', userId);
  const data = {
    schedule: schedule,
  };
  await setDoc(docRef, data, { merge: true })
    .then(() => {
      console.log('Schedule successfully written or updated!');
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
      console.log('onboarding status successfully written or updated!');
    })
    .catch((error) => {
      console.error('Error writing or updating document: ', error);
    });
}
