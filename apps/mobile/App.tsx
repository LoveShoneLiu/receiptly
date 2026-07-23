import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import type { ReceiptScanData } from './api/receiptScan';
import { BottomNavigation } from './components/BottomNavigation';
import { AddReceiptScreen } from './components/screens/AddReceiptScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ReceiptReviewScreen } from './components/screens/ReceiptReviewScreen';
import type { Tab } from './components/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [receiptDrafts, setReceiptDrafts] = useState<ReceiptScanData[]>([]);
  const [receiptToReview, setReceiptToReview] = useState<ReceiptScanData | null>(null);

  const saveReceiptDraft = (data: ReceiptScanData) => {
    setReceiptDrafts((current) => {
      const existingIndex = current.findIndex((draft) => draft.receipt.id === data.receipt.id);
      if (existingIndex === -1) return [...current, data];

      return current.map((draft, index) => index === existingIndex ? data : draft);
    });
    setReceiptToReview(null);
    setActiveTab('home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        {receiptToReview ? (
          <ReceiptReviewScreen
            initialData={receiptToReview}
            onBack={() => setReceiptToReview(null)}
            onSaveDraft={saveReceiptDraft}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                draftCount={receiptDrafts.length}
                onOpenLatestDraft={() => {
                  const latestDraft = receiptDrafts[receiptDrafts.length - 1];
                  if (latestDraft) setReceiptToReview(latestDraft);
                }}
              />
            )}
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
