import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const app = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Main page</Text>

      <Link href="/activity" style={styles.link} asChild>
        <Pressable style={styles.activityButtonStyle}>
          <Text style={styles.activityButtonText}>activity</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default app;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  title: {
    color: 'black',
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 120,
  },
  link: {
    marginHorizontal: 'auto',
  },
  image: {
    width: '100%',
    height: '100%',
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  activityButtonStyle: {
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    justifyContent: 'center',
  },
  activityButtonText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
