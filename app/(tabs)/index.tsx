import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const mainAppPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Main page template</Text>
    </View>
  );
};

export default mainAppPage;

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
