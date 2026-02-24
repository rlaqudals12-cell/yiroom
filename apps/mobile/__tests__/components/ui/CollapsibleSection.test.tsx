/**
 * CollapsibleSection + ChangeIndicator + InfoTooltip 테스트
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection';
import { ChangeIndicator } from '../../../components/ui/ChangeIndicator';
import { InfoTooltip } from '../../../components/ui/InfoTooltip';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ---------- CollapsibleSection ----------

describe('CollapsibleSection', () => {
  it('제목을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CollapsibleSection title="영양소">
        <Text>내용</Text>
      </CollapsibleSection>
    );
    expect(getByText('영양소')).toBeTruthy();
  });

  it('기본적으로 펼쳐진 상태여야 한다', () => {
    const { getByText } = renderWithTheme(
      <CollapsibleSection title="운동">
        <Text>운동 내용</Text>
      </CollapsibleSection>
    );
    expect(getByText('운동 내용')).toBeTruthy();
    expect(getByText('▲')).toBeTruthy();
  });

  it('defaultOpen=false일 때 접혀 있어야 한다', () => {
    const { queryByText, getByText } = renderWithTheme(
      <CollapsibleSection title="식단" defaultOpen={false}>
        <Text>식단 내용</Text>
      </CollapsibleSection>
    );
    expect(queryByText('식단 내용')).toBeNull();
    expect(getByText('▼')).toBeTruthy();
  });

  it('토글 시 접기/펼치기가 되어야 한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <CollapsibleSection title="수분">
        <Text>수분 내용</Text>
      </CollapsibleSection>
    );
    // 초기: 펼침
    expect(getByText('수분 내용')).toBeTruthy();

    // 토글: 접힘
    fireEvent.press(getByText('수분'));
    expect(queryByText('수분 내용')).toBeNull();

    // 다시 토글: 펼침
    fireEvent.press(getByText('수분'));
    expect(getByText('수분 내용')).toBeTruthy();
  });

  it('trailing 텍스트를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CollapsibleSection title="진행" trailing="3/5">
        <Text>내용</Text>
      </CollapsibleSection>
    );
    expect(getByText('3/5')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <CollapsibleSection title="테스트" testID="section-test">
        <Text>내용</Text>
      </CollapsibleSection>
    );
    expect(getByTestId('section-test')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <CollapsibleSection title="칼로리">
        <Text>내용</Text>
      </CollapsibleSection>
    );
    expect(getByLabelText('칼로리 섹션 접기')).toBeTruthy();
  });

  it('다크 모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <CollapsibleSection title="다크 섹션">
        <Text>다크 내용</Text>
      </CollapsibleSection>,
      true
    );
    expect(getByText('다크 섹션')).toBeTruthy();
    expect(getByText('다크 내용')).toBeTruthy();
  });
});

// ---------- ChangeIndicator ----------

describe('ChangeIndicator', () => {
  it('증가를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={80} previousValue={75} />
    );
    expect(getByText('▲')).toBeTruthy();
    expect(getByText('+5%')).toBeTruthy();
  });

  it('감소를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={60} previousValue={65} />
    );
    expect(getByText('▼')).toBeTruthy();
    expect(getByText('5%')).toBeTruthy();
  });

  it('변화 없음을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={70} previousValue={70} />
    );
    expect(getByText('—')).toBeTruthy();
    expect(getByText('변화 없음')).toBeTruthy();
  });

  it('임계값 이하 변화는 변화 없음으로 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={70.3} previousValue={70} threshold={0.5} />
    );
    expect(getByText('—')).toBeTruthy();
    expect(getByText('변화 없음')).toBeTruthy();
  });

  it('positiveIsGood=false일 때 증가가 부정적이어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={80} previousValue={75} positiveIsGood={false} />
    );
    expect(getByText('▲')).toBeTruthy();
  });

  it('커스텀 formatDiff를 사용해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator
        value={85}
        previousValue={80}
        formatDiff={(diff) => `${diff}점`}
      />
    );
    expect(getByText('5점')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ChangeIndicator value={50} previousValue={50} testID="change-hydration" />
    );
    expect(getByTestId('change-hydration')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ChangeIndicator value={80} previousValue={75} />
    );
    expect(getByLabelText('+5% 증가')).toBeTruthy();
  });

  it('소수점 변화를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={72.5} previousValue={70} />
    );
    expect(getByText('▲')).toBeTruthy();
    expect(getByText('+2.5%')).toBeTruthy();
  });

  it('다크 모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ChangeIndicator value={90} previousValue={80} />,
      true
    );
    expect(getByText('▲')).toBeTruthy();
  });
});

// ---------- InfoTooltip ----------

describe('InfoTooltip', () => {
  it('아이콘을 렌더링해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <InfoTooltip text="수분 점수는 0~100 사이입니다." />
    );
    expect(getByLabelText('정보 보기')).toBeTruthy();
  });

  it('초기에 툴팁이 숨겨져 있어야 한다', () => {
    const { queryByText } = renderWithTheme(
      <InfoTooltip text="숨겨진 설명" />
    );
    expect(queryByText('숨겨진 설명')).toBeNull();
  });

  it('아이콘을 누르면 툴팁이 표시되어야 한다', () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <InfoTooltip text="표시될 설명" />
    );
    fireEvent.press(getByLabelText('정보 보기'));
    expect(getByText('표시될 설명')).toBeTruthy();
  });

  it('다시 누르면 툴팁이 숨겨져야 한다', () => {
    const { getByLabelText, queryByText } = renderWithTheme(
      <InfoTooltip text="토글 설명" />
    );
    const button = getByLabelText('정보 보기');
    fireEvent.press(button);
    expect(queryByText('토글 설명')).toBeTruthy();

    fireEvent.press(button);
    expect(queryByText('토글 설명')).toBeNull();
  });

  it('children과 함께 렌더링되어야 한다', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <InfoTooltip text="설명">
        <Text>라벨</Text>
      </InfoTooltip>
    );
    expect(getByText('라벨')).toBeTruthy();
    expect(getByLabelText('정보 보기')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <InfoTooltip text="설명" testID="info-hydration" />
    );
    expect(getByTestId('info-hydration')).toBeTruthy();
  });

  it('다크 모드에서 렌더링되어야 한다', () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <InfoTooltip text="다크 설명" />,
      true
    );
    fireEvent.press(getByLabelText('정보 보기'));
    expect(getByText('다크 설명')).toBeTruthy();
  });
});
