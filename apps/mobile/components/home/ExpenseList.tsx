import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeExpense } from '../../api/homeExpenses';
import { useLanguage } from '../../i18n/LanguageContext';

type ExpenseListProps = {
  expenses: HomeExpense[];
  page: number;
  pageSize: number;
  totalLineCount: number;
  hasMore: boolean;
  loading: boolean;
  loadingPage: number | null;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onResetFilters: () => void;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-NZ', { currency: 'NZD', style: 'currency' }).format(cents / 100);

const formatQuantity = (expense: HomeExpense) =>
  expense.quantity && expense.unit ? `${expense.quantity} ${expense.unit}` : '—';

const formatUnitPrice = (expense: HomeExpense) =>
  expense.unitPriceCents !== null && expense.unit
    ? `${formatCurrency(expense.unitPriceCents)}/${expense.unit}`
    : '—';

const formatDate = (value: string, locale: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
};

export function ExpenseList({
  expenses,
  page,
  pageSize,
  totalLineCount,
  hasMore,
  loading,
  loadingPage,
  onNextPage,
  onPreviousPage,
  onResetFilters,
}: ExpenseListProps) {
  const { text } = useLanguage();
  const totalPages = Math.max(1, Math.ceil(totalLineCount / pageSize));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{text('支出明细', 'Expenses')}</Text>
          <Text style={styles.subtitle}>{text(`${totalLineCount} 条已确认记录 · 每页 ${pageSize} 条`, `${totalLineCount} confirmed · ${pageSize} per page`)}</Text>
        </View>
        <View style={styles.sortBadge}>
          <Text style={styles.sortText}>{text('最新优先', 'Newest first')}</Text>
        </View>
      </View>

      {loadingPage !== null && (
        <View accessibilityLiveRegion="polite" style={styles.pageLoading}>
          <Text style={styles.pageLoadingText}>{text(`正在加载第 ${loadingPage} 页…`, `Loading page ${loadingPage}…`)}</Text>
        </View>
      )}

      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⌕</Text>
          <Text style={styles.emptyTitle}>{text('没有符合条件的支出', 'No matching expenses')}</Text>
          <Text style={styles.emptyText}>{text('尝试调整时间范围，或清除门店、小票和商品名筛选。', 'Try another date range or clear the store, receipt and product filters.')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onResetFilters}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          >
            <Text style={styles.emptyButtonText}>{text('清除筛选', 'Clear filters')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {expenses.map((expense) => (
            <ExpenseRow expense={expense} key={expense.id} />
          ))}
        </View>
      )}

      {(expenses.length > 0 || page > 1) && (
        <View style={styles.pagination}>
          <PageButton
            disabled={page <= 1 || loading}
            label={text('上一页', 'Previous')}
            onPress={onPreviousPage}
          />
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>{text(`${page} / ${totalPages} 页`, `${page} / ${totalPages}`)}</Text>
          </View>
          <PageButton
            disabled={!hasMore || loading}
            label={text('下一页', 'Next')}
            onPress={onNextPage}
          />
        </View>
      )}
    </View>
  );
}

