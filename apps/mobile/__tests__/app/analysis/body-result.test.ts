/**
 * C-1 체형 분석 결과 화면 — 계약 테스트 (웹 API 정본, ADR-118)
 *
 * 고정하는 계약:
 * - 결과 화면은 로컬 lib/gemini 분석·클라이언트 DB 저장을 쓰지 않는다
 *   (과거: 클라이언트 키 부재 → 항상 Mock "샘플 결과" + 저장 실패 → 홈 5축 미반영)
 * - 서버 3타입(S/W/N) 응답을 그대로 렌더 소스로 쓴다 (8타입 재분류 매핑 제거)
 * - BMI 정직 표기 (참고 수치 + 근육량 캐비앳, 낙인 라벨 금지)
 */
import fs from 'fs';
import path from 'path';

const RESULT_SRC = fs.readFileSync(
  path.join(__dirname, '../../../app/(analysis)/body/result.tsx'),
  'utf8'
);

describe('C-1 체형 결과 화면 — 웹 API 정본 배선', () => {
  it('로컬 Gemini 분석 경로를 import하지 않는다 (스트랜딩 재발 방지)', () => {
    expect(RESULT_SRC).not.toContain('analyzeBody as analyzeWithGemini');
    expect(RESULT_SRC).not.toMatch(/analyzeWithGemini\(/);
  });

  it('웹 API 클라이언트(requestBodyAnalysis)를 사용한다', () => {
    expect(RESULT_SRC).toContain("from '@/lib/api/body'");
    expect(RESULT_SRC).toContain('requestBodyAnalysis(');
  });

  it('클라이언트 직접 DB 저장(saveBodyResult)이 없다 — 저장은 서버가 정본', () => {
    expect(RESULT_SRC).not.toContain('saveBodyResult');
    expect(RESULT_SRC).not.toContain('useClerkSupabaseClient');
  });

  it('8타입 재분류 매핑이 제거되었다 — 서버가 3타입(S/W/N)을 직접 반환', () => {
    expect(RESULT_SRC).not.toContain('BODY_TYPE_TO_STYLING');
    expect(RESULT_SRC).not.toContain("rectangle: 'Rectangle'");
  });

  it('폴백(usedMock) 여부를 신뢰 배지로 정직하게 표시한다', () => {
    expect(RESULT_SRC).toContain("trustBadgeType={analysis.usedMock ? 'fallback' : 'ai'}");
    expect(RESULT_SRC).toContain('usedFallback={analysis.usedMock}');
  });

  it('게이트·검증 에러는 서버 한국어 메시지를 그대로 보여준다', () => {
    expect(RESULT_SRC).toContain('error instanceof BodyApiError ? error.message');
    expect(RESULT_SRC).toContain('message={errorMessage}');
  });
});

describe('C-1 체형 결과 화면 — BMI 정직 표기 (낙인 제거, 웹 W4)', () => {
  // 주석은 낙인 라벨을 "금지 대상"으로 인용할 수 있으므로, 사용자에게 보이는
  // 코드(주석 제거본)만 검사한다.
  const DISPLAY_SRC = RESULT_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  it("BMI는 '참고 수치'로만 제시되고 낙인 라벨이 없다", () => {
    expect(DISPLAY_SRC).toContain('참고 수치');
    expect(DISPLAY_SRC).toContain('근육량');
    expect(DISPLAY_SRC).not.toMatch(/과체중|비만|저체중/);
  });

  it('의료적 판정 표현(진단/처방/치료)이 없다', () => {
    expect(DISPLAY_SRC).not.toMatch(/진단|처방|치료/);
  });
});
