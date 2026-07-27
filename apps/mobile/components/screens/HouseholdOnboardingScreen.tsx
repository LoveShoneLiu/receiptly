import { useState } from 'react';
import {
  ActivityIndicator,
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
  normalizeInvitationCode,
  previewHouseholdInvitation,
  type HouseholdInvitationPreview,
} from '../../api/households';
import { useAuth } from '../../auth/AuthContext';

type OnboardingMode = 'create' | 'join';

const formatExpiry = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('zh-CN', {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'long',
    }).format(date);
};

export function HouseholdOnboardingScreen() {
  const {
    acceptHouseholdInvitation,
    createHousehold,
    logout,
    session,
  } = useAuth();
  const [mode, setMode] = useState<OnboardingMode>('create');
  const [name, setName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [invitation, setInvitation] = useState<HouseholdInvitationPreview | null>(null);
  const [busy, setBusy] = useState<'accept' | 'create' | 'preview' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changeMode = (nextMode: OnboardingMode) => {
    if (busy) return;
    setMode(nextMode);
    setError(null);
    setInvitation(null);
  };

  const submitHousehold = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('请输入家庭名称。');
      return;
    }

    setBusy('create');
    setError(null);
    try {
      await createHousehold(normalizedName);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '创建家庭失败，请重试。');
    } finally {
      setBusy(null);
    }
  };

  const previewInvitation = async () => {
    const code = normalizeInvitationCode(invitationCode);
    if (code.length < 6) {
      setError('请输入邮件中的 6–8 位邀请码。');
      return;
    }
    if (!session) {
      setError('登录状态已失效，请重新登录。');
      return;
    }

    setBusy('preview');
    setError(null);
    setInvitation(null);
    try {
      const result = await previewHouseholdInvitation(session.accessToken, code);
      setInvitationCode(code);
      setInvitation(result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '无法查询邀请，请稍后重试。');
    } finally {
      setBusy(null);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation) return;
    setBusy('accept');
    setError(null);
    try {
      await acceptHouseholdInvitation(invitationCode);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '加入家庭失败，请稍后重试。');
      setBusy(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>首次设置</Text>
          <Text style={styles.title}>设置家庭账本</Text>
          <Text style={styles.subtitle}>
            登录成功，{session?.user.displayName ?? session?.user.email ?? '欢迎你'}。创建一个家庭，或使用邮件中的邀请码加入。
          </Text>

          <View accessibilityRole="tablist" style={styles.modeSelector}>
            <ModeButton
              label="创建家庭"
              onPress={() => changeMode('create')}
              selected={mode === 'create'}
            />
            <ModeButton
              label="加入家庭"
              onPress={() => changeMode('join')}
              selected={mode === 'join'}
            />
          </View>

          {mode === 'create' ? (
            <>
              <Text style={styles.label}>家庭名称</Text>
              <TextInput
                accessibilityLabel="家庭名称"
                autoCapitalize="words"
                editable={!busy}
                maxLength={80}
                onChangeText={setName}
                placeholder="例如：Liu Family"
                placeholderTextColor="#95A29B"
                style={styles.input}
                value={name}
              />
              <Pressable
                accessibilityRole="button"
                disabled={busy !== null}
                onPress={submitHousehold}
                style={({ pressed }) => [
                  styles.primary,
                  busy && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {busy === 'create'
                  ? <ActivityIndicator color="#1A382D" />
                  : <Text style={styles.primaryText}>创建并进入账本</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>家庭邀请码</Text>
              <TextInput
                accessibilityLabel="家庭邀请码"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!busy && !invitation}
                maxLength={8}
                onChangeText={(value) => {
                  setInvitationCode(normalizeInvitationCode(value));
                  setError(null);
                }}
                placeholder="例如：A7KM3X9P"
                placeholderTextColor="#95A29B"
                style={[styles.input, styles.codeInput]}
                value={invitationCode}
              />

              {invitation ? (
                <View style={styles.invitationCard}>
                  <Text style={styles.invitationEyebrow}>邀请有效</Text>
                  <Text style={styles.invitationTitle}>{invitation.household.name}</Text>
                  <Text style={styles.invitationText}>受邀邮箱：{invitation.invitedEmail}</Text>
                  <Text style={styles.invitationText}>
                    有效期至：{formatExpiry(invitation.expiresAt)}
                  </Text>
                  <Text style={styles.invitationNotice}>
                    同意后，你扫描并确认的小票会进入这个家庭账本。
                  </Text>
                </View>
              ) : (
                <Text style={styles.helpText}>输入邀请邮件中的代码，确认家庭后再决定是否加入。</Text>
              )}

              <Pressable
                accessibilityRole="button"
                disabled={busy !== null}
                onPress={invitation ? acceptInvitation : previewInvitation}
                style={({ pressed }) => [
                  styles.primary,
                  busy && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {busy === 'preview' || busy === 'accept'
                  ? <ActivityIndicator color="#1A382D" />
                  : (
                    <Text style={styles.primaryText}>
                      {invitation ? '同意加入家庭' : '查看邀请'}
                    </Text>
                  )}
              </Pressable>

              {invitation && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy !== null}
                  onPress={() => {
                    setInvitation(null);
                    setInvitationCode('');
                    setError(null);
                  }}
                  style={styles.secondary}
                >
                  <Text style={styles.secondaryText}>使用其他邀请码</Text>
                </Pressable>
              )}
            </>
          )}

          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityRole="button"
            disabled={busy !== null}
            onPress={() => void logout()}
            style={styles.logout}
          >
            <Text style={styles.logoutText}>退出登录</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.modeButton, selected && styles.modeButtonSelected]}
    >
      <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#F7F8F4', flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E1E7E0', borderRadius: 22, borderWidth: 1, padding: 22 },
  eyebrow: { color: '#557066', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18382D', fontSize: 27, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#667970', fontSize: 14, lineHeight: 21, marginTop: 10 },
  modeSelector: { backgroundColor: '#EDF1EC', borderRadius: 14, flexDirection: 'row', marginTop: 22, padding: 4 },
  modeButton: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 44 },
  modeButtonSelected: { backgroundColor: '#FFFFFF' },
  modeText: { color: '#6B7C74', fontSize: 14, fontWeight: '700' },
  modeTextSelected: { color: '#23483A' },
  label: { color: '#425B50', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 22 },
  input: { backgroundColor: '#F8FAF7', borderColor: '#D9E1D9', borderRadius: 12, borderWidth: 1, color: '#203A30', fontSize: 16, minHeight: 52, paddingHorizontal: 14 },
  codeInput: { fontSize: 19, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  helpText: { color: '#71847B', fontSize: 12, lineHeight: 18, marginTop: 9 },
  invitationCard: { backgroundColor: '#EFF5E9', borderRadius: 14, marginTop: 14, padding: 16 },
  invitationEyebrow: { color: '#52705F', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  invitationTitle: { color: '#1D4334', fontSize: 20, fontWeight: '800', marginTop: 7 },
  invitationText: { color: '#61756A', fontSize: 12, marginTop: 5 },
  invitationNotice: { color: '#365848', fontSize: 13, lineHeight: 19, marginTop: 12 },
  primary: { alignItems: 'center', backgroundColor: '#D9E965', borderRadius: 12, justifyContent: 'center', marginTop: 18, minHeight: 52 },
  primaryText: { color: '#1A382D', fontSize: 15, fontWeight: '800' },
  secondary: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  secondaryText: { color: '#557066', fontSize: 13, fontWeight: '700' },
  error: { color: '#A13D35', fontSize: 13, lineHeight: 19, marginTop: 12 },
  logout: { alignItems: 'center', justifyContent: 'center', marginTop: 8, minHeight: 44 },
  logoutText: { color: '#667970', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