function ExpenseRow({ expense }: { expense: HomeExpense }) {
  const { locale, text } = useLanguage();
  const store = expense.store ?? text('未确认门店', 'Unconfirmed store');
  const productName = expense.productName ?? text('未命名商品', 'Unnamed product');
  const receiptNumber = expense.receiptNumber ?? text('未提供', 'Not provided');

  return (
    <Pressable
      accessibilityHint={text('打开这笔支出的组成明细', 'Open expense details')}
      accessibilityRole="button"
      onPress={() => Alert.alert(
        `${productName} · ${formatCurrency(expense.amountCents)}`,
        text(
          `门店 ${store}\n小票编号 ${receiptNumber}\n单位 ${formatQuantity(expense)}\n单价 ${formatUnitPrice(expense)}\n购买日期 ${expense.purchasedOn}\n状态：已确认`,
          `Store ${store}\nReceipt ${receiptNumber}\nQuantity ${formatQuantity(expense)}\nUnit price ${formatUnitPrice(expense)}\nPurchased ${expense.purchasedOn}\nStatus: Confirmed`,
        ),
      )}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.storeMark}>
        <Text style={styles.storeMarkText}>{store.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={styles.productName}>{productName}</Text>
          <Text style={styles.price}>{text('实付', 'Paid')} {formatCurrency(expense.amountCents)}</Text>
        </View>
        <View style={styles.rowMiddle}>
          <Text numberOfLines={1} style={styles.storeName}>{store}</Text>
          <Text style={styles.date}>{formatDate(expense.purchasedOn, locale)}</Text>
        </View>
        <View style={styles.priceDetails}>
          <View style={styles.detailBadge}>
            <Text style={styles.detailLabel}>{text('单位', 'Qty')}</Text>
            <Text style={styles.detailValue}>{formatQuantity(expense)}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Text style={styles.detailLabel}>{text('单价', 'Unit')}</Text>
            <Text style={styles.detailValue}>{formatUnitPrice(expense)}</Text>
          </View>
        </View>
        <View style={styles.rowBottom}>
          <Text style={styles.receipt}>{text('小票', 'Receipt')} {receiptNumber}</Text>
          <View style={styles.confirmed}>
            <Text style={styles.confirmedText}>{text('已确认', 'Confirmed')}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function PageButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pageButton,
        disabled && styles.pageButtonDisabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pageButtonText, disabled && styles.pageButtonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#1F382F', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#7B8982', fontSize: 12, marginTop: 4 },
  sortBadge: { backgroundColor: '#EEF3EA', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
  sortText: { color: '#486257', fontSize: 11, fontWeight: '700' },
  list: { gap: 10 },
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAE4',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 148,
    padding: 14,
  },
  storeMark: {
    alignItems: 'center',
    backgroundColor: '#E8F0E3',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  storeMarkText: { color: '#315D49', fontSize: 16, fontWeight: '800' },
  rowContent: { flex: 1 },
  rowTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  productName: { color: '#263D34', flex: 1, fontSize: 15, fontWeight: '800', marginRight: 12 },
  price: { color: '#1D3F33', fontSize: 16, fontWeight: '800' },
  rowMiddle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  storeName: { color: '#5A6F65', flex: 1, fontSize: 13, marginRight: 10 },
  date: { color: '#78877F', fontSize: 12 },
  priceDetails: { flexDirection: 'row', gap: 8, marginTop: 10 },
  detailBadge: {
    alignItems: 'center',
    backgroundColor: '#F4F7F1',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 9,
  },
  detailLabel: { color: '#839087', fontSize: 10 },
  detailValue: { color: '#40594E', fontSize: 11, fontWeight: '700' },
  rowBottom: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  receipt: { color: '#8A978F', flex: 1, fontSize: 11 },
  confirmed: { backgroundColor: '#ECF5E7', borderRadius: 12, marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4 },
  confirmedText: { color: '#38654F', fontSize: 10, fontWeight: '700' },
  chevron: { color: '#91A098', fontSize: 24, marginLeft: 8 },
  empty: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E4EAE3',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
  },
  emptyIcon: { color: '#6E8378', fontSize: 34 },
  emptyTitle: { color: '#263D34', fontSize: 17, fontWeight: '700', marginTop: 10 },
  emptyText: { color: '#74847C', fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  emptyButton: { backgroundColor: '#EDF3E9', borderRadius: 12, justifyContent: 'center', marginTop: 16, minHeight: 44, paddingHorizontal: 16 },
  emptyButtonText: { color: '#315D49', fontSize: 13, fontWeight: '700' },
  pageLoading: {
    alignItems: 'center',
    backgroundColor: '#EEF3EA',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 36,
  },
  pageLoadingText: { color: '#486257', fontSize: 12, fontWeight: '700' },
  pagination: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  pageButton: {
    alignItems: 'center',
    borderColor: '#DDE5DC',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 82,
    paddingHorizontal: 14,
  },
  pageButtonDisabled: { backgroundColor: '#F2F4F1', borderColor: '#EBEEEA' },
  pageButtonText: { color: '#315D49', fontSize: 13, fontWeight: '700' },
  pageButtonTextDisabled: { color: '#AAB4AE' },
  pageIndicator: { alignItems: 'center', minWidth: 82 },
  pageIndicatorText: { color: '#5C6F66', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
