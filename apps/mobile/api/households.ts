import type { AuthHousehold, HouseholdRole } from '../auth/types';
import { isRecord, publicRequest } from './base';

export type HouseholdInvitationPreview = {
  household: {
    id: string;
    name: string;
  };
  invitedEmail: string;
  expiresAt: string;
};

export type HouseholdInvitationAcceptance = {
  activeHouseholdId: string;
  household: AuthHousehold;
  onboardingState: 'ready';
};

export type HouseholdMember = {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: HouseholdRole;
  joinedAt: string;
};

export type HouseholdInvitation = {
  invitationId: string;
  email: string;
  expiresAt: string;
};

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

const isRole = (value: unknown): value is HouseholdRole =>
  value === 'owner' || value === 'member';

const isHousehold = (value: unknown): value is AuthHousehold =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.name === 'string'
  && isRole(value.role);

const authorizationHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

export const normalizeInvitationCode = (code: string) =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

export async function createHouseholdInvitation(
  accessToken: string,
  householdId: string,
  email: string,
  locale: 'zh-CN' | 'en-NZ',
) {
  const data = await publicRequest<unknown>(
    `/households/${encodeURIComponent(householdId)}/invitations`,
    {
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        locale,
      }),
      headers: authorizationHeaders(accessToken),
      method: 'POST',
    },
  );

  if (!isRecord(data)
    || typeof data.invitationId !== 'string'
    || typeof data.email !== 'string'
    || typeof data.expiresAt !== 'string') {
    throw new Error('邀请接口返回的数据格式不正确。');
  }

  return data as HouseholdInvitation;
}

export async function previewHouseholdInvitation(
  accessToken: string,
  code: string,
) {
  const data = await publicRequest<unknown>('/household-invitations/preview', {
    body: JSON.stringify({ code: normalizeInvitationCode(code) }),
    headers: authorizationHeaders(accessToken),
    method: 'POST',
  });

  if (!isRecord(data)
    || !isRecord(data.household)
    || typeof data.household.id !== 'string'
    || typeof data.household.name !== 'string'
    || typeof data.invitedEmail !== 'string'
    || typeof data.expiresAt !== 'string') {
    throw new Error('邀请预览接口返回的数据格式不正确。');
  }

  return data as HouseholdInvitationPreview;
}

export async function acceptHouseholdInvitation(
  accessToken: string,
  code: string,
) {
  const data = await publicRequest<unknown>('/household-invitations/accept', {
    body: JSON.stringify({ code: normalizeInvitationCode(code) }),
    headers: authorizationHeaders(accessToken),
    method: 'POST',
  });

  if (!isRecord(data)
    || !isHousehold(data.household)
    || typeof data.activeHouseholdId !== 'string'
    || data.onboardingState !== 'ready') {
    throw new Error('接受邀请接口返回的数据格式不正确。');
  }

  return data as HouseholdInvitationAcceptance;
}

export async function getHouseholdMembers(
  accessToken: string,
  householdId: string,
) {
  const data = await publicRequest<unknown>(
    `/households/${encodeURIComponent(householdId)}/members`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!isRecord(data) || !Array.isArray(data.members)) {
    throw new Error('家庭成员接口返回的数据格式不正确。');
  }

  const members = data.members;
  if (!members.every((member): member is HouseholdMember =>
    isRecord(member)
    && typeof member.userId === 'string'
    && isNullableString(member.displayName)
    && isNullableString(member.email)
    && isRole(member.role)
    && typeof member.joinedAt === 'string')) {
    throw new Error('家庭成员列表包含无法读取的数据。');
  }

  return members;
}

export async function removeHouseholdMember(
  accessToken: string,
  householdId: string,
  userId: string,
) {
  await publicRequest<unknown>(
    `/households/${encodeURIComponent(householdId)}/members/${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: 'DELETE',
    },
  );
}
