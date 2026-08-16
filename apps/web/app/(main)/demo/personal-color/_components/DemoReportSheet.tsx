'use client';

/**
 * 데모 진단지 — 고정 샘플 데이터로 실결과와 같은 시트를 그린다.
 *
 * 데이터 조립을 클라이언트에 두는 이유: AnalysisResult가 이미 클라이언트 컴포넌트라
 * 서버에서 만들면 같은 결과 객체가 RSC 페이로드에 한 번 더 실린다(순증). 조립은 순수 함수라
 * 서버 렌더 HTML에는 그대로 포함된다.
 */

import AnalysisResult from '@/app/(main)/analysis/personal-color/_components/AnalysisResult';
import {
  generateSeasonPersonalColorResult,
  type PersonalColorResult,
} from '@/lib/mock/personal-color';
import { getCardPalette, toneHeroLabelKo } from '@/lib/share/tone-palettes';

/**
 * 샘플 발행일 — 고정값. `new Date()`를 쓰면 방문 시각이 찍혀 "방금 분석한 내 결과"처럼 보인다.
 * (샘플 배지와 함께 읽히도록 과거의 예시 일자로 고정)
 */
const DEMO_ANALYZED_AT = new Date('2026-03-02T10:20:00+09:00');

/** 데모 시즌 — 12톤 큐레이션(트루 스프링)과 짝 */
const DEMO_TONE_KEY = 'true-spring';

// 봄 웜톤 고정 데모 데이터 — 립/스타일은 spring 시즌 상수에서 결정론 구성.
// 팔레트는 12톤 표준 큐레이션(트루 스프링)으로 교체 — 웹세이프 목업색(골드×2 등
// 이름 중복)이 첫 방문 표면에 노출되지 않게, 공유카드·통합 리포트와 같은 색을 말한다.
function createDemoResult(): PersonalColorResult {
  // confidence 0 = 신뢰도 라인 미렌더. 샘플에는 측정된 신뢰도가 존재하지 않는다(위장 수치 금지)
  const base = generateSeasonPersonalColorResult('spring', 0);
  const curated = getCardPalette(DEMO_TONE_KEY, 'ko');
  if (curated) {
    base.bestColors = curated.best.map((c) => ({ hex: c.hex, name: c.name }));
    base.personalizedColors = false;
    base.paletteToneKey = DEMO_TONE_KEY;
  }
  // 12톤 진단명("트루 스프링")이 히어로 — 실결과와 같은 정밀도로 말한다
  base.undertoneLabel = toneHeroLabelKo(DEMO_TONE_KEY, 'spring') ?? base.seasonLabel;
  base.analyzedAt = DEMO_ANALYZED_AT;
  return base;
}

export function DemoReportSheet(): React.JSX.Element {
  return <AnalysisResult result={createDemoResult()} isSample />;
}

export default DemoReportSheet;
