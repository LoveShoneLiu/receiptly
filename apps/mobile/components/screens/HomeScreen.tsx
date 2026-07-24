import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CONFIRMED_EXPENSES } from '../../data/confirmedExpenses';
import { CustomDateRange } from '../home/CustomDateRange';
import {
  DEFAULT_FILTERS,
  INITIAL_CUSTOM_RANGE,
  PERIOD_RANGES,
  validateDateRange,
} from '../home/dateRanges';
import { ExpenseFiltersPanel } from '../home/ExpenseFiltersPanel';
import { ExpenseList } from '../home/ExpenseList';
import { FilteredSpendingTotal } from '../home/FilteredSpendingTotal';
import { PeriodSelector } from '../home/PeriodSelector';
import { SpendingSummary } from '../home/SpendingSummary';
import type {
  AppliedExpenseQuery,
  DateRange,
  ExpenseFilters,
  PeriodPreset,
} from '../home/types';

const PAGE_SIZE = 20;

const filterConfirmedExpenses = ({ range, filters }: AppliedExpenseQuery) =>
  CONFIRMED_EXPENSES.filter((expense) => {
    const insideRange = expense.purchasedOn >= range.start && expense.purchasedOn <= range.end;
    const matchesStore = filters.store === DEFAULT_FILTERS.store || expense.store === filters.store;
    const matchesProduct = filters.productName === DEFAULT_FILTERS.productName
      || expense.productName === filters.productName;
    const matchesReceipt = filters.receiptId === DEFAULT_FILTERS.receiptId || expense.receiptId === filters.receiptId;

    return expense.status === 'confirmed'
      && insideRange
      && matchesStore
      && matchesProduct
      && matchesReceipt;
  });

