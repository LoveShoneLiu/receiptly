import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DateRange, PeriodPreset } from './types';
import { useLanguage } from '../../i18n/LanguageContext';

type PeriodSelectorProps = {
  value: PeriodPreset;
  range: DateRange;
  onChange: (value: PeriodPreset) => void;
};

const presets: PeriodPreset[] = ['week', 'month', 'custom'];

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${year}/${month}/${day}`;
};

export function PeriodSelector({ value, range, onChange }: PeriodSelectorProps) {
  const { text } = useLanguage();
  const localizedPresets = presets.map((preset) => ({
    label: preset === 'week'
      ? text('本周', 'Week')
      : preset === 'month'
        ? text('本月', 'Month')
        : text('自定义', 'Custom'),
    value: preset,
  }));

  return (
    <View>
      <View accessibilityRole="tablist" style={styles.track}>
        {localizedPresets.map((preset) => {
          const selected = value === preset.value;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={preset.value}
              onPress={() => onChange(preset.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{preset.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.rangeText}>
        {formatDate(range.start)} – {formatDate(range.end)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#EEF1EC',
    borderRadius: 14,
    flexDirection: 'row',
    padding: 4,
  },
  option: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  optionSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#19352B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  optionText: { color: '#65736D', fontSize: 14, fontWeight: '600' },
  optionTextSelected: { color: '#193B30', fontWeight: '700' },
  rangeText: { color: '#718078', fontSize: 12, marginTop: 10, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
