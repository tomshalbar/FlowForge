import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
  const [wakeTime, setWakeTime] = useState('7:00 AM');
  const [sleepTime, setSleepTime] = useState('11:00 PM');

  const [values, setValues] = useState({
    study: 40,
    exercise: 30,
    relax: 30,
  });

  const [schedule, setSchedule] = useState('');

  // same times as onboarding
  const times = [
    '5:00 AM','6:00 AM','7:00 AM','8:00 AM','9:00 AM',
    '10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM',
    '3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM',
    '8:00 PM','9:00 PM','10:00 PM','11:00 PM','12:00 AM',
  ];

  // same logic as preferences screen :contentReference[oaicite:0]{index=0}
  const updateSlider = (key: 'study' | 'exercise' | 'relax', val: number) => {
    setValues((prev) => {
      const next = { ...prev };
      const target = Math.round(val);

      const diff = target - prev[key];

      if (diff === 0) return prev;

      const others = (Object.keys(prev) as (keyof typeof prev)[]).filter(
        (k) => k !== key
      );

      if (diff > 0) {
        // take from others
        let remaining = diff;
        for (let o of others) {
          const available = next[o] - MIN;
          const take = Math.min(available, remaining);
          next[o] -= take;
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
      if (sum !== TOTAL) next[key] += TOTAL - sum;

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
      setSchedule(result.assets[0].base64);
      console.log('schedule uploaded');
    }
  };

  const handleSave = () => {
    // TODO: teammate will connect backend here

    /*console.log({
      name,
      age,
      wakeTime,
      sleepTime,
      preferences: values,
      schedule,
    });*/

    // maybe show confirmation later
  };

  return (
    <AuthScreenLayout
      headerContent={
        <>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Update your preferences anytime
          </Text>
        </>
      }
      middleContent={
        <>
          {/* ---------- PERSONAL INFO ---------- */}

          <TextInput
            style={styles.inputs}
            placeholder="Name"
            placeholderTextColor="rgba(180,180,180,1)"
            onChangeText={setName}
          />

          <TextInput
            style={styles.inputs}
            placeholder="Age"
            keyboardType="number-pad"
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
              value={values.study}
              minimumTrackTintColor="red"
              maximumTrackTintColor="#ddd"
              onValueChange={(v) => updateSlider('study', v)}
            />
            <Text style={styles.percent}>{values.study}%</Text>
          </View>

          <Text style={styles.sliderLabel}>Exercise</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={values.exercise}
              minimumTrackTintColor="darkred"
              maximumTrackTintColor="#ddd"
              onValueChange={(v) => updateSlider('exercise', v)}
            />
            <Text style={styles.percent}>{values.exercise}%</Text>
          </View>

          <Text style={styles.sliderLabel}>Relax</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={values.relax}
              minimumTrackTintColor="hotpink"
              maximumTrackTintColor="#ddd"
              onValueChange={(v) => updateSlider('relax', v)}
            />
            <Text style={styles.percent}>{values.relax}%</Text>
          </View>

          {/* ---------- SCHEDULE ---------- */}

          <Text style={styles.sectionTitle}>Schedule</Text>

          <Pressable onPress={uploadImage}>
            <Image
              source={require('../../assets/images/temp_upload_icon.png')}
              style={[
                styles.upload_icon,
                {
                  borderColor: schedule
                    ? 'rgb(37,37,37)'
                    : 'rgb(184,184,184)',
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
            style={({ pressed }) => [
              styles.button,
              {
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
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