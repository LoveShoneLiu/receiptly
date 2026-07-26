import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getHomeExpenses,
  type HomeExpense,
  type HomeExpensesData,
} from '../../api/homeExpenses';
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

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : '加载家庭账本失败，请稍后重试。';

const toApiQuery = ({ range, filters }: AppliedExpenseQuery, cursor?: string) => ({
  start: range.start,
  end: range.end,
  store: filters.store === DEFAULT_FILTERS.store ? undefined : filters.store,
  product: filters.productName === DEFAULT_FILTERS.productName ? undefined : filters.productName,
  receiptNumber: filters.receiptNumber === DEFAULT_FILTERS.receiptNumber
    ? undefined
    : filters.receiptNumber,
  cursor,
  limit: PAGE_SIZE,
});

const uniqueValues = (
  items: HomeExpense[],
  select: (item: HomeExpense) => string | null,
) => [...new Set(items.map(select).filter((value): value is string => Boolean(value)))];

type HomeScreenProps = {
  accessToken: string;
  householdId: string;
};

export function HomeScreen({ accessToken, householdId }: HomeScreenProps) {
  const [overviewPeriod, setOverviewPeriod] = useState<PeriodPreset>('month');
  const [overviewCustomDraft, setOverviewCustomDraft] = useState<DateRange>(INITIAL_CUSTOM_RANGE);
  const [overviewCustomRange, setOverviewCustomRange] = useState<DateRange>(INITIAL_CUSTOM_RANGE);
  const [overviewDateError, setOverviewDateError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<HomeExpensesData | null>(null);

  const [detailPeriod, setDetailPeriod] = useState<PeriodPreset>('month');
  const [detailCustomRange, setDetailCustomRange] = useState<DateRange>(INITIAL_CUSTOM_RANGE);
  const [detailDateError, setDetailDateError] = useState<string | null>(null);
  const [detailFilters, setDetailFilters] = useState<ExpenseFilters>({ ...DEFAULT_FILTERS });
  const [appliedDetailQuery, setAppliedDetailQuery] = useState<AppliedExpenseQuery>({
    range: PERIOD_RANGES.month,
    filters: { ...DEFAULT_FILTERS },
  });
  const [detailData, setDetailData] = useState<HomeExpensesData | null>(null);
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Array<string | undefined>>([undefined]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const activeOverviewRange = overviewPeriod === 'custom'
    ? overviewCustomRange
    : PERIOD_RANGES[overviewPeriod];
  const hasPendingOverviewRange = overviewCustomDraft.start !== overviewCustomRange.start
    || overviewCustomDraft.end !== overviewCustomRange.end;
  const detailDraftRange = detailPeriod === 'custom'
    ? detailCustomRange
    : PERIOD_RANGES[detailPeriod];

  const filterOptions = useMemo(() => {
    const items = detailData?.items ?? [];
    const selectedStores = detailFilters.store === DEFAULT_FILTERS.store ? [] : [detailFilters.store];
    const selectedProducts = detailFilters.productName === DEFAULT_FILTERS.productName
      ? []
      : [detailFilters.productName];
    const selectedReceipts = detailFilters.receiptNumber === DEFAULT_FILTERS.receiptNumber
      ? []
      : [detailFilters.receiptNumber];

    return {
      stores: [DEFAULT_FILTERS.store, ...new Set([...selectedStores, ...uniqueValues(items, (item) => item.store)])],
      products: [DEFAULT_FILTERS.productName, ...new Set([
        ...selectedProducts,
        ...uniqueValues(items, (item) => item.productName),
      ])],
      receipts: [DEFAULT_FILTERS.receiptNumber, ...new Set([
        ...selectedReceipts,
        ...uniqueValues(items, (item) => item.receiptNumber),
      ])],
    };
  }, [detailData, detailFilters]);

  const loadData = useCallback(async ({
    currentPage = page,
    currentQuery = appliedDetailQuery,
    isRefresh = false,
  }: {
    currentPage?: number;
    currentQuery?: AppliedExpenseQuery;
    isRefresh?: boolean;
  } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const cursor = pageCursors[currentPage - 1];
      const [nextOverviewData, nextDetailData] = await Promise.all([
        getHomeExpenses(householdId, {
          start: activeOverviewRange.start,
          end: activeOverviewRange.end,
          limit: 1,
        }, { accessToken }),
        getHomeExpenses(
          householdId,
          toApiQuery(currentQuery, cursor),
          { accessToken },
        ),
      ]);
      if (requestId !== requestIdRef.current) return;

      setOverviewData(nextOverviewData);
      setDetailData(nextDetailData);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(getMessage(loadError));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [
    activeOverviewRange.end,
    activeOverviewRange.start,
    accessToken,
    appliedDetailQuery,
    householdId,
    page,
    pageCursors,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const hasPendingDetailChanges = detailDraftRange.start !== appliedDetailQuery.range.start
    || detailDraftRange.end !== appliedDetailQuery.range.end
    || detailFilters.store !== appliedDetailQuery.filters.store
    || detailFilters.productName !== appliedDetailQuery.filters.productName
    || detailFilters.receiptNumber !== appliedDetailQuery.filters.receiptNumber;

  const applyOverviewCustomRange = () => {
    const nextError = validateDateRange(overviewCustomDraft);
    if (nextError) {
      setOverviewDateError(nextError);
      return;
    }
    setOverviewCustomRange({ ...overviewCustomDraft });
    setOverviewDateError(null);
  };

  const applyDetailFilters = () => {
    const nextError = validateDateRange(detailDraftRange);
    if (nextError) {
      setDetailDateError(nextError);
      return;
    }

    setAppliedDetailQuery({
      range: { ...detailDraftRange },
      filters: { ...detailFilters },
    });
    setDetailDateError(null);
    setPage(1);
    setPageCursors([undefined]);
  };

  const resetDetailDraft = () => {
    setDetailPeriod('month');
    setDetailCustomRange(INITIAL_CUSTOM_RANGE);
    setDetailFilters({ ...DEFAULT_FILTERS });
    setDetailDateError(null);
  };

  const clearAppliedDetailFilters = () => {
    setDetailPeriod('month');
    setDetailCustomRange(INITIAL_CUSTOM_RANGE);
    setDetailFilters({ ...DEFAULT_FILTERS });
    setAppliedDetailQuery({
      range: PERIOD_RANGES.month,
      filters: { ...DEFAULT_FILTERS },
    });
    setDetailDateError(null);
    setPage(1);
    setPageCursors([undefined]);
  };

  const goToNextPage = () => {
    const nextCursor = detailData?.page.nextCursor;
    if (!nextCursor) return;
    setPageCursors((current) => {
      const next = [...current];
      next[page] = nextCursor;
      return next;
    });
    setPage(page + 1);
  };

  const updatedAt = overviewData
    ? new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'numeric',
      day: 'numeric',
    }).format(new Date())
    : null;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={(
        <RefreshControl
          onRefresh={() => void loadData({ isRefresh: true })}
          refreshing={refreshing}
          tintColor="#315D49"
        />
      )}
    >
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>RECEIPTLY</Text>
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

      {error && (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <View style={styles.errorCopy}>
            <Text style={styles.errorTitle}>家庭账本加载失败</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadData()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        </View>
      )}

      {loading && !overviewData && (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingTitle}>正在读取家庭账本…</Text>
          <Text style={styles.loadingText}>只会汇总已经确认的小票明细。</Text>
        </View>
      )}

      <View style={styles.periodCard}>
        <View style={styles.periodHeader}>
          <Text style={styles.sectionLabel}>账单总览时间</Text>
          <Text style={styles.timezone}>Pacific/Auckland</Text>
        </View>
        <PeriodSelector
          onChange={(nextPeriod) => {
            setOverviewPeriod(nextPeriod);
            setOverviewDateError(null);
          }}
          range={activeOverviewRange}
          value={overviewPeriod}
        />
        {overviewPeriod === 'custom' && (
          <CustomDateRange
            applyDisabled={!hasPendingOverviewRange}
            draftRange={overviewCustomDraft}
            error={overviewDateError}
            onApply={applyOverviewCustomRange}
            onChange={(field, value) => {
              setOverviewCustomDraft((current) => ({ ...current, [field]: value }));
              setOverviewDateError(null);
            }}
          />
        )}
      </View>

      <SpendingSummary
        totalCents={overviewData?.summary.totalCents ?? 0}
        updatedAt={updatedAt}
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
        onCustomRangeChange={(field, value) => {
          setDetailCustomRange((current) => ({ ...current, [field]: value }));
          setDetailDateError(null);
        }}
        onFilterChange={(field, value) => {
          setDetailFilters((current) => ({ ...current, [field]: value }));
        }}
        onPeriodChange={(nextPeriod) => {
          setDetailPeriod(nextPeriod);
          setDetailDateError(null);
        }}
        onReset={resetDetailDraft}
        period={detailPeriod}
        products={filterOptions.products}
        range={detailDraftRange}
        receipts={filterOptions.receipts}
        stores={filterOptions.stores}
      />

      <FilteredSpendingTotal
        lineCount={detailData?.summary.lineCount ?? 0}
        totalCents={detailData?.summary.totalCents ?? 0}
      />

      <ExpenseList
        expenses={detailData?.items ?? []}
        hasMore={detailData?.page.hasMore ?? false}
        loading={loading}
        onNextPage={goToNextPage}
        onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
        onResetFilters={clearAppliedDetailFilters}
        page={page}
        pageSize={PAGE_SIZE}
        totalLineCount={detailData?.summary.lineCount ?? 0}
      />

      <Text style={styles.dataBoundary}>
        数据边界：仅展示本家庭已确认小票记录，不代表零售商当前价格或市场价格。
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
  eyebrow: { color: '#557066', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
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
  errorCard: {
    alignItems: 'center',
    backgroundColor: '#FFF0ED',
    borderColor: '#F2C9C1',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  errorCopy: { flex: 1, paddingRight: 10 },
  errorTitle: { color: '#7F3028', fontSize: 14, fontWeight: '800' },
  errorText: { color: '#955148', fontSize: 12, lineHeight: 18, marginTop: 4 },
  retryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  retryText: { color: '#7F3028', fontSize: 13, fontWeight: '800' },
  loadingCard: { backgroundColor: '#EDF3E9', borderRadius: 16, padding: 16 },
  loadingTitle: { color: '#2A5041', fontSize: 14, fontWeight: '800' },
  loadingText: { color: '#61776C', fontSize: 12, marginTop: 4 },
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
