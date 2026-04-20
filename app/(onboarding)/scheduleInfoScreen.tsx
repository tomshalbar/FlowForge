import { auth } from '@/config/firebase';
import { analyzeImage } from '@/services/aiServices';
import { updateUserSchedule } from '@/services/dbServices';
import '@/services/polyfill';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const ScheduleInfoScreen = () => {
  const [schedule, setSchedule] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const uploadImage = async () => {
    setIsLoading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 1,
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
    setIsLoading(false);
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
          `Task: Convert the attached image into a JSON format that will be saved in a database. In the attached image, days are placed one after another horizontaly, while the vertical direction shows the classes for each day. Your response will be directly loaded into a typescript interface, so do not include any thing that will interfere with this logic. It should be a dictionary of days, with every day being a dictionary that maps a time of the day (in increments of 5 minutes), to the corresponding class. 
            
            Context: The Image is attached, and is in the form of base64 string. Here is the mapping logic from the schedule to the JSON: start Time: Use the text inside the block (e.g., "11:45 AM"). End Time: Calculate based on the number of Period rows (vertical length) the colored block occupies. 1 Period (seen in the y-axis of the grid) = 50 mins. 2 Periods = 115 mins (50+15+50). so if you see that a class spans two blocks, ensure that you extrapolate this to 115 mintues. PLEASE DON'T MISS THIS PART. Resolution: Map every 5-minute increment from Start to End (inclusive). If a class block's visual duration conflicts with its written start time, prioritize the written start time and use the period grid to determine the end time. In addition, you do not need to list any class that doens't correspond to any time block in the grid, since it is an online class. Note that if there is no class during a time period, you do not need to include that time in that day's dict.
            
            Assumptions: You need to assume that the period length is not determined by where the text is located on the grid, but only by the area the background color covers. The text relative position means nothing. Assume that you are really bad at detecting continuous colored regions across grid cells, so pay extra attention to this detail. This may help you with this For each class, determine the top and bottom boundaries of its colored region. Count how many row segments it spans vertically. Do not rely on text placement—only measure the vertical height of the colored rectangle. If a class spans multiple periods, the colored rectangle will be taller than others. Compare heights across classes to detect this. So if a class block spans two periods (background color continous across two periods), the class takes two periods even though there is text in only one of the blocks. Do not assume that each class only takes 50 minutes. 
            
            Chain of thought: first, determine which classes take up more than block. This will be clear to you by the background color of them. Second, determine the start time for each class. Third, calculate the end time for each class based on the start time and the number of blocks the background color covers. Last, place everything in the JSON appropriatly.
        
            Format if there is a valid schedule attached: ${example_json}. Return ONLY the JSON object. No markdown blocks, no conversational filler. If a day is empty, return an empty dictionary for that key
            
            Format if there is there is no valid schedule attached, or if you there is something that is hindering you from performing the task as described: {'monday': {}, 'tuesday': {}, 'wednesday': {}, 'thursday': {}, 'friday': {}}`,
        );
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

          {(imageUri || schedule) && (
            <Pressable
              onPress={() => {
                setImageUri(null);
                setSchedule('');
              }}
              style={({ pressed }) => [
                styles.nextButton,
                {
                  transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
                  marginTop: 100,
                },
              ]}
            >
              <Text style={styles.buttonText}>Clear Schedule</Text>
            </Pressable>
          )}
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
