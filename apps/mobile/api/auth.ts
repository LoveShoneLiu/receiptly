import { Platform } from 'react-native';

import type {
  AuthHousehold,
  AuthSession,
  AuthUser,
  DeviceInfo,
  LoginSessionPayload,
  OnboardingState,
} from '../auth/types';
import { getInstallationId } from '../auth/storage';
import { isRecord, publicRequest } from './base';

type ChallengeProvider = 'apple' | 'google';

export type AuthChallenge = {
  attemptId: string;
  nonce: string | null;
  state: string | null;
  expiresIn: number;
};

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

const isOnboardingState = (value: unknown): value is OnboardingState =>
  value === 'needs_household' || value === 'ready';

const isUser = (value: unknown): value is AuthUser =>
  isRecord(value)
  && typeof value.id === 'string'
  && isNullableString(value.email)
  && isNullableString(value.displayName);

const isHousehold = (value: unknown): value is AuthHousehold =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.name === 'string'
  && (value.role === 'owner' || value.role === 'member');

const parseLoginPayload = (value: unknown): LoginSessionPayload => {
  if (!isRecord(value)
    || typeof value.accessToken !== 'string'
    || typeof value.refreshToken !== 'string'
    || !Number.isFinite(value.expiresIn)
    || typeof value.sessionId !== 'string'
    || !isUser(value.user)
    || !Array.isArray(value.households)
    || !value.households.every(isHousehold)
    || !isNullableString(value.activeHouseholdId)
    || !isOnboardingState(value.onboardingState)
    || typeof value.isNewUser !== 'boolean') {
    throw new Error('登录接口返回的数据格式不正确。');
  }

  return value as LoginSessionPayload;
};

const toSession = (payload: LoginSessionPayload): AuthSession => ({
  accessToken: payload.accessToken,
  activeHouseholdId: payload.activeHouseholdId,
  expiresAt: Date.now() + payload.expiresIn * 1000,
  households: payload.households,
  onboardingState: payload.onboardingState,
  refreshToken: payload.refreshToken,
  sessionId: payload.sessionId,
  user: payload.user,
});

export const getDeviceInfo = async (): Promise<DeviceInfo> => ({
  installationId: await getInstallationId(),
  name: Platform.OS === 'ios' ? 'iPhone' : 'Android device',
  platform: Platform.OS === 'android' ? 'android' : 'ios',
});

export async function createAuthChallenge(provider: ChallengeProvider) {
  const data = await publicRequest<unknown>('/auth/challenges', {
    body: JSON.stringify({ provider }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!isRecord(data)
    || typeof data.attemptId !== 'string'
    || !isNullableString(data.nonce)
    || !isNullableString(data.state)
    || !Number.isFinite(data.expiresIn)) {
    throw new Error('登录 Challenge 响应格式不正确。');
  }

  return data as AuthChallenge;
}

export async function loginWithGoogle(attemptId: string, idToken: string) {
  const data = await publicRequest<unknown>('/auth/google', {
    body: JSON.stringify({
      attemptId,
      device: await getDeviceInfo(),
      idToken,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return toSession(parseLoginPayload(data));
}

export async function loginWithApple(input: {
  attemptId: string;
  authorizationCode: string;
  identityToken: string;
  profile: {
    email: string | null;
    familyName: string | null;
    givenName: string | null;
  };
}) {
  const data = await publicRequest<unknown>('/auth/apple', {
    body: JSON.stringify({
      ...input,
      device: await getDeviceInfo(),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return toSession(parseLoginPayload(data));
}

export async function requestEmailCode(email: string) {
  const data = await publicRequest<unknown>('/auth/email/request-code', {
    body: JSON.stringify({ email: email.trim().toLowerCase(), locale: 'zh-CN' }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!isRecord(data)
    || !Number.isFinite(data.expiresIn)
    || !Number.isFinite(data.resendAfter)) {
    throw new Error('验证码接口返回的数据格式不正确。');
  }
  return {
    expiresIn: Number(data.expiresIn),
    resendAfter: Number(data.resendAfter),
  };
}

export async function verifyEmailCode(email: string, code: string) {
  const data = await publicRequest<unknown>('/auth/email/verify-code', {
    body: JSON.stringify({
      code,
      device: await getDeviceInfo(),
      email: email.trim().toLowerCase(),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return toSession(parseLoginPayload(data));
}

export async function loginWithEmailPassword(email: string, password: string) {
  const data = await publicRequest<unknown>('/auth/email/login', {
    body: JSON.stringify({
      device: await getDeviceInfo(),
      email: email.trim().toLowerCase(),
      password,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return toSession(parseLoginPayload(data));
}

export async function registerWithEmailPassword(input: {
  code: string;
  displayName: string | null;
  email: string;
  password: string;
}) {
  const data = await publicRequest<unknown>('/auth/email/register', {
    body: JSON.stringify({
      device: await getDeviceInfo(),
      ...input,
      email: input.email.trim().toLowerCase(),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return toSession(parseLoginPayload(data));
}

export async function refreshSession(refreshToken: string, current: AuthSession) {
  const data = await publicRequest<unknown>('/auth/refresh', {
    body: JSON.stringify({
      installationId: (await getDeviceInfo()).installationId,
      refreshToken,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!isRecord(data)
    || typeof data.accessToken !== 'string'
    || typeof data.refreshToken !== 'string'
    || !Number.isFinite(data.expiresIn)
    || typeof data.sessionId !== 'string') {
    throw new Error('刷新登录状态的响应格式不正确。');
  }
  return {
    ...current,
    accessToken: data.accessToken,
    expiresAt: Date.now() + Number(data.expiresIn) * 1000,
    refreshToken: data.refreshToken,
    sessionId: data.sessionId,
  };
}

export async function getMe(accessToken: string, current: AuthSession) {
  const data = await publicRequest<unknown>('/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!isRecord(data)
    || !isUser(data.user)
    || !Array.isArray(data.households)
    || !data.households.every(isHousehold)
    || !isNullableString(data.activeHouseholdId)
    || !isOnboardingState(data.onboardingState)) {
    throw new Error('账号接口返回的数据格式不正确。');
  }
  return {
    ...current,
    activeHouseholdId: data.activeHouseholdId,
    households: data.households,
    onboardingState: data.onboardingState,
    user: data.user,
  };
}

export async function logoutSession(accessToken: string) {
  await publicRequest<unknown>('/auth/logout', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });
}

export async function createHousehold(accessToken: string, name: string) {
  const data = await publicRequest<unknown>('/households', {
    body: JSON.stringify({
      currency: 'NZD',
      name: name.trim(),
      timezone: 'Pacific/Auckland',
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (!isRecord(data)
    || !isHousehold(data.household)
    || typeof data.activeHouseholdId !== 'string'
    || data.onboardingState !== 'ready') {
    throw new Error('创建家庭接口返回的数据格式不正确。');
  }
  return data as {
    activeHouseholdId: string;
    household: AuthHousehold;
    onboardingState: 'ready';
  };
}
