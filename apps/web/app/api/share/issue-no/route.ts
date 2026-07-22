/**
 * 공유카드 발급 번호 API — 통합 분석 세션의 전체 순번 (모바일 E+ 카드용)
 *
 * @route GET /api/share/issue-no?sessionId=<uuid>
 * @description
 *   웹 결과 페이지는 서버 컴포넌트에서 fetchIssueNo를 직접 호출하지만, 모바일은
 *   RLS 클라이언트로 본인 행만 셀 수 있어 전체 순번을 얻을 수 없다(thin client).
 *   소유권은 RLS 조회로 검증(본인 세션이 아니면 404) 후 service-role 카운트만 반환 —
 *   개인 데이터 노출 없음. 실패 시 카드가 번호를 지어내지 않고 생략하므로 200 + null.
 */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { fetchIssueNo } from '@/lib/share/issue-no';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: '로그인이 필요해요.' }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  // 표준 UUID 형식만 통과 — 비정형 값이 uuid 캐스팅 에러(500)로 새지 않게 400에서 차단
  if (
    !sessionId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
  ) {
    return NextResponse.json(
      { success: false, error: '세션 정보가 올바르지 않아요.' },
      { status: 400 }
    );
  }

  // RLS 조회 = 소유권 검증(본인 세션이 아니면 0행 → 404)
  const supabase = createClerkSupabaseClient();
  const { data: session, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('created_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: '발급 번호를 확인하지 못했어요.' },
      { status: 500 }
    );
  }
  if (!session) {
    return NextResponse.json({ success: false, error: '세션을 찾을 수 없어요.' }, { status: 404 });
  }

  const issueNo = await fetchIssueNo(session.created_at as string);
  return NextResponse.json({ success: true, data: { issueNo } });
}
