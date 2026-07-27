import { fetch } from 'expo/fetch';

const DEFAULT_API_BASE_URL = __DEV__
  ? 'http://127.0.0.1:3000'
  : 'https://www.liushaofei.cn';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '');

export const API_PREFIX = '/api/receiptly/v1';

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T | null;
  error?: {
    code: string;
    message?: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
};

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  httpStatus: number;
  requestId?: string;
  status: number;

  constructor(httpStatus: number, status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isApiResponse = (value: unknown): value is ApiResponse<unknown> =>
  isRecord(value)
  && typeof value.status === 'number'
  && typeof value.message === 'string'
  && 'data' in value;

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, -1, {
      code: 'INVALID_RESPONSE',
      message: '服务返回了无法读取的数据。',
    });
  }

  if (!isApiResponse(payload)) {
    throw new ApiError(response.status, -1, {
      code: 'INVALID_RESPONSE',
      message: '服务返回的数据格式不正确。',
    });
  }

  if (!response.ok || payload.status !== 0 || payload.data === null) {
    const error = payload.error;
    throw new ApiError(response.status, payload.status, {
      code: isRecord(error) && typeof error.code === 'string'
        ? error.code
        : 'UNKNOWN_ERROR',
      details: isRecord(error) && isRecord(error.details)
        ? error.details
        : undefined,
      message: payload.message || '请求失败，请稍后重试。',
      requestId: isRecord(error) && typeof error.requestId === 'string'
        ? error.requestId
        : undefined,
    });
  }

  return payload.data as T;
};

export const publicRequest = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, -1, {
      code: 'NETWORK_ERROR',
      message: `无法连接 receiptly 服务（${API_BASE_URL}）。`,
    });
  }

  return parseJsonResponse<T>(response);
};
