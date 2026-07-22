/**
 * 공유카드 발급 번호 HTTP 클라이언트 (웹 API 재사용) — thin client
 *
 * @module lib/api/issue-no
 * @description
 *   웹 GET /api/share/issue-no를 호출해 통합 세션의 전체 순번을 얻는다.
 *   RLS 클라이언트는 본인 행만 셀 수 있어 모바일 단독으론 전체 순번 불가(서버 위임).
 *   어떤 실패든 null — 카드는 번호를 지어내지 않고 생략한다(화면에 에러 미노출).
 *
 * @see apps/web/app/api/share/issue-no/route.ts
 */

export async function fetchIssueNo(
  clerkToken: string | null,
  sessionId: string,
  baseUrl?: string
): Promise<number | null> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url || !clerkToken) return null;

  try {
    const response = await fetch(
      `${url}/api/share/issue-no?sessionId=${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          'x-yiroom-client': 'mobile',
        },
      }
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      success?: boolean;
      data?: { issueNo?: unknown };
    };
    const issueNo = json.data?.issueNo;
    return json.success === true && typeof issueNo === 'number' && issueNo > 0 ? issueNo : null;
  } catch {
    return null;
  }
}
