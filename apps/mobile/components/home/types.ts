export type PeriodPreset = 'week' | 'month' | 'custom';
export type OverviewPeriodPreset = 'week' | 'month' | 'year';

export type DateRange = {
  start: string;
  end: string;
};

export type ExpenseFilters = {
  store: string;
  receiptNumber: string;
  productName: string;
};

export type AppliedExpenseQuery = {
  range: DateRange;
  filters: ExpenseFilters;
};
