import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type AuthScreenLayoutProps = {
  headerContent: ReactNode;
  middleContent: ReactNode;
  bottomContent: ReactNode;
};

export default function AuthScreenLayout({
  headerContent,
  middleContent,
  bottomContent,
}: AuthScreenLayoutProps) {
  return (
    <LinearGradient colors={['#F5B3B6', '#C94B52']} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.headerSection}>{headerContent}</View>

              <View style={styles.middleSection}>{middleContent}</View>

              <View style={styles.bottomSection}>{bottomContent}</View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 80,
  },
  gradient: {
    flex: 1,
    borderRadius: 5,
  },
  headerSection: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingBottom: 80,
    alignItems: 'center',
  },
});
