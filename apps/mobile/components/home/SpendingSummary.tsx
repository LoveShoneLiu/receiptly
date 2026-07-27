import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { DateRange, OverviewPeriodPreset } from './types';
import { useLanguage } from '../../i18n/LanguageContext';

type SpendingSummaryProps = {
  loading: boolean;
  onPeriodChange: (period: OverviewPeriodPreset) => void;
  period: OverviewPeriodPreset;
  range: DateRange;
  totalCents: number | null;
  updatedAt: string | null;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-NZ', { currency: 'NZD', style: 'currency' }).format(cents / 100);

const periods: OverviewPeriodPreset[] = ['week', 'month', 'year'];

const formatDate = (value: string) => value.replaceAll('-', '/');

export function SpendingSummary({
  loading,
  onPeriodChange,
  period,
  range,
  totalCents,
  updatedAt,
}: SpendingSummaryProps) {
  const { text } = useLanguage();
  const localizedPeriods = periods.map((item) => ({
    label: item === 'week'
      ? text('本周', 'Week')
      : item === 'month'
        ? text('本月', 'Month')
        : text('本年', 'Year'),
    value: item,
  }));

  return (
    <View style={styles.card}>
      <View accessibilityRole="tablist" style={styles.periodTrack}>
        {localizedPeriods.map((item) => {
          const selected = period === item.value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={item.value}
              onPress={() => onPeriodChange(item.value)}
              style={({ pressed }) => [
                styles.periodOption,
                selected && styles.periodOptionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[
                styles.periodText,
                selected && styles.periodTextSelected,
              ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.rangeText}>
        {formatDate(range.start)} – {formatDate(range.end)}
      </Text>

      <View style={styles.cardTop}>
        <View style={styles.summaryCopy}>
          <Text style={styles.label}>{text('已确认支出', 'Confirmed spending')}</Text>
          <View style={styles.amountRow}>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[styles.amount, loading && styles.amountLoading]}
            >
              {totalCents === null ? 'NZ $—' : `NZ ${formatCurrency(totalCents)}`}
            </Text>
            {loading && (
              <ActivityIndicator
                accessibilityLabel={text('正在更新支出金额', 'Updating spending total')}
                color="#B8C5BD"
                size="small"
                style={styles.amountSpinner}
              />
            )}
          </View>
          <Text style={styles.updatedAt}>
            {updatedAt
              ? text(`数据更新于 ${updatedAt}`, `Updated ${updatedAt}`)
              : text('正在读取家庭账本', 'Loading household ledger')}
          </Text>
        </View>
        <View style={styles.confirmedBadge}>
          <Text style={styles.confirmedDot}>●</Text>
          <Text style={styles.confirmedText}>{text('仅已确认', 'Confirmed only')}</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F493B',
    borderRadius: 24,
    padding: 21,
    shadowColor: '#19352B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  periodTrack: {
    backgroundColor: 'rgba(10, 28, 21, 0.24)',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 4,
  },
  periodOption: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  periodOptionSelected: { backgroundColor: '#F7FAF4' },
  periodText: { color: '#BFD2C5', fontSize: 14, fontWeight: '700' },
  periodTextSelected: { color: '#1F493B', fontWeight: '800' },
  rangeText: { color: '#AFC8B6', fontSize: 11, marginBottom: 18, textAlign: 'center' },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  summaryCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  label: { color: '#BFD8C4', fontSize: 13, fontWeight: '700' },
  amountRow: { alignItems: 'center', flexDirection: 'row' },
  amount: { color: '#FFFFFF', flexShrink: 1, fontSize: 35, fontWeight: '800', letterSpacing: -1.1, marginTop: 8 },
  amountLoading: { color: '#8FA39A' },
  amountSpinner: { marginLeft: 10, marginTop: 8 },
  updatedAt: { color: '#AFC8B6', fontSize: 10, marginTop: 5 },
  confirmedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(220, 238, 211, 0.12)',
    borderRadius: 20,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  confirmedDot: { color: '#D8E965', fontSize: 9, marginRight: 5 },
  confirmedText: { color: '#E9F2E7', fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
