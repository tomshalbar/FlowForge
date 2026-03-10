import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const presonalInfoScreen = () => {
  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.aboutText}>
            {'We’ll use this to personalize your schedule'}
          </Text>
        </>
      }
      middleContent={
        <>
          <TextInput
            style={styles.inputs}
            placeholder="Name"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
          />

          <TextInput
            style={styles.inputs}
            placeholder="Age"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="number-pad"
          />

          <TextInput
            style={styles.inputs}
            placeholder="When do you feel most productive?"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
          />
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={() => {
              // add function to save user input
              router.push('/(onboarding)/preferencesScreen');
            }}
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

export default presonalInfoScreen;

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
    marginBottom: 60,
  },
  inputs: {
    alignItems: 'center',
    height: 52,
    width: '100%',
    maxWidth: 354,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 15,
    color: 'rgba(0,0,0,1)',
    marginBottom: 15,
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
