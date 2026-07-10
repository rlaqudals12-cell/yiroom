/**
 * 통합분석 "다음 단계" 링크 회귀 방지 테스트
 *
 * 대상: lib/integrated/next-steps.ts
 * 회귀 방지: 색·피부·체형 다음 단계가 게이팅된 [기록] 탭(`/(tabs)/records`)으로
 * 잘못 연결되지 않고, 라벨 의도에 맞는 실존 뷰티 목적지로 연결되는지 검증.
 */
import { ALL_STEPS } from '../../../lib/integrated/next-steps';

describe('통합분석 다음 단계 링크 (next-steps)', () => {
  it('어떤 다음 단계도 게이팅된 [기록] 탭으로 연결되지 않는다', () => {
    ALL_STEPS.forEach((step) => {
      expect(step.href).not.toBe('/(tabs)/records');
    });
  });

  it('5개 축이 모두 정의되어 있다', () => {
    const axes = ALL_STEPS.map((s) => s.axis);
    expect(axes).toEqual(
      expect.arrayContaining(['personal_color', 'skin', 'body', 'hair', 'makeup'])
    );
    expect(ALL_STEPS).toHaveLength(5);
  });

  it('각 축이 라벨 의도에 맞는 실존 뷰티 목적지로 연결된다', () => {
    const byAxis = Object.fromEntries(ALL_STEPS.map((s) => [s.axis, s.href]));
    expect(byAxis.personal_color).toBe('/(tabs)/beauty');
    expect(byAxis.skin).toBe('/(analysis)/skin/routine');
    expect(byAxis.body).toBe('/(tabs)/style');
    expect(byAxis.hair).toBe('/(analysis)/hair');
    expect(byAxis.makeup).toBe('/(analysis)/makeup');
  });
});
