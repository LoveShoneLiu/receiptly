export type PeriodPreset = 'week' | 'month' | 'custom';

export type DateRange = {
  start: string;
  end: string;
};

export type ExpenseFilters = {
  store: string;
  receiptId: string;
  productName: string;
};

export type AppliedExpenseQuery = {
  range: DateRange;
  filters: ExpenseFilters;
};
