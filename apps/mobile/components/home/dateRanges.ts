import type { DateRange, OverviewPeriodPreset } from './types';

const HOUSEHOLD_TIME_ZONE = 'Pacific/Auckland';

export const DEFAULT_FILTERS = {
  store: '',
  receiptNumber: '',
  productName: '',
} as const;

const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const getHouseholdToday = () => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    timeZone: HOUSEHOLD_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
  ));
};

const householdToday = getHouseholdToday();
const startOfWeek = new Date(householdToday);
const daysSinceMonday = (householdToday.getUTCDay() + 6) % 7;
startOfWeek.setUTCDate(householdToday.getUTCDate() - daysSinceMonday);

const startOfMonth = new Date(Date.UTC(
  householdToday.getUTCFullYear(),
  householdToday.getUTCMonth(),
  1,
));
const endOfMonth = new Date(Date.UTC(
  householdToday.getUTCFullYear(),
  householdToday.getUTCMonth() + 1,
  0,
));
const startOfYear = new Date(Date.UTC(householdToday.getUTCFullYear(), 0, 1));
const endOfYear = new Date(Date.UTC(householdToday.getUTCFullYear(), 11, 31));
const startOfCustomRange = new Date(householdToday);
startOfCustomRange.setUTCMonth(startOfCustomRange.getUTCMonth() - 1);

export const PERIOD_RANGES: Record<OverviewPeriodPreset, DateRange> = {
  week: {
    start: formatIsoDate(startOfWeek),
    end: formatIsoDate(householdToday),
  },
  month: {
    start: formatIsoDate(startOfMonth),
    end: formatIsoDate(endOfMonth),
  },
  year: {
    start: formatIsoDate(startOfYear),
    end: formatIsoDate(endOfYear),
  },
};

export const INITIAL_CUSTOM_RANGE: DateRange = {
  start: formatIsoDate(startOfCustomRange),
  end: formatIsoDate(householdToday),
};

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const validateDateRange = (
  range: DateRange,
  text: (zh: string, en: string) => string,
) => {
  if (!isValidIsoDate(range.start) || !isValidIsoDate(range.end)) {
    return text(
      '请输入有效日期，格式为 YYYY-MM-DD。',
      'Enter valid dates in YYYY-MM-DD format.',
    );
  }
  if (range.start > range.end) {
    return text(
      '开始日期不能晚于结束日期。',
      'The start date cannot be later than the end date.',
    );
  }
  return null;
};
