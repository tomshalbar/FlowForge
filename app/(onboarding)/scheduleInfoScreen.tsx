import { auth } from '@/config/firebase';
import { updateUserSchedule } from '@/services/dbServices';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const ScheduleInfoScreen = () => {
  const [schedule, setSchedule] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const uploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.2,
    });

    if (!result.canceled) {
      if (result.assets[0].base64) {
        const base64Data = result.assets[0].base64;
        setSchedule(base64Data);
        //   const model_result = await aiModel.generateContent([
        //     'what do you see in this image?',
        //     base64Data,
        //   ]);
        // console.log('got model response');
        // const response = model_result.response;
        // const text = response.text();
        // console.log(text);
        // setSchedule(text);
        console.log('scheudle uploaded succesfully');
      }
    }
  };

  const callOpenAIAPI = async (base64Image: string, prompt: string) => {
    console.log('Calling dummy openAIAPI');
  };

  const handleNext = () => {
    const user = auth.currentUser;
    if (schedule && user) {
      updateUserSchedule(user.uid, schedule);
      callOpenAIAPI(schedule, 'What do you see in this image?');
      router.push('/(onboarding)/doneScreen');
    } else {
      setErrorMessage('Please upload schedule');
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
            style={({ pressed }) => [
              styles.nextButton,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Image
              source={require('../../assets/images/temp_upload_icon.png')}
              style={styles.upload_icon}
            />
          </Pressable>
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.buttonText}>Next</Text>
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

export default ScheduleInfoScreen;

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
