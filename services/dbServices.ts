import { auth, db } from '@/config/firebase';
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

type DailySchedule = {
  [time: string]: string;
};

type WeeklySchedule = {
  [day: string]: DailySchedule;
};

function timeStringToMinutes(time: string): number {
  const [timePart, meridiem] = time.trim().split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  if (meridiem === 'AM') {
    if (hours === 12) hours = 0;
  } else if (meridiem === 'PM') {
    if (hours !== 12) hours += 12;
  }

  return hours * 60 + minutes;
}

function minutesTo24HourString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

function generateTimeSlots(wakeUpTime: string, sleepTime: string): string[] {
  const wakeMinutes = timeStringToMinutes(wakeUpTime);
  const sleepMinutes = timeStringToMinutes(sleepTime);

  const slots: string[] = [];

  for (let current = wakeMinutes; current < sleepMinutes; current += 5) {
    slots.push(minutesTo24HourString(current));
  }

  return slots;
}

function emptyTimeSlots(
  scheduleString: string,
  wakeUpTime: string,
  sleepTime: string,
): string {
  const schedule: WeeklySchedule = JSON.parse(scheduleString);
  const allTimeSlots = generateTimeSlots(wakeUpTime, sleepTime);
  const weekdays = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  for (const day of weekdays) {
    const currentDaySchedule = schedule[day] || {};
    const completedDaySchedule: DailySchedule = {};

    for (const time of allTimeSlots) {
      completedDaySchedule[time] = currentDaySchedule[time] ?? '';
    }

    schedule[day] = completedDaySchedule;
  }

  return JSON.stringify(schedule, null, 2);
}

function generateSchedule(
  scheduleString: string,
  wakeUpTime: string,
  sleepTime: string,
): string {
  const scheduleWithEmptySlots = emptyTimeSlots(
    scheduleString,
    wakeUpTime,
    sleepTime,
  );

  const schedule: WeeklySchedule = JSON.parse(scheduleWithEmptySlots);
  const wakeMinutes = timeStringToMinutes(wakeUpTime);
  const sleepMinutes = timeStringToMinutes(sleepTime);
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  for (const day of weekdays) {
    const daySchedule = schedule[day];

    const meals = [
      {
        durationSlots: 5,
        searchStart: wakeMinutes + 30,
        searchEnd: Math.min(wakeMinutes + 120, 11 * 60),
        targetStart: wakeMinutes + 30,
      },
      {
        durationSlots: 8,
        searchStart: Math.max(11 * 60 + 30, wakeMinutes),
        searchEnd: Math.min(15 * 60, sleepMinutes),
        targetStart: 12 * 60,
      },
      {
        durationSlots: 9,
        searchStart: Math.max(17 * 60 + 30, wakeMinutes),
        searchEnd: Math.min(21 * 60, sleepMinutes),
        targetStart: 18 * 60 + 30,
      },
    ];

    for (const meal of meals) {
      let bestStart: number | null = null;
      let bestDistance = Infinity;

      for (
        let start = meal.searchStart;
        start <= meal.searchEnd - meal.durationSlots * 5;
        start += 5
      ) {
        let canPlaceMeal = true;

        for (let offset = 0; offset < meal.durationSlots; offset++) {
          const slotTime = minutesTo24HourString(start + offset * 5);

          if (!(slotTime in daySchedule) || daySchedule[slotTime] !== '') {
            canPlaceMeal = false;
            break;
          }
        }

        if (canPlaceMeal) {
          const distance = Math.abs(start - meal.targetStart);

          if (distance < bestDistance) {
            bestDistance = distance;
            bestStart = start;
          }
        }
      }

      if (bestStart !== null) {
        for (let offset = 0; offset < meal.durationSlots; offset++) {
          const slotTime = minutesTo24HourString(bestStart + offset * 5);
          daySchedule[slotTime] = 'meal';
        }
      }
    }
  }

  return JSON.stringify(schedule, null, 2);
}

export async function updateUserSchedule(userId: string, schedule: string) {
  const docRef = doc(db, 'users', userId);

  const userDocSnap = await getDoc(docRef);
  const userData = userDocSnap.data();
  const wakeUpTime = userData.wake_up_time;
  const sleepTime = userData.sleep_time;

  const updatedSchedule = {
    schedule: generateSchedule(schedule, wakeUpTime, sleepTime),
  };

  await setDoc(docRef, updatedSchedule, { merge: true })
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
