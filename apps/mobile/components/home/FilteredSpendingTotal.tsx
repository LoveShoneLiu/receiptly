import { StyleSheet, Text, View } from 'react-native';

type FilteredSpendingTotalProps = {
  totalCents: number;
  lineCount: number;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-NZ', { currency: 'NZD', style: 'currency' }).format(cents / 100);

export function FilteredSpendingTotal({
  totalCents,
  lineCount,
}: FilteredSpendingTotalProps) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.label}>筛选结果总消费</Text>
        <Text style={styles.meta}>{lineCount} 条已确认明细 · 小票总数待接口提供</Text>
      </View>
      <Text style={styles.amount}>NZ {formatCurrency(totalCents)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DC',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 17,
  },
  label: { color: '#52675D', fontSize: 12, fontWeight: '700' },
  meta: { color: '#8A978F', fontSize: 10, marginTop: 5 },
  amount: { color: '#1D4436', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
});
