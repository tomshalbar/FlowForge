import { signIn } from '@/services/authServices';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const signInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      router.replace('/(onboarding)');
    } catch (error: any) {
      setErrorMessage('Incorrect Email or Password');
    }
  };
  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.aboutText}>Welcome back to FlowForge</Text>
        </>
      }
      middleContent={
        <>
          <TextInput
            style={styles.inputs}
            placeholder="Email"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="default"
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
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage('');
            }}
            secureTextEntry
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Pressable
            onPress={() => {
              handleSignIn();
            }}
            style={({ pressed }) => [
              styles.nextButtonStyle,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.mainButtonText}>Sign In</Text>
          </Pressable>
        </>
      }
      bottomContent={
        <>
          <Text style={styles.smallText}>{"Don't have an account?"}</Text>

          <Pressable
            onPress={() => {
              router.push('/signUpScreen');
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
                Sign up
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

export default signInScreen;

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
  errorText: {
    color: 'red',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
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
