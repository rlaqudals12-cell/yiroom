import { getApiBaseUrl } from './base-url';

export interface FastingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  target_hours: number;
  actual_hours: number | null;
  is_completed: boolean;
}

interface FastingSessionsResponse {
  success?: boolean;
  activeSession?: FastingSession | null;
  history?: FastingSession[];
}

interface FastingMutationResponse {
  success?: boolean;
  data?: FastingSession;
}

function requireToken(clerkToken: string): void {
  if (!clerkToken.trim()) throw new Error('로그인이 필요합니다.');
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error('서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해주세요.');
  }
}

async function requestFasting(
  clerkToken: string,
  init: RequestInit,
  baseUrl?: string,
  query = ''
): Promise<unknown> {
  requireToken(clerkToken);
  const response = await fetch(`${getApiBaseUrl(baseUrl)}/api/nutrition/fasting${query}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${clerkToken}`,
      'x-yiroom-client': 'mobile',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error('단식 요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
  }
  return payload;
}

export async function getFastingSessions(
  clerkToken: string,
  baseUrl?: string
): Promise<{ activeSession: FastingSession | null; history: FastingSession[] }> {
  const payload = (await requestFasting(
    clerkToken,
    { method: 'GET' },
    baseUrl,
    '?includeHistory=true&historyLimit=10'
  )) as FastingSessionsResponse;

  return {
    activeSession: payload.activeSession ?? null,
    history: Array.isArray(payload.history) ? payload.history : [],
  };
}

export async function startFastingSession(
  clerkToken: string,
  targetHours: number,
  baseUrl?: string
): Promise<FastingSession> {
  const payload = (await requestFasting(
    clerkToken,
    { method: 'POST', body: JSON.stringify({ targetHours }) },
    baseUrl
  )) as FastingMutationResponse;

  if (!payload.success || !payload.data) {
    throw new Error('단식 시작 결과를 확인하지 못했어요.');
  }
  return payload.data;
}

export async function completeFastingSession(
  clerkToken: string,
  sessionId: string,
  baseUrl?: string
): Promise<FastingSession> {
  const payload = (await requestFasting(
    clerkToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ id: sessionId, isCompleted: true }),
    },
    baseUrl
  )) as FastingMutationResponse;

  if (!payload.success || !payload.data) {
    throw new Error('단식 종료 결과를 확인하지 못했어요.');
  }
  return payload.data;
}
