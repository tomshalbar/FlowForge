import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const presonalInfoScreen = () => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>

        <Text style={styles.title}>Tell us about you</Text>

        <Text style={styles.subtitle}>
          We'll use this to personalize your schedule.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="When do you feel most productive?"
          placeholderTextColor="#aaa"
        />

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
            // function to save user input
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
                },
              ]}
            >
              Back
            </Text>
          )}
        </Pressable>

      </LinearGradient>
    </View>
  );
};

export default presonalInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },

  gradient: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: 'black',
    fontSize: 38,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#2b2b2b',
    marginBottom: 40,
  },

  input: {
    width: '90%',
    height: 55,
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
  },

  nextButtonStyle: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
    marginTop: 40,
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