export function HomeScreen() {
  const [overviewPeriod, setOverviewPeriod] = useState<PeriodPreset>('month');
  const [overviewCustomDraft, setOverviewCustomDraft] = useState<DateRange>(INITIAL_CUSTOM_RANGE);
  const [overviewCustomRange, setOverviewCustomRange] = useState<DateRange>(INITIAL_CUSTOM_RANGE);
  const [overviewDateError, setOverviewDateError] = useState<string | null>(null);

  const [detailPeriod, setDetailPeriod] = useState<PeriodPreset>('month');
  const [detailCustomRange, setDetailCustomRange] = useState<DateRange>(INITIAL_CUSTOM_RANGE);
  const [detailDateError, setDetailDateError] = useState<string | null>(null);
  const [detailFilters, setDetailFilters] = useState<ExpenseFilters>({ ...DEFAULT_FILTERS });
  const [appliedDetailQuery, setAppliedDetailQuery] = useState<AppliedExpenseQuery>({
    range: PERIOD_RANGES.month,
    filters: { ...DEFAULT_FILTERS },
  });
  const [page, setPage] = useState(1);

  const activeOverviewRange = overviewPeriod === 'custom'
    ? overviewCustomRange
    : PERIOD_RANGES[overviewPeriod];
  const detailDraftRange = detailPeriod === 'custom'
    ? detailCustomRange
    : PERIOD_RANGES[detailPeriod];

  const filterOptions = useMemo(() => ({
    stores: ['全部门店', ...new Set(CONFIRMED_EXPENSES.map((expense) => expense.store))],
    products: ['全部商品', ...new Set(CONFIRMED_EXPENSES.map((expense) => expense.productName))],
    receipts: ['全部小票', ...new Set(CONFIRMED_EXPENSES.map((expense) => expense.receiptId))],
  }), []);

  const overviewExpenses = useMemo(
    () => filterConfirmedExpenses({ range: activeOverviewRange, filters: { ...DEFAULT_FILTERS } }),
    [activeOverviewRange],
  );
  const detailExpenses = useMemo(
    () => filterConfirmedExpenses(appliedDetailQuery),
    [appliedDetailQuery],
  );

  const overviewTotalCents = overviewExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const overviewReceiptCount = new Set(overviewExpenses.map((expense) => expense.receiptId)).size;
  const detailTotalCents = detailExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const detailReceiptCount = new Set(detailExpenses.map((expense) => expense.receiptId)).size;
  const hasPendingDetailChanges = detailDraftRange.start !== appliedDetailQuery.range.start
    || detailDraftRange.end !== appliedDetailQuery.range.end
    || detailFilters.store !== appliedDetailQuery.filters.store
    || detailFilters.productName !== appliedDetailQuery.filters.productName
    || detailFilters.receiptId !== appliedDetailQuery.filters.receiptId;

  const changeOverviewPeriod = (nextPeriod: PeriodPreset) => {
    setOverviewPeriod(nextPeriod);
    setOverviewDateError(null);
  };

  const changeOverviewCustomDraft = (field: keyof DateRange, value: string) => {
    setOverviewCustomDraft((current) => ({ ...current, [field]: value }));
    setOverviewDateError(null);
  };

  const applyOverviewCustomRange = () => {
    const error = validateDateRange(overviewCustomDraft);
    if (error) {
      setOverviewDateError(error);
      return;
    }

    setOverviewCustomRange(overviewCustomDraft);
    setOverviewDateError(null);
  };

  const changeDetailPeriod = (nextPeriod: PeriodPreset) => {
    setDetailPeriod(nextPeriod);
    setDetailDateError(null);
  };

  const changeDetailCustomRange = (field: keyof DateRange, value: string) => {
    setDetailCustomRange((current) => ({ ...current, [field]: value }));
    setDetailDateError(null);
  };

  const changeDetailFilter = (field: keyof ExpenseFilters, value: string) => {
    setDetailFilters((current) => ({ ...current, [field]: value }));
  };

  const applyDetailFilters = () => {
    const error = validateDateRange(detailDraftRange);
    if (error) {
      setDetailDateError(error);
      return;
    }

    setAppliedDetailQuery({
      range: { ...detailDraftRange },
      filters: { ...detailFilters },
    });
    setDetailDateError(null);
    setPage(1);
  };

  const resetDetailDraft = () => {
    setDetailPeriod('month');
    setDetailCustomRange(INITIAL_CUSTOM_RANGE);
    setDetailFilters({ ...DEFAULT_FILTERS });
    setDetailDateError(null);
  };

  const clearAppliedDetailFilters = () => {
    const defaultQuery = {
      range: PERIOD_RANGES.month,
      filters: { ...DEFAULT_FILTERS },
    };
    setDetailPeriod('month');
    setDetailCustomRange(INITIAL_CUSTOM_RANGE);
    setDetailFilters({ ...DEFAULT_FILTERS });
    setAppliedDetailQuery(defaultQuery);
    setDetailDateError(null);
    setPage(1);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>RECEIPTLY</Text>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>合成演示数据</Text>
            </View>
          </View>
          <Text style={styles.title}>家庭账单</Text>
          <Text style={styles.subtitle}>看清每一笔已确认的家庭支出</Text>
        </View>
        <Pressable
          accessibilityLabel="账单工具"
          accessibilityRole="button"
          onPress={() => Alert.alert('账单工具', '导出、分类管理和账单设置将在后续版本接入。')}
          style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}
        >
          <Text style={styles.toolIcon}>⚙︎</Text>
        </Pressable>
      </View>

      <View style={styles.periodCard}>
        <View style={styles.periodHeader}>
          <Text style={styles.sectionLabel}>账单总览时间</Text>
          <Text style={styles.timezone}>Pacific/Auckland</Text>
        </View>
        <PeriodSelector onChange={changeOverviewPeriod} range={activeOverviewRange} value={overviewPeriod} />
        {overviewPeriod === 'custom' && (
          <CustomDateRange
            draftRange={overviewCustomDraft}
            error={overviewDateError}
            onApply={applyOverviewCustomRange}
            onChange={changeOverviewCustomDraft}
          />
        )}
      </View>

      <SpendingSummary
        lineCount={overviewExpenses.length}
        receiptCount={overviewReceiptCount}
        totalCents={overviewTotalCents}
      />

      <View style={styles.detailsHeading}>
        <View>
          <Text style={styles.detailsTitle}>支出详情</Text>
          <Text style={styles.detailsSubtitle}>筛选结果只包含已确认小票</Text>
        </View>
      </View>

      <ExpenseFiltersPanel
        customRange={detailCustomRange}
        dateError={detailDateError}
        filters={detailFilters}
        hasPendingChanges={hasPendingDetailChanges}
        onApply={applyDetailFilters}
        onCustomRangeChange={changeDetailCustomRange}
        onFilterChange={changeDetailFilter}
        onPeriodChange={changeDetailPeriod}
        onReset={resetDetailDraft}
        period={detailPeriod}
        products={filterOptions.products}
        range={detailDraftRange}
        receipts={filterOptions.receipts}
        stores={filterOptions.stores}
      />

      <FilteredSpendingTotal
        lineCount={detailExpenses.length}
        receiptCount={detailReceiptCount}
        totalCents={detailTotalCents}
      />

      <ExpenseList
        expenses={detailExpenses}
        onPageChange={setPage}
        onResetFilters={clearAppliedDetailFilters}
        page={page}
        pageSize={PAGE_SIZE}
      />

      <Text style={styles.dataBoundary}>
        数据边界：仅展示本家庭合成的已确认小票记录，不代表零售商当前价格或市场价格。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#F7F8F4',
    gap: 20,
    paddingBottom: 34,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { flex: 1, paddingRight: 14 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  eyebrow: { color: '#557066', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  demoBadge: { backgroundColor: '#FFF1D8', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  demoBadgeText: { color: '#8A5A16', fontSize: 9, fontWeight: '700' },
  title: { color: '#1A342B', fontSize: 31, fontWeight: '800', letterSpacing: -0.9, marginTop: 7 },
  subtitle: { color: '#6C7C74', fontSize: 13, marginTop: 5 },
  toolButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E6DF',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  toolIcon: { color: '#315D49', fontSize: 21 },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8E1',
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
  },
  periodHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  sectionLabel: { color: '#294239', fontSize: 14, fontWeight: '700' },
  timezone: { color: '#89968F', fontSize: 10 },
  detailsHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detailsTitle: { color: '#1F382F', fontSize: 21, fontWeight: '800' },
  detailsSubtitle: { color: '#7A8981', fontSize: 12, marginTop: 4 },
  dataBoundary: { color: '#87938D', fontSize: 10, lineHeight: 16, paddingHorizontal: 6, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
