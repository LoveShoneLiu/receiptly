import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeExpense } from '../../api/homeExpenses';

type ExpenseListProps = {
  expenses: HomeExpense[];
  page: number;
  pageSize: number;
  totalLineCount: number;
  hasMore: boolean;
  loading: boolean;
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

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
};

export function ExpenseList({
  expenses,
  page,
  pageSize,
  totalLineCount,
  hasMore,
  loading,
  onNextPage,
  onPreviousPage,
  onResetFilters,
}: ExpenseListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>支出明细</Text>
          <Text style={styles.subtitle}>{totalLineCount} 条已确认记录 · 每页 {pageSize} 条</Text>
        </View>
        <View style={styles.sortBadge}>
          <Text style={styles.sortText}>最新优先</Text>
        </View>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⌕</Text>
          <Text style={styles.emptyTitle}>没有符合条件的支出</Text>
          <Text style={styles.emptyText}>尝试调整时间范围，或清除门店、小票和商品名筛选。</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onResetFilters}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          >
            <Text style={styles.emptyButtonText}>清除筛选</Text>
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
            label="上一页"
            onPress={onPreviousPage}
          />
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>第 {page} 页</Text>
          </View>
          <PageButton
            disabled={!hasMore || loading}
            label="下一页"
            onPress={onNextPage}
          />
        </View>
      )}
    </View>
  );
}

function ExpenseRow({ expense }: { expense: HomeExpense }) {
  const store = expense.store ?? '未确认门店';
  const productName = expense.productName ?? '未命名商品';
  const receiptNumber = expense.receiptNumber ?? '未提供';

  return (
    <Pressable
      accessibilityHint="打开这笔支出的组成明细"
      accessibilityRole="button"
      onPress={() => Alert.alert(
        `${productName} · ${formatCurrency(expense.amountCents)}`,
        `门店 ${store}\n小票编号 ${receiptNumber}\n单位 ${formatQuantity(expense)}\n单价 ${formatUnitPrice(expense)}\n购买日期 ${expense.purchasedOn}\n状态：已确认`,
      )}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.storeMark}>
        <Text style={styles.storeMarkText}>{store.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={styles.productName}>{productName}</Text>
          <Text style={styles.price}>实付 {formatCurrency(expense.amountCents)}</Text>
        </View>
        <View style={styles.rowMiddle}>
          <Text numberOfLines={1} style={styles.storeName}>{store}</Text>
          <Text style={styles.date}>{formatDate(expense.purchasedOn)}</Text>
        </View>
        <View style={styles.priceDetails}>
          <View style={styles.detailBadge}>
            <Text style={styles.detailLabel}>单位</Text>
            <Text style={styles.detailValue}>{formatQuantity(expense)}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Text style={styles.detailLabel}>单价</Text>
            <Text style={styles.detailValue}>{formatUnitPrice(expense)}</Text>
          </View>
        </View>
        <View style={styles.rowBottom}>
          <Text style={styles.receipt}>小票 {receiptNumber}</Text>
          <View style={styles.confirmed}>
            <Text style={styles.confirmedText}>已确认</Text>
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
  pageIndicator: { alignItems: 'center', minWidth: 66 },
  pageIndicatorText: { color: '#5C6F66', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
