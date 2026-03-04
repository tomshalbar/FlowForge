import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const signUp = () => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.aboutText}>Welcome to FlowForge</Text>

        <View style={styles.inputView}>
          <TextInput
            style={styles.inputs}
            placeholder="Username"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
          />

          <TextInput
            style={styles.inputs}
            placeholder="Password"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
            secureTextEntry
          />

          <TextInput
            style={styles.inputs}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
            secureTextEntry
          />
        </View>

        <Pressable
          onPress={() => {
            // add function to save user input
            router.replace('/(onboarding)');
          }}
          style={({ pressed }) => [
            styles.nextButtonStyle,
            {
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            },
          ]}
        >
          <Text style={styles.mainButtonText}>Sign Up</Text>
        </Pressable>

        <Text style={styles.smallText}>Already have an account?</Text>

        <Pressable
          onPress={() => {
            // function to save user input
            router.replace('/signInScreen');
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
              Sign in
            </Text>
          )}
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
              Back to Home Page
            </Text>
          )}
        </Pressable>
      </LinearGradient>
    </View>
  );
};

export default signUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  title: {
    color: 'black',
    fontSize: 50,
    textAlign: 'center',
    fontWeight: '600',
  },
  aboutText: {
    color: 'rgba(0, 0, 0, .6)',
    fontSize: 24,
    padding: 20,
    textAlign: 'center',
    marginBottom: 60,
  },
  inputView: {
    marginTop: 30,
  },
  inputs: {
    height: 52,
    width: 354,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 15,
    color: 'rgba(0,0,0,1)',
    marginBottom: 15,
  },
  gradient: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
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
