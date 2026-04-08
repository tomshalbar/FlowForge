// Generates a schedule recommendation based on the user's current schedule and preferences.

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

export async function generateScheduleRecommendation(
  schedule: string,
  preferences: Record<string, string>,
  wakeSleepTime: { wakeUpTime: string; sleepTime: string } | undefined,
): Promise<string> {
  // preferences (study/exercise/relax) not yet implemented

  const wakeUpTime = wakeSleepTime?.wakeUpTime ?? '';
  const sleepTime = wakeSleepTime?.sleepTime ?? '';

  const scheduleWithEmptySlots = emptyTimeSlots(
    schedule,
    wakeUpTime,
    sleepTime,
  );

  const parsedSchedule: WeeklySchedule = JSON.parse(scheduleWithEmptySlots);
  const wakeMinutes = timeStringToMinutes(wakeUpTime);
  const sleepMinutes = timeStringToMinutes(sleepTime);
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  for (const day of weekdays) {
    const daySchedule = parsedSchedule[day];

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

  return JSON.stringify(parsedSchedule, null, 2);
}
