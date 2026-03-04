import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const activityPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity page template</Text>
    </View>
  );
};

export default activityPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  title: {
    color: 'black',
    fontSize: 42,
    textAlign: 'center',
    marginTop: 100,
  },
});
