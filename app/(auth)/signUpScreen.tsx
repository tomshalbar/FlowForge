import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { validateSignUp } from '../../logic/signUpValidation';
import { signUp } from '../../services/authServices';
import AuthScreenLayout from '../screenTemplate';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async () => {
    setErrorMessage('');

    const validationError = validateSignUp(email, password, confirm_password);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      signUp(email, password, confirm_password);
      router.replace('/(onboarding)');
    } catch (error: any) {
      setErrorMessage('Error signing up');
      console.log('Firebase sign-in error:', error);
    }
  };
  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.aboutText}>Welcome to FlowForge</Text>
        </>
      }
      middleContent={
        <>
          <TextInput
            style={styles.inputs}
            placeholder="Email"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="email-address"
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage('');
            }}
          />

          <TextInput
            style={styles.inputs}
            placeholder="Password"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
            secureTextEntry
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage('');
            }}
          />

          <TextInput
            style={styles.inputs}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
            secureTextEntry
            onChangeText={(text) => {
              setConfirm(text);
              if (errorMessage) setErrorMessage('');
            }}
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <Pressable
            onPress={() => {
              // add function to save user input
              handleSignUp();
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
        </>
      }
      bottomContent={
        <>
          <Text style={styles.smallText}>Already have an account?</Text>

          <Pressable
            onPress={() => {
              // function to save user input
              router.push('/signInScreen');
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
        </>
      }
    />
  );
};

export default SignUpScreen;

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
  errorText: {
    color: 'red',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
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
