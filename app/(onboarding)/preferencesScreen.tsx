import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const preferencesScreen = () => {
  const [study, setStudy] = useState(60);
  const [exercise, setExercise] = useState(30);
  const [relax, setRelax] = useState(10);

  const total = study + exercise + relax;

  const handleNext = () => {
    if (total !== 100) {
      Alert.alert('Total must equal 100%', 'Please adjust the sliders so they add up to 100%.');
      return;
    }

    router.push('/(onboarding)/scheduleInfoScreen');
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
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={study}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => {
                if (val + exercise + relax <= 100) setStudy(val);
              }}
            />
            <Text style={styles.percent}>{study}%</Text>
          </View>

          {/* Exercise */}
          <Text style={styles.label}>Exercise</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={exercise}
              minimumTrackTintColor="darkred"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => {
                if (study + val + relax <= 100) setExercise(val);
              }}
            />
            <Text style={styles.percent}>{exercise}%</Text>
          </View>

          {/* Relax */}
          <Text style={styles.label}>Relax</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={relax}
              minimumTrackTintColor="hotpink"
              maximumTrackTintColor="#ddd"
              onValueChange={(val) => {
                if (study + exercise + val <= 100) setRelax(val);
              }}
            />
            <Text style={styles.percent}>{relax}%</Text>
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