import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
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
  createAuthChallenge,
  loginWithApple,
  loginWithGoogle,
  requestEmailCode,
  verifyEmailCode,
} from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';

type BusyAction = 'apple' | 'google' | 'email-request' | 'email-verify' | null;

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : '登录失败，请稍后重试。';

export function LoginScreen() {
  const { acceptSession } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

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

  const signInWithApple = () => run('apple', async () => {
    const challenge = await createAuthChallenge('apple');
    if (!challenge.nonce) throw new Error('服务端没有返回 Apple 登录 nonce。');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      challenge.nonce,
    );
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      state: challenge.state ?? undefined,
    });
    if (challenge.state && credential.state !== challenge.state) {
      throw new Error('Apple 登录状态校验失败，请重新尝试。');
    }
    if (!credential.identityToken || !credential.authorizationCode) {
      throw new Error('Apple 没有返回完整登录凭据，请重新尝试。');
    }
    const session = await loginWithApple({
      attemptId: challenge.attemptId,
      authorizationCode: credential.authorizationCode,
      identityToken: credential.identityToken,
      profile: {
        email: credential.email,
        familyName: credential.fullName?.familyName ?? null,
        givenName: credential.fullName?.givenName ?? null,
      },
    });
    await acceptSession(session);
  });

  const signInWithGoogle = () => run('google', async () => {
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    if (!iosClientId) throw new Error('尚未配置 Google iOS Client ID。');
    const challenge = await createAuthChallenge('google');
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ iosClientId });
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') return;
    if (!response.data.idToken) throw new Error('Google 没有返回 ID Token。');
    const session = await loginWithGoogle(challenge.attemptId, response.data.idToken);
    await acceptSession(session);
  });

  const requestCode = () => run('email-request', async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('请输入有效的邮箱地址。');
    }
    const result = await requestEmailCode(normalizedEmail);
    setEmail(normalizedEmail);
    setCodeRequested(true);
    setResendSeconds(result.resendAfter);
  });

  const verifyCode = () => run('email-verify', async () => {
    if (!/^\d{6}$/.test(code)) throw new Error('请输入六位数字验证码。');
    const session = await verifyEmailCode(email, code);
    await acceptSession(session);
  });

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
          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              cornerRadius={12}
              onPress={signInWithApple}
              style={styles.appleButton}
            />
          )}

          <Pressable
            accessibilityRole="button"
            disabled={Boolean(busy)}
            onPress={signInWithGoogle}
            style={({ pressed }) => [styles.providerButton, pressed && styles.pressed]}
          >
            {busy === 'google'
              ? <ActivityIndicator color="#315D49" />
              : <Text style={styles.providerText}>使用 Google 账号继续</Text>}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>或使用邮箱</Text>
            <View style={styles.divider} />
          </View>

          <Text style={styles.label}>邮箱</Text>
          <TextInput
            accessibilityLabel="邮箱地址"
            autoCapitalize="none"
            autoComplete="email"
            editable={!codeRequested && !busy}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#95A29B"
            style={styles.input}
            value={email}
          />

          {codeRequested && (
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
            onPress={codeRequested ? verifyCode : requestCode}
            style={({ pressed }) => [
              styles.emailButton,
              Boolean(busy) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {busy === 'email-request' || busy === 'email-verify'
              ? <ActivityIndicator color="#1A382D" />
              : <Text style={styles.emailButtonText}>
                {codeRequested ? '验证并登录' : '发送验证码'}
              </Text>}
          </Pressable>

          {codeRequested && (
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

const styles = StyleSheet.create({
  root: { backgroundColor: '#F7F8F4', flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { marginBottom: 24 },
  eyebrow: { color: '#557066', fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#17372C', fontSize: 32, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#667970', fontSize: 14, lineHeight: 21, marginTop: 8 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8E1', borderRadius: 22, borderWidth: 1, padding: 20 },
  appleButton: { height: 52, width: '100%' },
  providerButton: { alignItems: 'center', borderColor: '#CED8D1', borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 12, minHeight: 52 },
  providerText: { color: '#29483C', fontSize: 15, fontWeight: '700' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', marginVertical: 20 },
  divider: { backgroundColor: '#E2E7E2', flex: 1, height: 1 },
  dividerText: { color: '#829087', fontSize: 12, marginHorizontal: 12 },
  label: { color: '#425B50', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: '#F8FAF7', borderColor: '#D9E1D9', borderRadius: 12, borderWidth: 1, color: '#203A30', fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
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
