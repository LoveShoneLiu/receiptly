import type { DateRange, PeriodPreset } from './types';

export const DEFAULT_FILTERS = {
  store: '全部门店',
  receiptId: '全部小票',
  productName: '全部商品',
} as const;

export const PERIOD_RANGES: Record<Exclude<PeriodPreset, 'custom'>, DateRange> = {
  week: { start: '2026-07-20', end: '2026-07-23' },
  month: { start: '2026-07-01', end: '2026-07-31' },
};

export const INITIAL_CUSTOM_RANGE: DateRange = {
  start: '2026-06-23',
  end: '2026-07-23',
};

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const validateDateRange = (range: DateRange) => {
  if (!isValidIsoDate(range.start) || !isValidIsoDate(range.end)) {
    return '请输入有效日期，格式为 YYYY-MM-DD。';
  }
  if (range.start > range.end) {
    return '开始日期不能晚于结束日期。';
  }
  return null;
};
