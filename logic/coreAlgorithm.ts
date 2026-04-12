// Generates a schedule recommendation based on the user's current schedule and preferences.

// --- Types ---

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

type ActivityBudget = {
  exercise: number;
  study: number;
  relax: number;
};

type DayStudyInfo = {
  day: string;
  morningFrom: number;
  morningTo: number;
  eveningFrom: number;
  eveningTo: number;
  share: number;
  actuallyPlaced: number;
};

// --- Utils ---

// Converts a 12-hour time string (e.g. "8:00 AM") to total minutes from midnight.
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

// Converts total minutes from midnight to a 24-hour time string (e.g. "08:00").
function minutesTo24HourString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

// Generates a list of 24-hour time strings in 5-minute increments between wake and sleep.
function generateTimeSlots(wakeUpTime: string, sleepTime: string): string[] {
  const wakeMinutes = timeStringToMinutes(wakeUpTime);
  const sleepMinutes = timeStringToMinutes(sleepTime);

  const slots: string[] = [];

  for (let current = wakeMinutes; current < sleepMinutes; current += 5) {
    slots.push(minutesTo24HourString(current));
  }

  return slots;
}

// Fills in all 5-minute time slots between wake and sleep with empty strings for days
// that are missing slots, ensuring every day has a complete slot map.
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

// Returns the number of empty slots in a day's schedule.
function countFreeSlots(daySchedule: DailySchedule): number {
  return Object.values(daySchedule).filter((v) => v === '').length;
}

// Scans a day's schedule and returns the start/end times of each contiguous meal block.
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

// Returns the start/end times of each contiguous block of empty slots within a time range.
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

// Fills all empty slots in a time range with the given label.
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

// Returns the total free slots and largest contiguous free block in a time range.
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

// --- Step 1: Place meals ---

// Places breakfast, lunch, and dinner blocks for every weekday, choosing the slot
// closest to each meal's target time that is still free.
function placeMeals(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
): void {
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
          daySchedule[minutesTo24HourString(bestStart + offset * 5)] = 'Meal';
        }
      }
    }
  }
}

// --- Step 2: Compute activity budget ---

// Computes how many slots each activity gets across the week based on preference
// percentages applied to total free slots remaining after meals are placed.
function computeBudget(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  preferences: Record<string, number>,
): ActivityBudget {
  const totalFreeSlots = weekdays.reduce(
    (sum, day) => sum + countFreeSlots(parsedSchedule[day]),
    0,
  );

  return {
    exercise: Math.round(totalFreeSlots * (preferences.exercise / 100)),
    study: Math.round(totalFreeSlots * (preferences.study / 100)),
    relax: Math.round(totalFreeSlots * (preferences.relax / 100)),
  };
}

// --- Step 3: Place exercise ---

// Determines how many exercise slots each eligible weekday gets based on the budget,
// prioritising days with the most consecutive free afternoon time.
function assignExerciseSlots(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
  budget: ActivityBudget,
): ExerciseAssignment {
  const EXERCISE_MIN_SLOTS = 9;
  const EXERCISE_MAX_SLOTS = 18;

  const totalExerciseSlots = Math.max(budget.exercise, EXERCISE_MIN_SLOTS);

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

  // Forced minimum: no budget override, placement will decrement budget into negative.
  if (Object.keys(exerciseAssignment).length === 0) {
    const bestDay = [...afternoonInfos].sort(
      (a, b) => b.totalFreeSlots - a.totalFreeSlots,
    )[0];
    if (bestDay) exerciseAssignment[bestDay.day] = EXERCISE_MIN_SLOTS;
  }

  return exerciseAssignment;
}

