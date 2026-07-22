/**
 * E+ 공유카드 데이터 해석 테스트 — 웹 resolveCardPalettes 규칙 미러 검증
 */
import { resolvePersonaCardData } from '../../../lib/share/card-data';
import type { IntegratedAnalysisResult, AxisData, AxisResult } from '../../../lib/api';

function axis(data: AxisData | null): AxisResult<AxisData> {
  if (data) return { success: true, data, usedFallback: false };
  return {
    success: false,
    error: { code: 'MISSING', message: 'x', userMessage: 'x', retryable: false },
  };
}

function makeResult(overrides: {
  persona?: { oneLine: string } | null;
  pc?: AxisData | null;
  skin?: AxisData | null;
  body?: AxisData | null;
  hair?: AxisData | null;
}): IntegratedAnalysisResult {
  return {
    sessionId: 's-1',
    status: 'completed',
    axes: {
      personalColor: axis(overrides.pc ?? null),
      skin: axis(overrides.skin ?? null),
      body: axis(overrides.body ?? null),
      hair: axis(overrides.hair ?? null),
      makeup: axis(null),
    },
    persona:
      overrides.persona === null
        ? null
        : {
            oneLine: overrides.persona?.oneLine ?? '차분한 빛을 품은 사람',
            narrative: '',
            keyInsights: [],
            usedFallback: false,
          },
    axesCompleted: [],
    axesFailed: [],
    usedFallback: [],
    createdAt: '2026-07-23T00:00:00Z',
    completedAt: '2026-07-23T00:00:00Z',
  };
}

describe('resolvePersonaCardData', () => {
  it('persona가 없으면 null (카드를 만들 수 없음)', () => {
    expect(resolvePersonaCardData(makeResult({ persona: null }))).toBeNull();
  });

  it('12톤 키를 ko 히어로 라벨로 해석하고 톤 표준 큐레이션 팔레트를 쓴다', () => {
    const data = resolvePersonaCardData(makeResult({ pc: { tone: 'muted-summer' } }));
    expect(data?.toneName).toBe('뮤티드 서머');
    // 뮤티드 서머 큐레이션 베스트 6 + avoid 4 (shared 정본)
    expect(data?.palette).toHaveLength(6);
    expect(data?.palette[0]).toEqual({ hex: '#C79AA0', name: '더스티 로즈' });
    expect(data?.worstPalette).toHaveLength(4);
  });

  it('개인 실측 best_colors가 이름 포함 4개+면 큐레이션보다 우선한다', () => {
    const stored = [
      { hex: '#111111', name: '색1' },
      { hex: '#222222', name: '색2' },
      { hex: '#333333', name: '색3' },
      { hex: '#444444', name: '색4' },
    ];
    const data = resolvePersonaCardData(
      makeResult({ pc: { tone: 'muted-summer', best_colors: stored } })
    );
    expect(data?.palette).toHaveLength(4);
    expect(data?.palette[0]).toEqual({ hex: '#111111', name: '색1' });
  });

  it('개인 실측에 이름이 일부 없으면 큐레이션으로 대체한다 (지어내지 않음)', () => {
    const stored = [
      { hex: '#111111', name: '색1' },
      { hex: '#222222' },
      { hex: '#333333', name: '색3' },
      { hex: '#444444', name: '색4' },
    ];
    const data = resolvePersonaCardData(
      makeResult({ pc: { tone: 'muted-summer', best_colors: stored } })
    );
    expect(data?.palette[0]).toEqual({ hex: '#C79AA0', name: '더스티 로즈' });
  });

  it('tone이 없으면 season 폴백 (트루 톤 팔레트 + 계절 라벨)', () => {
    const data = resolvePersonaCardData(makeResult({ pc: { season: 'summer' } }));
    expect(data?.toneName).toBe('여름 쿨톤');
    expect(data?.palette).toHaveLength(6);
  });

  it('미지의 tone이면 toneName 없이 은유가 히어로가 된다 (원시 영문키 금지)', () => {
    const data = resolvePersonaCardData(makeResult({ pc: { tone: 'unknown-tone' } }));
    expect(data?.toneName).toBeUndefined();
    expect(data?.oneLine).toBe('차분한 빛을 품은 사람');
    expect(data?.palette).toHaveLength(0);
    expect(data?.worstPalette).toHaveLength(0);
  });

  it('성공 축의 저장값만 뱃지로 쓴다 — 영문 enum은 ko 라벨로, placeholder·실패 축 제외', () => {
    const data = resolvePersonaCardData(
      makeResult({
        pc: { tone: 'muted-summer' },
        skin: { skinType: 'combination' },
        body: { bodyType: '-' },
        hair: { faceShape: 'oval' },
      })
    );
    expect(data?.badges).toEqual([
      { label: '피부', value: '복합성' },
      { label: '헤어', value: '계란형' },
    ]);
  });

  it('미지의 영문 enum은 뱃지에서 생략한다 (원시 영문값 카드 노출 금지)', () => {
    const data = resolvePersonaCardData(
      makeResult({ pc: { tone: 'muted-summer' }, skin: { skinType: 'mystery-type' } })
    );
    expect(data?.badges).toEqual([]);
  });

  it('재방문 raw row 형태도 해석한다 — image_analysis.tone·대문자 season·snake_case 뱃지', () => {
    const data = resolvePersonaCardData(
      makeResult({
        pc: { season: 'Summer', image_analysis: { tone: 'muted-summer' } },
        skin: { skin_type: 'oily' },
        body: { body_type: 'W' },
        hair: { face_shape: 'round' },
      })
    );
    expect(data?.toneName).toBe('뮤티드 서머');
    expect(data?.palette).toHaveLength(6);
    expect(data?.worstPalette).toHaveLength(4);
    expect(data?.badges).toEqual([
      { label: '피부', value: '지성' },
      { label: '체형', value: '웨이브' },
      { label: '헤어', value: '둥근형' },
    ]);
  });

  it('raw row에 tone이 없으면 대문자 season만으로도 폴백된다', () => {
    const data = resolvePersonaCardData(makeResult({ pc: { season: 'Winter' } }));
    expect(data?.toneName).toBe('겨울 쿨톤');
    expect(data?.palette).toHaveLength(6);
  });

  it('best_colors가 bare hex 문자열 배열이면 큐레이션 폴백(이름 없음)하되, 큐레이션 불가 시 hex만이라도 쓴다', () => {
    // 이름 없는 문자열 배열 → 선호 조건(every name) 미충족 → 큐레이션 우선
    const withTone = resolvePersonaCardData(
      makeResult({ pc: { tone: 'muted-summer', best_colors: ['#111111', '#222222'] } })
    );
    expect(withTone?.palette[0].name).toBe('더스티 로즈');
    // 미지 톤 → 큐레이션 null → 실측 hex 폴백(웹 최종 폴백 미러)
    const unknownTone = resolvePersonaCardData(
      makeResult({ pc: { tone: 'unknown', best_colors: ['#111111', '#222222'] } })
    );
    expect(unknownTone?.palette).toEqual([{ hex: '#111111' }, { hex: '#222222' }]);
  });
});
