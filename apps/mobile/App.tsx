import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ReceiptScanData } from './api/receiptScan';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { BottomNavigation } from './components/BottomNavigation';
import { AddReceiptScreen } from './components/screens/AddReceiptScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { HouseholdOnboardingScreen } from './components/screens/HouseholdOnboardingScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ReceiptReviewScreen } from './components/screens/ReceiptReviewScreen';
import type { Tab } from './components/types';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

function AppContent() {
  const {
    deleteAccount,
    logout,
    restoring,
    session,
  } = useAuth();
  const { text } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [receiptToReview, setReceiptToReview] = useState<ReceiptScanData | null>(null);

  const finishConfirmation = () => {
    setReceiptToReview(null);
    setActiveTab('home');
    Alert.alert(
      text('确认成功', 'Confirmed'),
      text('小票已经计入家庭账本。', 'The receipt has been added to your household ledger.'),
    );
  };

  if (restoring) {
    return (
      <View style={styles.restoring}>
        <ActivityIndicator color="#315D49" />
        <Text style={styles.restoringText}>
          {text('正在恢复登录状态…', 'Restoring your session…')}
        </Text>
      </View>
    );
  }

  if (!session) return <LoginScreen />;
  if (session.onboardingState !== 'ready' || !session.activeHouseholdId) {
    return <HouseholdOnboardingScreen />;
  }

  const activeHousehold = session.households.find(
    (household) => household.id === session.activeHouseholdId,
  );
  if (!activeHousehold) return <HouseholdOnboardingScreen />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.app}>
        {receiptToReview ? (
          <ReceiptReviewScreen
            accessToken={session.accessToken}
            initialData={receiptToReview}
            onBack={() => setReceiptToReview(null)}
            onConfirmed={finishConfirmation}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                accessToken={session.accessToken}
                householdId={session.activeHouseholdId}
              />
            )}
            {activeTab === 'add' && (
              <AddReceiptScreen
                accessToken={session.accessToken}
                onScanComplete={setReceiptToReview}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                accessToken={session.accessToken}
                household={activeHousehold}
                onDeleteAccount={deleteAccount}
                onLogout={() => void logout()}
                user={session.user}
              />
            )}
            <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  app: { flex: 1 },
  restoring: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  restoringText: { color: '#62766C', fontSize: 13, marginTop: 10 },
});
