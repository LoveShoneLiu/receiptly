import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../auth/AuthContext';

export function HouseholdOnboardingScreen() {
  const { createHousehold, logout, session } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('请输入家庭名称。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createHousehold(normalizedName);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '创建家庭失败，请重试。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>首次设置</Text>
        <Text style={styles.title}>创建你的家庭账本</Text>
        <Text style={styles.subtitle}>
          登录成功，{session?.user.displayName ?? session?.user.email ?? '欢迎你'}。当前版本先支持创建一个家庭。
        </Text>
        <Text style={styles.label}>家庭名称</Text>
        <TextInput
          accessibilityLabel="家庭名称"
          autoCapitalize="words"
          maxLength={80}
          onChangeText={setName}
          placeholder="例如：Liu Family"
          placeholderTextColor="#95A29B"
          style={styles.input}
          value={name}
        />
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={submit}
          style={({ pressed }) => [styles.primary, saving && styles.disabled, pressed && styles.pressed]}
        >
          {saving
            ? <ActivityIndicator color="#1A382D" />
            : <Text style={styles.primaryText}>创建并进入账本</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.logout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#F7F8F4', flex: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E1E7E0', borderRadius: 22, borderWidth: 1, padding: 22 },
  eyebrow: { color: '#557066', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18382D', fontSize: 27, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#667970', fontSize: 14, lineHeight: 21, marginTop: 10 },
  label: { color: '#425B50', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 22 },
  input: { backgroundColor: '#F8FAF7', borderColor: '#D9E1D9', borderRadius: 12, borderWidth: 1, color: '#203A30', fontSize: 16, minHeight: 52, paddingHorizontal: 14 },
  error: { color: '#A13D35', fontSize: 13, marginTop: 12 },
  primary: { alignItems: 'center', backgroundColor: '#D9E965', borderRadius: 12, justifyContent: 'center', marginTop: 18, minHeight: 52 },
  primaryText: { color: '#1A382D', fontSize: 15, fontWeight: '800' },
  logout: { alignItems: 'center', justifyContent: 'center', marginTop: 8, minHeight: 44 },
  logoutText: { color: '#667970', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
