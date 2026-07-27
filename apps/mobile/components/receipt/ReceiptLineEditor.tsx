import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { ReceiptCandidateLine } from '../../api/receiptScan';
import { CurrencyField } from './CurrencyField';
import { useLanguage } from '../../i18n/LanguageContext';

export type EditableReceiptLine = ReceiptCandidateLine & {
  linePriceInput: string;
  unitPriceInput: string;
};

type ReceiptLineEditorProps = {
  index: number;
  line: EditableReceiptLine;
  onChange: <Field extends keyof EditableReceiptLine>(
    field: Field,
    value: EditableReceiptLine[Field],
  ) => void;
  onRemove: () => void;
};

function LineInput({
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

export function ReceiptLineEditor({
  index,
  line,
  onChange,
  onRemove,
}: ReceiptLineEditorProps) {
  const { text } = useLanguage();

  return (
    <View style={[styles.card, !line.included && styles.cardExcluded]}>
      <View style={styles.header}>
        <View style={styles.lineNumber}>
          <Text style={styles.lineNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{text('商品行', 'Receipt item')}</Text>
          <Text numberOfLines={2} style={styles.rawText}>{line.rawText || text('手动添加的商品', 'Manually added item')}</Text>
        </View>
        <View style={styles.includeControl}>
          <Text style={styles.includeLabel}>{line.included ? text('计入', 'Include') : text('排除', 'Exclude')}</Text>
          <Switch
            accessibilityLabel={text(`商品行 ${index + 1} 是否计入`, `Include receipt item ${index + 1}`)}
            onValueChange={(value) => onChange('included', value)}
            trackColor={{ false: '#D5DBD7', true: '#B9DCA8' }}
            value={line.included}
          />
        </View>
      </View>

      <LineInput
        label={text('商品名', 'Product name')}
        onChange={(value) => onChange('productName', value)}
        placeholder={text('请输入商品名', 'Enter product name')}
        value={line.productName}
      />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <LineInput
            label={text('购买数量', 'Quantity')}
            onChange={(value) => onChange('quantity', value)}
            placeholder={text('例如 0.860', 'e.g. 0.860')}
            value={line.quantity}
          />
        </View>
        <View style={styles.gridItem}>
          <LineInput
            label={text('单位', 'Unit')}
            onChange={(value) => onChange('unit', value.toLowerCase())}
            placeholder="kg / l / item"
            value={line.unit}
          />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <CurrencyField
            label={text('单位单价', 'Unit price')}
            onChange={(value) => onChange('unitPriceInput', value)}
            value={line.unitPriceInput}
          />
        </View>
        <View style={styles.gridItem}>
          <LineInput
            label={text('单价基准', 'Price basis')}
            onChange={(value) => onChange('unitPriceBasis', value.toLowerCase())}
            placeholder="kg / l / item"
            value={line.unitPriceBasis}
          />
        </View>
      </View>

      <CurrencyField
        label={text('实付行价', 'Line total')}
        onChange={(value) => onChange('linePriceInput', value)}
        value={line.linePriceInput}
      />

      <Pressable
        accessibilityRole="button"
        onPress={onRemove}
        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
      >
        <Text style={styles.removeText}>{text('删除此商品行', 'Remove item')}</Text>
      </Pressable>
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
    padding: 15,
  },
  cardExcluded: { opacity: 0.6 },
  header: { alignItems: 'flex-start', flexDirection: 'row' },
  lineNumber: {
    alignItems: 'center',
    backgroundColor: '#EAF1E5',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    marginRight: 10,
    width: 34,
  },
  lineNumberText: { color: '#315D49', fontSize: 13, fontWeight: '800' },
  headerCopy: { flex: 1 },
  headerTitle: { color: '#263D34', fontSize: 14, fontWeight: '800' },
  rawText: { color: '#859189', fontSize: 10, lineHeight: 15, marginTop: 3 },
  includeControl: { alignItems: 'center', marginLeft: 8 },
  includeLabel: { color: '#6B7B73', fontSize: 9, fontWeight: '700', marginBottom: 2 },
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
  removeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  removeText: { color: '#A84C43', fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
