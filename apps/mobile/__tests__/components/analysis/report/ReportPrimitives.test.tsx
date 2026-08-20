import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  REPORT_COLORS,
  ReportAttrRow,
  ReportDivider,
  ReportEvidenceDisclosure,
  ReportHero,
  ReportInkNumber,
  ReportRowTable,
} from '../../../../components/analysis/report';
import { renderWithTheme } from '../../../helpers/test-utils';

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

describe('모바일 진단지 프리미티브', () => {
  it('세리프 히어로는 다크 테마에서도 좌정렬 잉크 결론을 유지한다', () => {
    const screen = renderWithTheme(
      <ReportHero eyebrow="헤어 분석 결과" subtitle="건성 두피" title="직모 · 가는 모발" />,
      true
    );

    const title = screen.getByTestId('report-hero-title');
    const style = StyleSheet.flatten(title.props.style);

    expect(screen.getByText('직모 · 가는 모발')).toBeTruthy();
    expect(style.color).toBe(REPORT_COLORS.ink);
    expect(style.textAlign).toBe('left');
  });

  it('속성표는 행 사이에만 구분선을 두고 라벨과 값을 읽는다', () => {
    const screen = render(
      <ReportRowTable testID="attrs">
        <ReportAttrRow label="두피" testID="scalp-row" value="건성 두피" />
        <ReportAttrRow label="손상도" testID="damage-row" value="32%" />
      </ReportRowTable>
    );

    expect(screen.getByTestId('scalp-row').props.accessibilityLabel).toBe('두피, 건성 두피');
    expect(screen.getByTestId('damage-row').props.accessibilityLabel).toBe('손상도, 32%');
    expect(screen.getByTestId('attrs-divider-1')).toBeTruthy();
    expect(screen.queryByTestId('attrs-divider-2')).toBeNull();
  });

  it('잉크 숫자는 등급 없이 표 숫자와 단위만 표시한다', () => {
    const screen = render(
      <ReportInkNumber
        accessibilityLabel="BMI 21.4 참고 수치"
        status="참고 수치"
        unit="BMI"
        value="21.4"
      />
    );
    const value = screen.getByText(/21.4/);
    const style = StyleSheet.flatten(value.props.style);

    expect(style.color).toBe(REPORT_COLORS.ink);
    expect(style.fontVariant).toEqual(['tabular-nums']);
    expect(screen.queryByText(/A\+|다이아몬드|등급/)).toBeNull();
  });

  it('구분선은 고정 웜 헤어라인만 렌더한다', () => {
    const screen = render(<ReportDivider inset={12} />);
    const style = StyleSheet.flatten(screen.getByTestId('report-divider').props.style);

    expect(style.backgroundColor).toBe(REPORT_COLORS.rule);
    expect(style.marginHorizontal).toBe(12);
  });

  it('근거는 기본 접힘이고 사용자가 펼쳤을 때만 내용을 보여준다', () => {
    const onToggle = jest.fn();
    const screen = render(
      <ReportEvidenceDisclosure
        onToggle={onToggle}
        summary="윤기·탄력·밀도·두피"
        title="항목별 컨디션"
      >
        <View>
          <Text>윤기 72점</Text>
        </View>
      </ReportEvidenceDisclosure>
    );

    expect(screen.queryByText('윤기 72점')).toBeNull();
    expect(
      screen.getByTestId('report-evidence-disclosure-trigger').props.accessibilityState
    ).toEqual({
      expanded: false,
    });

    fireEvent.press(screen.getByTestId('report-evidence-disclosure-trigger'));

    expect(screen.getByText('윤기 72점')).toBeTruthy();
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
