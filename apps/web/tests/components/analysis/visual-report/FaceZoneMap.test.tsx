import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FaceZoneMap } from '@/components/analysis/visual-report/FaceZoneMap';
import type { ZoneStatus } from '@/components/analysis/visual-report/FaceZoneMap';

describe('FaceZoneMap', () => {
  const mockZones: {
    forehead: ZoneStatus;
    tZone: ZoneStatus;
    eyes: ZoneStatus;
    cheeks: ZoneStatus;
    uZone: ZoneStatus;
    chin: ZoneStatus;
  } = {
    forehead: { score: 85, status: 'good', label: '이마' },
    tZone: { score: 62, status: 'normal', label: 'T존' },
    eyes: { score: 45, status: 'warning', label: '눈가', concern: '건조함' },
    cheeks: { score: 78, status: 'good', label: '볼' },
    uZone: { score: 55, status: 'normal', label: 'U존' },
    chin: { score: 40, status: 'warning', label: '턱', concern: '모공 확대' },
  };

  describe('정상 케이스', () => {
    it('FaceZoneMap 컴포넌트가 렌더링된다', () => {
      render(<FaceZoneMap zones={mockZones} />);

      expect(screen.getByTestId('face-zone-map')).toBeInTheDocument();
    });

    it('SVG가 올바른 aria-label을 가진다', () => {
      render(<FaceZoneMap zones={mockZones} />);

      const svg = screen.getByRole('img', { name: '피부 존별 상태' });
      expect(svg).toBeInTheDocument();
    });

    it('각 존이 올바른 data-zone 속성을 가진다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} />);

      const zones = container.querySelectorAll('[data-zone]');
      const zoneIds = Array.from(zones).map((el) => el.getAttribute('data-zone'));

      expect(zoneIds).toContain('forehead');
      expect(zoneIds).toContain('tZone');
      expect(zoneIds).toContain('eyes');
      expect(zoneIds).toContain('cheeks');
      expect(zoneIds).toContain('uZone');
      expect(zoneIds).toContain('chin');
    });
  });

  describe('라벨 및 점수 표시', () => {
    it('showLabels=true일 때 라벨을 표시한다', () => {
      render(<FaceZoneMap zones={mockZones} showLabels />);

      expect(screen.getByText('이마')).toBeInTheDocument();
      expect(screen.getByText('T존')).toBeInTheDocument();
      expect(screen.getByText('눈가')).toBeInTheDocument();
      expect(screen.getByText('볼')).toBeInTheDocument();
    });

    it('showScores=true일 때 점수를 표시한다', () => {
      render(<FaceZoneMap zones={mockZones} showScores />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('62')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('showLabels와 showScores를 모두 활성화할 수 있다', () => {
      render(<FaceZoneMap zones={mockZones} showLabels showScores />);

      expect(screen.getByText('이마')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('크기 조정', () => {
    it('size=sm일 때 작은 크기로 렌더링된다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} size="sm" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '168');
    });

    it('size=md일 때 중간 크기로 렌더링된다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} size="md" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '180');
      expect(svg).toHaveAttribute('height', '252');
    });

    it('size=lg일 때 큰 크기로 렌더링된다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} size="lg" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '240');
      expect(svg).toHaveAttribute('height', '336');
    });
  });

  describe('존 클릭 이벤트', () => {
    it('onZoneClick 콜백이 제공되면 존을 클릭할 수 있다', () => {
      const onZoneClick = vi.fn();
      const { container } = render(<FaceZoneMap zones={mockZones} onZoneClick={onZoneClick} />);

      const foreheadZone = container.querySelector('[data-zone="forehead"]');
      if (foreheadZone) {
        const path = foreheadZone.querySelector('path');
        if (path) {
          fireEvent.click(path);
          expect(onZoneClick).toHaveBeenCalledWith('forehead');
        }
      }
    });

    it('onZoneClick이 없을 때 클릭해도 동작하지 않는다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} />);

      const foreheadZone = container.querySelector('[data-zone="forehead"]');
      if (foreheadZone) {
        const path = foreheadZone.querySelector('path');
        expect(path).not.toHaveClass('cursor-pointer');
      }
    });
  });

  describe('최악의 존 하이라이트', () => {
    it('highlightWorst=true일 때 가장 낮은 점수의 존을 하이라이트한다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} highlightWorst />);

      // chin이 40점으로 가장 낮음
      const chinZone = container.querySelector('[data-zone="chin"]');
      expect(chinZone).toBeInTheDocument();

      // stroke-2와 animate-pulse 클래스가 있는지 확인
      const chinPath = chinZone?.querySelector('path');
      expect(chinPath).toHaveClass('stroke-2');
      expect(chinPath).toHaveClass('animate-pulse');
    });
  });

  describe('호버 툴팁', () => {
    it('존에 마우스 오버 시 툴팁을 표시한다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} />);

      const eyesZone = container.querySelector('[data-zone="eyes"]');
      const path = eyesZone?.querySelector('path');

      if (path) {
        fireEvent.mouseEnter(path);

        // concern이 있는 경우 concern을 표시
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('건조함');
      }
    });

    it('존에서 마우스 아웃 시 툴팁을 숨긴다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} />);

      const eyesZone = container.querySelector('[data-zone="eyes"]');
      const path = eyesZone?.querySelector('path');

      if (path) {
        fireEvent.mouseEnter(path);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();

        fireEvent.mouseLeave(path);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      }
    });

    it('concern이 없을 때 라벨을 툴팁으로 표시한다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} />);

      const foreheadZone = container.querySelector('[data-zone="forehead"]');
      const path = foreheadZone?.querySelector('path');

      if (path) {
        fireEvent.mouseEnter(path);

        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('이마');
      }
    });
  });

  describe('엣지 케이스', () => {
    it('일부 존만 제공되어도 렌더링된다', () => {
      const partialZones = {
        forehead: mockZones.forehead,
        tZone: mockZones.tZone,
      };

      render(<FaceZoneMap zones={partialZones} />);

      expect(screen.getByTestId('face-zone-map')).toBeInTheDocument();
    });

    it('빈 zones 객체로도 렌더링된다', () => {
      render(<FaceZoneMap zones={{}} />);

      expect(screen.getByTestId('face-zone-map')).toBeInTheDocument();
    });

    it('커스텀 className을 적용한다', () => {
      render(<FaceZoneMap zones={mockZones} className="custom-class" />);

      expect(screen.getByTestId('face-zone-map')).toHaveClass('custom-class');
    });

    it('존 상태에 따라 올바른 색상 클래스를 적용한다', () => {
      const { container } = render(<FaceZoneMap zones={mockZones} />);

      // good 상태 (forehead: 85점)
      const foreheadPath = container.querySelector('[data-zone="forehead"]')?.querySelector('path');
      expect(foreheadPath).toHaveClass('fill-emerald-100');

      // normal 상태 (tZone: 62점)
      const tZonePath = container.querySelector('[data-zone="tZone"]')?.querySelector('path');
      expect(tZonePath).toHaveClass('fill-yellow-100');

      // warning 상태 (eyes: 45점)
      const eyesPath = container.querySelector('[data-zone="eyes"]')?.querySelector('path');
      expect(eyesPath).toHaveClass('fill-red-100');
    });
  });
});
