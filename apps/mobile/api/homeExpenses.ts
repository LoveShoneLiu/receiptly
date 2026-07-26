import { isRecord, publicRequest } from './base';

export type HomeExpense = {
  id: string;
  receiptId: string;
  receiptNumber: string | null;
  store: string | null;
  productName: string | null;
  quantity: string | null;
  unit: string | null;
  unitPriceCents: number | null;
  amountCents: number;
  purchasedOn: string;
  purchasedAtLocal: string | null;
  currency: string | null;
  status: 'confirmed';
};

export type HomeExpensesData = {
  summary: {
    lineCount: number;
    totalCents: number;
  };
  items: HomeExpense[];
  page: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type HomeExpensesQuery = {
  start?: string;
  end?: string;
  store?: string;
  product?: string;
  receiptNumber?: string;
  cursor?: string;
  limit?: number;
};

type RequestOptions = {
  accessToken?: string;
  signal?: AbortSignal;
};

const isNullableString = (value: unknown) => typeof value === 'string' || value === null;

const isHomeExpense = (value: unknown): value is HomeExpense => {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && typeof value.receiptId === 'string'
    && isNullableString(value.receiptNumber)
    && isNullableString(value.store)
    && isNullableString(value.productName)
    && isNullableString(value.quantity)
    && isNullableString(value.unit)
    && (value.unitPriceCents === null || Number.isInteger(value.unitPriceCents))
    && Number.isInteger(value.amountCents)
    && typeof value.purchasedOn === 'string'
    && isNullableString(value.purchasedAtLocal)
    && isNullableString(value.currency)
    && value.status === 'confirmed';
};

const isHomeExpensesData = (value: unknown): value is HomeExpensesData => {
  if (!isRecord(value) || !isRecord(value.summary) || !isRecord(value.page)) return false;

  return Number.isInteger(value.summary.lineCount)
    && Number.isInteger(value.summary.totalCents)
    && Array.isArray(value.items)
    && value.items.every(isHomeExpense)
    && typeof value.page.hasMore === 'boolean'
    && isNullableString(value.page.nextCursor);
};

export async function getHomeExpenses(
  householdId: string,
  query: HomeExpensesQuery,
  options: RequestOptions = {},
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });

  const data = await publicRequest<unknown>(
    `/households/${encodeURIComponent(householdId)}/home/expenses?${params.toString()}`,
    {
      headers: options.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : undefined,
      signal: options.signal,
    },
  );
  if (!isHomeExpensesData(data)) {
    throw new Error('首页支出接口返回的数据格式不正确。');
  }

  return data;
}
