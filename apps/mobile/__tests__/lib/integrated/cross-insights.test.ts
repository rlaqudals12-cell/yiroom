/**
 * 모바일 축 조합 인사이트 라벨 한국어화 테스트 (표현 레이어 수리)
 *
 * 회귀 방지: 조합 문구에 원시 영문/코드(undertone='warm', skinType='oily',
 * season='spring', faceShape='oval', bodyType='W')가 그대로 노출되지 않고
 * 웹 정본과 동일한 한국어 표기("웜톤"·"지성"·"봄 웜톤"·"계란형"·"W(웨이브)")로
 * 나오는지 검증.
 *
 * @see apps/mobile/lib/integrated/cross-insights.ts
 * @see apps/mobile/lib/integrated/labels.ts
 */

import { composeCrossInsights } from '@/lib/integrated/cross-insights';
import type { IntegratedAnalysisResult, AxisResult, AxisData } from '@/lib/api';

const failed: AxisResult<AxisData> = {
  success: false,
  error: { code: 'MISSING_INPUT', message: 'x', userMessage: 'x', retryable: true },
};

function allFailed(): IntegratedAnalysisResult['axes'] {
  return {
    personalColor: failed,
    skin: failed,
    body: failed,
    hair: failed,
    makeup: failed,
  };
}

const pcWarm: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { season: 'spring', undertone: 'warm', tone: 'true-spring' },
};

const skinOily: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'oily', overallScore: 70 },
};

const bodyWave: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'W' },
};

const hairOval: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'oval' },
};

const makeup: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { baseRecommendation: '글로우 베이스' },
};

describe('composeCrossInsights (모바일) — 라벨 한국어화', () => {
  it('PC×피부 body는 한글 undertone/skinType(웜톤/지성) — 원시 warm/oily 노출 금지', () => {
    const { items } = composeCrossInsights({
      ...allFailed(),
      personalColor: pcWarm,
      skin: skinOily,
    });
    const pcS = items.find((i) => i.id === 'pc_s');
    expect(pcS?.body).toContain('웜톤');
    expect(pcS?.body).toContain('지성');
    expect(pcS?.body).not.toContain('warm');
    expect(pcS?.body).not.toContain('oily');
  });

  it('PC×메이크업 body는 "봄 웜톤" (원시 spring 노출 금지)', () => {
    const { items } = composeCrossInsights({ ...allFailed(), personalColor: pcWarm, makeup });
    const pcM = items.find((i) => i.id === 'pc_m');
    expect(pcM?.body).toContain('봄 웜톤');
    expect(pcM?.body).not.toContain('spring');
  });

  it('체형×헤어는 "W(웨이브)" + 한글 얼굴형 "계란형" (원값 W/oval 노출 금지)', () => {
    const { items } = composeCrossInsights({ ...allFailed(), body: bodyWave, hair: hairOval });
    const cH = items.find((i) => i.id === 'c_h');
    expect(cH?.title).toContain('W(웨이브)');
    expect(cH?.body).toContain('계란형');
    expect(cH?.body).not.toContain('oval');
  });

  it('PC×체형 body는 "봄 웜톤" + "W(웨이브)" (원시 spring / 원값 "W 체형" 노출 금지)', () => {
    const { items } = composeCrossInsights({
      ...allFailed(),
      personalColor: pcWarm,
      body: bodyWave,
    });
    const pcC = items.find((i) => i.id === 'pc_c');
    expect(pcC?.body).toContain('봄 웜톤');
    expect(pcC?.body).toContain('W(웨이브)');
    expect(pcC?.body).not.toContain('spring');
    expect(pcC?.body).not.toContain('W 체형');
  });
});
