import { auth } from '@/config/firebase';
import { getSchedule } from '@/services/dbServices';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AuthScreenLayout from '../screenTemplate';

const SIZE = 200;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const activityConfig: any = {
  exercise: { color: '#FF6B6B', emoji: '💪', messages: ['Push it.', 'Stay strong.', 'Keep going.'] },
  study: { color: '#4D96FF', emoji: '📚', messages: ['Lock in.', 'Focus up.', 'Stay sharp.'] },
  relax: { color: '#6BCB77', emoji: '🧘', messages: ['Breathe.', 'Slow down.', 'Reset.'] },
  meal: { color: '#FFD93D', emoji: '🍽️', messages: ['Eat well.', 'Fuel up.', 'Take your time.'] },
  class: { color: '#845EC2', emoji: '🏫', messages: ['Stay engaged.', 'Pay attention.', 'Take notes.'] },
};

const exerciseCycle = [
  { name: 'Stretch', time: 20 },
  { name: 'Rest', time: 10 },
  { name: 'Push-ups', time: 20 },
  { name: 'Rest', time: 10 },
  { name: 'Plank', time: 20 },
  { name: 'Rest', time: 10 },
  { name: 'Sit-ups', time: 20 },
  { name: 'Rest', time: 10 },
];

const studyCycle = [
  { name: 'Work', time: 1500 },
  { name: 'Break', time: 300 },
];

const relaxCycle = [
  { name: 'Deep Breathing', time: 60 },
  { name: 'Clear Mind', time: 60 },
  { name: 'Slow Breathing', time: 60 },
];

const activityPage = () => {
  const [activity, setActivity] = useState<any>('study');
  const [className, setClassName] = useState('');
  const [message, setMessage] = useState('');

  const [subIndex, setSubIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalTime, setTotalTime] = useState(60);

  const getCurrentTimeKey = () => {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 5) * 5;
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = minutes.toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const getDayKey = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  const loadActivityFromSchedule = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const schedule = await getSchedule(user.uid);
    if (!schedule) return;

    const day = getDayKey();
    const time = getCurrentTimeKey();

    const value = schedule?.[day]?.[time];

    if (!value) {
      setActivity('relax');
      return;
    }

    const lower = value.toLowerCase();

    if (['study', 'exercise', 'relax', 'meal'].includes(lower)) {
      setActivity(lower);
      setClassName('');
    } else {
      setActivity('class');
      setClassName(value);
    }
  };

  useEffect(() => {
    loadActivityFromSchedule();
    const interval = setInterval(loadActivityFromSchedule, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const msgs = activityConfig[activity].messages;
    setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    setSubIndex(0);
  }, [activity]);

  // ONLY run timer logic if NOT class or meal
  useEffect(() => {
    if (activity === 'class' || activity === 'meal') return;

    let current;

    if (activity === 'exercise') current = exerciseCycle[subIndex % exerciseCycle.length];
    else if (activity === 'study') current = studyCycle[subIndex % studyCycle.length];
    else if (activity === 'relax') current = relaxCycle[subIndex % relaxCycle.length];

    if (!current) return;

    setTimeLeft(current.time);
    setTotalTime(current.time);
  }, [subIndex, activity]);

  useEffect(() => {
    if (activity === 'class' || activity === 'meal') return;

    if (timeLeft <= 0) {
      setSubIndex((prev) => prev + 1);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, activity]);

  const getCurrentSub = () => {
    if (activity === 'exercise') return exerciseCycle[subIndex % exerciseCycle.length].name;
    if (activity === 'study') return studyCycle[subIndex % studyCycle.length].name;
    if (activity === 'relax') return relaxCycle[subIndex % relaxCycle.length].name;
    return '';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress =
    activity === 'class' || activity === 'meal'
      ? 0
      : totalTime > 0
      ? timeLeft / totalTime
      : 0;

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <AuthScreenLayout
      headerContent={
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: activityConfig[activity].color }]}>
            {activity.toUpperCase()}
          </Text>
          {activity === 'class' && (
            <Text style={styles.classCode}>{className}</Text>
          )}
        </View>
      }
      middleContent={
        <View style={styles.middleContainer}>
          {/* sub activity */}
          {activity !== 'class' && activity !== 'meal' && (
            <Text style={styles.subText}>{getCurrentSub()}</Text>
          )}

          {/* timer text */}
          {activity !== 'class' && activity !== 'meal' && (
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          )}

          {/* circle */}
          <View>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                stroke={activityConfig[activity].color + '30'}
                fill="none"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                strokeWidth={STROKE_WIDTH}
              />
              {activity !== 'class' && activity !== 'meal' && (
                <Circle
                  stroke="white"
                  fill="none"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
              )}
            </Svg>

            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{activityConfig[activity].emoji}</Text>
            </View>
          </View>

          <Text style={styles.message}>{message}</Text>
        </View>
      }
      bottomContent={
        <View style={styles.buttonRow}>
          {Object.keys(activityConfig).map((key) => (
            <Pressable key={key} onPress={() => setActivity(key)} style={styles.button}>
              <Text>{key}</Text>
            </Pressable>
          ))}
        </View>
      }
    />
  );
};

export default activityPage;

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '600',
  },
  classCode: {
    fontSize: 18,
    color: '#333',
    marginTop: 5,
  },
  middleContainer: {
    alignItems: 'center',
    gap: 15,
  },
  subText: {
    fontSize: 20,
    color: '#333',
  },
  timerText: {
    fontSize: 18,
    color: '#333',
  },
  emojiContainer: {
    position: 'absolute',
    top: 75,
    left: 75,
  },
  emoji: {
    fontSize: 50,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    padding: 8,
    backgroundColor: '#00000020',
    borderRadius: 8,
  },
});