import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { ReceiptCandidate } from '../../api/receiptScan';
import { CurrencyField } from './CurrencyField';
import { useLanguage } from '../../i18n/LanguageContext';

export type ReceiptHeaderDraft = Pick<
  ReceiptCandidate,
  'storeName' | 'receiptNumber' | 'purchasedOn' | 'purchasedAtLocal'
> & {
  declaredTotalInput: string;
};

type ReceiptHeaderFormProps = {
  receipt: ReceiptHeaderDraft;
  onChange: <Field extends keyof ReceiptHeaderDraft>(
    field: Field,
    value: ReceiptHeaderDraft[Field],
  ) => void;
};

function HeaderInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A2ADA7"
        style={styles.input}
        value={value ?? ''}
      />
    </View>
  );
}

export function ReceiptHeaderForm({ receipt, onChange }: ReceiptHeaderFormProps) {
  const { text } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{text('小票信息', 'Receipt details')}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{text('扫描候选', 'SCAN RESULT')}</Text>
        </View>
      </View>

      <HeaderInput
        label={text('门店', 'Store')}
        onChange={(value) => onChange('storeName', value)}
        placeholder={text('请输入门店名称', 'Enter store name')}
        value={receipt.storeName}
      />
      <HeaderInput
        label={text('小票编号', 'Receipt number')}
        onChange={(value) => onChange('receiptNumber', value)}
        placeholder={text('没有编号可留空', 'Optional')}
        value={receipt.receiptNumber}
      />
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <HeaderInput
            label={text('购买日期', 'Purchase date')}
            onChange={(value) => onChange('purchasedOn', value)}
            placeholder="YYYY-MM-DD"
            value={receipt.purchasedOn}
          />
        </View>
        <View style={styles.gridItem}>
          <HeaderInput
            label={text('本地时间', 'Local time')}
            onChange={(value) => onChange('purchasedAtLocal', value)}
            placeholder="YYYY-MM-DDTHH:mm"
            value={receipt.purchasedAtLocal}
          />
        </View>
      </View>
      <CurrencyField
        label={text('小票总额', 'Receipt total')}
        onChange={(value) => onChange('declaredTotalInput', value)}
        value={receipt.declaredTotalInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8E1',
    borderRadius: 20,
    borderWidth: 1,
    gap: 13,
    padding: 16,
  },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#203A30', fontSize: 18, fontWeight: '800' },
  statusBadge: { backgroundColor: '#FFF0CF', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#8A5A16', fontSize: 10, fontWeight: '800' },
  field: { flex: 1 },
  label: { color: '#65776E', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAF7',
    borderColor: '#DCE4DC',
    borderRadius: 12,
    borderWidth: 1,
    color: '#203A30',
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  grid: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1 },
});
