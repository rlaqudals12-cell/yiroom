/**
 * PhotoOverlayMap.tsx 테스트
 * @description 사진 위 존 오버레이 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  PhotoOverlayMap,
  type ZoneId,
  type ZoneStatus,
} from '@/components/analysis/visual-report/PhotoOverlayMap';

// ============================================
// Mock 데이터
// ============================================

const mockImageUrl = '/test-image.jpg';

const mockZones: Partial<Record<ZoneId, ZoneStatus>> = {
  forehead: { score: 85, status: 'good', label: '이마', concern: undefined },
  tZone: { score: 65, status: 'normal', label: 'T존', concern: '유분 과다' },
  eyes: { score: 75, status: 'normal', label: '눈가' },
  cheeks: { score: 45, status: 'warning', label: '볼', concern: '건조함' },
  uZone: { score: 80, status: 'good', label: 'U존' },
  chin: { score: 55, status: 'normal', label: '턱' },
};

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('PhotoOverlayMap', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);
      expect(screen.getByTestId('photo-overlay-map')).toBeInTheDocument();
    });

    it('이미지가 렌더링되어야 함', () => {
      render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);
      const image = screen.getByRole('img', { name: '분석 사진' });
      expect(image).toBeInTheDocument();
    });

    it('이미지 로드 후 SVG 오버레이가 표시되어야 함', async () => {
      render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      // 이미지 로드 시뮬레이션
      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const svg = screen.getByRole('img', { name: '피부 존별 분석 오버레이' });
        expect(svg).toBeInTheDocument();
      });
    });

    it('이미지 로드 전에는 SVG가 표시되지 않아야 함', () => {
      render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      // SVG는 이미지 로드 전에는 없어야 함
      const svg = screen.queryByRole('img', { name: '피부 존별 분석 오버레이' });
      expect(svg).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 존 렌더링 테스트
  // ============================================

  describe('존 렌더링', () => {
    it('제공된 존만 렌더링되어야 함', async () => {
      const partialZones: Partial<Record<ZoneId, ZoneStatus>> = {
        forehead: { score: 85, status: 'good', label: '이마' },
        cheeks: { score: 45, status: 'warning', label: '볼' },
      };

      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={partialZones} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        // forehead와 cheeks 존만 렌더링됨
        expect(container.querySelector('[data-zone="forehead"]')).toBeInTheDocument();
        expect(container.querySelector('[data-zone="cheeks"]')).toBeInTheDocument();
        // 다른 존은 렌더링되지 않음
        expect(container.querySelector('[data-zone="tZone"]')).not.toBeInTheDocument();
        expect(container.querySelector('[data-zone="eyes"]')).not.toBeInTheDocument();
      });
    });

    it('빈 zones로도 에러 없이 렌더링되어야 함', () => {
      expect(() => {
        render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={{}} />);
      }).not.toThrow();
    });

    it('cheeks 존은 ellipse로 렌더링되어야 함 (양 볼)', async () => {
      const cheeksOnly: Partial<Record<ZoneId, ZoneStatus>> = {
        cheeks: { score: 45, status: 'warning', label: '볼' },
      };

      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={cheeksOnly} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const cheeksGroup = container.querySelector('[data-zone="cheeks"]');
        expect(cheeksGroup).toBeInTheDocument();

        // 양 볼에 대해 2개의 ellipse가 있어야 함
        const ellipses = cheeksGroup?.querySelectorAll('ellipse');
        expect(ellipses).toHaveLength(2);
      });
    });

    it('다른 존은 path로 렌더링되어야 함', async () => {
      const foreheadOnly: Partial<Record<ZoneId, ZoneStatus>> = {
        forehead: { score: 85, status: 'good', label: '이마' },
      };

      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={foreheadOnly} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const foreheadGroup = container.querySelector('[data-zone="forehead"]');
        expect(foreheadGroup).toBeInTheDocument();

        // path 요소가 있어야 함
        const path = foreheadGroup?.querySelector('path');
        expect(path).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // 상태별 색상 테스트
  // ============================================

  describe('상태별 색상', () => {
    it('good 상태는 emerald 색상을 사용해야 함', async () => {
      const goodZone: Partial<Record<ZoneId, ZoneStatus>> = {
        forehead: { score: 85, status: 'good', label: '이마' },
      };

      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={goodZone} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const path = container.querySelector('[data-zone="forehead"] path');
        expect(path).toHaveAttribute('fill', 'rgba(16, 185, 129, 0.3)');
        expect(path).toHaveAttribute('stroke', 'rgba(16, 185, 129, 0.8)');
      });
    });

    it('normal 상태는 yellow 색상을 사용해야 함', async () => {
      const normalZone: Partial<Record<ZoneId, ZoneStatus>> = {
        tZone: { score: 65, status: 'normal', label: 'T존' },
      };

      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={normalZone} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const path = container.querySelector('[data-zone="tZone"] path');
        expect(path).toHaveAttribute('fill', 'rgba(234, 179, 8, 0.3)');
        expect(path).toHaveAttribute('stroke', 'rgba(234, 179, 8, 0.8)');
      });
    });

    it('warning 상태는 red 색상을 사용해야 함', async () => {
      const warningZone: Partial<Record<ZoneId, ZoneStatus>> = {
        cheeks: { score: 45, status: 'warning', label: '볼' },
      };

      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={warningZone} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const ellipse = container.querySelector('[data-zone="cheeks"] ellipse');
        expect(ellipse).toHaveAttribute('fill', 'rgba(239, 68, 68, 0.3)');
        expect(ellipse).toHaveAttribute('stroke', 'rgba(239, 68, 68, 0.8)');
      });
    });
  });

  // ============================================
  // 라벨 테스트
  // ============================================

  describe('라벨', () => {
    it('showLabels=true(기본값)일 때 라벨이 표시되어야 함', async () => {
      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        // SVG text 요소 확인
        const textElements = container.querySelectorAll('svg text');
        expect(textElements.length).toBeGreaterThan(0);
      });
    });

    it('showLabels=false일 때 라벨이 숨겨져야 함', async () => {
      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} showLabels={false} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const textElements = container.querySelectorAll('svg text');
        expect(textElements.length).toBe(0);
      });
    });

    it('라벨에 존 이름과 점수가 표시되어야 함', async () => {
      const singleZone: Partial<Record<ZoneId, ZoneStatus>> = {
        forehead: { score: 85, status: 'good', label: '이마' },
      };

      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={singleZone} showLabels={true} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const textElement = container.querySelector('svg text');
        expect(textElement?.textContent).toContain('이마');
        expect(textElement?.textContent).toContain('85');
      });
    });
  });

  // ============================================
  // 클릭 이벤트 테스트
  // ============================================

  describe('클릭 이벤트', () => {
    it('onZoneClick이 제공되면 존 클릭 시 호출되어야 함', async () => {
      const onZoneClick = vi.fn();

      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} onZoneClick={onZoneClick} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const foreheadPath = container.querySelector('[data-zone="forehead"] path');
        expect(foreheadPath).toBeInTheDocument();
      });

      const foreheadPath = container.querySelector('[data-zone="forehead"] path');
      fireEvent.click(foreheadPath!);

      expect(onZoneClick).toHaveBeenCalledWith('forehead');
    });

    it('cheeks 존 클릭도 올바르게 처리되어야 함', async () => {
      const onZoneClick = vi.fn();

      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} onZoneClick={onZoneClick} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const cheeksEllipse = container.querySelector('[data-zone="cheeks"] ellipse');
        expect(cheeksEllipse).toBeInTheDocument();
      });

      const cheeksEllipse = container.querySelector('[data-zone="cheeks"] ellipse');
      fireEvent.click(cheeksEllipse!);

      expect(onZoneClick).toHaveBeenCalledWith('cheeks');
    });

    it('onZoneClick이 없으면 클릭해도 에러가 발생하지 않아야 함', async () => {
      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const foreheadPath = container.querySelector('[data-zone="forehead"] path');
        expect(foreheadPath).toBeInTheDocument();
      });

      // 에러 없이 클릭 가능해야 함
      const foreheadPath = container.querySelector('[data-zone="forehead"] path');
      expect(() => fireEvent.click(foreheadPath!)).not.toThrow();
    });
  });

  // ============================================
  // 호버 툴팁 테스트
  // ============================================

  describe('호버 툴팁', () => {
    it('존에 마우스 호버 시 툴팁이 표시되어야 함', async () => {
      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const foreheadPath = container.querySelector('[data-zone="forehead"] path');
        expect(foreheadPath).toBeInTheDocument();
      });

      const foreheadPath = container.querySelector('[data-zone="forehead"] path');
      fireEvent.mouseEnter(foreheadPath!);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('이마');
        expect(tooltip).toHaveTextContent('점수: 85점');
      });
    });

    it('마우스 leave 시 툴팁이 사라져야 함', async () => {
      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const foreheadPath = container.querySelector('[data-zone="forehead"] path');
        expect(foreheadPath).toBeInTheDocument();
      });

      const foreheadPath = container.querySelector('[data-zone="forehead"] path');

      // 마우스 진입
      fireEvent.mouseEnter(foreheadPath!);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      // 마우스 떠남
      fireEvent.mouseLeave(foreheadPath!);
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('concern이 있으면 툴팁에 표시되어야 함', async () => {
      const zoneWithConcern: Partial<Record<ZoneId, ZoneStatus>> = {
        tZone: { score: 65, status: 'normal', label: 'T존', concern: '유분 과다' },
      };

      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={zoneWithConcern} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const tZonePath = container.querySelector('[data-zone="tZone"] path');
        expect(tZonePath).toBeInTheDocument();
      });

      const tZonePath = container.querySelector('[data-zone="tZone"] path');
      fireEvent.mouseEnter(tZonePath!);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('유분 과다');
      });
    });
  });

  // ============================================
  // opacity prop 테스트
  // ============================================

  describe('opacity prop', () => {
    it('기본 opacity는 0.6이어야 함', async () => {
      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const svg = screen.getByRole('img', { name: '피부 존별 분석 오버레이' });
        expect(svg).toHaveStyle({ opacity: '0.6' });
      });
    });

    it('커스텀 opacity가 적용되어야 함', async () => {
      const { container } = render(
        <PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} opacity={0.8} />
      );

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const svg = screen.getByRole('img', { name: '피부 존별 분석 오버레이' });
        expect(svg).toHaveStyle({ opacity: '0.8' });
      });
    });
  });

  // ============================================
  // className prop 테스트
  // ============================================

  describe('className prop', () => {
    it('추가 className이 적용되어야 함', () => {
      render(
        <PhotoOverlayMap
          imageUrl={mockImageUrl}
          zones={mockZones}
          className="custom-class test-class"
        />
      );

      const container = screen.getByTestId('photo-overlay-map');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('test-class');
    });
  });

  // ============================================
  // 접근성 테스트
  // ============================================

  describe('접근성', () => {
    it('SVG에 aria-label이 있어야 함', async () => {
      render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const svg = screen.getByRole('img', { name: '피부 존별 분석 오버레이' });
        expect(svg).toHaveAttribute('aria-label', '피부 존별 분석 오버레이');
      });
    });

    it('이미지에 적절한 alt 텍스트가 있어야 함', () => {
      render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      expect(image).toHaveAttribute('alt', '분석 사진');
    });

    it('툴팁에 role="tooltip"이 있어야 함', async () => {
      const { container } = render(<PhotoOverlayMap imageUrl={mockImageUrl} zones={mockZones} />);

      const image = screen.getByRole('img', { name: '분석 사진' });
      fireEvent.load(image);

      await waitFor(() => {
        const foreheadPath = container.querySelector('[data-zone="forehead"] path');
        expect(foreheadPath).toBeInTheDocument();
      });

      const foreheadPath = container.querySelector('[data-zone="forehead"] path');
      fireEvent.mouseEnter(foreheadPath!);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });
});
