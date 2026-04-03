import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import schedule from '@/constants/tempSchedule.json';

// format date
const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

// get day key
const getTodayKey = () => {
  const days = [
    'sunday','monday','tuesday','wednesday','thursday','friday','saturday'
  ];
  return days[new Date().getDay()];
};

// convert "13:55" -> "1:55 PM"
const formatTime = (time: string) => {
  const [hourStr, min] = time.split(':');
  let hour = parseInt(hourStr);

  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;

  return `${hour}:${min} ${ampm}`;
};

// group blocks (same as before)
const groupSchedule = (daySchedule: Record<string, string>) => {
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

  return blocks;
};

// convert time to vertical position
const timeToPosition = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h * 60 + m) - (8 * 60); // start day at 8 AM
};

const mainAppPage = () => {
  const todayKey = getTodayKey();
  const todaySchedule = schedule[todayKey as keyof typeof schedule];
  const grouped = groupSchedule(todaySchedule);

  return (
    <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* header */}
        <Text style={styles.title}>Your Schedule</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>

        {/* timeline */}
        <View style={styles.timelineContainer}>

          {/* hour labels */}
          {Array.from({ length: 16 }).map((_, i) => {
            const hour = 8 + i;
            const display = hour > 12 ? hour - 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';

            return (
              <Text key={i} style={[styles.hour, { top: i * 80 }]}>
                {display} {ampm}
              </Text>
            );
          })}

          {/* events */}
          {grouped.map((block, index) => {
            const top = timeToPosition(block.start) * (80 / 60);
            const height =
              (timeToPosition(block.end) - timeToPosition(block.start)) *
              (80 / 60);

            return (
              <View
                key={index}
                style={[
                  styles.eventBlock,
                  {
                    top,
                    height: Math.max(height, 50),
                  },
                ]}
              >
                <Text style={styles.eventTitle}>{block.name}</Text>
                <Text style={styles.eventTime}>
                  {formatTime(block.start)} - {formatTime(block.end)}
                </Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </LinearGradient>
  );
};

export default mainAppPage;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },

  container: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },

  date: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: 'rgba(0,0,0,0.6)',
  },

  timelineContainer: {
    height: 80 * 16, // 8 AM -> 12 AM
    position: 'relative',
    marginLeft: 50,
  },

  hour: {
    position: 'absolute',
    left: -50,
    fontSize: 14,
    color: '#555',
  },

  eventBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#7b61ff',
    borderRadius: 12,
    padding: 10,
  },

  eventTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  eventTime: {
    color: 'white',
    fontSize: 13,
    marginTop: 3,
  },
});