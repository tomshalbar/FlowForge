import { auth } from '@/config/firebase';
import { analyzeImage } from '@/services/aiServices';
import { updateUserSchedule } from '@/services/dbServices';
import '@/services/polyfill';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const onboardingDoneScreen = () => {
  const [schedule, setSchedule] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const uploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.2,
    });

    if (!result.canceled) {
      if (result.assets[0].base64) {
        const base64Data = result.assets[0].base64;
        const uri = result.assets[0].uri;
        setSchedule(base64Data);
        setImageUri(uri);
        console.log('image uploaded succesfully');
      }
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (schedule && user) {
        setErrorMessage('');
        const example_json =
          "{'monday': {'08:30': 'CIS4301', '08:35': 'CIS4301', ..., '14:35': 'CIS4930' '14:40': 'CIS4930'}, ..., 'Friday': { '09:35': 'COP4533', '09:40': 'COP4533', ... '14:35': 'CIS4930', '14:40': 'CIS4930'}}";
        const result = await analyzeImage(
          schedule,
          `Task: Convert the attached image into a JSON format that will be saved in a database. Your response will be directly loaded into a typescript interface, so do not include any thing that will interfere with this logic. It should be a dictionary of days, with every day being a dictionary that maps a time of the day (in increments of 5 minutes), to the corresponding class. 

Context: The Image is attached, and is in the form of base64 string. It should be of a schedule, if it is not, please return an empty dict. Every class period is 50 minutes, with 15 minutes between periods. So if you see a class block that extends across two periods for example, the total time will be 50 + 50 + 15 = 115. You will need to extrapolate from the listed start time through the duration of the class, depending on how many periods the class is. Please use your judgment in this. Note that if there is no class during a time period, you do not need to include that time in that day's dict.

Format if there is a valid schedule attached: ${example_json}

Format if there is there is no valid schedule attached, or if you there is anything that is hindering you from performing the task exactly as described: {'monday': {}, 'tuesday': {}, 'wednesday': {}, 'thursday': {}, 'friday': {}}`,
        );
        ``;
        if (result != null) {
          await updateUserSchedule(user.uid, result);
        }
        router.push('/(onboarding)/doneScreen');
      } else {
        setErrorMessage('Please upload schedule');
      }
    } catch (error) {
      setErrorMessage('Error processing schedule. Please try later.');
      setIsLoading(false);
      setSchedule('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>Current class schedule</Text>
        </>
      }
      middleContent={
        <>
          <Pressable
            onPress={uploadImage}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.nextButton,
              {
                backgroundColor: 'transparent',
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : require('../../assets/images/temp_upload_icon.png')
              }
              style={[
                styles.upload_icon,
                {
                  borderColor: schedule
                    ? 'rgb(37, 37, 37)'
                    : 'rgb(184, 184, 184)',
                  opacity: schedule ? 1 : 0.8,
                },
              ]}
            />
          </Pressable>
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={handleNext}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.nextButton,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
                opacity: isLoading ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Saving...' : 'Next'}
            </Text>
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
          {isLoading ? (
            <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>
              Processing schedule may be slow.
            </Text>
          ) : null}
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
  upload_icon: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginTop: 80,
    marginBottom: 100,
    borderWidth: 4,
    borderColor: 'rgba(163,51,58,1)',
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
  errorText: {
    color: 'red',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
  },
});
