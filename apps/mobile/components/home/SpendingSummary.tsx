import { StyleSheet, Text, View } from 'react-native';

type SpendingSummaryProps = {
  totalCents: number;
  receiptCount: number;
  lineCount: number;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-NZ', { currency: 'NZD', style: 'currency' }).format(cents / 100);

export function SpendingSummary({ totalCents, receiptCount, lineCount }: SpendingSummaryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.label}>已确认支出</Text>
          <Text style={styles.amount}>NZ {formatCurrency(totalCents)}</Text>
          <Text style={styles.updatedAt}>演示快照更新于 2026/07/23</Text>
        </View>
        <View style={styles.confirmedBadge}>
          <Text style={styles.confirmedDot}>●</Text>
          <Text style={styles.confirmedText}>仅已确认</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{receiptCount}</Text>
          <Text style={styles.metricLabel}>小票</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{lineCount}</Text>
          <Text style={styles.metricLabel}>支出明细</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>NZD</Text>
          <Text style={styles.metricLabel}>家庭货币</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>i</Text>
        <Text style={styles.noticeText}>草稿、处理中和待确认的小票不会计入这里。</Text>
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
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#BFD8C4', fontSize: 13, fontWeight: '700' },
  amount: { color: '#FFFFFF', fontSize: 35, fontWeight: '800', letterSpacing: -1.1, marginTop: 8 },
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
  divider: { backgroundColor: 'rgba(255, 255, 255, 0.13)', height: 1, marginVertical: 18 },
  metrics: { alignItems: 'center', flexDirection: 'row' },
  metric: { flex: 1 },
  metricValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  metricLabel: { color: '#BBD0C0', fontSize: 11, marginTop: 4 },
  metricDivider: { backgroundColor: 'rgba(255, 255, 255, 0.13)', height: 32, width: 1 },
  notice: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 28, 21, 0.24)',
    borderRadius: 13,
    flexDirection: 'row',
    marginTop: 18,
    padding: 11,
  },
  noticeIcon: {
    backgroundColor: '#D8E965',
    borderRadius: 10,
    color: '#1B3C31',
    fontSize: 11,
    fontWeight: '800',
    height: 20,
    lineHeight: 20,
    marginRight: 8,
    textAlign: 'center',
    width: 20,
  },
  noticeText: { color: '#D5E4D6', flex: 1, fontSize: 12, lineHeight: 18 },
});
