import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { SpendingSummary } from '../home/SpendingSummary';
import type {
  AppliedExpenseQuery,
  DateRange,
  ExpenseFilters,
  OverviewPeriodPreset,
  PeriodPreset,
} from '../home/types';
import { useLanguage } from '../../i18n/LanguageContext';

const PAGE_SIZE = 20;

const getMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

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
  const { locale, text } = useLanguage();
  const [overviewPeriod, setOverviewPeriod] = useState<OverviewPeriodPreset>('month');
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
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [applyingFilters, setApplyingFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const activeOverviewRange = PERIOD_RANGES[overviewPeriod];
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
    currentQuery = appliedDetailQuery,
    isRefresh = false,
  }: {
    currentQuery?: AppliedExpenseQuery;
    isRefresh?: boolean;
  } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [nextOverviewData, nextDetailData] = await Promise.all([
        getHomeExpenses(householdId, {
          start: activeOverviewRange.start,
          end: activeOverviewRange.end,
          limit: 1,
        }, { accessToken }),
        getHomeExpenses(
          householdId,
          toApiQuery(currentQuery),
          { accessToken },
        ),
      ]);
      if (requestId !== requestIdRef.current) return;

      setOverviewData(nextOverviewData);
      setDetailData(nextDetailData);
      setPage(1);
      setPageCursors([undefined]);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(getMessage(
        loadError,
        text('加载家庭账本失败，请稍后重试。', 'Could not load the household ledger. Try again.'),
      ));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
        setApplyingFilters(false);
      }
    }
  }, [
    activeOverviewRange.end,
    activeOverviewRange.start,
    accessToken,
    appliedDetailQuery,
    householdId,
    text,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const hasPendingDetailChanges = detailDraftRange.start !== appliedDetailQuery.range.start
    || detailDraftRange.end !== appliedDetailQuery.range.end
    || detailFilters.store !== appliedDetailQuery.filters.store
    || detailFilters.productName !== appliedDetailQuery.filters.productName
    || detailFilters.receiptNumber !== appliedDetailQuery.filters.receiptNumber;

  const applyDetailFilters = () => {
    const nextError = validateDateRange(detailDraftRange, text);
    if (nextError) {
      setDetailDateError(nextError);
      return;
    }

    setAppliedDetailQuery({
      range: { ...detailDraftRange },
      filters: { ...detailFilters },
    });
    setApplyingFilters(true);
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

  const loadExpensePage = async (targetPage: number, cursor: string | undefined) => {
    if (pendingPage !== null || targetPage < 1) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPendingPage(targetPage);
    setError(null);

    try {
      const nextDetailData = await getHomeExpenses(
        householdId,
        toApiQuery(appliedDetailQuery, cursor),
        { accessToken },
      );
      if (requestId !== requestIdRef.current) return;

      setDetailData(nextDetailData);
      setPage(targetPage);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(getMessage(
          loadError,
          text('加载家庭账本失败，请稍后重试。', 'Could not load the household ledger. Try again.'),
        ));
      }
    } finally {
      if (requestId === requestIdRef.current) setPendingPage(null);
    }
  };

  const goToNextPage = () => {
    const nextCursor = detailData?.page.nextCursor;
    if (!nextCursor) return;

    const targetPage = page + 1;
    setPageCursors((current) => {
      const next = [...current];
      next[targetPage - 1] = nextCursor;
      return next;
    });
    void loadExpensePage(targetPage, nextCursor);
  };

  const goToPreviousPage = () => {
    const targetPage = Math.max(1, page - 1);
    void loadExpensePage(targetPage, pageCursors[targetPage - 1]);
  };

  const updatedAt = overviewData
    ? new Intl.DateTimeFormat(locale, {
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
          <Text style={styles.title}>{text('家庭账单', 'Household ledger')}</Text>
          <Text style={styles.subtitle}>
            {text('看清每一笔已确认的家庭支出', 'See every confirmed household expense')}
          </Text>
        </View>
        {/* Ledger tools are hidden for the initial App Store release until they are complete.
        <Pressable
          accessibilityLabel={text('账单工具', 'Ledger tools')}
          accessibilityRole="button"
          onPress={() => Alert.alert(
            text('账单工具', 'Ledger tools'),
            text(
              '导出、分类管理和账单设置将在后续版本接入。',
              'Export, category management, and ledger settings are coming later.',
            ),
          )}
          style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}
        >
          <Text style={styles.toolIcon}>⚙︎</Text>
        </Pressable>
        */}
      </View>

      {error && (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <View style={styles.errorCopy}>
            <Text style={styles.errorTitle}>
              {text('家庭账本加载失败', 'Could not load household ledger')}
            </Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadData()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>{text('重试', 'Retry')}</Text>
          </Pressable>
        </View>
      )}

      <SpendingSummary
        loading={loading}
        onPeriodChange={setOverviewPeriod}
        period={overviewPeriod}
        range={activeOverviewRange}
        totalCents={overviewData?.summary.totalCents ?? null}
        updatedAt={updatedAt}
      />

      <View style={styles.detailsHeading}>
        <View>
          <Text style={styles.detailsTitle}>{text('支出详情', 'Expense details')}</Text>
          <Text style={styles.detailsSubtitle}>
            {text('筛选结果只包含已确认小票', 'Results include confirmed receipts only')}
          </Text>
        </View>
      </View>

      <ExpenseFiltersPanel
        applying={applyingFilters}
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
        loading={loading || pendingPage !== null}
        loadingPage={pendingPage}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        onResetFilters={clearAppliedDetailFilters}
        page={page}
        pageSize={PAGE_SIZE}
        totalLineCount={detailData?.summary.lineCount ?? 0}
      />

      <Text style={styles.dataBoundary}>
        {text(
          '数据边界：仅展示本家庭已确认小票记录，不代表零售商当前价格或市场价格。',
          'Data boundary: confirmed household receipts only. These are not current retailer or market prices.',
        )}
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
  detailsHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detailsTitle: { color: '#1F382F', fontSize: 21, fontWeight: '800' },
  detailsSubtitle: { color: '#7A8981', fontSize: 12, marginTop: 4 },
  dataBoundary: { color: '#87938D', fontSize: 10, lineHeight: 16, paddingHorizontal: 6, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
