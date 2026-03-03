import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const authIndex = () => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>
        <Text style={styles.title}>FlowForge</Text>
        <Text style={styles.aboutText}>
          Build a schedule that balances work, exercise, and recovery.
        </Text>
        <Image
          source={require('../../assets/images/tempLogo.png')}
          style={styles.big_logo}
        />

        <Pressable
          onPress={() => {
            // add function to save user input
            router.push('/(auth)/signUp');
          }}
          style={({ pressed }) => [
            styles.getStartedButtonStyle,
            {
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            },
          ]}
        >
          <Text style={styles.activityButtonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.smallText}>Already have an account?</Text>

        <Pressable
          onPress={() => {
            // function to save user input
            router.push('/(auth)/signIn');
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
              Sign In
            </Text>
          )}
        </Pressable>
      </LinearGradient>
    </View>
  );
};

export default authIndex;

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
  aboutText: {
    color: 'rgba(0, 0, 0, .6)',
    fontSize: 24,
    padding: 20,
    textAlign: 'center',
  },
  big_logo: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginTop: 80,
    marginBottom: 100,
  },
  gradient: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  getStartedButtonStyle: {
    width: 200,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(163,51,58,1)',
    justifyContent: 'center',
  },
  activityButtonText: {
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