// Places an exercise block in the afternoon, preferring the free block closest to 4 PM.
// Fills from the end of the block if it starts before 4 PM, pushing exercise later.
function placeExerciseInAfternoon(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
  slotsToPlace: number,
  budget: ActivityBudget,
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

  // Fallback: no block large enough → use largest available.
  if (!chosenBlock) {
    chosenBlock = freeBlocks.reduce(
      (best: { start: number; end: number; size: number }, block) => {
        const size = (block.end - block.start) / 5;
        return size > best.size ? { ...block, size } : best;
      },
      { start: 0, end: 0, size: 0 },
    );
  }

  if (!chosenBlock || chosenBlock.size === 0) return slotsToPlace;

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

  budget.exercise -= actualSlots;
  return slotsToPlace - actualSlots; // overflow
}

// Places overflow exercise slots in the evening when the afternoon couldn't fit them all.
// Prefers the first block large enough to fit the overflow, falls back to largest available.
function placeExerciseInEvening(
  daySchedule: DailySchedule,
  fromMinutes: number,
  toMinutes: number,
  slotsToPlace: number,
  budget: ActivityBudget,
): void {
  const freeBlocks = getFreeBlocks(daySchedule, fromMinutes, toMinutes);

  for (const block of freeBlocks) {
    const size = (block.end - block.start) / 5;
    if (size >= slotsToPlace) {
      for (let i = 0; i < slotsToPlace; i++) {
        daySchedule[minutesTo24HourString(block.start + i * 5)] = 'Exercise';
      }
      budget.exercise -= slotsToPlace;
      return;
    }
  }

  const largestBlock = freeBlocks.reduce(
    (best: { start: number; end: number; size: number }, block) => {
      const size = (block.end - block.start) / 5;
      return size > best.size ? { ...block, size } : best;
    },
    { start: 0, end: 0, size: 0 },
  );

  if (largestBlock.size > 0) {
    const actualSlots = Math.min(slotsToPlace, largestBlock.size);
    for (let i = 0; i < actualSlots; i++) {
      daySchedule[minutesTo24HourString(largestBlock.start + i * 5)] =
        'Exercise';
    }
    budget.exercise -= actualSlots;
  }
}

// Assigns and places all exercise blocks across the week, with overflow going to the evening.
function placeExercise(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
  budget: ActivityBudget,
): void {
  const exerciseAssignment = assignExerciseSlots(
    parsedSchedule,
    weekdays,
    wakeMinutes,
    sleepMinutes,
    budget,
  );

  for (const day of weekdays) {
    const daySchedule = parsedSchedule[day];
    const [, lunch, dinner] = findMealGroups(
      daySchedule,
      wakeMinutes,
      sleepMinutes,
    );
    if (!lunch || !dinner) continue;

    if (exerciseAssignment[day]) {
      const overflow = placeExerciseInAfternoon(
        daySchedule,
        lunch.end,
        dinner.start,
        exerciseAssignment[day],
        budget,
      );
      if (overflow > 0) {
        placeExerciseInEvening(
          daySchedule,
          dinner.end,
          sleepMinutes,
          overflow,
          budget,
        );
      }
    }
  }
}

// --- Step 4: Fill Mandatory Relax Periods ---

