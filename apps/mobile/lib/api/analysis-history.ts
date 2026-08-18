import { getApiBaseUrl } from './base-url';

export type AnalysisHistoryType = 'skin' | 'body' | 'personal-color';

interface AnalysisHistoryItem {
  details?: Record<string, unknown>;
}

interface AnalysisHistoryPayload {
  analyses?: AnalysisHistoryItem[];
}

export async function getLatestAnalysisDetails(
  clerkToken: string,
  type: AnalysisHistoryType,
  baseUrl?: string
): Promise<Record<string, unknown> | null> {
  if (!clerkToken.trim()) throw new Error('로그인이 필요합니다.');

  const response = await fetch(
    `${getApiBaseUrl(baseUrl)}/api/analysis/history?type=${type}&limit=1&period=all`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
    }
  );
  if (!response.ok) throw new Error('분석 이력을 불러오지 못했어요.');

  const payload = (await response.json()) as AnalysisHistoryPayload;
  return payload.analyses?.[0]?.details ?? null;
}
