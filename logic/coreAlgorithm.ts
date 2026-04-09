// Generates a schedule recommendation based on the user's current schedule and preferences.

type DailySchedule = {
  [time: string]: string;
};

type WeeklySchedule = {
  [day: string]: DailySchedule;
};

type DayAfternoonInfo = {
  day: string;
  totalFreeSlots: number;
  largestConsecutiveSlots: number;
};

type ExerciseAssignment = {
  [day: string]: number;
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

function countFreeSlots(daySchedule: DailySchedule): number {
  return Object.values(daySchedule).filter((v) => v === '').length;
}

function findMealGroups(
  daySchedule: DailySchedule,
  wakeMinutes: number,
  sleepMinutes: number,
): { start: number; end: number }[] {
  const groups: { start: number; end: number }[] = [];
  let inMeal = false;
  let mealStart = 0;
  for (let t = wakeMinutes; t < sleepMinutes; t += 5) {
    const isMeal = daySchedule[minutesTo24HourString(t)] === 'Meal';
    if (isMeal && !inMeal) {
      inMeal = true;
      mealStart = t;
    } else if (!isMeal && inMeal) {
      groups.push({ start: mealStart, end: t });
      inMeal = false;
    }
  }
  if (inMeal) groups.push({ start: mealStart, end: sleepMinutes });
  return groups;
}

function getFreeBlocks(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
): { start: number; end: number }[] {
  const blocks: { start: number; end: number }[] = [];
  let blockStart: number | null = null;
  for (let t = fromMinutes; t < toMinutes; t += 5) {
    const isFree = daySchedule[minutesTo24HourString(t)] === '';
    if (isFree && blockStart === null) {
      blockStart = t;
    } else if (!isFree && blockStart !== null) {
      blocks.push({ start: blockStart, end: t });
      blockStart = null;
    }
  }
  if (blockStart !== null) blocks.push({ start: blockStart, end: toMinutes });
  return blocks;
}

function fillFreeWith(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
  label: string,
): void {
  for (let t = fromMinutes; t < toMinutes; t += 5) {
    const slot = minutesTo24HourString(t);
    if (daySchedule[slot] === '') daySchedule[slot] = label;
  }
}

function getAfternoonInfo(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
): Omit<DayAfternoonInfo, 'day'> {
  let totalFreeSlots = 0;
  let largestConsecutiveSlots = 0;
  let currentConsecutive = 0;
  for (let t = fromMinutes; t < toMinutes; t += 5) {
    if (daySchedule[minutesTo24HourString(t)] === '') {
      totalFreeSlots++;
      currentConsecutive++;
      largestConsecutiveSlots = Math.max(
        largestConsecutiveSlots,
        currentConsecutive,
      );
    } else {
      currentConsecutive = 0;
    }
  }
  return { totalFreeSlots, largestConsecutiveSlots };
}

function placeExerciseInAfternoon(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
  slotsToPlace: number,
): number {
  const TARGET_MINUTES = 16 * 60;
  const WINDOW_START = 16 * 60;
  const freeBlocks = getFreeBlocks(daySchedule, fromMinutes, toMinutes);

  const eligibleBlocks = freeBlocks.filter(
    (block) => (block.end - block.start) / 5 >= slotsToPlace,
  );

  let chosenBlock = eligibleBlocks.reduce(
    (best: { start: number; end: number; size: number } | null, block) => {
      const distance = Math.abs(block.start - TARGET_MINUTES);
      const bestDistance = best
        ? Math.abs(best.start - TARGET_MINUTES)
        : Infinity;
      return distance < bestDistance
        ? { ...block, size: (block.end - block.start) / 5 }
        : best;
    },
    null,
  );

  // Fallback: no block large enough → use largest available
  if (!chosenBlock) {
    chosenBlock = freeBlocks.reduce(
      (best: { start: number; end: number; size: number }, block) => {
        const size = (block.end - block.start) / 5;
        return size > best.size ? { ...block, size } : best;
      },
      { start: 0, end: 0, size: 0 },
    );
  }

  if (!chosenBlock || chosenBlock.size === 0) return 0;

  const actualSlots = Math.min(slotsToPlace, chosenBlock.size);
  const fillFromEnd = chosenBlock.start < WINDOW_START;

  if (fillFromEnd) {
    const fillStart = chosenBlock.end - actualSlots * 5;
    for (let i = 0; i < actualSlots; i++) {
      daySchedule[minutesTo24HourString(fillStart + i * 5)] = 'Exercise';
    }
  } else {
    for (let i = 0; i < actualSlots; i++) {
      daySchedule[minutesTo24HourString(chosenBlock.start + i * 5)] =
        'Exercise';
    }
  }

  return actualSlots;
}

function placeExerciseInEvening(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
  slotsToPlace: number,
): void {
  const freeBlocks = getFreeBlocks(daySchedule, fromMinutes, toMinutes);
  for (const block of freeBlocks) {
    const size = (block.end - block.start) / 5;
    if (size >= slotsToPlace) {
      for (let i = 0; i < slotsToPlace; i++) {
        daySchedule[minutesTo24HourString(block.start + i * 5)] = 'Exercise';
      }
      return;
    }
  }
  const largestBlock = freeBlocks.reduce(
    (best: { start: number; end: number; size: number }, block) => {
      const size = (block.end - block.start) / 5;
      return size > best.size ? { ...block, size } : best;
    },
    { start: 0, end: 0, size: 0 } as {
      start: number;
      end: number;
      size: number;
    },
  );
  if (largestBlock.size > 0) {
    const actualSlots = Math.min(slotsToPlace, largestBlock.size);
    for (let i = 0; i < actualSlots; i++) {
      daySchedule[minutesTo24HourString(largestBlock.start + i * 5)] =
        'Exercise';
    }
  }
}

export async function generateScheduleRecommendation(
  schedule: string,
  preferences: Record<string, number>,
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
          daySchedule[slotTime] = 'Meal';
        }
      }
    }
  }

  const EXERCISE_MIN_SLOTS = 9;
  const EXERCISE_MAX_SLOTS = 18;

  const totalWeeklyFreeSlots = weekdays.reduce(
    (sum, day) => sum + countFreeSlots(parsedSchedule[day]),
    0,
  );
  const totalExerciseSlots = Math.max(
    Math.round(totalWeeklyFreeSlots * (preferences.exercise / 100)),
    EXERCISE_MIN_SLOTS,
  );

  const afternoonInfos: DayAfternoonInfo[] = weekdays.map((day) => {
    const mealGroups = findMealGroups(
      parsedSchedule[day],
      wakeMinutes,
      sleepMinutes,
    );
    const lunch = mealGroups[1];
    const dinner = mealGroups[2];
    if (!lunch || !dinner)
      return { day, totalFreeSlots: 0, largestConsecutiveSlots: 0 };
    return {
      day,
      ...getAfternoonInfo(parsedSchedule[day], lunch.end, dinner.start),
    };
  });

  const eligibleDays = afternoonInfos
    .filter((d) => d.largestConsecutiveSlots >= EXERCISE_MIN_SLOTS)
    .sort((a, b) => b.largestConsecutiveSlots - a.largestConsecutiveSlots);

  const exerciseAssignment: ExerciseAssignment = {};
  let remainingBudget = totalExerciseSlots;

  for (const dayInfo of eligibleDays) {
    if (remainingBudget <= 0) break;
    const slotsForDay = Math.min(remainingBudget, EXERCISE_MAX_SLOTS);
    if (slotsForDay >= EXERCISE_MIN_SLOTS) {
      exerciseAssignment[dayInfo.day] = slotsForDay;
      remainingBudget -= slotsForDay;
    }
  }

  // Forced minimum fallback
  if (Object.keys(exerciseAssignment).length === 0) {
    const bestDay = [...afternoonInfos].sort(
      (a, b) => b.totalFreeSlots - a.totalFreeSlots,
    )[0];
    if (bestDay) exerciseAssignment[bestDay.day] = EXERCISE_MIN_SLOTS;
  }

  // --- Pass 2: Place exercise per day ---
  for (const day of weekdays) {
    const daySchedule = parsedSchedule[day];
    const [breakfast, lunch, dinner] = findMealGroups(
      daySchedule,
      wakeMinutes,
      sleepMinutes,
    );
    if (!breakfast || !lunch || !dinner) continue;

    if (exerciseAssignment[day]) {
      const placedInAfternoon = placeExerciseInAfternoon(
        daySchedule,
        lunch.end,
        dinner.start,
        exerciseAssignment[day],
      );
      const overflow = exerciseAssignment[day] - placedInAfternoon;
      if (overflow > 0)
        placeExerciseInEvening(daySchedule, dinner.end, sleepMinutes, overflow);
    }
  }

  return JSON.stringify(parsedSchedule, null, 2);
}
