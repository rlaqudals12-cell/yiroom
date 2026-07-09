/**
 * DrapeSimulator 테스트
 *
 * @description
 * - 진단 정본 베스트 컬러(diagnosisBestColors)를 후보 스와치로 제시하는지
 * - A·B 슬롯에 사용자가 직접 담아 비교하는 흐름
 * - 회귀 방지: "가짜 순위" 표현("어울림 N위"·별점(★)·"베스트 컬러 TOP 5"·자동 베스트/워스트)이
 *   더 이상 렌더되지 않는다 (측정 신호 없는 지어낸 순위 제거)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// next-intl 목 (라벨은 키 그대로 반환)
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// 캔버스 렌더 의존성 목 (jsdom canvas 우회 — 렌더 로직이 아니라 UI 구조/문구 검증이 목적)
vi.mock('@/lib/analysis', () => ({
  applyDrapeColor: vi.fn(),
  applyMetalReflectance: vi.fn(),
  createOptimizedContext: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
  })),
  getConstrainedCanvasSize: () => ({ width: 100, height: 133 }),
  applyVignette: vi.fn(),
  releaseCanvas: vi.fn(),
}));

vi.mock('@/lib/utils/color-names', () => ({
  getKoreanColorName: (hex: string) => `색상 ${hex}`,
}));

import DrapeSimulator from '@/components/analysis/visual/DrapeSimulator';
import type { DeviceCapability } from '@/types/visual-analysis';

const DEVICE: DeviceCapability = {
  tier: 'high',
  drapeColors: 128,
  landmarkCount: 468,
  useGPU: true,
};

const DIAGNOSIS_COLORS = [
  { hex: '#FF7F50', name: '코랄' },
  { hex: '#FFCBA4', name: '피치' },
  { hex: '#FA8072', name: '살몬' },
];

function renderSimulator(
  props: Partial<React.ComponentProps<typeof DrapeSimulator>> = {}
): ReturnType<typeof render> {
  const image = new Image();
  const faceMask = new Uint8Array(100 * 133);
  return render(
    <DrapeSimulator
      image={image}
      faceMask={faceMask}
      deviceCapability={DEVICE}
      metalType="gold"
      diagnosisBestColors={DIAGNOSIS_COLORS}
      {...props}
    />
  );
}

describe('DrapeSimulator', () => {
  it('시뮬레이터 컨테이너를 렌더한다', () => {
    renderSimulator();
    expect(screen.getByTestId('drape-simulator')).toBeInTheDocument();
  });

  it('진단 정본 베스트 컬러를 후보 스와치로 노출한다', () => {
    renderSimulator();
    expect(screen.getByTestId('diagnosis-best-colors')).toBeInTheDocument();
    expect(screen.getByLabelText('코랄 대보기')).toBeInTheDocument();
    expect(screen.getByLabelText('피치 대보기')).toBeInTheDocument();
    expect(screen.getByLabelText('살몬 대보기')).toBeInTheDocument();
  });

  it('진단 베스트 컬러가 비면 후보 섹션을 숨긴다 (지어내지 않음)', () => {
    renderSimulator({ diagnosisBestColors: [] });
    expect(screen.queryByTestId('diagnosis-best-colors')).toBeNull();
  });

  it('A·B 비교 섹션과 두 슬롯 선택 버튼을 렌더한다', () => {
    renderSimulator();
    expect(screen.getByTestId('ab-compare-section')).toBeInTheDocument();
    expect(screen.getByTestId('slot-A-select')).toBeInTheDocument();
    expect(screen.getByTestId('slot-B-select')).toBeInTheDocument();
  });

  it('색을 고르면 활성 슬롯에 담기고 다음 슬롯으로 전환된다', () => {
    renderSimulator();

    // 초기: A 슬롯이 담는 중
    expect(screen.getByTestId('slot-A-select')).toHaveTextContent('담는 중');
    expect(screen.getByTestId('slot-B-select')).not.toHaveTextContent('담는 중');

    // 첫 색 선택 → A에 담기고 B로 전환
    fireEvent.click(screen.getByLabelText('코랄 대보기'));
    expect(screen.getByTestId('slot-B-select')).toHaveTextContent('담는 중');
    expect(screen.getByTestId('slot-A-select')).not.toHaveTextContent('담는 중');
    // A 슬롯에 색이 담겨 미리보기 캔버스가 나타난다
    expect(screen.getByLabelText('A 슬롯 미리보기')).toBeInTheDocument();

    // 둘째 색 선택 → B에 담기고 A로 전환
    fireEvent.click(screen.getByLabelText('피치 대보기'));
    expect(screen.getByTestId('slot-A-select')).toHaveTextContent('담는 중');
    expect(screen.getByLabelText('B 슬롯 미리보기')).toBeInTheDocument();
  });

  it('슬롯 선택 버튼으로 담을 슬롯을 직접 바꿀 수 있다', () => {
    renderSimulator();
    fireEvent.click(screen.getByTestId('slot-B-select'));
    expect(screen.getByTestId('slot-B-select')).toHaveTextContent('담는 중');

    // 이제 첫 색은 B에 담긴다
    fireEvent.click(screen.getByLabelText('코랄 대보기'));
    expect(screen.getByLabelText('B 슬롯 미리보기')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 회귀 방지: 가짜 순위 표현이 사라졌는지
  // ---------------------------------------------------------------------------

  describe('가짜 순위 표현 제거 (회귀 방지)', () => {
    it('"어울림 N위" 판정 문구를 렌더하지 않는다', () => {
      const { container } = renderSimulator();
      // 색을 선택한 뒤에도 판정 문구가 나오지 않아야 한다
      fireEvent.click(screen.getByLabelText('코랄 대보기'));
      expect(container.textContent).not.toMatch(/어울림/);
      expect(container.textContent).not.toMatch(/\d+\s*위/);
      expect(screen.queryByText(/가장 어울려요/)).toBeNull();
      expect(screen.queryByText(/덜 어울려요/)).toBeNull();
    });

    it('별점(★/☆)을 렌더하지 않는다', () => {
      const { container } = renderSimulator();
      fireEvent.click(screen.getByLabelText('코랄 대보기'));
      expect(container.textContent).not.toMatch(/[★☆]/);
    });

    it('"베스트 컬러 TOP 5" 순위 헤더를 렌더하지 않는다', () => {
      const { container } = renderSimulator();
      expect(container.textContent).not.toMatch(/TOP\s*5/i);
    });
  });
});
