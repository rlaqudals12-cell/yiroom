import type { PersonalColorSeason } from '@yiroom/shared';

import { PERSONAL_COLOR_REPORT_DATA } from '../../../lib/analysis/personal-color-report-data';

describe('퍼스널컬러 결과 정적 참고표', () => {
  it('네 계절의 실제 화면 폴백 데이터를 직접 검증한다', () => {
    const seasons: PersonalColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

    expect(Object.keys(PERSONAL_COLOR_REPORT_DATA)).toEqual(seasons);
    seasons.forEach((season) => {
      const data = PERSONAL_COLOR_REPORT_DATA[season];
      expect(data.name).toMatch(/웜톤|쿨톤/);
      expect(data.description).toMatch(/색상|색/);
      expect(data.bestColors).toHaveLength(6);
      expect(data.worstColors).toHaveLength(4);
      expect(data.stylingTips).toHaveLength(3);
    });
  });

  it('팔레트는 유효한 6자리 hex이며 계절 안에서 중복되지 않는다', () => {
    Object.values(PERSONAL_COLOR_REPORT_DATA).forEach((data) => {
      const colors = [...data.bestColors, ...data.worstColors];
      colors.forEach((color) => expect(color).toMatch(/^#[0-9A-F]{6}$/));
      expect(new Set(data.bestColors).size).toBe(data.bestColors.length);
      expect(new Set(data.worstColors).size).toBe(data.worstColors.length);
    });
  });
});