// Places all forced relax periods at their minimum durations regardless of budget,
// but still decrements budget.relax to accurately track total relax slots placed.
function placeAllForcedRelax(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
  budget: ActivityBudget,
): void {
  const POST_BREAKFAST_RELAX_SLOTS = 3; // 15 min
  const POST_LUNCH_RELAX_SLOTS = 6; // 30 min
  const POST_DINNER_RELAX_SLOTS = 6; // 30 min
  const PRE_SLEEP_RELAX_SLOTS = 12; // 60 min (includes routine)

  for (const day of weekdays) {
    const daySchedule = parsedSchedule[day];
    const [breakfast, lunch, dinner] = findMealGroups(
      daySchedule,
      wakeMinutes,
      sleepMinutes,
    );
    if (!breakfast || !lunch || !dinner) continue;

    // Pre-breakfast — fill entire window
    const preBreakfastSlots = (breakfast.start - wakeMinutes) / 5;
    fillFreeWith(daySchedule, wakeMinutes, breakfast.start, 'Relax');
    budget.relax -= preBreakfastSlots;

    // Post-breakfast
    for (let i = 0; i < POST_BREAKFAST_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(breakfast.end + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }
    budget.relax -= POST_BREAKFAST_RELAX_SLOTS;

    // Post-lunch
    for (let i = 0; i < POST_LUNCH_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(lunch.end + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }
    budget.relax -= POST_LUNCH_RELAX_SLOTS;

    // Post-dinner
    for (let i = 0; i < POST_DINNER_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(dinner.end + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }
    budget.relax -= POST_DINNER_RELAX_SLOTS;

    // Pre-sleep
    for (let i = 0; i < PRE_SLEEP_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(
        sleepMinutes - PRE_SLEEP_RELAX_SLOTS * 5 + i * 5,
      );
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }
    budget.relax -= PRE_SLEEP_RELAX_SLOTS;
  }
}

// --- Step 5: Fill remaining slots ---

// Distributes remaining study budget equally across weekdays, prioritising morning
// then evening windows. Redistributes unabsorbed slots by extending existing study
// blocks on days with least study placed. Fills all leftover slots with relax.
function fillRemainingSlots(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
  budget: ActivityBudget,
): void {
  const STUDY_MIN_SLOTS = 6; // 30 min

  // --- Entry condition: exercise + relax budgets exhausted, fill all with study ---
  if (budget.exercise + budget.relax <= 0) {
    for (const day of weekdays) {
      fillFreeWith(parsedSchedule[day], wakeMinutes, sleepMinutes, 'Study');
    }
    return;
  }

  // --- 2a: Compute per-day shares ---
  const perDayBase = Math.floor(budget.study / weekdays.length);
  const remainder = budget.study % weekdays.length;

  const dayStudyInfos: DayStudyInfo[] = weekdays.map((day, index) => {
    const daySchedule = parsedSchedule[day];
    const [breakfast, lunch, dinner] = findMealGroups(
      daySchedule,
      wakeMinutes,
      sleepMinutes,
    );

    // Windows naturally exclude forced relax since those slots are already filled
    const morningFrom = breakfast ? breakfast.end : wakeMinutes;
    const morningTo = lunch ? lunch.start : sleepMinutes;
    const eveningFrom = dinner ? dinner.end : wakeMinutes;
    const eveningTo = sleepMinutes;

    return {
      day,
      morningFrom,
      morningTo,
      eveningFrom,
      eveningTo,
      share: perDayBase + (index < remainder ? 1 : 0),
      actuallyPlaced: 0,
    };
  });

  // --- 2b: Pass 1 - Fill each day's share, morning first then evening ---
  for (const info of dayStudyInfos) {
    const daySchedule = parsedSchedule[info.day];
    let remaining = info.share;

    const windows = [
      { from: info.morningFrom, to: info.morningTo },
      { from: info.eveningFrom, to: info.eveningTo },
    ];

    for (const window of windows) {
      if (remaining < STUDY_MIN_SLOTS) break;

      const blocks = getFreeBlocks(daySchedule, window.from, window.to)
        .filter((block) => (block.end - block.start) / 5 >= STUDY_MIN_SLOTS)
        .sort((a, b) => b.end - b.start - (a.end - a.start)); // largest first

      for (const block of blocks) {
        if (remaining < STUDY_MIN_SLOTS) break;
        const blockSlots = (block.end - block.start) / 5;
        const toPlace = Math.min(remaining, blockSlots);
        if (toPlace < STUDY_MIN_SLOTS) break;
        fillFreeWith(
          daySchedule,
          block.start,
          block.start + toPlace * 5,
          'Study',
        );
        budget.study -= toPlace;
        info.actuallyPlaced += toPlace;
        remaining -= toPlace;
      }
    }
  }

  // --- 2c: Pass 2 - Redistribute unabsorbed slots by extending existing study blocks ---
  let redistributionPool = dayStudyInfos.reduce(
    (sum, info) => sum + (info.share - info.actuallyPlaced),
    0,
  );

  if (redistributionPool > 0) {
    // Days with least study placed get redistribution first
    const sortedByPlaced = [...dayStudyInfos].sort(
      (a, b) => a.actuallyPlaced - b.actuallyPlaced,
    );

    for (const info of sortedByPlaced) {
      if (redistributionPool <= 0) break;
      const daySchedule = parsedSchedule[info.day];

      // Find existing study block in morning then evening
      let studyStart: number | null = null;
      let studyEnd: number | null = null;

      const windows = [
        { from: info.morningFrom, to: info.morningTo },
        { from: info.eveningFrom, to: info.eveningTo },
      ];

      outer: for (const window of windows) {
        for (let t = window.from; t < window.to; t += 5) {
          if (daySchedule[minutesTo24HourString(t)] === 'Study') {
            if (studyStart === null) studyStart = t;
            studyEnd = t + 5;
          } else if (studyStart !== null) {
            break outer; // found end of study block
          }
        }
      }

      if (studyStart === null || studyEnd === null) continue;

      // Extend at end first
      while (redistributionPool > 0) {
        const slot = minutesTo24HourString(studyEnd);
        const inMorning = studyEnd < info.morningTo;
        const inEvening =
          studyEnd >= info.eveningFrom && studyEnd < info.eveningTo;
        if ((inMorning || inEvening) && daySchedule[slot] === '') {
          daySchedule[slot] = 'Study';
          budget.study -= 1;
          info.actuallyPlaced += 1;
          redistributionPool -= 1;
          studyEnd += 5;
        } else {
          break;
        }
      }

      // Then extend at start
      while (redistributionPool > 0) {
        const prevTime = studyStart - 5;
        const slot = minutesTo24HourString(prevTime);
        const inMorning = prevTime >= info.morningFrom;
        const inEvening =
          prevTime >= info.eveningFrom && prevTime < info.eveningTo;
        if ((inMorning || inEvening) && daySchedule[slot] === '') {
          daySchedule[slot] = 'Study';
          budget.study -= 1;
          info.actuallyPlaced += 1;
          redistributionPool -= 1;
          studyStart -= 5;
        } else {
          break;
        }
      }
    }
  }

  // --- Step 3: Fill all remaining empty slots with relax ---
  for (const day of weekdays) {
    fillFreeWith(parsedSchedule[day], wakeMinutes, sleepMinutes, 'Relax');
  }
}

// --- Main export ---

// Orchestrates the full schedule generation: fills empty slots, places meals,
// computes activity budgets, places exercise, then fills the afternoon.
export async function generateScheduleRecommendation(
  schedule: string,
  preferences: Record<string, number>,
  wakeSleepTime: { wakeUpTime: string; sleepTime: string } | undefined,
): Promise<string> {
  const wakeUpTime = wakeSleepTime?.wakeUpTime ?? '';
  const sleepTime = wakeSleepTime?.sleepTime ?? '';

  const parsedSchedule: WeeklySchedule = JSON.parse(
    emptyTimeSlots(schedule, wakeUpTime, sleepTime),
  );
  const wakeMinutes = timeStringToMinutes(wakeUpTime);
  const sleepMinutes = timeStringToMinutes(sleepTime);
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  placeMeals(parsedSchedule, weekdays, wakeMinutes, sleepMinutes);

  const budget = computeBudget(parsedSchedule, weekdays, preferences);

  placeExercise(parsedSchedule, weekdays, wakeMinutes, sleepMinutes, budget);

  placeAllForcedRelax(
    parsedSchedule,
    weekdays,
    wakeMinutes,
    sleepMinutes,
    budget,
  );

  fillRemainingSlots(
    parsedSchedule,
    weekdays,
    wakeMinutes,
    sleepMinutes,
    budget,
  );

  return JSON.stringify(parsedSchedule, null, 2);
}
