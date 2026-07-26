import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from './types';

const SESSION_KEY = 'receiptly.auth.session.v1';
const INSTALLATION_KEY = 'receiptly.installation.id.v1';

export const loadStoredSession = async () => {
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
};

export const saveStoredSession = (session: AuthSession) =>
  SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));

export const clearStoredSession = () =>
  SecureStore.deleteItemAsync(SESSION_KEY);

export const getInstallationId = async () => {
  const stored = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (stored) return stored;

  const installationId = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_KEY, installationId);
  return installationId;
};
