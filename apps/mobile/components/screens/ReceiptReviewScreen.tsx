import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  confirmReceipt,
  getReceiptApiErrorMessage,
  type ReceiptCandidateLine,
  type ReceiptScanConfirmPayload,
  type ReceiptScanData,
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
import { useLanguage } from '../../i18n/LanguageContext';

type ReceiptReviewScreenProps = {
  accessToken: string;
  initialData: ReceiptScanData;
  onBack: () => void;
  onConfirmed: () => void;
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
  accessToken,
  initialData,
  onBack,
  onConfirmed,
}: ReceiptReviewScreenProps) {
  const { text } = useLanguage();
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const reconciliation = useMemo(() => {
    const declaredTotal = inputToCents(receipt.declaredTotalInput);
    const includedLines = lines.filter((line) => line.included);
    const parsedPrices = includedLines.map((line) => inputToCents(line.linePriceInput));
    const hasInvalidMoney = declaredTotal === undefined
      || (typeof declaredTotal === 'number' && declaredTotal < 0)
      || includedLines.some((line) => {
        const linePrice = inputToCents(line.linePriceInput);
        const unitPrice = inputToCents(line.unitPriceInput);
        return linePrice === undefined
          || unitPrice === undefined
          || (typeof linePrice === 'number' && linePrice < 0)
          || (typeof unitPrice === 'number' && unitPrice < 0);
      });
    const hasMissingLinePrice = parsedPrices.some((value) => value === null || value === undefined);
    const hasMissingRequiredFields = !receipt.storeName?.trim()
      || !receipt.purchasedOn?.trim()
      || includedLines.some((line) => !line.productName?.trim());
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
      hasMissingRequiredFields,
      isBalanced,
      lineTotalCents,
    };
  }, [lines, receipt.declaredTotalInput, receipt.purchasedOn, receipt.storeName]);

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

  const canConfirm = reconciliation.isBalanced && !reconciliation.hasMissingRequiredFields;

  const createConfirmationPayload = (): ReceiptScanConfirmPayload => {
    const declaredTotalCents = inputToCents(receipt.declaredTotalInput);

    return {
      receipt: {
        currency: initialData.receipt.currency,
        declaredTotalCents: typeof declaredTotalCents === 'number' ? declaredTotalCents : null,
        id: initialData.receipt.id,
        purchasedAtLocal: receipt.purchasedAtLocal?.trim() || null,
        purchasedOn: receipt.purchasedOn?.trim() || null,
        receiptNumber: receipt.receiptNumber?.trim() || null,
        storeName: receipt.storeName?.trim() || null,
      },
      lines: lines.map((line) => {
        const linePriceCents = inputToCents(line.linePriceInput);
        const unitPriceCents = inputToCents(line.unitPriceInput);

        return {
          id: line.id,
          included: line.included,
          linePriceCents: typeof linePriceCents === 'number' ? linePriceCents : null,
          productName: line.productName?.trim() || null,
          quantity: line.quantity?.trim() || null,
          rawText: line.rawText?.trim() || null,
          source: line.source,
          unit: line.unit?.trim().toLowerCase() || null,
          unitPriceBasis: line.unitPriceBasis?.trim().toLowerCase() || null,
          unitPriceCents: typeof unitPriceCents === 'number' ? unitPriceCents : null,
        };
      }),
    };
  };

  const confirmScannedReceipt = async () => {
    if (!canConfirm || isConfirming) return;

    setIsConfirming(true);
    setConfirmError(null);
    try {
      await confirmReceipt(createConfirmationPayload(), { accessToken });
      onConfirmed();
    } catch (error) {
      setConfirmError(getReceiptApiErrorMessage(
        error,
        text,
        text('确认失败，请稍后重试。', 'Confirmation failed. Try again later.'),
      ));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.navigation}>
        <Pressable
          accessibilityLabel={text('返回添加小票', 'Back to add receipt')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.navigationCopy}>
          <Text style={styles.navigationTitle}>{text('检查扫描结果', 'Review scan')}</Text>
          <Text style={styles.navigationSubtitle}>{text('确认入账前请逐项核对候选内容', 'Check every suggested item before confirming')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.candidateNotice}>
          <Text style={styles.candidateNoticeTitle}>{text('确认后将正式入账', 'Confirmation adds this to your ledger')}</Text>
          <Text style={styles.candidateNoticeText}>
            {text('请先检查门店、日期、总额和每一条商品内容。', 'Check the store, date, total and every product first.')}
          </Text>
        </View>

        <ReceiptHeaderForm onChange={updateReceipt} receipt={receipt} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{text('商品明细', 'Items')}</Text>
            <Text style={styles.sectionSubtitle}>{text(`${lines.length} 条候选商品行`, `${lines.length} suggested items`)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLines((current) => [...current, createEmptyLine()])}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Text style={styles.addButtonText}>＋ {text('添加商品', 'Add item')}</Text>
          </Pressable>
        </View>

        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{text('没有商品行', 'No items')}</Text>
            <Text style={styles.emptyText}>{text('可以手动添加商品，继续完成这张小票。', 'Add items manually to complete this receipt.')}</Text>
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
            <Text style={styles.reconciliationLabel}>{text('计入商品合计', 'Included item total')}</Text>
            <Text style={styles.reconciliationValue}>
              {formatCurrency(reconciliation.lineTotalCents)}
            </Text>
          </View>
          <View style={styles.reconciliationRow}>
            <Text style={styles.reconciliationLabel}>{text('与小票总额差异', 'Difference from receipt total')}</Text>
            <Text style={styles.reconciliationValue}>
              {reconciliation.differenceCents === null
                ? text('待填写', 'Required')
                : formatCurrency(Math.abs(reconciliation.differenceCents))}
            </Text>
          </View>
          <Text style={styles.reconciliationHint}>
            {reconciliation.isBalanced
              ? reconciliation.hasMissingRequiredFields
                ? text('金额一致，但仍有必填内容需要补充。', 'The totals match, but required details are still missing.')
                : text('金额一致，可以确认并计入家庭账本。', 'The totals match. You can confirm this receipt.')
              : text('金额尚未一致，处理差异后才能确认入账。', 'The totals do not match. Resolve the difference before confirming.')}
          </Text>
        </View>

        {confirmError && (
          <View accessibilityRole="alert" style={styles.confirmError}>
            <Text style={styles.confirmErrorTitle}>{text('未能确认入账', 'Could not confirm receipt')}</Text>
            <Text style={styles.confirmErrorText}>{confirmError}</Text>
          </View>
        )}

        <Pressable
          accessibilityHint={text('确认这张小票并计入正式账本', 'Confirm this receipt and add it to the household ledger')}
          accessibilityRole="button"
          disabled={!canConfirm || isConfirming}
          onPress={confirmScannedReceipt}
          style={({ pressed }) => [
            styles.saveButton,
            (!canConfirm || isConfirming) && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {isConfirming
            ? <ActivityIndicator color="#1A382D" size="small" />
            : <Text style={styles.saveButtonText}>{text('确认', 'Confirm')}</Text>}
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
  confirmError: { backgroundColor: '#FFEAE7', borderRadius: 14, padding: 14 },
  confirmErrorTitle: { color: '#8E3E36', fontSize: 13, fontWeight: '800' },
  confirmErrorText: { color: '#9A5B54', fontSize: 11, lineHeight: 17, marginTop: 3 },
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
