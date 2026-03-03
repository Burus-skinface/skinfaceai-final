/**
 * User Types and Authentication
 */

export interface OnboardingData {
  age: number;
  gender: 'male' | 'female' | 'other';
  skinGoals: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  provider: 'google' | 'anonymous';
  createdAt: string;
  onboardingData?: OnboardingData;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  needsOnboarding: boolean;
}

