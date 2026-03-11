/**
 * DailyCapsuleCard 테스트
 *
 * Level 0 (생성 전), Level 1 (요약), Level 2 (확장) 상태 검증.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { DailyCapsuleCard } from '../../../components/capsule/DailyCapsuleCard';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

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
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

const mockItems = [
  { id: '1', moduleCode: 'skin', name: '수분 크림', reason: '건조한 피부에 수분 공급', isChecked: false },
  { id: '2', moduleCode: 'nutrition', name: '비타민 C', reason: '피부 톤 개선', isChecked: true },
  { id: '3', moduleCode: 'workout', name: '요가 스트레칭', reason: '혈액순환 개선', isChecked: false },
];

const mockCapsule = {
  id: 'capsule-1',
  items: mockItems,
  totalCcs: 78,
  status: 'active',
};

describe('DailyCapsuleCard', () => {
  const onGenerate = jest.fn();
  const onCheckItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Level 0: 생성 전', () => {
    it('캡슐 없을 때 CTA 렌더링', () => {
      const { getByText, getByLabelText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={null}
          completionRate={0}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
          testID="capsule-card"
        />
      );

      expect(getByText('오늘의 뷰티 캡슐')).toBeTruthy();
      expect(getByText('캡슐 만들기')).toBeTruthy();
      expect(getByLabelText('오늘의 캡슐 만들기')).toBeTruthy();
    });

    it('생성 버튼 클릭 시 onGenerate 호출', () => {
      const { getByLabelText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={null}
          completionRate={0}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      fireEvent.press(getByLabelText('오늘의 캡슐 만들기'));
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('isGenerating=true일 때 버튼 비활성화', () => {
      const { queryByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={null}
          completionRate={0}
          isGenerating={true}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      // 로딩 중엔 "캡슐 만들기" 텍스트 대신 ActivityIndicator
      expect(queryByText('캡슐 만들기')).toBeNull();
    });

    it('testID 전달', () => {
      const { getByTestId } = renderWithTheme(
        <DailyCapsuleCard
          capsule={null}
          completionRate={0}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
          testID="my-capsule"
        />
      );

      expect(getByTestId('my-capsule')).toBeTruthy();
    });
  });

  describe('Level 1: 요약 (접힌 상태)', () => {
    it('캡슐 제목과 CCS 표시', () => {
      const { getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      expect(getByText('오늘의 뷰티 캡슐')).toBeTruthy();
      expect(getByText('CCS 78')).toBeTruthy();
    });

    it('펼치기 버튼 존재', () => {
      const { getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      expect(getByText('펼치기 ▼')).toBeTruthy();
    });

    it('아이템 리스트는 접힌 상태에서 보이지 않음', () => {
      const { queryByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      expect(queryByText('수분 크림')).toBeNull();
    });
  });

  describe('Level 2: 확장', () => {
    it('헤더 클릭 시 아이템 리스트 표시', () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      fireEvent.press(getByLabelText('캡슐 펼치기'));

      expect(getByText('수분 크림')).toBeTruthy();
      expect(getByText('비타민 C')).toBeTruthy();
      expect(getByText('요가 스트레칭')).toBeTruthy();
    });

    it('확장 후 "접기 ▲" 텍스트 표시', () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      fireEvent.press(getByLabelText('캡슐 펼치기'));
      expect(getByText('접기 ▲')).toBeTruthy();
    });

    it('아이템 클릭 시 onCheckItem 호출', () => {
      const { getByLabelText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      // 먼저 펼치기
      fireEvent.press(getByLabelText('캡슐 펼치기'));

      // 미완료 아이템 클릭 → isChecked: true로 토글
      fireEvent.press(getByLabelText('수분 크림 미완료'));
      expect(onCheckItem).toHaveBeenCalledWith('1', true);
    });

    it('완료된 아이템 클릭 시 해제', () => {
      const { getByLabelText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      fireEvent.press(getByLabelText('캡슐 펼치기'));

      // 이미 완료된 아이템 클릭 → isChecked: false로 토글
      fireEvent.press(getByLabelText('비타민 C 완료'));
      expect(onCheckItem).toHaveBeenCalledWith('2', false);
    });

    it('아이템에 모듈 이모지 표시', () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      fireEvent.press(getByLabelText('캡슐 펼치기'));
      expect(getByText('💧')).toBeTruthy(); // skin
      expect(getByText('🥗')).toBeTruthy(); // nutrition
      expect(getByText('💪')).toBeTruthy(); // workout
    });

    it('이유(reason) 텍스트 표시', () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={33}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      fireEvent.press(getByLabelText('캡슐 펼치기'));
      expect(getByText('건조한 피부에 수분 공급')).toBeTruthy();
    });
  });

  describe('다크모드', () => {
    it('다크모드에서 정상 렌더링', () => {
      const { getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={mockCapsule}
          completionRate={50}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />,
        true
      );

      expect(getByText('오늘의 뷰티 캡슐')).toBeTruthy();
      expect(getByText('CCS 78')).toBeTruthy();
    });
  });

  describe('빈 아이템', () => {
    it('아이템 없는 캡슐 렌더링', () => {
      const emptyCapsule = { id: 'empty', items: [], totalCcs: 0, status: 'active' };
      const { getByText } = renderWithTheme(
        <DailyCapsuleCard
          capsule={emptyCapsule}
          completionRate={0}
          onGenerate={onGenerate}
          onCheckItem={onCheckItem}
        />
      );

      expect(getByText('CCS 0')).toBeTruthy();
    });
  });
});
