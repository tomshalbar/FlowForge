import { auth } from '@/config/firebase';
import schedule from '@/constants/tempSchedule.json';
import {
  formatTime,
  getFormattedDate,
  getTodayKey,
  groupSchedule,
  timeToPosition,
} from '@/logic/scheduleUtils';
import { getGeneratedSchedule } from '@/services/dbServices';
import { useFocusEffect } from '@react-navigation/core';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const activityConfig: Record<string, string> = {
  exercise: '#FF6B6B',
  study: '#4D96FF',
  relax: '#6BCB77',
  meal: '#FFD93D',
  class: '#845EC2',
  free: '#E0E0E0',
};

function getBlockColor(name: string): string {
  if (!name || name.trim() === '') return activityConfig.free;

  const key = name.toLowerCase();
  if (key === 'meal') return activityConfig.meal;
  if (key === 'exercise') return activityConfig.exercise;
  if (key === 'study') return activityConfig.study;
  if (key === 'relax') return activityConfig.relax;

  // Anything else (class names like CIS4301, COP4533, etc.) gets class color
  return activityConfig.class;
}

const mainAppPage = () => {
  const [scheduleData, setScheduleData] = useState(schedule);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const baseUser = auth.currentUser;
        if (baseUser) {
          const data = await getGeneratedSchedule(baseUser.uid);
          try {
            const jsonData = JSON.parse(data);
            setScheduleData(jsonData);
          } catch (e) {
            console.error('Invalid JSON string', e);
            setErrorMessage('Failed to parse schedule data.');
            return null;
          }
        } else {
          console.log('No user is currently signed in.');
        }
        setLoading(false);
      };

      fetchData(); // Cleanup listener on unmount
    }, []),
  );

  const todayKey = getTodayKey();
  const todaySchedule = scheduleData[todayKey as keyof typeof scheduleData];
  const grouped = groupSchedule(todaySchedule);
  const start_time_str = Object.keys(todaySchedule).sort()[0];
  const start_time = start_time_str
    ? parseInt(start_time_str.split(':')[0])
    : 5;
  const PX_PER_HOUR = 160; // 160 pixels per hour

  return (
    <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* header */}
        <Text style={styles.title}>Your Schedule</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>

        {/* timeline */}
        <View style={styles.timelineContainer}>
          {/* hour labels */}
          {Array.from({ length: 24 - start_time }).map((_, i) => {
            const hour = start_time + i;
            const display = hour > 12 ? hour - 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';

            return (
              <Text key={i} style={[styles.hour, { top: i * PX_PER_HOUR }]}>
                {display} {ampm}
              </Text>
            );
          })}
          {/* events */}
          {grouped.map((block, index) => {
            const top =
              timeToPosition(block.start, start_time) * (PX_PER_HOUR / 60);
            const height =
              (timeToPosition(block.end, start_time) -
                timeToPosition(block.start, start_time)) *
              (PX_PER_HOUR / 60);

            const durationSlots =
              (timeToPosition(block.end, start_time) -
                timeToPosition(block.start, start_time)) /
              5;
            const isShort = durationSlots < 5; // 5 slots = 25 min
            const blockColor = getBlockColor(block.name);

            return (
              <View
                key={index}
                style={[
                  styles.eventBlock,
                  {
                    top,
                    height,
                    backgroundColor: blockColor,
                  },
                ]}
              >
                {!isShort && (
                  <>
                    <Text style={styles.eventTitle}>{block.name}</Text>
                    <Text style={styles.eventTime}>
                      {formatTime(block.start)} - {formatTime(block.end)}
                    </Text>
                  </>
                )}
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
    height: 160 * 19, // 5 AM -> 12 AM
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
