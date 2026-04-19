import { auth } from '@/config/firebase';
import { updateUserPreferences } from '@/services/dbServices';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const PreferencesScreen = () => {
  const [studyPercent, setStudyPercent] = useState(40);
  const [exerciseDays, setExerciseDays] = useState(3);
  const [exerciseDuration, setExerciseDuration] = useState(60);

  const handleNext = () => {
    const user = auth.currentUser;
    if (user) {
      updateUserPreferences(
        studyPercent,
        exerciseDays,
        exerciseDuration,
        user.uid,
      );
      router.push('/(onboarding)/scheduleInfoScreen');
    }
  };

  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>How should we balance your time?</Text>
          <Text style={styles.subtitle}>
            We'll use this to personalize your schedule.
          </Text>
        </>
      }
      middleContent={
        <>
          <Text style={styles.label}>Study</Text>
          <Text style={styles.sublabel}>Proportion of free time</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={80}
              step={5}
              value={studyPercent}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => setStudyPercent(Math.round(val))}
            />
            <Text style={styles.percent}>{studyPercent}%</Text>
          </View>

          <Text style={styles.label}>Exercise Days</Text>
          <Text style={styles.sublabel}>Days per week</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={exerciseDays}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => setExerciseDays(Math.round(val))}
            />
            <Text style={styles.percent}>{exerciseDays} days</Text>
          </View>

          <Text style={styles.label}>Exercise Duration</Text>
          <Text style={styles.sublabel}>Minutes per day</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={120}
              step={10}
              value={exerciseDuration}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => setExerciseDuration(Math.round(val))}
            />
            <Text style={styles.percent}>{exerciseDuration} min</Text>
          </View>
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButtonStyle,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.mainButtonText}>Next</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              router.back();
            }}
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.smallText,
                  {
                    color: pressed
                      ? 'rgba(91, 90, 90, 1)'
                      : 'rgba(182, 179, 179, 1)',
                    marginTop: 10,
                  },
                ]}
              >
                Back
              </Text>
            )}
          </Pressable>
        </>
      }
    />
  );
};

export default PreferencesScreen;

const styles = StyleSheet.create({
  title: {
    color: 'black',
    fontSize: 40,
    textAlign: 'center',
    fontWeight: '600',
  },

  subtitle: {
    color: 'rgba(0, 0, 0, .6)',
    fontSize: 16,
    padding: 20,
    textAlign: 'center',
    marginBottom: 40,
  },

  label: {
    color: 'white',
    fontSize: 22,
    marginTop: 20,
    width: '100%',
    maxWidth: 354,
  },

  sublabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    width: '100%',
    maxWidth: 354,
    marginBottom: 4,
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 354,
  },

  slider: {
    flex: 1,
  },

  percent: {
    color: 'white',
    fontSize: 20,
    marginLeft: 10,
    width: 60,
    textAlign: 'right',
  },

  nextButtonStyle: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
    marginTop: 30,
  },

  mainButtonText: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '700',
  },

  smallText: {
    marginTop: 15,
    fontSize: 18,
    textAlign: 'center',
  },
});
