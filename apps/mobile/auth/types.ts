export type HouseholdRole = 'owner' | 'member';
export type OnboardingState = 'needs_profile' | 'needs_household' | 'ready';

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type AuthHousehold = {
  id: string;
  name: string;
  role: HouseholdRole;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  sessionId: string;
  user: AuthUser;
  households: AuthHousehold[];
  activeHouseholdId: string | null;
  onboardingState: OnboardingState;
};

export type LoginSessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: AuthUser;
  households: AuthHousehold[];
  activeHouseholdId: string | null;
  onboardingState: OnboardingState;
  isNewUser: boolean;
};

export type DeviceInfo = {
  installationId: string;
  name: string;
  platform: 'ios' | 'android';
};
