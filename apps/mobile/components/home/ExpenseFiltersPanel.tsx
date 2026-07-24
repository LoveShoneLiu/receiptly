import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CustomDateRange } from './CustomDateRange';
import { FilterSelect } from './FilterSelect';
import { PeriodSelector } from './PeriodSelector';
import type { DateRange, ExpenseFilters, PeriodPreset } from './types';

type ExpenseFiltersPanelProps = {
  period: PeriodPreset;
  range: DateRange;
  customRange: DateRange;
  dateError: string | null;
  filters: ExpenseFilters;
  stores: string[];
  products: string[];
  receipts: string[];
  hasPendingChanges: boolean;
  onPeriodChange: (period: PeriodPreset) => void;
  onCustomRangeChange: (field: keyof DateRange, value: string) => void;
  onFilterChange: (field: keyof ExpenseFilters, value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function ExpenseFiltersPanel({
  period,
  range,
  customRange,
  dateError,
  filters,
  stores,
  products,
  receipts,
  hasPendingChanges,
  onPeriodChange,
  onCustomRangeChange,
  onFilterChange,
  onApply,
  onReset,
}: ExpenseFiltersPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>筛选条件</Text>
            {hasPendingChanges && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>待应用</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>选择条件后点击确定更新结果</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onReset} style={styles.resetButton}>
          <Text style={styles.resetText}>重置</Text>
        </Pressable>
      </View>

      <View style={styles.periodBlock}>
        <Text style={styles.groupLabel}>时间</Text>
        <PeriodSelector onChange={onPeriodChange} range={range} value={period} />
        {period === 'custom' && (
          <CustomDateRange
            draftRange={customRange}
            error={dateError}
            onChange={onCustomRangeChange}
            showApplyButton={false}
          />
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <FilterSelect label="门店" onChange={(next) => onFilterChange('store', next)} options={stores} value={filters.store} />
        </View>
        <View style={styles.gridItem}>
          <FilterSelect label="小票编号" onChange={(next) => onFilterChange('receiptNumber', next)} options={receipts} value={filters.receiptNumber} />
        </View>
      </View>
      <FilterSelect label="商品名" onChange={(next) => onFilterChange('productName', next)} options={products} value={filters.productName} />

      <Pressable
        accessibilityHint="应用时间、门店、小票和商品名筛选"
        accessibilityRole="button"
        onPress={onApply}
        style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
      >
        <Text style={styles.applyButtonText}>确定并查看结果</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F8F3',
    borderColor: '#E3E8E1',
    borderRadius: 20,
    borderWidth: 1,
    gap: 13,
    padding: 15,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  title: { color: '#253D34', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#7A8981', fontSize: 12, marginTop: 3 },
  pendingBadge: { backgroundColor: '#FFF0CF', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  pendingText: { color: '#8A5A16', fontSize: 9, fontWeight: '800' },
  resetButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 },
  resetText: { color: '#356854', fontSize: 13, fontWeight: '700' },
  periodBlock: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE5DE',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  groupLabel: { color: '#53665D', fontSize: 12, fontWeight: '700', marginBottom: 9 },
  grid: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1 },
  applyButton: {
    alignItems: 'center',
    backgroundColor: '#D9E965',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 50,
  },
  applyButtonText: { color: '#1A382D', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
