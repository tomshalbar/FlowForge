import { auth } from '@/config/firebase';
import { setDoneOnboarding } from '@/services/dbServices';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const onboardingDoneScreen = () => {
  const handleDone = () => {
    const user = auth.currentUser;
    if (user) {
      setDoneOnboarding(user.uid);
      router.replace('/(tabs)');
    }
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
            style={({ pressed }) => [
              styles.nextButton,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.buttonText}>Next</Text>
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
});
