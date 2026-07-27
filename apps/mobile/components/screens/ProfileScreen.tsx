import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '../../api/base';
import type { AuthHousehold, AuthUser } from '../../auth/types';
import { useLanguage } from '../../i18n/LanguageContext';
import { HouseholdMembersScreen } from './HouseholdMembersScreen';

const PRIVACY_POLICY_URL = 'https://www.liushaofei.cn/receiptly/privacy';

type ProfileScreenProps = {
  accessToken: string;
  household: AuthHousehold;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  user: AuthUser;
};

export function ProfileScreen({
  accessToken,
  household,
  onDeleteAccount,
  onLogout,
  user,
}: ProfileScreenProps) {
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const { language, setLanguage, text } = useLanguage();
  const avatar = (user.displayName ?? user.email ?? 'R').slice(0, 1).toUpperCase();

  const deleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      const ownerTransferRequired = error instanceof ApiError
        && error.code === 'OWNER_TRANSFER_REQUIRED';
      Alert.alert(
        text('无法删除账号', 'Could not delete account'),
        ownerTransferRequired
          ? text(
            '请先删除家庭中的其他成员，再删除账号。',
            'Remove the other household members before deleting your account.',
          )
          : text(
            '账号尚未删除，请检查网络后重试。',
            'Your account was not deleted. Check your connection and try again.',
          ),
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmAccountDeletion = () => {
    if (deletingAccount) return;
    Alert.alert(
      text('永久删除账号？', 'Permanently delete account?'),
      text(
        '此操作会撤销你的所有登录会话并删除账号。单人家庭的小票和账目也会被永久删除，且无法恢复。',
        'This revokes all sessions and deletes your account. Receipts and ledger data in a single-member household will also be permanently deleted and cannot be recovered.',
      ),
      [
        { style: 'cancel', text: text('取消', 'Cancel') },
        {
          onPress: () => void deleteAccount(),
          style: 'destructive',
          text: text('删除账号', 'Delete account'),
        },
      ],
    );
  };

  const openPrivacyPolicy = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert(
        text('无法打开隐私政策', 'Could not open privacy policy'),
        text(
          '请稍后重试，或在浏览器中访问 www.liushaofei.cn/receiptly/privacy。',
          'Try again later, or visit www.liushaofei.cn/receiptly/privacy in your browser.',
        ),
      );
    }
  };

  if (showMembers) {
    return (
      <HouseholdMembersScreen
        accessToken={accessToken}
        household={household}
        onBack={() => setShowMembers(false)}
        user={user}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.eyebrow}>{text('个人中心', 'ACCOUNT')}</Text>
        <Text style={styles.title}>{text('我的', 'Profile')}</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{avatar}</Text>
        </View>
        <View style={styles.profileIdentity}>
          <Text style={styles.profileName}>
            {user.displayName ?? text('Receiptly 用户', 'Receiptly user')}
          </Text>
          <Text style={styles.profileDetail}>
            {user.email ?? text('Apple 私密账号', 'Private Apple account')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onLogout}
          style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
        >
          <Text style={styles.loginButtonText}>{text('退出', 'Log out')}</Text>
        </Pressable>
      </View>

      <View style={styles.settingsGroup}>
        <SettingRow label={text('当前家庭', 'Current household')} value={household.name} />
        <SettingRow
          label={text('家庭成员', 'Household members')}
          onPress={() => setShowMembers(true)}
          value={household.role === 'owner'
            ? text('管理 ›', 'Manage ›')
            : text('查看 ›', 'View ›')}
        />
        <SettingRow
          label={text('我的角色', 'My role')}
          value={household.role === 'owner' ? text('管理员', 'Owner') : text('成员', 'Member')}
        />
        <SettingRow label={text('默认货币', 'Default currency')} value={household.currency ?? 'NZD'} />
        <View style={styles.languageRow}>
          <Text style={styles.settingLabel}>{text('语言', 'Language')}</Text>
          <View accessibilityRole="tablist" style={styles.languageSelector}>
            <LanguageButton
              label="中文"
              onPress={() => void setLanguage('zh')}
              selected={language === 'zh'}
            />
            <LanguageButton
              label="English"
              onPress={() => void setLanguage('en')}
              selected={language === 'en'}
            />
          </View>
        </View>
        <SettingRow
          label={text('隐私与数据', 'Privacy & data')}
          onPress={() => void openPrivacyPolicy()}
          value="›"
          last
        />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>{text('隐私优先', 'Privacy first')}</Text>
        <Text style={styles.noticeText}>
          {text(
            '小票和消费记录仅供你的家庭使用，不会公开展示或用于广告。',
            'Receipts and spending records are private to your household and are never used for advertising.',
          )}
        </Text>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>{text('删除账号', 'Delete account')}</Text>
        <Text style={styles.dangerText}>
          {text(
            '永久删除账号并撤销所有登录会话。此操作无法撤销。',
            'Permanently delete your account and revoke every session. This cannot be undone.',
          )}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: deletingAccount, disabled: deletingAccount }}
          disabled={deletingAccount}
          onPress={confirmAccountDeletion}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
            deletingAccount && styles.disabled,
          ]}
        >
          {deletingAccount ? (
            <ActivityIndicator color="#A33F35" size="small" />
          ) : (
            <Text style={styles.deleteButtonText}>
              {text('永久删除账号', 'Permanently delete account')}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function LanguageButton({
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
      style={[styles.languageButton, selected && styles.languageButtonSelected]}
    >
      <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SettingRow({
  label,
  value,
  last = false,
  onPress,
}: {
  label: string;
  value: string;
  last?: boolean;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.settingRow,
          last && styles.settingRowLast,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </Pressable>
    );
  }

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
  languageRow: {
    alignItems: 'center',
    borderBottomColor: '#E9ECE7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 66,
  },
  languageSelector: { backgroundColor: '#EDF2ED', borderRadius: 10, flexDirection: 'row', padding: 3 },
  languageButton: { borderRadius: 8, justifyContent: 'center', minHeight: 36, paddingHorizontal: 10 },
  languageButtonSelected: { backgroundColor: '#FFFFFF' },
  languageText: { color: '#71847B', fontSize: 11, fontWeight: '700' },
  languageTextSelected: { color: '#315D49' },
  notice: { backgroundColor: '#EDF2E7', borderRadius: 16, padding: 18 },
  noticeTitle: { color: '#315D49', fontSize: 15, fontWeight: '700' },
  noticeText: { color: '#496157', fontSize: 14, lineHeight: 20, marginTop: 6 },
  dangerZone: { backgroundColor: '#FFF7F5', borderColor: '#F0D3CF', borderRadius: 16, borderWidth: 1, padding: 18 },
  dangerTitle: { color: '#8E3E36', fontSize: 15, fontWeight: '700' },
  dangerText: { color: '#76534E', fontSize: 13, lineHeight: 19, marginTop: 6 },
  deleteButton: { alignItems: 'center', borderColor: '#C9655A', borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 14, minHeight: 48 },
  deleteButtonText: { color: '#A33F35', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
