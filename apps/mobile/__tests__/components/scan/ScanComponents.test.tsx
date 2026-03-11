/**
 * 스캔 컴포넌트 테스트 — ScanCamera, ScanResult, BarcodeInput, IngredientConflictAlert
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BarcodeInput } from '../../../components/scan/BarcodeInput';
import { IngredientConflictAlert } from '../../../components/scan/IngredientConflictAlert';
import { ScanCamera } from '../../../components/scan/ScanCamera';
import { ScanResult } from '../../../components/scan/ScanResult';
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

// expo-image mock
jest.mock('expo-image', () => {
  const RN = require('react-native');
  const RR = require('react');
  return {
    Image: (props: any) =>
      RR.createElement(RN.View, {
        testID: props.testID || 'expo-image',
        accessibilityLabel: props.accessibilityLabel,
      }),
  };
});

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

// ─── ScanCamera ────────────────────────────────────────

describe('ScanCamera', () => {
  const onScan = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 렌더링', () => {
    const { getByTestId, getByLabelText } = renderWithTheme(
      <ScanCamera onScan={onScan} onClose={onClose} />
    );

    expect(getByTestId('scan-camera')).toBeTruthy();
    expect(getByLabelText('바코드 스캔 카메라')).toBeTruthy();
  });

  it('안내 텍스트 표시', () => {
    const { getByText } = renderWithTheme(
      <ScanCamera onScan={onScan} onClose={onClose} />
    );

    expect(getByText('바코드를 스캔해주세요')).toBeTruthy();
    expect(getByText('제품의 바코드를 프레임 안에 맞춰주세요')).toBeTruthy();
  });

  it('닫기 버튼 클릭 시 onClose 호출', () => {
    const { getByTestId } = renderWithTheme(
      <ScanCamera onScan={onScan} onClose={onClose} />
    );

    fireEvent.press(getByTestId('scan-camera-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼 접근성', () => {
    const { getByLabelText } = renderWithTheme(
      <ScanCamera onScan={onScan} onClose={onClose} />
    );

    expect(getByLabelText('스캔 닫기')).toBeTruthy();
  });
});

// ─── ScanResult ────────────────────────────────────────

describe('ScanResult', () => {
  const baseProps = {
    productName: '수분 크림',
    brand: '이니스프리',
    barcode: '8801234567895',
    ingredients: [
      { name: '히알루론산', safety: 'safe' as const },
      { name: '향료', safety: 'caution' as const },
      { name: '포름알데히드', safety: 'danger' as const },
    ],
  };

  it('제품 정보 렌더링', () => {
    const { getByText } = renderWithTheme(<ScanResult {...baseProps} />);

    expect(getByText('수분 크림')).toBeTruthy();
    expect(getByText('이니스프리')).toBeTruthy();
    expect(getByText('바코드: 8801234567895')).toBeTruthy();
  });

  it('testID 전달', () => {
    const { getByTestId } = renderWithTheme(<ScanResult {...baseProps} />);

    expect(getByTestId('scan-result')).toBeTruthy();
  });

  it('성분 목록 렌더링', () => {
    const { getByText } = renderWithTheme(<ScanResult {...baseProps} />);

    expect(getByText('성분 분석')).toBeTruthy();
    expect(getByText('히알루론산')).toBeTruthy();
    expect(getByText('향료')).toBeTruthy();
    expect(getByText('포름알데히드')).toBeTruthy();
  });

  it('안전성 라벨 표시', () => {
    const { getAllByText } = renderWithTheme(<ScanResult {...baseProps} />);

    expect(getAllByText('안전').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('주의').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('위험').length).toBeGreaterThanOrEqual(1);
  });

  it('성분 없을 때 빈 상태', () => {
    const { getByText } = renderWithTheme(
      <ScanResult {...baseProps} ingredients={[]} />
    );

    expect(getByText('성분 정보가 없습니다')).toBeTruthy();
  });

  it('저장 버튼 클릭', () => {
    const onSave = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ScanResult {...baseProps} onSave={onSave} />
    );

    fireEvent.press(getByTestId('scan-result-save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼 클릭', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ScanResult {...baseProps} onDismiss={onDismiss} />
    );

    fireEvent.press(getByTestId('scan-result-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('접근성 라벨', () => {
    const { getByLabelText } = renderWithTheme(<ScanResult {...baseProps} />);

    expect(getByLabelText('스캔 결과: 이니스프리 수분 크림')).toBeTruthy();
  });

  it('이미지 없을 때 플레이스홀더', () => {
    const { getByLabelText } = renderWithTheme(<ScanResult {...baseProps} />);

    expect(getByLabelText('기본 제품 아이콘')).toBeTruthy();
  });
});

// ─── BarcodeInput ──────────────────────────────────────

describe('BarcodeInput', () => {
  const onChange = jest.fn();
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 렌더링', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <BarcodeInput value="" onChange={onChange} onSubmit={onSubmit} />
    );

    expect(getByTestId('barcode-input')).toBeTruthy();
    expect(getByText('제품 뒷면의 바코드 숫자를 직접 입력할 수 있어요')).toBeTruthy();
  });

  it('값 변경 시 onChange 호출', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="" onChange={onChange} onSubmit={onSubmit} />
    );

    fireEvent.changeText(getByTestId('barcode-input-field'), '12345');
    expect(onChange).toHaveBeenCalledWith('12345');
  });

  it('빈 값일 때 조회 버튼 비활성화', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="" onChange={onChange} onSubmit={onSubmit} />
    );

    const submitBtn = getByTestId('barcode-input-submit');
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('값이 있을 때 조회 버튼 활성화', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="12345" onChange={onChange} onSubmit={onSubmit} />
    );

    const submitBtn = getByTestId('barcode-input-submit');
    expect(submitBtn.props.accessibilityState?.disabled).toBe(false);
  });

  it('조회 버튼 클릭 시 onSubmit 호출', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="12345" onChange={onChange} onSubmit={onSubmit} />
    );

    fireEvent.press(getByTestId('barcode-input-submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('키보드 Submit 시 onSubmit 호출', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="12345" onChange={onChange} onSubmit={onSubmit} />
    );

    fireEvent(getByTestId('barcode-input-field'), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('커스텀 placeholder', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput
        value=""
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder="EAN-13 입력"
      />
    );

    expect(getByTestId('barcode-input-field').props.placeholder).toBe('EAN-13 입력');
  });

  it('접근성', () => {
    const { getByLabelText } = renderWithTheme(
      <BarcodeInput value="" onChange={onChange} onSubmit={onSubmit} />
    );

    expect(getByLabelText('바코드 입력')).toBeTruthy();
    expect(getByLabelText('바코드 번호 입력란')).toBeTruthy();
    expect(getByLabelText('바코드 조회')).toBeTruthy();
  });
});

// ─── IngredientConflictAlert ───────────────────────────

describe('IngredientConflictAlert', () => {
  const mockConflicts = [
    { ingredient: '향료', reason: '민감한 피부에 자극을 줄 수 있어요', severity: 'medium' as const },
    { ingredient: '파라벤', reason: '알레르기 유발 가능성이 있어요', severity: 'high' as const },
  ];

  it('충돌 목록 렌더링', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />
    );

    expect(getByTestId('ingredient-conflict-alert')).toBeTruthy();
    expect(getByText('향료')).toBeTruthy();
    expect(getByText('파라벤')).toBeTruthy();
    expect(getByText('민감한 피부에 자극을 줄 수 있어요')).toBeTruthy();
  });

  it('최고 심각도에 따른 헤더', () => {
    const { getByText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />
    );

    // high가 최고 심각도 → "위험" 아이콘
    expect(getByText('🚨')).toBeTruthy();
  });

  it('빈 배열일 때 null 반환', () => {
    const { toJSON } = renderWithTheme(
      <IngredientConflictAlert conflicts={[]} />
    );

    expect(toJSON()).toBeNull();
  });

  it('심각도별 라벨 표시', () => {
    const { getAllByText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />
    );

    expect(getAllByText('주의').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('위험').length).toBeGreaterThanOrEqual(1);
  });

  it('닫기 버튼 클릭', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} onDismiss={onDismiss} />
    );

    fireEvent.press(getByTestId('conflict-alert-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('닫기 콜백 없을 때 닫기 버튼 미표시', () => {
    const { queryByTestId } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />
    );

    expect(queryByTestId('conflict-alert-dismiss')).toBeNull();
  });

  it('접근성 라벨', () => {
    const { getByLabelText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />
    );

    expect(getByLabelText('성분 충돌 경고 2건')).toBeTruthy();
  });

  it('단일 충돌 (low 심각도)', () => {
    const single = [{ ingredient: '향료', reason: '약간의 자극', severity: 'low' as const }];
    const { getByText } = renderWithTheme(
      <IngredientConflictAlert conflicts={single} />
    );

    expect(getByText('ℹ️')).toBeTruthy(); // low → info icon
    expect(getByText('참고')).toBeTruthy();
  });
});
