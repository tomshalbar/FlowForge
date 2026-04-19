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

type ActivityBudget = {
  exercise: number;
  study: number;
};

type DayExerciseInfo = {
  day: string;
  share: number;
  actuallyPlaced: number;
  afternoonFrom: number;
  afternoonTo: number;
  eveningFrom: number;
  eveningTo: number;
  morningFrom: number;
  morningTo: number;
};

type DayStudyInfo = {
  day: string;
  morningFrom: number;
  morningTo: number;
  afternoonFrom: number;
  afternoonTo: number;
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
        durationSlots: 6,
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
  preferences: {
    study: number;
    exerciseDays: number;
    exerciseDuration: number;
  },
): ActivityBudget {
  const totalFreeSlots = weekdays.reduce(
    (sum, day) => sum + countFreeSlots(parsedSchedule[day]),
    0,
  );

  return {
    study: Math.round(totalFreeSlots * (preferences.study / 100)),
    exercise: preferences.exerciseDays * (preferences.exerciseDuration / 5),
  };
}

// --- Step 3: Fill Mandatory Relax Periods ---

// Places all forced relax periods at their minimum durations regardless of budget,
// but still decrements budget.relax to accurately track total relax slots placed.
function placeAllForcedRelax(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
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
    fillFreeWith(daySchedule, wakeMinutes, breakfast.start, 'Relax');

    // Post-breakfast
    for (let i = 0; i < POST_BREAKFAST_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(breakfast.end + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }

    // Post-lunch
    for (let i = 0; i < POST_LUNCH_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(lunch.end + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }

    // Post-dinner
    for (let i = 0; i < POST_DINNER_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(dinner.end + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }

    // Pre-sleep
    for (let i = 0; i < PRE_SLEEP_RELAX_SLOTS; i++) {
      const slot = minutesTo24HourString(
        sleepMinutes - PRE_SLEEP_RELAX_SLOTS * 5 + i * 5,
      );
      if (daySchedule[slot] === '') daySchedule[slot] = 'Relax';
    }
  }
}

// --- Step 4: Place exercise ---

// Determines how many exercise slots each eligible weekday gets based on the budget,
// prioritising days with the most consecutive free afternoon time.
function placeExercise(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
  budget: ActivityBudget,
  preferences: {
    study: number;
    exerciseDays: number;
    exerciseDuration: number;
  },
): void {
  const EXERCISE_MIN_SLOTS = 6; // 30 min
  const numDays = Math.min(preferences.exerciseDays, 5);
  const slotsPerDay = preferences.exerciseDuration / 5;

  // Gather afternoon info for each weekday
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

  // Select top numDays eligible days by largest consecutive afternoon free slots
  const selectedDays = [...afternoonInfos]
    .filter((d) => d.largestConsecutiveSlots >= EXERCISE_MIN_SLOTS)
    .sort((a, b) => b.largestConsecutiveSlots - a.largestConsecutiveSlots)
    .slice(0, numDays);

  // Forced minimum fallback if no eligible days
  if (selectedDays.length === 0) {
    const bestDay = [...afternoonInfos].sort(
      (a, b) => b.totalFreeSlots - a.totalFreeSlots,
    )[0];
    if (bestDay) selectedDays.push(bestDay);
  }

  // Build per-day exercise infos
  const dayExerciseInfos: DayExerciseInfo[] = selectedDays.map((info) => {
    const mealGroups = findMealGroups(
      parsedSchedule[info.day],
      wakeMinutes,
      sleepMinutes,
    );
    const [breakfast, lunch, dinner] = mealGroups;
    return {
      day: info.day,
      share: slotsPerDay,
      actuallyPlaced: 0,
      afternoonFrom: lunch ? lunch.end : wakeMinutes,
      afternoonTo: dinner ? dinner.start : sleepMinutes,
      eveningFrom: dinner ? dinner.end : wakeMinutes,
      eveningTo: sleepMinutes,
      morningFrom: breakfast ? breakfast.end : wakeMinutes,
      morningTo: lunch ? lunch.start : sleepMinutes,
    };
  });

  const TARGET_MINUTES = 16 * 60;
  const WINDOW_START = 16 * 60;

  // Helper: place slots into a block, returns number placed
  const placeInBlock = (
    daySchedule: DailySchedule,
    blockStart: number,
    blockEnd: number,
    slotsNeeded: number,
    fromEnd: boolean,
  ): number => {
    const blockSize = (blockEnd - blockStart) / 5;
    const toPlace = Math.min(slotsNeeded, blockSize);
    const fillStart = fromEnd ? blockEnd - toPlace * 5 : blockStart;
    for (let i = 0; i < toPlace; i++) {
      const slot = minutesTo24HourString(fillStart + i * 5);
      if (daySchedule[slot] === '') daySchedule[slot] = 'Exercise';
    }
    return toPlace;
  };

  // Helper: fill remaining slots across a window, returns updated remaining
  const fillWindow = (
    daySchedule: DailySchedule,
    fromMinutes: number,
    toMinutes: number,
    remaining: number,
    fromEnd: boolean,
  ): number => {
    const blocks = getFreeBlocks(daySchedule, fromMinutes, toMinutes).filter(
      (block) => (block.end - block.start) / 5 >= EXERCISE_MIN_SLOTS,
    );

    for (const block of blocks) {
      if (remaining < EXERCISE_MIN_SLOTS) return remaining;
      const placed = placeInBlock(
        daySchedule,
        block.start,
        block.end,
        remaining,
        fromEnd,
      );
      budget.exercise -= placed;
      remaining -= placed;
    }
    return remaining;
  };

  // --- Main placement loop: one day at a time ---
  for (const info of dayExerciseInfos) {
    const daySchedule = parsedSchedule[info.day];
    let remaining = info.share;

    // Afternoon pass 1 — best single block closest to 4 PM
    const afternoonBlocks = getFreeBlocks(
      daySchedule,
      info.afternoonFrom,
      info.afternoonTo,
    ).filter((block) => (block.end - block.start) / 5 >= EXERCISE_MIN_SLOTS);

    if (afternoonBlocks.length > 0) {
      const chosenBlock = afternoonBlocks.reduce(
        (best: { start: number; end: number } | null, block) => {
          const distance = Math.abs(block.start - TARGET_MINUTES);
          const bestDist = best
            ? Math.abs(best.start - TARGET_MINUTES)
            : Infinity;
          return distance < bestDist ? block : best;
        },
        null,
      )!;

      const fromEnd = chosenBlock.start < WINDOW_START;
      const placed = placeInBlock(
        daySchedule,
        chosenBlock.start,
        chosenBlock.end,
        remaining,
        fromEnd,
      );
      budget.exercise -= placed;
      info.actuallyPlaced += placed;
      remaining -= placed;
    }

    if (remaining < EXERCISE_MIN_SLOTS) continue;

    // Afternoon pass 2 — remaining afternoon blocks chronologically, forwards
    remaining = fillWindow(
      daySchedule,
      info.afternoonFrom,
      info.afternoonTo,
      remaining,
      false,
    );
    if (remaining < EXERCISE_MIN_SLOTS) {
      info.actuallyPlaced += info.share - remaining;
      continue;
    }

    // Evening pass — forwards
    remaining = fillWindow(
      daySchedule,
      info.eveningFrom,
      info.eveningTo,
      remaining,
      false,
    );
    if (remaining < EXERCISE_MIN_SLOTS) {
      info.actuallyPlaced += info.share - remaining;
      continue;
    }

    // Morning pass — backwards from lunch
    remaining = fillWindow(
      daySchedule,
      info.morningFrom,
      info.morningTo,
      remaining,
      true,
    );

    // Discard any remaining below 30 min
  }

  // --- Extension pass: extend existing exercise blocks into adjacent free slots ---
  // Collect all free blocks adjacent to exercise across all selected days, smallest first
  type AdjacentBlock = {
    day: string;
    start: number;
    end: number;
    size: number;
  };

  const adjacentBlocks: AdjacentBlock[] = [];

  for (const info of dayExerciseInfos) {
    const daySchedule = parsedSchedule[info.day];
    const allWindows = [
      { from: info.afternoonFrom, to: info.afternoonTo },
      { from: info.eveningFrom, to: info.eveningTo },
      { from: info.morningFrom, to: info.morningTo },
    ];

    for (const window of allWindows) {
      const freeBlocks = getFreeBlocks(daySchedule, window.from, window.to);
      for (const block of freeBlocks) {
        const slotBefore = minutesTo24HourString(block.start - 5);
        const slotAfter = minutesTo24HourString(block.end);
        const adjacentToExercise =
          daySchedule[slotBefore] === 'Exercise' ||
          daySchedule[slotAfter] === 'Exercise';

        if (adjacentToExercise) {
          adjacentBlocks.push({
            day: info.day,
            start: block.start,
            end: block.end,
            size: (block.end - block.start) / 5,
          });
        }
      }
    }
  }

  // Sort by size ascending — smallest adjacent blocks first
  adjacentBlocks.sort((a, b) => a.size - b.size);

  for (const block of adjacentBlocks) {
    if (budget.exercise <= 0) break;
    const daySchedule = parsedSchedule[block.day];

    const slotAfter = minutesTo24HourString(block.end);
    const exerciseIsAfter = daySchedule[slotAfter] === 'Exercise';

    if (exerciseIsAfter) {
      // Fill backwards from block end so partial fills stay connected to exercise
      for (
        let t = block.end - 5;
        t >= block.start && budget.exercise > 0;
        t -= 5
      ) {
        const slot = minutesTo24HourString(t);
        if (daySchedule[slot] === '') {
          daySchedule[slot] = 'Exercise';
          budget.exercise -= 1;
        }
      }
    } else {
      // Fill forwards from block start
      for (let t = block.start; t < block.end && budget.exercise > 0; t += 5) {
        const slot = minutesTo24HourString(t);
        if (daySchedule[slot] === '') {
          daySchedule[slot] = 'Exercise';
          budget.exercise -= 1;
        }
      }
    }
  }
}

// --- Step 5: Fill remaining slots ---

// Distributes remaining study budget equally across weekdays, prioritising afternoon
// then morning then evening windows. Redistributes unabsorbed slots by extending
// existing study blocks on days with least study placed. Fills all leftover slots with relax.
function fillRemainingSlots(
  parsedSchedule: WeeklySchedule,
  weekdays: string[],
  wakeMinutes: number,
  sleepMinutes: number,
  budget: ActivityBudget,
): void {
  const STUDY_MIN_SLOTS = 6; // 30 min

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

    const morningFrom = breakfast ? breakfast.end : wakeMinutes;
    const morningTo = lunch ? lunch.start : sleepMinutes;
    const afternoonFrom = lunch ? lunch.end : wakeMinutes;
    const afternoonTo = dinner ? dinner.start : sleepMinutes;
    const eveningFrom = dinner ? dinner.end : wakeMinutes;
    const eveningTo = sleepMinutes;

    return {
      day,
      morningFrom,
      morningTo,
      afternoonFrom,
      afternoonTo,
      eveningFrom,
      eveningTo,
      share: perDayBase + (index < remainder ? 1 : 0),
      actuallyPlaced: 0,
    };
  });

  // --- 2b: Pass 1 - Fill each day's share, afternoon first then morning then evening ---
  for (const info of dayStudyInfos) {
    const daySchedule = parsedSchedule[info.day];
    let remaining = info.share;

    const windows = [
      { from: info.afternoonFrom, to: info.afternoonTo },
      { from: info.morningFrom, to: info.morningTo },
      { from: info.eveningFrom, to: info.eveningTo },
    ];

    for (const window of windows) {
      if (remaining < STUDY_MIN_SLOTS) break;

      const blocks = getFreeBlocks(daySchedule, window.from, window.to).filter(
        (block) => (block.end - block.start) / 5 >= STUDY_MIN_SLOTS,
      );

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
    const sortedByPlaced = [...dayStudyInfos].sort(
      (a, b) => a.actuallyPlaced - b.actuallyPlaced,
    );

    for (const info of sortedByPlaced) {
      if (redistributionPool <= 0) break;
      const daySchedule = parsedSchedule[info.day];

      let studyStart: number | null = null;
      let studyEnd: number | null = null;

      const windows = [
        { from: info.afternoonFrom, to: info.afternoonTo },
        { from: info.morningFrom, to: info.morningTo },
        { from: info.eveningFrom, to: info.eveningTo },
      ];

      outer: for (const window of windows) {
        for (let t = window.from; t < window.to; t += 5) {
          if (daySchedule[minutesTo24HourString(t)] === 'Study') {
            if (studyStart === null) studyStart = t;
            studyEnd = t + 5;
          } else if (studyStart !== null) {
            break outer;
          }
        }
      }

      if (studyStart === null || studyEnd === null) continue;

      // Extend at end first
      while (redistributionPool >= STUDY_MIN_SLOTS) {
        const slot = minutesTo24HourString(studyEnd);
        const inAfternoon =
          studyEnd >= info.afternoonFrom && studyEnd < info.afternoonTo;
        const inMorning =
          studyEnd >= info.morningFrom && studyEnd < info.morningTo;
        const inEvening =
          studyEnd >= info.eveningFrom && studyEnd < info.eveningTo;
        if (
          (inAfternoon || inMorning || inEvening) &&
          daySchedule[slot] === ''
        ) {
          daySchedule[slot] = 'Study';
          budget.study -= 1;
          info.actuallyPlaced += 1;
          redistributionPool -= 1;
          studyEnd += 5;
        } else break;
      }

      // Then extend at start — only if enough pool remains
      while (redistributionPool >= STUDY_MIN_SLOTS) {
        const prevTime = studyStart - 5;
        const slot = minutesTo24HourString(prevTime);
        const inAfternoon =
          prevTime >= info.afternoonFrom && prevTime < info.afternoonTo;
        const inMorning =
          prevTime >= info.morningFrom && prevTime < info.morningTo;
        const inEvening =
          prevTime >= info.eveningFrom && prevTime < info.eveningTo;
        if (
          (inAfternoon || inMorning || inEvening) &&
          daySchedule[slot] === ''
        ) {
          daySchedule[slot] = 'Study';
          budget.study -= 1;
          info.actuallyPlaced += 1;
          redistributionPool -= 1;
          studyStart -= 5;
        } else break;
      }
    }
  }

  // --- 2d: Morning study overflow — backwards from lunch ---
  if (redistributionPool >= STUDY_MIN_SLOTS) {
    for (const info of dayStudyInfos) {
      if (redistributionPool < STUDY_MIN_SLOTS) break;
      const daySchedule = parsedSchedule[info.day];

      // Count contiguous free slots scanning backwards from lunch
      let contiguous = 0;
      for (let t = info.morningTo - 5; t >= info.morningFrom; t -= 5) {
        if (daySchedule[minutesTo24HourString(t)] === '') contiguous++;
        else break;
      }

      // Only fill if there are enough contiguous slots
      if (contiguous < STUDY_MIN_SLOTS) continue;

      for (
        let t = info.morningTo - 5;
        t >= info.morningFrom && redistributionPool >= STUDY_MIN_SLOTS;
        t -= 5
      ) {
        const slot = minutesTo24HourString(t);
        if (daySchedule[slot] === '') {
          daySchedule[slot] = 'Study';
          budget.study -= 1;
          redistributionPool -= 1;
        }
      }
    }
  }

  // --- Step 3: Absorb short gaps adjacent to study first, then exercise ---
  for (const day of weekdays) {
    const daySchedule = parsedSchedule[day];
    const freeBlocks = getFreeBlocks(daySchedule, wakeMinutes, sleepMinutes);

    for (const block of freeBlocks) {
      const blockSlots = (block.end - block.start) / 5;
      if (blockSlots >= STUDY_MIN_SLOTS) continue;

      const slotBefore = minutesTo24HourString(block.start - 5);
      const slotAfter = minutesTo24HourString(block.end);

      const adjacentToStudy =
        daySchedule[slotBefore] === 'Study' ||
        daySchedule[slotAfter] === 'Study';
      const adjacentToExercise =
        daySchedule[slotBefore] === 'Exercise' ||
        daySchedule[slotAfter] === 'Exercise';

      if (adjacentToStudy) {
        for (let t = block.start; t < block.end; t += 5) {
          daySchedule[minutesTo24HourString(t)] = 'Study';
          budget.study -= 1;
        }
      } else if (adjacentToExercise) {
        for (let t = block.start; t < block.end; t += 5) {
          daySchedule[minutesTo24HourString(t)] = 'Exercise';
          budget.exercise -= 1;
        }
      }
    }

    // Step 4: Fill all remaining empty slots with relax
    fillFreeWith(daySchedule, wakeMinutes, sleepMinutes, 'Relax');
  }
}

// --- Main export ---

// Orchestrates the full schedule generation: fills empty slots, places meals,
// computes activity budgets, places exercise, then fills the afternoon.
export async function generateScheduleRecommendation(
  schedule: string,
  preferences: {
    study: number;
    exerciseDays: number;
    exerciseDuration: number;
  },
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

  placeAllForcedRelax(parsedSchedule, weekdays, wakeMinutes, sleepMinutes);

  placeExercise(
    parsedSchedule,
    weekdays,
    wakeMinutes,
    sleepMinutes,
    budget,
    preferences,
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
