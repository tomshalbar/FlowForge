import { auth } from '@/config/firebase';
import { generateScheduleRecommendation } from '@/logic/coreAlgorithm';
import { analyzeImage } from '@/services/aiServices';
import {
  getUserData,
  updateUserAge,
  updateUserGeneratedSchedule,
  updateUserName,
  updateUserPreferences,
  updateUserSchedule,
  updateUserSleepTime,
  updateUserWakeUpTime,
} from '@/services/dbServices';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AuthScreenLayout from '../screenTemplate';

const MIN = 10;
const MAX = 80;
const TOTAL = 100;

const settingPage = () => {
  // same state as onboarding just editable
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [prefValues, setPrefValues] = useState({
    study: '',
    exercise: '',
    relax: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [scheduleJson, setScheduleJson] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      const baseUser = auth.currentUser;
      if (!baseUser) return;

      const data = (await getUserData(baseUser.uid)) ?? [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ];

      // Set all states from fetched data
      setName(data[0]);
      setAge(data[1]);
      setWakeTime(data[2]);
      setSleepTime(data[3]);
      setPrefValues({
        study: data[4],
        exercise: data[5],
        relax: data[6],
      });
      setScheduleJson(data[7]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        if (name) {
          updateUserName(name, user.uid);
        }
        if (age) {
          updateUserAge(age, user.uid);
        }
        if (wakeTime) {
          updateUserWakeUpTime(wakeTime, user.uid);
        }
        if (sleepTime) {
          updateUserSleepTime(sleepTime, user.uid);
        }
        if (prefValues) {
          updateUserPreferences(
            +prefValues['exercise'],
            +prefValues['study'],
            +prefValues['relax'],
            user.uid,
          );
        }
        if (schedule) {
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
            setScheduleJson(result);
            updateUserSchedule(user.uid, result);
          }
        }
        const userSched = scheduleJson;
        const userPrefs = {
          exercise: +prefValues['exercise'],
          study: +prefValues['study'],
          relax: +prefValues['relax'],
        };
        const userWakeSleepTime = {
          wakeUpTime: wakeTime,
          sleepTime: sleepTime,
        };
        if (userSched && userPrefs) {
          const recommendation = await generateScheduleRecommendation(
            userSched,
            userPrefs,
            userWakeSleepTime,
          );
          updateUserGeneratedSchedule(user.uid, recommendation);
        }
      }
    } catch (error) {
      setErrorMessage('Error processing information. Please try later.');
      setIsLoading(false);
      setSchedule('');
    } finally {
      setIsLoading(false);
    }
  };

  // same times as onboarding
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

  // same logic as preferences screen :contentReference[oaicite:0]{index=0}
  const updateSlider = (key: 'study' | 'exercise' | 'relax', val: number) => {
    setPrefValues((prev) => {
      const next = { ...prev };
      const target = Math.round(val);

      const diff = target - +prev[key];

      if (diff === 0) return prev;

      const others = (Object.keys(prev) as (keyof typeof prev)[]).filter(
        (k) => k !== key,
      );

      if (diff > 0) {
        // take from others
        let remaining = diff;
        for (let o of others) {
          const available = +next[o] - MIN;
          const take = Math.min(available, remaining);
          next[o] = +next[o] - take;
          remaining -= take;
        }
        next[key] = target - remaining;
      } else {
        // give to others
        let remaining = -diff;
        for (let o of others) {
          const space = MAX - next[o];
          const give = Math.min(space, remaining);
          next[o] += give;
          remaining -= give;
        }
        next[key] = target + remaining;
      }

      // force sum = 100
      const sum = next.study + next.exercise + next.relax;
      if (+sum !== TOTAL) next[key] += TOTAL - +sum;

      return next;
    });
  };

  // schedule upload (same as onboarding but no AI call yet) :contentReference[oaicite:1]{index=1}
  const uploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.2,
    });

    if (!result.canceled && result.assets[0].base64) {
      const uri = result.assets[0].uri;
      setSchedule(result.assets[0].base64);
      setImageUri(uri);
      console.log('schedule uploaded');
    }
  };

  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Update your preferences anytime</Text>
        </>
      }
      middleContent={
        <>
          {/* ---------- PERSONAL INFO ---------- */}

          <TextInput
            style={styles.inputs}
            placeholder="Name"
            placeholderTextColor="rgba(180,180,180,1)"
            defaultValue={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.inputs}
            placeholder="Age"
            keyboardType="number-pad"
            defaultValue={age}
            placeholderTextColor="rgba(180,180,180,1)"
            onChangeText={(t) => setAge(t)}
          />

          <Text style={styles.label}>Wake time</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={wakeTime}
              onValueChange={setWakeTime}
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
              onValueChange={setSleepTime}
              itemStyle={styles.pickerItem}
            >
              {times.map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>

          {/* ---------- PREFERENCES ---------- */}

          <Text style={styles.sectionTitle}>Preferences</Text>

          <Text style={styles.sliderLabel}>Study</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={+prefValues.study}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(v) => updateSlider('study', v)}
            />
            <Text style={styles.percent}>{prefValues.study}%</Text>
          </View>

          <Text style={styles.sliderLabel}>Exercise</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={+prefValues.exercise}
              minimumTrackTintColor="darkred"
              maximumTrackTintColor="#ddd"
              onValueChange={(v) => updateSlider('exercise', v)}
            />
            <Text style={styles.percent}>{prefValues.exercise}%</Text>
          </View>

          <Text style={styles.sliderLabel}>Relax</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={+prefValues.relax}
              minimumTrackTintColor="hotpink"
              maximumTrackTintColor="#ddd"
              onValueChange={(v) => updateSlider('relax', v)}
            />
            <Text style={styles.percent}>{prefValues.relax}%</Text>
          </View>

          {/* ---------- SCHEDULE ---------- */}

          <Text style={styles.sectionTitle}>Schedule</Text>

          <Pressable onPress={uploadImage}>
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : require('../../assets/images/temp_upload_icon.png')
              }
              style={[
                styles.upload_icon,
                {
                  borderColor: schedule ? 'rgb(37,37,37)' : 'rgb(184,184,184)',
                },
              ]}
            />
          </Pressable>
        </>
      }
      bottomContent={
        <>
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.button,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
                opacity: isLoading ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
          {isLoading ? (
            <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>
              Updating information.
            </Text>
          ) : null}
        </>
      }
    />
  );
};

export default settingPage;

const styles = StyleSheet.create({
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: 'black',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0,0,0,.6)',
    textAlign: 'center',
    marginTop: 10,
  },

  inputs: {
    height: 52,
    width: '100%',
    maxWidth: 354,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },

  label: {
    width: '100%',
    maxWidth: 354,
    fontSize: 18,
    marginTop: 10,
    color: 'black',
  },

  dropdown: {
    width: '100%',
    maxWidth: 354,
    height: 150,
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },

  pickerItem: {
    color: 'black',
    fontSize: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20,
    color: 'white',
  },

  sliderLabel: {
    color: 'white',
    fontSize: 20,
    marginTop: 10,
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 354,
  },

  slider: {
    flex: 1,
  },

  percent: {
    color: 'white',
    marginLeft: 10,
    width: 50,
    textAlign: 'right',
  },

  upload_icon: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 4,
  },

  button: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '700',
  },
});
