import { File } from 'expo-file-system';

import { ApiError, isRecord, publicRequest } from './base';

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

const MAX_RECEIPT_IMAGE_BYTES = 7 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

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

const parseScanData = (value: unknown): ReceiptScanData => {
  if (!isRecord(value)) {
    throw new ReceiptApiError('接口返回的数据格式不正确。', false);
  }

  const { receipt, lines } = value;
  if (!isReceipt(receipt) || !Array.isArray(lines) || !lines.every(isReceiptLine)) {
    throw new ReceiptApiError('扫描结果缺少必要字段，请检查接口版本。', false);
  }

  return { receipt, lines };
};

export class ReceiptApiError extends Error {
  code?: string;
  details?: Record<string, unknown>;
  retryable: boolean;

  constructor(
    message: string,
    retryable = true,
    apiError?: Pick<ApiError, 'code' | 'details'>,
  ) {
    super(message);
    this.name = 'ReceiptApiError';
    this.code = apiError?.code;
    this.details = apiError?.details;
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
    ? `/receipts/${options.receiptId}/scan`
    : '/receipts/scan';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let data: unknown;
  try {
    data = await publicRequest<unknown>(receiptPath, {
      body: formData,
      headers,
      method: 'POST',
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw new ReceiptApiError('已取消本次识别。');
    }
    if (error instanceof ApiError) {
      const retryable = error.httpStatus === 0
        || error.httpStatus >= 500
        || error.httpStatus === 408
        || error.httpStatus === 429;
      throw new ReceiptApiError(error.message, retryable, error);
    }
    throw error;
  }

  const parsed = parseScanData(data);
  if (parsed.receipt.status !== 'needs_review') {
    throw new ReceiptApiError('识别结果尚未进入待确认状态，请稍后重试。');
  }

  return parsed;
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

  let data: unknown;
  try {
    data = await publicRequest<unknown>('/receipts/scan/confirm', {
      body: JSON.stringify(reviewedCandidate),
      headers,
      method: 'POST',
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw new ReceiptApiError('已取消本次确认。');
    }
    if (error instanceof ApiError) {
      const retryable = error.httpStatus === 0
        || error.httpStatus >= 500
        || error.httpStatus === 408
        || error.httpStatus === 429;
      throw new ReceiptApiError(error.message, retryable, error);
    }
    throw error;
  }

  const parsed = parseScanData(data);
  if (parsed.receipt.status !== 'confirmed') {
    throw new ReceiptApiError('接口已响应，但小票尚未进入已确认状态。', false);
  }

  return parsed;
}
