import OnboardingWelcome from '@/app/(onboarding)/index'; // adjust path as needed
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock the AuthScreenLayout to render children directly
jest.mock('@/app/screenTemplate', () => {
  const { View } = require('react-native');
  return ({ headerContent, middleContent, bottomContent }: any) => (
    <View>
      {headerContent}
      {middleContent}
      {bottomContent}
    </View>
  );
});

// Mock the logo image
jest.mock('@/assets/images/tempLogo.png', () => 'tempLogo');

import { router } from 'expo-router';

describe('OnboardingWelcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title text', () => {
    const { getByText } = render(<OnboardingWelcome />);
    expect(getByText('Let’s get started')).toBeTruthy();
  });

  it('renders the description text', () => {
    const { getByText } = render(<OnboardingWelcome />);
    expect(
      getByText(
        'We will collect information about your preferences and schedule in the upcoming screens',
      ),
    ).toBeTruthy();
  });

  it('renders the onboard button', () => {
    const { getByText } = render(<OnboardingWelcome />);
    expect(getByText('Onboard')).toBeTruthy();
  });

  it('navigates to personalInfoScreen when onboard button is pressed', () => {
    const { getByText } = render(<OnboardingWelcome />);
    fireEvent.press(getByText('Onboard'));
    expect(router.push).toHaveBeenCalledWith(
      '/(onboarding)/personalInfoScreen',
    );
  });

  it('calls router.push exactly once when button is pressed', () => {
    const { getByText } = render(<OnboardingWelcome />);
    fireEvent.press(getByText('Onboard'));
    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
