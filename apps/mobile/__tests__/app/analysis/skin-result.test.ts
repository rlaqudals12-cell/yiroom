import { formatReportReading } from '../../../lib/analysis';
import { SKIN_TYPE_DATA } from '../../../lib/skincare';

describe('S-1 피부 결과 진단지 계약', () => {
  it('다섯 피부 타입은 실제 분류명·설명·행동 팁을 가진다', () => {
    expect(Object.keys(SKIN_TYPE_DATA)).toEqual([
      'dry',
      'oily',
      'combination',
      'sensitive',
      'normal',
    ]);

    Object.values(SKIN_TYPE_DATA).forEach((data) => {
      expect(data.name.trim().length).toBeGreaterThan(0);
      expect(data.description.trim().length).toBeGreaterThan(10);
      expect(data.tips.length).toBeGreaterThan(0);
      data.tips.forEach((tip) => expect(tip.trim().length).toBeGreaterThan(0));
    });
  });

  it('원 지표는 등급이나 신호등 없이 값만 표시한다', () => {
    const reading = formatReportReading(65);

    expect(reading).toBe('65');
    expect(reading).not.toMatch(/A\+|등급|양호|주의/);
  });

  it('변화량은 좋음·나쁨을 판정하지 않고 산술 차이만 표시한다', () => {
    expect(formatReportReading(68, 3)).toBe('68 · 이전보다 +3');
    expect(formatReportReading(22, -4)).toBe('22 · 이전보다 -4');
    expect(formatReportReading(50, 0)).toBe('50');
    expect(formatReportReading(50, null)).toBe('50');
  });

  it('단위가 있는 실측값도 같은 평문 규칙을 쓴다', () => {
    expect(formatReportReading('21.4', undefined, ' BMI')).toBe('21.4 BMI');
  });
});
