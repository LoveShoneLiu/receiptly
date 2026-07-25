import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { DateRange } from './types';

type CustomDateRangeProps = {
  draftRange: DateRange;
  error: string | null;
  applyDisabled?: boolean;
  onChange: (field: keyof DateRange, value: string) => void;
  onApply?: () => void;
  showApplyButton?: boolean;
};

export function CustomDateRange({
  draftRange,
  error,
  applyDisabled = false,
  onChange,
  onApply,
  showApplyButton = true,
}: CustomDateRangeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.fields}>
        <DateField label="开始日期" value={draftRange.start} onChangeText={(value) => onChange('start', value)} />
        <DateField label="结束日期" value={draftRange.end} onChangeText={(value) => onChange('end', value)} />
      </View>
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {showApplyButton && onApply && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: applyDisabled }}
          disabled={applyDisabled}
          onPress={onApply}
          style={({ pressed }) => [
            styles.applyButton,
            applyDisabled && styles.applyButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[
            styles.applyButtonText,
            applyDisabled && styles.applyButtonTextDisabled,
          ]}
          >
            {applyDisabled ? '当前范围已应用' : '应用时间范围'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function DateField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={`${label}，格式为年-月-日`}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9AA69F"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F8F3',
    borderColor: '#E1E7DE',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  fields: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  label: { color: '#53665D', fontSize: 12, fontWeight: '600', marginBottom: 7 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E0D7',
    borderRadius: 11,
    borderWidth: 1,
    color: '#213A31',
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: 11,
  },
  error: { color: '#A13D35', fontSize: 12, lineHeight: 18, marginTop: 10 },
  applyButton: {
    alignItems: 'center',
    backgroundColor: '#244F40',
    borderRadius: 11,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 44,
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  applyButtonDisabled: { backgroundColor: '#E3E9E2' },
  applyButtonTextDisabled: { color: '#78877F' },
  pressed: { opacity: 0.72 },
});
