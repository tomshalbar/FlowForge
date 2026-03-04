import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const signUp = () => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>
        <Text style={styles.title}>Sign Up Template</Text>

        <Pressable
          onPress={() => {
            // add function to save user input
            router.replace('/(onboarding)');
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

        <Pressable
          onPress={() => {
            // function to save user input
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
      </LinearGradient>
    </View>
  );
};

export default signUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  title: {
    color: 'black',
    fontSize: 50,
    textAlign: 'center',
    fontWeight: '600',
  },
  gradient: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  nextButtonStyle: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
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
