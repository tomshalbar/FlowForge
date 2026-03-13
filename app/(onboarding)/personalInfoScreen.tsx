import { auth } from '@/config/firebase';
import { updateUserPersonalInfo } from '@/services/dbServices';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const personalInfoScreen = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [wakeTime, setWakeTime] = useState('7:00 AM');
  const [sleepTime, setSleepTime] = useState('11:00 PM');
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = () => {
    const user = auth.currentUser;
    if (name && age) {
      if (user) {
        updateUserPersonalInfo(name, age, wakeTime, sleepTime, user.uid);
        router.push('/(onboarding)/preferencesScreen');
      }
    } else {
      setErrorMessage('Incomplet boxes');
    }
  };

  const times = [
    '5:00 AM',
    '6:00 AM',
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
    '10:00 PM',
    '11:00 PM',
    '12:00 AM',
  ];

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
            onChangeText={(text) => {
              setName(text);
            }}
          />

          <TextInput
            style={styles.inputs}
            placeholder="Age"
            placeholderTextColor="rgba(180, 180, 180, 1)"
            keyboardType="number-pad"
            onChangeText={(text) => {
              setAge(text.toString());
            }}
          />

          <Text style={styles.label}>Wake up time</Text>

          <View style={styles.dropdown}>
            <Picker
              selectedValue={wakeTime}
              onValueChange={(itemValue) => setWakeTime(itemValue)}
              itemStyle={styles.pickerItem}
            >
              {times.map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Sleep time</Text>

          <View style={styles.dropdown}>
            <Picker
              selectedValue={sleepTime}
              onValueChange={(itemValue) => setSleepTime(itemValue)}
              itemStyle={styles.pickerItem}
            >
              {times.map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={() => {
              handleNext();
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
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </>
      }
    />
  );
};

export default personalInfoScreen;

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

  label: {
    width: '100%',
    maxWidth: 354,
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
    color: 'black',
  },

  dropdown: {
    width: '100%',
    maxWidth: 354,
    height: 150,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },

  pickerItem: {
    color: 'black',
    fontSize: 20,
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
