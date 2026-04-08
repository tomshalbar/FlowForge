import { auth } from '@/config/firebase';
import { generateScheduleRecommendation } from '@/logic/coreAlgorithm';
import {
  getPreferences,
  getSchedule,
  setDoneOnboarding,
  updateUserSchedule,
} from '@/services/dbServices';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const onboardingDoneScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDone = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (user) {
      const userSched = await getSchedule(user.uid);
      const userPrefs = await getPreferences(user.uid);
      if (userSched && userPrefs) {
        const recommendation = await generateScheduleRecommendation(
          userSched,
          userPrefs,
        );
        updateUserSchedule(user.uid, recommendation);
        setDoneOnboarding(user.uid);
        router.replace('/(tabs)');
      } else {
        setIsLoading(false);
        setErrorMessage('Missing schedule or preferences.');
      }
    }
    setIsLoading(false);
  };

  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>{'Everything is set!'}</Text>
          <Text style={styles.aboutText}>Your new schedule is waiting</Text>
        </>
      }
      middleContent={
        <>
          <Image
            source={require('../../assets/images/tempLogo.png')}
            style={styles.big_logo}
          />
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={handleDone}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.nextButton,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
                opacity: isLoading ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Next'}
            </Text>
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
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          {isLoading ? (
            <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>
              Generating schedule...
            </Text>
          ) : null}
        </>
      }
    />
  );
};

export default onboardingDoneScreen;

const styles = StyleSheet.create({
  title: {
    color: 'black',
    fontSize: 40,
    textAlign: 'center',
    fontWeight: '600',
  },
  aboutText: {
    color: 'rgba(0, 0, 0, .6)',
    fontSize: 16,
    padding: 20,
    textAlign: 'center',
  },
  big_logo: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginTop: 80,
    marginBottom: 100,
  },
  nextButton: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  smallText: {
    marginTop: 15,
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
  },
});
