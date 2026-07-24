/**
 * 통합 결과 5축 요약 테스트 — payload(camelCase)·raw row(snake_case) 양형태에서
 * 원시 영문 enum이 화면에 노출되지 않고 ko 라벨로 해석되는지 단언
 * (적대 리뷰 2026-07-23 결함 수리 검증)
 */
import {
  pcSummary,
  skinSummary,
  bodySummary,
  hairSummary,
  makeupSummary,
} from '../../../lib/integrated/axis-summary';

describe('pcSummary', () => {
  it('실패 축이면 분석 미완료', () => {
    expect(pcSummary(null)).toBe('분석 미완료');
  });

  it('payload 형태: 12톤 + 언더톤을 ko로 해석한다', () => {
    expect(pcSummary({ tone: 'muted-summer', undertone: 'cool' })).toBe('뮤티드 서머 / 쿨톤');
  });

  it('raw row 형태: image_analysis.tone·대문자 season·undertone을 해석한다', () => {
    expect(
      pcSummary({ season: 'Summer', image_analysis: { tone: 'muted-summer' }, undertone: 'cool' })
    ).toBe('뮤티드 서머 / 쿨톤');
  });

  it('tone이 없으면 대문자 season만으로 4계절 폴백한다', () => {
    expect(pcSummary({ season: 'Winter' })).toBe('겨울 쿨톤');
  });

  it('미해석 부분은 생략한다 — 원시 영문 노출 금지', () => {
    // 언더톤만 해석 가능 → 톤 부분 생략
    expect(pcSummary({ tone: 'unknown-tone', undertone: 'warm' })).toBe('웜톤');
    // 전부 미해석 → 원시값 대신 일반 문구
    expect(pcSummary({ tone: 'unknown-tone', undertone: 'weird' })).toBe('분석 완료');
  });

  it('대문자 변형 undertone(Warm)도 해석한다 (웹 undertoneKo 미러)', () => {
    expect(pcSummary({ tone: 'muted-summer', undertone: 'Warm' })).toBe('뮤티드 서머 / 웜톤');
  });
});

describe('skinSummary', () => {
  it('실패 축이면 분석 미완료', () => {
    expect(skinSummary(null)).toBe('분석 미완료');
  });

  it('payload 형태: skinType + overallScore', () => {
    expect(skinSummary({ skinType: 'combination', overallScore: 82 })).toBe('복합성 · 82점');
  });

  it('raw row 형태: skin_type + overall_score', () => {
    expect(skinSummary({ skin_type: 'oily', overall_score: 74 })).toBe('지성 · 74점');
  });

  it('점수가 숫자가 아니면 점수 부분 생략 (숫자 방어)', () => {
    expect(skinSummary({ skinType: 'dry', overallScore: 'NaN아님' })).toBe('건성');
    expect(skinSummary({ skinType: 'dry' })).toBe('건성');
  });

  it('타입이 미지 영문이면 타입 생략, 전부 미해석이면 일반 문구', () => {
    expect(skinSummary({ skinType: 'mystery', overallScore: 70 })).toBe('70점');
    expect(skinSummary({ skinType: 'mystery' })).toBe('분석 완료');
  });
});

describe('bodySummary', () => {
  it('S/W/N 코드를 ko 라벨로 해석한다 (양형태)', () => {
    expect(bodySummary({ bodyType: 'S' })).toBe('스트레이트');
    expect(bodySummary({ body_type: 'W' })).toBe('웨이브');
  });

  it('실패 축·미지값 처리', () => {
    expect(bodySummary(null)).toBe('분석 미완료');
    expect(bodySummary({ bodyType: 'X' })).toBe('분석 완료');
  });
});

describe('hairSummary', () => {
  it('faceShape enum을 ko로 해석하고 "형" 이중 접미가 없다 (양형태)', () => {
    expect(hairSummary({ faceShape: 'oval' })).toBe('계란형');
    expect(hairSummary({ face_shape: 'round' })).toBe('둥근형');
  });

  it('실패 축·미지값 처리', () => {
    expect(hairSummary(null)).toBe('분석 미완료');
    expect(hairSummary({ faceShape: 'weird' })).toBe('분석 완료');
  });
});

describe('makeupSummary', () => {
  it('자유 텍스트 추천을 양형태에서 읽고 28자로 자른다', () => {
    expect(makeupSummary({ baseRecommendation: '세미매트 쿠션' })).toBe('세미매트 쿠션');
    expect(makeupSummary({ base_recommendation: '가'.repeat(40) })).toBe('가'.repeat(28));
  });

  it('실패 축·추천 부재 처리', () => {
    expect(makeupSummary(null)).toBe('분석 미완료');
    expect(makeupSummary({})).toBe('추천 있음');
  });
});
