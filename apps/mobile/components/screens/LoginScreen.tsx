import { useEffect, useState } from 'react';
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
  loginWithEmailPassword,
  registerWithEmailPassword,
  requestEmailCode,
  verifyEmailCode,
} from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';

type EmailMode = 'login' | 'register' | 'code';
type BusyAction =
  | 'email-login'
  | 'email-register'
  | 'email-request'
  | 'email-verify'
  | null;

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : '登录失败，请稍后重试。';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const validateEmail = (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('请输入有效的邮箱地址。');
  }
  return normalizedEmail;
};

export function LoginScreen() {
  const { acceptSession } = useAuth();
  const [busy, setBusy] = useState<BusyAction>(null);
  const [email, setEmail] = useState('');
  const [emailMode, setEmailMode] = useState<EmailMode>('login');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [registrationCodeRequested, setRegistrationCodeRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const run = async (action: Exclude<BusyAction, null>, task: () => Promise<void>) => {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      await task();
    } catch (nextError) {
      setError(getMessage(nextError));
    } finally {
      setBusy(null);
    }
  };

  const requestCode = () => run('email-request', async () => {
    const normalizedEmail = validateEmail(email);
    const result = await requestEmailCode(normalizedEmail);
    setEmail(normalizedEmail);
    if (emailMode === 'register') setRegistrationCodeRequested(true);
    else setCodeRequested(true);
    setResendSeconds(result.resendAfter);
  });

  const verifyCode = () => run('email-verify', async () => {
    if (!/^\d{6}$/.test(code)) throw new Error('请输入六位数字验证码。');
    const session = await verifyEmailCode(email, code);
    await acceptSession(session);
  });

  const submitPasswordLogin = () => run('email-login', async () => {
    const normalizedEmail = validateEmail(email);
    if (!password) throw new Error('请输入密码。');
    const session = await loginWithEmailPassword(normalizedEmail, password);
    await acceptSession(session);
  });

  const submitPasswordRegistration = () => run('email-register', async () => {
    const normalizedEmail = validateEmail(email);
    if (!/^\d{6}$/.test(code)) throw new Error('请输入六位数字验证码。');
    if (password.length < 8) throw new Error('密码至少需要 8 个字符。');
    if (new TextEncoder().encode(password).length > 72) {
      throw new Error('密码的 UTF-8 编码不能超过 72 字节。');
    }
    if (password !== passwordConfirmation) throw new Error('两次输入的密码不一致。');
    const session = await registerWithEmailPassword({
      code,
      displayName: displayName.trim() || null,
      email: normalizedEmail,
      password,
    });
    await acceptSession(session);
  });

  const changeEmailMode = (nextMode: EmailMode) => {
    setEmailMode(nextMode);
    setCode('');
    setCodeRequested(false);
    setDisplayName('');
    setPassword('');
    setPasswordConfirmation('');
    setRegistrationCodeRequested(false);
    setError(null);
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
        <View style={styles.brand}>
          <Text style={styles.eyebrow}>RECEIPTLY</Text>
          <Text style={styles.title}>登录家庭账本</Text>
          <Text style={styles.subtitle}>你的购物小票和消费记录仅对家庭成员可见。</Text>
        </View>

        <View style={styles.card}>
          <View accessibilityRole="tablist" style={styles.modeSelector}>
            <ModeButton
              label="密码登录"
              onPress={() => changeEmailMode('login')}
              selected={emailMode === 'login'}
            />
            <ModeButton
              label="注册账号"
              onPress={() => changeEmailMode('register')}
              selected={emailMode === 'register'}
            />
            <ModeButton
              label="验证码"
              onPress={() => changeEmailMode('code')}
              selected={emailMode === 'code'}
            />
          </View>

          <Text style={styles.label}>邮箱</Text>
          <TextInput
            accessibilityLabel="邮箱地址"
            autoCapitalize="none"
            autoComplete="email"
            editable={
              (emailMode !== 'code' || !codeRequested)
              && (emailMode !== 'register' || !registrationCodeRequested)
              && !busy
            }
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#95A29B"
            style={styles.input}
            value={email}
          />

          {emailMode === 'register' && registrationCodeRequested && (
            <>
              <Text style={styles.label}>显示名称（可选）</Text>
              <TextInput
                accessibilityLabel="显示名称"
                autoCapitalize="words"
                maxLength={80}
                onChangeText={setDisplayName}
                placeholder="例如：Shaofei Liu"
                placeholderTextColor="#95A29B"
                style={styles.input}
                value={displayName}
              />
              <Text style={styles.label}>六位验证码</Text>
              <TextInput
                accessibilityLabel="注册邮箱六位验证码"
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
                placeholder="000000"
                placeholderTextColor="#95A29B"
                style={styles.input}
                value={code}
              />
            </>
          )}

          {(emailMode === 'login'
            || (emailMode === 'register' && registrationCodeRequested)) && (
            <>
              <Text style={styles.label}>密码</Text>
              <TextInput
                accessibilityLabel={emailMode === 'register' ? '设置密码' : '密码'}
                autoCapitalize="none"
                autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'}
                onChangeText={setPassword}
                passwordRules={emailMode === 'register' ? 'minlength: 8;' : undefined}
                placeholder={emailMode === 'register' ? '至少 8 个字符' : '输入密码'}
                placeholderTextColor="#95A29B"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </>
          )}

          {emailMode === 'register' && registrationCodeRequested && (
            <>
              <Text style={styles.label}>确认密码</Text>
              <TextInput
                accessibilityLabel="确认密码"
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setPasswordConfirmation}
                placeholder="再次输入密码"
                placeholderTextColor="#95A29B"
                secureTextEntry
                style={styles.input}
                value={passwordConfirmation}
              />
              <Text style={styles.passwordHint}>
                至少 8 个字符、UTF-8 最多 72 字节；建议使用不与其他网站重复的密码。
              </Text>
            </>
          )}

          {emailMode === 'code' && codeRequested && (
            <>
              <Text style={styles.label}>六位验证码</Text>
              <TextInput
                accessibilityLabel="六位邮箱验证码"
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
                placeholder="000000"
                placeholderTextColor="#95A29B"
                style={styles.input}
                value={code}
              />
            </>
          )}

          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityRole="button"
            disabled={Boolean(busy)}
            onPress={emailMode === 'login'
              ? submitPasswordLogin
              : emailMode === 'register'
                ? registrationCodeRequested
                  ? submitPasswordRegistration
                  : requestCode
                : codeRequested
                  ? verifyCode
                  : requestCode}
            style={({ pressed }) => [
              styles.emailButton,
              Boolean(busy) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {busy?.startsWith('email-')
              ? <ActivityIndicator color="#1A382D" />
              : <Text style={styles.emailButtonText}>
                {emailMode === 'login'
                  ? '登录'
                  : emailMode === 'register'
                    ? registrationCodeRequested
                      ? '完成注册'
                      : '发送注册验证码'
                    : codeRequested
                      ? '验证并登录'
                      : '发送验证码'}
              </Text>}
          </Pressable>

          {((emailMode === 'code' && codeRequested)
            || (emailMode === 'register' && registrationCodeRequested)) && (
            <View style={styles.codeActions}>
              <Pressable
                accessibilityRole="button"
                disabled={resendSeconds > 0 || Boolean(busy)}
                onPress={requestCode}
                style={styles.textButton}
              >
                <Text style={[styles.textButtonLabel, resendSeconds > 0 && styles.muted]}>
                  {resendSeconds > 0 ? `${resendSeconds} 秒后重新发送` : '重新发送验证码'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setCodeRequested(false);
                  setRegistrationCodeRequested(false);
                  setCode('');
                  setError(null);
                }}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>更换邮箱</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.privacy}>
          登录即表示你同意仅将账号资料用于家庭账本、身份验证和数据保护。
        </Text>
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
      style={({ pressed }) => [
        styles.modeButton,
        selected && styles.modeButtonSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#F7F8F4', flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { marginBottom: 24 },
  eyebrow: { color: '#557066', fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#17372C', fontSize: 32, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#667970', fontSize: 14, lineHeight: 21, marginTop: 8 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8E1', borderRadius: 22, borderWidth: 1, padding: 20 },
  modeSelector: { backgroundColor: '#F0F4EF', borderRadius: 12, flexDirection: 'row', padding: 4 },
  modeButton: { alignItems: 'center', borderRadius: 9, flex: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 5 },
  modeButtonSelected: { backgroundColor: '#FFFFFF' },
  modeButtonText: { color: '#687A71', fontSize: 11, fontWeight: '700' },
  modeButtonTextSelected: { color: '#244F40' },
  label: { color: '#425B50', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: '#F8FAF7', borderColor: '#D9E1D9', borderRadius: 12, borderWidth: 1, color: '#203A30', fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  passwordHint: { color: '#7C8B83', fontSize: 11, lineHeight: 16, marginTop: 7 },
  error: { color: '#A13D35', fontSize: 13, lineHeight: 19, marginTop: 14 },
  emailButton: { alignItems: 'center', backgroundColor: '#D9E965', borderRadius: 12, justifyContent: 'center', marginTop: 18, minHeight: 52 },
  emailButtonText: { color: '#1A382D', fontSize: 15, fontWeight: '800' },
  codeActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  textButton: { justifyContent: 'center', minHeight: 44 },
  textButtonLabel: { color: '#356854', fontSize: 12, fontWeight: '700' },
  muted: { color: '#96A29B' },
  privacy: { color: '#819087', fontSize: 11, lineHeight: 17, marginTop: 18, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
