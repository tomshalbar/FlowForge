import { auth } from '@/config/firebase';
import { updateUserPreferences } from '@/services/dbServices';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

type SliderKey = 'study' | 'exercise' | 'relax';

type SliderValues = {
  study: number;
  exercise: number;
  relax: number;
};

const MIN = 10;
const MAX = 80;
const TOTAL = 100;

const preferencesScreen = () => {
  const [values, setValues] = useState<SliderValues>({
    study: 40,
    exercise: 30,
    relax: 30,
  });

  const priorityMap: Record<SliderKey, SliderKey[]> = {
    study: ['exercise', 'relax'], // 1 takes/gives 2 then 3
    exercise: ['relax', 'study'], // 2 takes/gives 3 then 1
    relax: ['study', 'exercise'], // 3 takes/gives 1 then 2
  };

  const updateSlider = (key: SliderKey, requestedValue: number) => {
    setValues((prev) => {
      const next = { ...prev };
      const current = prev[key];

      // Clamp requested slider itself
      const target = Math.max(MIN, Math.min(MAX, Math.round(requestedValue)));
      const delta = target - current;

      const [first, second] = priorityMap[key];

      if (delta > 0) {
        // Increasing this slider: take from others in priority order
        let remaining = delta;

        const takeFrom = (otherKey: SliderKey) => {
          const available = next[otherKey] - MIN;
          const taken = Math.min(available, remaining);
          next[otherKey] -= taken;
          remaining -= taken;
        };

        takeFrom(first);
        takeFrom(second);

        // Whatever could actually be taken is what this slider gains
        next[key] = current + (delta - remaining);
      } else if (delta < 0) {
        // Decreasing this slider: give to others in priority order
        let remaining = -delta;
        const giveTo = (otherKey: SliderKey) => {
          const space = MAX - next[otherKey];
          const given = Math.min(space, remaining);
          next[otherKey] += given;
          remaining -= given;
        };

        giveTo(first);
        giveTo(second);

        // Whatever could actually be given away is what this slider loses
        next[key] = current - (-delta - remaining);
      }

      // Safety: force exact total of 100
      const sum = next.study + next.exercise + next.relax;
      if (sum !== TOTAL) {
        next[key] += TOTAL - sum;
      }

      return next;
    });
  };

  const handleNext = () => {
    const user = auth.currentUser;
    if (user) {
      updateUserPreferences(
        values.study,
        values.exercise,
        values.relax,
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
          {/* Study */}
          <Text style={styles.label}>Study</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={values.study}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => updateSlider('study', val)}
            />
            <Text style={styles.percent}>{values.study}%</Text>
          </View>

          {/* Exercise */}
          <Text style={styles.label}>Exercise</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={values.exercise}
              minimumTrackTintColor="darkred"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => updateSlider('exercise', val)}
            />
            <Text style={styles.percent}>{values.exercise}%</Text>
          </View>

          {/* Relax */}
          <Text style={styles.label}>Relax</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={values.relax}
              minimumTrackTintColor="hotpink"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => updateSlider('relax', val)}
            />
            <Text style={styles.percent}>{values.relax}%</Text>
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

export default preferencesScreen;

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
