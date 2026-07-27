import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createHouseholdInvitation,
  getHouseholdMembers,
  removeHouseholdMember,
  type HouseholdInvitation,
  type HouseholdMember,
} from '../../api/households';
import type { AuthHousehold, AuthUser } from '../../auth/types';
import { useLanguage } from '../../i18n/LanguageContext';

type HouseholdMembersScreenProps = {
  accessToken: string;
  household: AuthHousehold;
  onBack: () => void;
  user: AuthUser;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

const formatJoinedDate = (
  value: string,
  locale: 'zh-CN' | 'en-NZ',
  text: (zh: string, en: string) => string,
) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text('已加入', 'Joined');

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  return text(`${formattedDate}加入`, `Joined ${formattedDate}`);
};

export function HouseholdMembersScreen({
  accessToken,
  household,
  onBack,
  user,
}: HouseholdMembersScreenProps) {
  const { locale, text } = useLanguage();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<HouseholdInvitation | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getHouseholdMembers(accessToken, household.id);
      setMembers(result);
    } catch (error) {
      setLoadError(error instanceof Error
        ? error.message
        : text('家庭成员加载失败，请重试。', 'Could not load household members. Try again.'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, household.id, text]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const sendInvitation = async () => {
    const email = normalizeEmail(inviteEmail);
    if (!isValidEmail(email)) {
      setInviteError(text('请输入有效的邮箱地址。', 'Enter a valid email address.'));
      return;
    }

    setInviting(true);
    setInviteError(null);
    setInvitation(null);
    try {
      const result = await createHouseholdInvitation(
        accessToken,
        household.id,
        email,
        locale,
      );
      setInvitation(result);
      setInviteEmail('');
    } catch (error) {
      setInviteError(error instanceof Error
        ? error.message
        : text('邀请发送失败，请稍后重试。', 'Could not send the invitation. Try again later.'));
    } finally {
      setInviting(false);
    }
  };

  const confirmRemoval = (member: HouseholdMember) => {
    const identity = member.displayName ?? member.email ?? text('该成员', 'this member');
    Alert.alert(
      text('删除家庭成员', 'Remove household member'),
      text(
        `确定将 ${identity} 移出家庭吗？其已经确认的历史小票会继续保留。`,
        `Remove ${identity} from the household? Their confirmed receipt history will be retained.`,
      ),
      [
        { style: 'cancel', text: text('取消', 'Cancel') },
        {
          style: 'destructive',
          text: text('删除成员', 'Remove'),
          onPress: () => {
            setRemovingUserId(member.userId);
            void removeHouseholdMember(accessToken, household.id, member.userId)
              .then(() => {
                setMembers((current) =>
                  current.filter((item) => item.userId !== member.userId));
              })
              .catch((error) => {
                Alert.alert(
                  text('删除失败', 'Could not remove member'),
                  error instanceof Error
                    ? error.message
                    : text('暂时无法删除该成员。', 'This member could not be removed right now.'),
                );
              })
              .finally(() => setRemovingUserId(null));
          },
        },
      ],
    );
  };

  const isOwner = household.role === 'owner';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.navigation}>
        <Pressable
          accessibilityLabel={text('返回个人中心', 'Back to profile')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.navigationTitle}>{text('家庭成员', 'Household members')}</Text>
          <Text style={styles.navigationSubtitle}>{household.name}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {isOwner && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{text('邀请家庭成员', 'Invite a household member')}</Text>
            <Text style={styles.cardDescription}>
              {text(
                '邀请邮件会发送一次性邀请码，对方明确同意后才会加入家庭。',
                'The email contains a one-time invitation code. They join only after accepting.',
              )}
            </Text>
            <Text style={styles.label}>{text('成员邮箱', 'Member email')}</Text>
            <TextInput
              accessibilityLabel={text('受邀成员邮箱', 'Invited member email')}
              autoCapitalize="none"
              autoComplete="email"
              editable={!inviting}
              keyboardType="email-address"
              onChangeText={(value) => {
                setInviteEmail(value);
                setInviteError(null);
                setInvitation(null);
              }}
              placeholder="family@example.com"
              placeholderTextColor="#95A29B"
              style={styles.input}
              value={inviteEmail}
            />
            {inviteError && (
              <Text accessibilityRole="alert" style={styles.error}>{inviteError}</Text>
            )}
            {invitation && (
              <View accessibilityRole="alert" style={styles.success}>
                <Text style={styles.successTitle}>
                  {text('邀请邮件已发送', 'Invitation email sent')}
                </Text>
                <Text style={styles.successText}>
                  {text(
                    `${invitation.email} 同意邀请后才会出现在成员列表中。`,
                    `${invitation.email} will appear in the member list after accepting.`,
                  )}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={inviting}
              onPress={sendInvitation}
              style={({ pressed }) => [
                styles.primaryButton,
                inviting && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {inviting
                ? <ActivityIndicator color="#1A382D" />
                : (
                  <Text style={styles.primaryButtonText}>
                    {text('发送邀请邮件', 'Send invitation email')}
                  </Text>
                )}
            </Pressable>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{text('当前成员', 'Current members')}</Text>
            <Text style={styles.sectionDescription}>
              {loading
                ? text('正在获取成员…', 'Loading members…')
                : text(
                  `${members.length} 位家庭成员`,
                  `${members.length} household ${members.length === 1 ? 'member' : 'members'}`,
                )}
            </Text>
          </View>
          {!loading && loadError && (
            <Pressable accessibilityRole="button" onPress={() => void loadMembers()}>
              <Text style={styles.retryText}>{text('重试', 'Retry')}</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#315D49" />
          </View>
        ) : loadError ? (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <Text style={styles.errorCardTitle}>
              {text('无法读取家庭成员', 'Could not load household members')}
            </Text>
            <Text style={styles.errorCardText}>{loadError}</Text>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {text('暂时没有成员资料', 'No member details yet')}
            </Text>
            <Text style={styles.emptyText}>
              {text(
                '服务端返回成员后会显示在这里。',
                'Household members will appear here when available.',
              )}
            </Text>
          </View>
        ) : (
          members.map((member) => {
            const isCurrentUser = member.userId === user.id;
            const canRemove = isOwner && member.role !== 'owner' && !isCurrentUser;
            const identity = member.displayName ?? member.email ?? text('家庭成员', 'Household member');

            return (
              <View key={member.userId} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{identity.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.memberIdentity}>
                  <View style={styles.memberNameRow}>
                    <Text numberOfLines={1} style={styles.memberName}>{identity}</Text>
                    {isCurrentUser && <Text style={styles.youBadge}>{text('你', 'You')}</Text>}
                  </View>
                  {member.displayName && member.email && (
                    <Text numberOfLines={1} style={styles.memberEmail}>{member.email}</Text>
                  )}
                  <Text style={styles.memberMeta}>
                    {member.role === 'owner'
                      ? text('管理员', 'Owner')
                      : text('成员', 'Member')} · {formatJoinedDate(member.joinedAt, locale, text)}
                  </Text>
                </View>
                {canRemove && (
                  <Pressable
                    accessibilityLabel={text(`删除成员 ${identity}`, `Remove member ${identity}`)}
                    accessibilityRole="button"
                    disabled={removingUserId !== null}
                    onPress={() => confirmRemoval(member)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      removingUserId && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    {removingUserId === member.userId
                      ? <ActivityIndicator color="#A13D35" size="small" />
                      : <Text style={styles.removeButtonText}>{text('删除', 'Remove')}</Text>}
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F8F4', flex: 1 },
  navigation: { alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomColor: '#E4E9E3', borderBottomWidth: 1, flexDirection: 'row', minHeight: 70, paddingHorizontal: 18 },
  backButton: { alignItems: 'center', height: 44, justifyContent: 'center', marginRight: 8, width: 44 },
  backIcon: { color: '#315D49', fontSize: 38, fontWeight: '300', lineHeight: 40 },
  navigationTitle: { color: '#1F3C31', fontSize: 18, fontWeight: '800' },
  navigationSubtitle: { color: '#7A8A82', fontSize: 12, marginTop: 2 },
  content: { gap: 18, padding: 20, paddingBottom: 34 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8E1', borderRadius: 18, borderWidth: 1, padding: 18 },
  cardTitle: { color: '#203E32', fontSize: 18, fontWeight: '800' },
  cardDescription: { color: '#6D7F76', fontSize: 13, lineHeight: 19, marginTop: 6 },
  label: { color: '#425B50', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 18 },
  input: { backgroundColor: '#F8FAF7', borderColor: '#D9E1D9', borderRadius: 12, borderWidth: 1, color: '#203A30', fontSize: 15, minHeight: 50, paddingHorizontal: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: '#D9E965', borderRadius: 12, justifyContent: 'center', marginTop: 14, minHeight: 50 },
  primaryButtonText: { color: '#1A382D', fontSize: 14, fontWeight: '800' },
  success: { backgroundColor: '#EAF4E5', borderRadius: 12, marginTop: 12, padding: 13 },
  successTitle: { color: '#2F654C', fontSize: 13, fontWeight: '800' },
  successText: { color: '#557066', fontSize: 12, lineHeight: 18, marginTop: 4 },
  error: { color: '#A13D35', fontSize: 12, marginTop: 8 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#1F3C31', fontSize: 20, fontWeight: '800' },
  sectionDescription: { color: '#7A8A82', fontSize: 12, marginTop: 3 },
  retryText: { color: '#315D49', fontSize: 13, fontWeight: '800', padding: 8 },
  loading: { alignItems: 'center', minHeight: 100, paddingTop: 30 },
  errorCard: { backgroundColor: '#FFF0ED', borderRadius: 14, padding: 16 },
  errorCardTitle: { color: '#943F37', fontSize: 14, fontWeight: '800' },
  errorCardText: { color: '#A85A52', fontSize: 12, lineHeight: 18, marginTop: 5 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8E1', borderRadius: 16, borderWidth: 1, padding: 20 },
  emptyTitle: { color: '#365246', fontSize: 15, fontWeight: '800' },
  emptyText: { color: '#74877D', fontSize: 12, marginTop: 5 },
  memberCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E2E8E1', borderRadius: 16, borderWidth: 1, flexDirection: 'row', padding: 15 },
  avatar: { alignItems: 'center', backgroundColor: '#DCE9D4', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: '#315D49', fontSize: 17, fontWeight: '800' },
  memberIdentity: { flex: 1, marginLeft: 12 },
  memberNameRow: { alignItems: 'center', flexDirection: 'row' },
  memberName: { color: '#263C33', flexShrink: 1, fontSize: 15, fontWeight: '800' },
  youBadge: { backgroundColor: '#EEF4E9', borderRadius: 8, color: '#52705F', fontSize: 10, fontWeight: '800', marginLeft: 7, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3 },
  memberEmail: { color: '#71847B', fontSize: 12, marginTop: 3 },
  memberMeta: { color: '#829188', fontSize: 11, marginTop: 4 },
  removeButton: { alignItems: 'center', borderColor: '#E8C3BE', borderRadius: 10, borderWidth: 1, justifyContent: 'center', minHeight: 40, minWidth: 58, paddingHorizontal: 10 },
  removeButtonText: { color: '#A13D35', fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.72 },
});
