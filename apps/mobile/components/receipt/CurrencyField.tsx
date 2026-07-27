import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useLanguage } from '../../i18n/LanguageContext';

type CurrencyFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const centsToInput = (value: number | null) =>
  value === null ? '' : (value / 100).toFixed(2);

export const inputToCents = (value: string): number | null | undefined => {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^-?\d+(?:\.\d{0,2})?$/.test(normalized)) return undefined;

  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [dollars, fraction = ''] = unsigned.split('.');
  const cents = (Number(dollars) * 100) + Number(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
};

export function CurrencyField({ label, value, onChange }: CurrencyFieldProps) {
  const { text } = useLanguage();
  const invalid = inputToCents(value) === undefined;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, invalid && styles.inputShellInvalid]}>
        <Text style={styles.currency}>NZ$</Text>
        <TextInput
          accessibilityLabel={label}
          keyboardType="decimal-pad"
          onChangeText={onChange}
          placeholder="0.00"
          placeholderTextColor="#A2ADA7"
          style={styles.input}
          value={value}
        />
      </View>
      {invalid && (
        <Text accessibilityRole="alert" style={styles.error}>
          {text('金额最多保留两位小数。', 'Enter an amount with no more than two decimal places.')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  label: { color: '#65776E', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE4DC',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputShellInvalid: { borderColor: '#C85A50' },
  currency: { color: '#66786F', fontSize: 13, fontWeight: '700', marginRight: 5 },
  input: { color: '#203A30', flex: 1, fontSize: 15, fontWeight: '700', paddingVertical: 0 },
  error: { color: '#A64037', fontSize: 10, marginTop: 4 },
});
