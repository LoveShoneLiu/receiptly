export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000'
).replace(/\/$/, '');

export const API_PREFIX = '/api/receiptly/v1';

export type ApiErrorPayload = {
  code: string;
  message: string;
  details: Record<string, unknown>;
  requestId: string | null;
};

export class ApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  requestId: string | null;
  status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const parseJsonResponse = async (response: Response) => {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, {
      code: 'INVALID_RESPONSE',
      details: {},
      message: '服务返回了无法读取的数据。',
      requestId: null,
    });
  }

  if (!response.ok) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : {};
    throw new ApiError(response.status, {
      code: typeof error.code === 'string' ? error.code : 'REQUEST_FAILED',
      details: isRecord(error.details) ? error.details : {},
      message: typeof error.message === 'string' ? error.message : `请求失败（${response.status}）。`,
      requestId: typeof error.requestId === 'string' ? error.requestId : null,
    });
  }

  return payload;
};

export const publicRequest = async (
  path: string,
  init: RequestInit = {},
) => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      details: {},
      message: `无法连接 receiptly 服务（${API_BASE_URL}）。`,
      requestId: null,
    });
  }

  return parseJsonResponse(response);
};
