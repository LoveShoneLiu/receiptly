import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.eyebrow}>个人中心</Text>
        <Text style={styles.title}>我的</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>R</Text>
        </View>
        <View style={styles.profileIdentity}>
          <Text style={styles.profileName}>尚未登录</Text>
          <Text style={styles.profileDetail}>登录后可查看账号和家庭信息</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('账号功能', '登录和账号管理将在后续切片中接入。')}
          style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
        >
          <Text style={styles.loginButtonText}>登录</Text>
        </Pressable>
      </View>

      <View style={styles.settingsGroup}>
        <SettingRow label="家庭成员" value="未加入家庭" />
        <SettingRow label="默认货币" value="NZD" />
        <SettingRow label="隐私与数据" value="›" last />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>隐私优先</Text>
        <Text style={styles.noticeText}>小票和消费记录仅供你的家庭使用，不会公开展示或用于广告。</Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.settingRow, last && styles.settingRowLast]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 18 },
  eyebrow: { color: '#577066', fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#1E302B', fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 4 },
  profileCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6EAE4', borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 18 },
  profileAvatar: { alignItems: 'center', backgroundColor: '#DCE9D4', borderRadius: 25, height: 50, justifyContent: 'center', width: 50 },
  profileAvatarText: { color: '#315D49', fontSize: 19, fontWeight: '700' },
  profileIdentity: { flex: 1, marginLeft: 13 },
  profileName: { color: '#263C33', fontSize: 16, fontWeight: '700' },
  profileDetail: { color: '#71847B', fontSize: 12, marginTop: 4 },
  loginButton: { backgroundColor: '#EDF2E7', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 16 },
  loginButtonText: { color: '#315D49', fontSize: 14, fontWeight: '700' },
  settingsGroup: { backgroundColor: '#FFFFFF', borderColor: '#E6EAE4', borderRadius: 18, borderWidth: 1, paddingHorizontal: 18 },
  settingRow: { alignItems: 'center', borderBottomColor: '#E9ECE7', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58 },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel: { color: '#30483E', fontSize: 15 },
  settingValue: { color: '#71847B', fontSize: 14 },
  notice: { backgroundColor: '#EDF2E7', borderRadius: 16, padding: 18 },
  noticeTitle: { color: '#315D49', fontSize: 15, fontWeight: '700' },
  noticeText: { color: '#496157', fontSize: 14, lineHeight: 20, marginTop: 6 },
  pressed: { opacity: 0.72 },
});
