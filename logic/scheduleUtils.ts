// format date
export const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

// get day key
export const getTodayKey = () => {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[new Date().getDay()];
};

// convert "13:55" -> "1:55 PM"
export const formatTime = (time: string) => {
  const [hourStr, min] = time.split(':');
  let hour = parseInt(hourStr);

  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;

  return `${hour}:${min} ${ampm}`;
};

// group blocks (same as before)
export const groupSchedule = (daySchedule: Record<string, string>) => {
  const times = Object.keys(daySchedule).sort();

  const blocks: { start: string; end: string; name: string }[] = [];

  let currentBlock: any = null;

  times.forEach((time) => {
    const activity = daySchedule[time];

    if (!currentBlock) {
      currentBlock = { start: time, end: time, name: activity };
    } else if (currentBlock.name === activity) {
      currentBlock.end = time;
    } else {
      blocks.push(currentBlock);
      currentBlock = { start: time, end: time, name: activity };
    }
  });

  if (currentBlock) blocks.push(currentBlock);
  console.log(blocks.map((b) => `${b.name}: ${b.start} - ${b.end}`));

  return blocks;
};

// convert time to vertical position
export const timeToPosition = (time: string, dayStart: number) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m - dayStart * 60;
};
