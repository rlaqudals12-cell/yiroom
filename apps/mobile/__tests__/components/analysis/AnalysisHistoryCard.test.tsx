import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

import { AnalysisHistoryCard } from '../../../components/analysis/AnalysisHistoryCard';

describe('AnalysisHistoryCard', () => {
  it('퍼스널컬러 confidence를 점수가 아닌 분석 신뢰도로 표시한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <AnalysisHistoryCard
        item={{
          id: 'pc-1',
          moduleType: 'personal-color',
          createdAt: new Date('2026-08-27T10:00:00.000Z'),
          summary: '봄 웜톤 · 브라이트',
          score: 0.91,
        }}
      />
    );

    expect(getByText('분석 신뢰도 91%')).toBeTruthy();
    expect(getByText('봄 웜톤 · 브라이트')).toBeTruthy();
    expect(queryByText('0.91점')).toBeNull();
    expect(queryByText('91점')).toBeNull();
  });

  it('피부 overall_score는 기존 원점수 문법을 유지한다', () => {
    const { getByText } = renderWithTheme(
      <AnalysisHistoryCard
        item={{
          id: 'skin-1',
          moduleType: 'skin',
          createdAt: new Date('2026-08-27T10:00:00.000Z'),
          summary: '건성',
          score: 69,
        }}
      />
    );

    expect(getByText('69점')).toBeTruthy();
  });
});
