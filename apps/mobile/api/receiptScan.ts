import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

export type ReceiptStatus = 'draft' | 'processing' | 'needs_review' | 'confirmed' | 'deleted';

export type ReceiptLineSource = 'ai' | 'manual';

export type ReceiptCandidate = {
  id: string;
  status: ReceiptStatus;
  storeName: string | null;
  receiptNumber: string | null;
  purchasedOn: string | null;
  purchasedAtLocal: string | null;
  currency: string | null;
  declaredTotalCents: number | null;
  version: number;
};

export type ReceiptCandidateLine = {
  id: string;
  rawText: string | null;
  productName: string | null;
  quantity: string | null;
  unit: string | null;
  unitPriceCents: number | null;
  unitPriceBasis: string | null;
  linePriceCents: number | null;
  source: ReceiptLineSource;
  included: boolean;
};

export type ReceiptScanData = {
  receipt: ReceiptCandidate;
  lines: ReceiptCandidateLine[];
};

export type ReceiptScanConfirmPayload = {
  receipt: Pick<
    ReceiptCandidate,
    | 'id'
    | 'storeName'
    | 'receiptNumber'
    | 'purchasedOn'
    | 'purchasedAtLocal'
    | 'currency'
    | 'declaredTotalCents'
  >;
  lines: ReceiptCandidateLine[];
};

type ReceiptScanResponse = {
  data: ReceiptScanData;
};

type ScanReceiptOptions = {
  accessToken?: string;
  fileName?: string;
  mimeType?: string;
  receiptId?: string;
  signal?: AbortSignal;
};

type ConfirmReceiptOptions = {
  accessToken?: string;
  signal?: AbortSignal;
};

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const MAX_RECEIPT_IMAGE_BYTES = 7 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

const isNullableCents = (value: unknown): value is number | null =>
  value === null || Number.isInteger(value);

const isReceiptStatus = (value: unknown): value is ReceiptStatus =>
  value === 'draft'
  || value === 'processing'
  || value === 'needs_review'
  || value === 'confirmed'
  || value === 'deleted';

const isLineSource = (value: unknown): value is ReceiptLineSource =>
  value === 'ai' || value === 'manual';

const isReceipt = (value: unknown): value is ReceiptCandidate => {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && isReceiptStatus(value.status)
    && isNullableString(value.storeName)
    && isNullableString(value.receiptNumber)
    && isNullableString(value.purchasedOn)
    && isNullableString(value.purchasedAtLocal)
    && isNullableString(value.currency)
    && isNullableCents(value.declaredTotalCents)
    && Number.isInteger(value.version);
};

const isReceiptLine = (value: unknown): value is ReceiptCandidateLine => {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && isNullableString(value.rawText)
    && isNullableString(value.productName)
    && isNullableString(value.quantity)
    && isNullableString(value.unit)
    && isNullableCents(value.unitPriceCents)
    && isNullableString(value.unitPriceBasis)
    && isNullableCents(value.linePriceCents)
    && isLineSource(value.source)
    && typeof value.included === 'boolean';
};

const parseScanResponse = (value: unknown): ReceiptScanResponse => {
  if (!isRecord(value) || !isRecord(value.data)) {
    throw new ReceiptApiError('接口返回的数据格式不正确。', false);
  }

  const { receipt, lines } = value.data;
  if (!isReceipt(receipt) || !Array.isArray(lines) || !lines.every(isReceiptLine)) {
    throw new ReceiptApiError('扫描结果缺少必要字段，请检查接口版本。', false);
  }

  return { data: { receipt, lines } };
};

const getErrorMessage = (value: unknown) => {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  return typeof value.error.message === 'string' ? value.error.message : null;
};

export class ReceiptApiError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'ReceiptApiError';
    this.retryable = retryable;
  }
}

export async function scanReceiptImage(
  imageUri: string,
  options: ScanReceiptOptions = {},
): Promise<ReceiptScanData> {
  let imageFile: File;
  try {
    imageFile = new File(imageUri);
    if (!imageFile.exists || imageFile.size === 0) {
      throw new Error('The selected image is unavailable.');
    }
  } catch {
    throw new ReceiptApiError('无法读取所选小票图片，请重新选择。', false);
  }

  const mimeType = options.mimeType ?? imageFile.type;
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new ReceiptApiError('目前只支持 JPEG 或 PNG 格式的小票图片。', false);
  }
  if (imageFile.size > MAX_RECEIPT_IMAGE_BYTES) {
    throw new ReceiptApiError('小票图片不能超过 7 MB，请压缩后重试。', false);
  }

  const uploadFile = imageFile.type === mimeType
    ? imageFile
    : imageFile.slice(0, imageFile.size, mimeType);
  const formData = new FormData();
  formData.append('image', uploadFile, options.fileName ?? imageFile.name);

  const receiptPath = options.receiptId
    ? `/api/receiptly/v1/receipts/${options.receiptId}/scan`
    : '/api/receiptly/v1/receipts/scan';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(`${API_BASE_URL}${receiptPath}`, {
      body: formData,
      headers,
      method: 'POST',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ReceiptApiError('已取消本次识别。');
    }
    throw new ReceiptApiError(`无法连接识别服务（${API_BASE_URL}），请确认服务已启动后重试。`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ReceiptApiError('识别服务返回了无法读取的数据。');
  }

  if (!response.ok) {
    const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    throw new ReceiptApiError(
      getErrorMessage(payload) ?? `识别失败（${response.status}）。`,
      retryable,
    );
  }

  const parsed = parseScanResponse(payload);
  if (parsed.data.receipt.status !== 'needs_review') {
    throw new ReceiptApiError('识别结果尚未进入待确认状态，请稍后重试。');
  }

  return parsed.data;
}

export async function confirmReceipt(
  reviewedCandidate: ReceiptScanConfirmPayload,
  options: ConfirmReceiptOptions = {},
): Promise<ReceiptScanData> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(`${API_BASE_URL}/api/receiptly/v1/receipts/scan/confirm`, {
      body: JSON.stringify(reviewedCandidate),
      headers,
      method: 'POST',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ReceiptApiError('已取消本次确认。');
    }
    throw new ReceiptApiError(`无法连接确认服务（${API_BASE_URL}），请确认服务已启动后重试。`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ReceiptApiError('确认服务返回了无法读取的数据。');
  }

  if (!response.ok) {
    const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    throw new ReceiptApiError(
      getErrorMessage(payload) ?? `确认失败（${response.status}）。`,
      retryable,
    );
  }

  const parsed = parseScanResponse(payload);
  if (parsed.data.receipt.status !== 'confirmed') {
    throw new ReceiptApiError('接口已响应，但小票尚未进入已确认状态。', false);
  }

  return parsed.data;
}
