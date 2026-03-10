import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const authIndex = () => {
  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>FlowForge</Text>
          <Text style={styles.aboutText}>
            Build a schedule that balances work, exercise, and recovery.
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
              router.push('/(auth)/signUpScreen');
            }}
            style={({ pressed }) => [
              styles.getStartedButtonStyle,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.activityButtonText}>Get Started</Text>
          </Pressable>

          <Text style={styles.smallText}>Already have an account?</Text>

          <Pressable
            onPress={() => {
              // function to save user input
              router.push('/(auth)/signInScreen');
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
                Sign In
              </Text>
            )}
          </Pressable>
        </>
      }
    />
  );
};

export default authIndex;

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
  getStartedButtonStyle: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
  },
  activityButtonText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  smallText: {
    marginTop: 15,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});
