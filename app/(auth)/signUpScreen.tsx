import { auth } from '@/config/firebase';
import { registerBaseUser } from '@/services/dbServices';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sendEmailVerification, signOut } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { validateSignUp } from '../../logic/signUpValidation';
import { signUp } from '../../services/authServices';
import AuthScreenLayout from '../screenTemplate';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirm_password, setConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');

  const handleSignUp = async () => {
    setErrorMessage('');

    const validationError = validateSignUp(email, password, confirm_password);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      const userCredentials = await signUp(email, password, confirm_password);
      registerBaseUser(email, userCredentials.user.uid);

      await sendEmailVerification(userCredentials.user);
      console.log(
        'Created account for User. Sent verification email to:',
        userCredentials.user.email,
      );
      await signOut(auth);

      setNotification(
        'Account created! Please check your email to verify your account before signing in.',
      );
      setTimeout(() => {
        setNotification('');
        router.replace('/signInScreen');
      }, 5000);
    } catch (error: any) {
      setErrorMessage(error.message);
      console.log('Firebase sign-up error:', error);
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
            style={styles.emailInput}
            placeholder="Email"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="email-address"
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage('');
            }}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="rgba(180, 180, 180, 1)"
              keyboardType="default"
              secureTextEntry={!showPassword}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="rgba(180, 180, 180, 1)"
              keyboardType="default"
              secureTextEntry={!showPassword}
              onChangeText={(text) => {
                setConfirm(text);
                if (errorMessage) setErrorMessage('');
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          {notification ? (
            <Text style={styles.notificationText}>{notification}</Text>
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
              router.navigate('/(auth)');
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
  emailInput: {
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
  passwordInput: {
    flex: 1,
    color: 'rgba(0,0,0,1)',
    paddingVertical: 0,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    width: '100%',
    maxWidth: 354,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 15,
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
  notificationText: {
    color: 'white',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 18,
    textAlign: 'center',
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
