import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import type { ReceiptScanData } from './api/receiptScan';
import { BottomNavigation } from './components/BottomNavigation';
import { AddReceiptScreen } from './components/screens/AddReceiptScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ReceiptReviewScreen } from './components/screens/ReceiptReviewScreen';
import type { Tab } from './components/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [receiptToReview, setReceiptToReview] = useState<ReceiptScanData | null>(null);

  const finishConfirmation = () => {
    setReceiptToReview(null);
    setActiveTab('home');
    Alert.alert('确认成功', '小票已经计入家庭账本。');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        {receiptToReview ? (
          <ReceiptReviewScreen
            initialData={receiptToReview}
            onBack={() => setReceiptToReview(null)}
            onConfirmed={finishConfirmation}
          />
        ) : (
          <>
            {activeTab === 'home' && <HomeScreen />}
            {activeTab === 'add' && <AddReceiptScreen onScanComplete={setReceiptToReview} />}
            {activeTab === 'profile' && <ProfileScreen />}
            <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8F4' },
  app: { flex: 1 },
});
