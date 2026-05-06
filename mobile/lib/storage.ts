// Resumable onboarding state (FR-ONB-05).
// Records the last completed step so we can route the user back if they drop off.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'swipewise.onboarding.step';

export type OnboardingStep =
  | 'landing'
  | 'phone'
  | 'otp'
  | 'plaid'
  | 'manual'
  | 'done';

export async function setStep(step: OnboardingStep): Promise<void> {
  await AsyncStorage.setItem(KEY, step);
}

export async function getStep(): Promise<OnboardingStep | null> {
  return (await AsyncStorage.getItem(KEY)) as OnboardingStep | null;
}
