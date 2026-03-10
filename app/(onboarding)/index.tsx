import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const onboardingWelcome = () => {
  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>{'Let’s get started'}</Text>
          <Text style={styles.aboutText}>
            We will collect information about your preferences and schedule in
            the upcoming screens
          </Text>
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
            onPress={() => {
              // add function to save user input
              router.push('/(onboarding)/personalInfoScreen');
            }}
            style={({ pressed }) => [
              styles.onboardButton,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.onboardText}>Onboard</Text>
          </Pressable>
        </>
      }
    />
  );
};

export default onboardingWelcome;

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
  onboardButton: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
  },
  onboardText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
});
