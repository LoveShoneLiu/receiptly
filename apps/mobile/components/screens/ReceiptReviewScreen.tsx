import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  ReceiptCandidateLine,
  ReceiptScanData,
} from '../../api/receiptScan';
import {
  centsToInput,
  inputToCents,
} from '../receipt/CurrencyField';
import {
  ReceiptHeaderForm,
  type ReceiptHeaderDraft,
} from '../receipt/ReceiptHeaderForm';
import {
  ReceiptLineEditor,
  type EditableReceiptLine,
} from '../receipt/ReceiptLineEditor';

type ReceiptReviewScreenProps = {
  initialData: ReceiptScanData;
  onBack: () => void;
  onSaveDraft: (data: ReceiptScanData) => void;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-NZ', { currency: 'NZD', style: 'currency' }).format(cents / 100);

const toEditableLine = (line: ReceiptCandidateLine): EditableReceiptLine => ({
  ...line,
  linePriceInput: centsToInput(line.linePriceCents),
  unitPriceInput: centsToInput(line.unitPriceCents),
});

const createEmptyLine = (): EditableReceiptLine => ({
  id: `manual-${Date.now()}`,
  included: true,
  linePriceCents: null,
  linePriceInput: '',
  productName: '',
  quantity: '',
  rawText: '',
  source: 'manual',
  unit: '',
  unitPriceBasis: '',
  unitPriceCents: null,
  unitPriceInput: '',
});

export function ReceiptReviewScreen({
  initialData,
  onBack,
  onSaveDraft,
}: ReceiptReviewScreenProps) {
  const [receipt, setReceipt] = useState<ReceiptHeaderDraft>({
    declaredTotalInput: centsToInput(initialData.receipt.declaredTotalCents),
    purchasedAtLocal: initialData.receipt.purchasedAtLocal,
    purchasedOn: initialData.receipt.purchasedOn,
    receiptNumber: initialData.receipt.receiptNumber,
    storeName: initialData.receipt.storeName,
  });
  const [lines, setLines] = useState<EditableReceiptLine[]>(
    initialData.lines.map(toEditableLine),
  );

  const reconciliation = useMemo(() => {
    const declaredTotal = inputToCents(receipt.declaredTotalInput);
    const includedLines = lines.filter((line) => line.included);
    const parsedPrices = includedLines.map((line) => inputToCents(line.linePriceInput));
    const hasInvalidMoney = declaredTotal === undefined
      || lines.some((line) =>
        inputToCents(line.linePriceInput) === undefined
        || inputToCents(line.unitPriceInput) === undefined);
    const hasMissingLinePrice = parsedPrices.some((value) => value === null || value === undefined);
    const lineTotalCents = parsedPrices.reduce<number>(
      (sum, value) => sum + (typeof value === 'number' ? value : 0),
      0,
    );
    const differenceCents = typeof declaredTotal === 'number'
      ? declaredTotal - lineTotalCents
      : null;
    const isBalanced = !hasInvalidMoney
      && !hasMissingLinePrice
      && includedLines.length > 0
      && differenceCents === 0;

    return {
      differenceCents,
      hasInvalidMoney,
      isBalanced,
      lineTotalCents,
    };
  }, [lines, receipt.declaredTotalInput]);

  const updateReceipt = <Field extends keyof ReceiptHeaderDraft>(
    field: Field,
    value: ReceiptHeaderDraft[Field],
  ) => {
    setReceipt((current) => ({ ...current, [field]: value }));
  };

  const updateLine = <Field extends keyof EditableReceiptLine>(
    lineId: string,
    field: Field,
    value: EditableReceiptLine[Field],
  ) => {
    setLines((current) => current.map((line) =>
      line.id === lineId ? { ...line, [field]: value } : line));
  };

  const saveDraft = () => {
    if (reconciliation.hasInvalidMoney) return;

    const declaredTotalCents = inputToCents(receipt.declaredTotalInput);
    const savedLines: ReceiptCandidateLine[] = lines.map((line) => {
      const linePriceCents = inputToCents(line.linePriceInput);
      const unitPriceCents = inputToCents(line.unitPriceInput);

      return {
        id: line.id,
        included: line.included,
        linePriceCents: typeof linePriceCents === 'number' ? linePriceCents : null,
        productName: line.productName?.trim() || null,
        quantity: line.quantity?.trim() || null,
        rawText: line.rawText,
        source: line.source,
        unit: line.unit?.trim() || null,
        unitPriceBasis: line.unitPriceBasis?.trim() || null,
        unitPriceCents: typeof unitPriceCents === 'number' ? unitPriceCents : null,
      };
    });

    onSaveDraft({
      lines: savedLines,
      receipt: {
        ...initialData.receipt,
        declaredTotalCents: typeof declaredTotalCents === 'number' ? declaredTotalCents : null,
        purchasedAtLocal: receipt.purchasedAtLocal?.trim() || null,
        purchasedOn: receipt.purchasedOn?.trim() || null,
        receiptNumber: receipt.receiptNumber?.trim() || null,
        status: 'needs_review',
        storeName: receipt.storeName?.trim() || null,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.navigation}>
        <Pressable
          accessibilityLabel="返回添加小票"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.navigationCopy}>
          <Text style={styles.navigationTitle}>检查扫描结果</Text>
          <Text style={styles.navigationSubtitle}>保存前请逐项核对候选内容</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.candidateNotice}>
          <Text style={styles.candidateNoticeTitle}>扫描结果尚未入账</Text>
          <Text style={styles.candidateNoticeText}>
            当前状态为待确认，不会进入首页总额和价格历史。
          </Text>
        </View>

        <ReceiptHeaderForm onChange={updateReceipt} receipt={receipt} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>商品明细</Text>
            <Text style={styles.sectionSubtitle}>{lines.length} 条候选商品行</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLines((current) => [...current, createEmptyLine()])}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Text style={styles.addButtonText}>＋ 添加商品</Text>
          </Pressable>
        </View>

        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>没有商品行</Text>
            <Text style={styles.emptyText}>可以手动添加商品，继续完成这张小票。</Text>
          </View>
        ) : (
          lines.map((line, index) => (
            <ReceiptLineEditor
              index={index}
              key={line.id}
              line={line}
              onChange={(field, value) => updateLine(line.id, field, value)}
              onRemove={() => setLines((current) => current.filter((item) => item.id !== line.id))}
            />
          ))
        )}

        <View style={[
          styles.reconciliation,
          reconciliation.isBalanced ? styles.reconciliationBalanced : styles.reconciliationWarning,
        ]}>
          <View style={styles.reconciliationRow}>
            <Text style={styles.reconciliationLabel}>计入商品合计</Text>
            <Text style={styles.reconciliationValue}>
              {formatCurrency(reconciliation.lineTotalCents)}
            </Text>
          </View>
          <View style={styles.reconciliationRow}>
            <Text style={styles.reconciliationLabel}>与小票总额差异</Text>
            <Text style={styles.reconciliationValue}>
              {reconciliation.differenceCents === null
                ? '待填写'
                : formatCurrency(Math.abs(reconciliation.differenceCents))}
            </Text>
          </View>
          <Text style={styles.reconciliationHint}>
            {reconciliation.isBalanced
              ? '金额一致，可以保存为待确认。'
              : '金额尚未一致；仍可保存草稿，正式确认时必须处理差异。'}
          </Text>
        </View>

        <Pressable
          accessibilityHint="保存编辑内容，但不会计入正式账本"
          accessibilityRole="button"
          disabled={reconciliation.hasInvalidMoney}
          onPress={saveDraft}
          style={({ pressed }) => [
            styles.saveButton,
            reconciliation.hasInvalidMoney && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveButtonText}>保存为待确认</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F8F4', flex: 1 },
  navigation: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E9E3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 14,
  },
  backButton: { alignItems: 'center', height: 44, justifyContent: 'center', marginRight: 8, width: 44 },
  backIcon: { color: '#315D49', fontSize: 34, lineHeight: 36 },
  navigationCopy: { flex: 1 },
  navigationTitle: { color: '#1F382F', fontSize: 18, fontWeight: '800' },
  navigationSubtitle: { color: '#78877F', fontSize: 11, marginTop: 2 },
  content: { gap: 14, padding: 18, paddingBottom: 38 },
  candidateNotice: { backgroundColor: '#FFF6DF', borderRadius: 16, padding: 14 },
  candidateNoticeTitle: { color: '#75501D', fontSize: 14, fontWeight: '800' },
  candidateNoticeText: { color: '#8B6B3E', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { color: '#203A30', fontSize: 19, fontWeight: '800' },
  sectionSubtitle: { color: '#7A8981', fontSize: 11, marginTop: 3 },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#EDF3E9',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  addButtonText: { color: '#315D49', fontSize: 12, fontWeight: '800' },
  empty: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8E1',
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: { color: '#263D34', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#77867E', fontSize: 12, marginTop: 6 },
  reconciliation: { borderRadius: 18, padding: 16 },
  reconciliationBalanced: { backgroundColor: '#EAF4E5' },
  reconciliationWarning: { backgroundColor: '#FFF0E5' },
  reconciliationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reconciliationLabel: { color: '#596C63', fontSize: 13 },
  reconciliationValue: { color: '#263D34', fontSize: 14, fontWeight: '800' },
  reconciliationHint: { color: '#6B776F', fontSize: 11, lineHeight: 17, marginTop: 3 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#D9E965',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 54,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: '#1A382D', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
