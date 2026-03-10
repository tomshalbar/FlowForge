import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const presonalInfoScreen = () => {
  const [wakeTime, setWakeTime] = useState('7:00 AM');
  const [sleepTime, setSleepTime] = useState('11:00 PM');

  const times = [
    '5:00 AM','6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
    '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM','12:00 AM'
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>

        <Text style={styles.title}>Tell us about you</Text>

        <Text style={styles.subtitle}>
          We'll use this to personalize your schedule.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          keyboardType="numeric"
          placeholderTextColor="#aaa"
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

        <Pressable
          onPress={() => {
            router.push('/(onboarding)/preferencesScreen');
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
                },
              ]}
            >
              Back
            </Text>
          )}
        </Pressable>

      </LinearGradient>
    </ScrollView>
  );
};

export default presonalInfoScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  gradient: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100%',
  },

  title: {
    color: 'black',
    fontSize: 38,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 60,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#2b2b2b',
    marginBottom: 30,
  },

  input: {
    width: '90%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
  },

  label: {
    width: '90%',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
    color: 'black',
  },

  dropdown: {
    width: '90%',
    height: 150, // important so wheel shows
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