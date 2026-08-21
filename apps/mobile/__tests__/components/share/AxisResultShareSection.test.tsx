import { render } from '@testing-library/react-native';
import React from 'react';

import { AxisResultShareSection } from '../../../components/share/AxisResultShareSection';

const mockPersonaSection = jest.fn();

jest.mock('../../../components/share/PersonaShareSection', () => {
  const { View } = require('react-native');
  return {
    PersonaShareSection: (props: Record<string, unknown>) => {
      mockPersonaSection(props);
      return <View testID="mock-persona-share" />;
    },
  };
});

describe('AxisResultShareSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('단일 축 실데이터를 E+ 카드 형상으로 변환하고 발급 번호는 지어내지 않는다', () => {
    const screen = render(
      <AxisResultShareSection
        analysisType="personal-color"
        badges={[{ label: '세부 톤', value: '라이트' }]}
        heading="내 컬러 카드"
        oneLine="맑고 따뜻한 색이 잘 어울려요"
        palette={['#FFE0B2']}
        usedFallback
        verdict="봄 웜"
        worstPalette={['#222244']}
      />
    );

    expect(screen.getByTestId('mock-persona-share')).toBeTruthy();
    expect(mockPersonaSection).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisType: 'personal-color',
        data: {
          oneLine: '맑고 따뜻한 색이 잘 어울려요',
          toneName: '봄 웜',
          badges: [
            { label: '세부 톤', value: '라이트' },
            { label: '근거', value: '예시 결과' },
          ],
          palette: [{ hex: '#FFE0B2' }],
          worstPalette: [{ hex: '#222244' }],
        },
      })
    );
    expect(mockPersonaSection.mock.calls[0]?.[0]).not.toHaveProperty('serialNo');
  });
});
