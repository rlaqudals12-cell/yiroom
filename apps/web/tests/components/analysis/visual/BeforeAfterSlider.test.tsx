/**
 * BeforeAfterSlider.tsx 테스트
 * @description 인터랙티브 Before/After 슬라이더 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BeforeAfterSlider, {
  SliderPresetButtons,
  SliderPositionIndicator,
} from '@/components/analysis/visual/BeforeAfterSlider';

// ============================================
// Mock 데이터
// ============================================

const mockBeforeImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const mockAfterImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// requestAnimationFrame을 동기로 실행하도록 mock
const originalRAF = global.requestAnimationFrame;
const originalCAF = global.cancelAnimationFrame;

beforeEach(() => {
  let rafId = 0;
  global.requestAnimationFrame = vi.fn((callback) => {
    rafId++;
    // 즉시 콜백 실행 (테스트 환경)
    setTimeout(() => callback(performance.now()), 0);
    return rafId;
  });
  global.cancelAnimationFrame = vi.fn();
});

afterEach(() => {
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
});

describe('BeforeAfterSlider', () => {
  // ============================================
  // 기본 렌더링
  // ============================================

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      render(<BeforeAfterSlider beforeImage={mockBeforeImage} afterImage={mockAfterImage} />);
      expect(screen.getByTestId('before-after-slider')).toBeInTheDocument();
    });

    it('슬라이더 역할이 설정되어야 함', () => {
      render(<BeforeAfterSlider beforeImage={mockBeforeImage} afterImage={mockAfterImage} />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('aria 속성이 올바르게 설정되어야 함', () => {
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          initialPosition={30}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '30');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('Before/After 이미지가 렌더링되어야 함', () => {
      render(<BeforeAfterSlider beforeImage={mockBeforeImage} afterImage={mockAfterImage} />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // 라벨 테스트
  // ============================================

  describe('라벨', () => {
    it('기본 라벨이 표시되어야 함', () => {
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          showLabels={true}
        />
      );

      // 이미지 로드 후 라벨 표시됨
      const beforeImg = screen.getAllByRole('img')[0];
      fireEvent.load(beforeImg);

      const afterImg = screen.getAllByRole('img')[1];
      fireEvent.load(afterImg);

      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });

    it('커스텀 라벨이 표시되어야 함', () => {
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          showLabels={true}
          beforeLabel="이전"
          afterLabel="이후"
        />
      );

      // 이미지 로드
      screen.getAllByRole('img').forEach((img) => fireEvent.load(img));

      expect(screen.getByText('이전')).toBeInTheDocument();
      expect(screen.getByText('이후')).toBeInTheDocument();
    });

    it('showLabels=false면 라벨이 숨겨져야 함', () => {
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          showLabels={false}
        />
      );

      // 이미지 로드
      screen.getAllByRole('img').forEach((img) => fireEvent.load(img));

      expect(screen.queryByText('Before')).not.toBeInTheDocument();
      expect(screen.queryByText('After')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 초기 위치 테스트
  // ============================================

  describe('초기 위치', () => {
    it('기본 초기 위치는 50이어야 함', () => {
      render(<BeforeAfterSlider beforeImage={mockBeforeImage} afterImage={mockAfterImage} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('커스텀 초기 위치를 설정할 수 있어야 함', () => {
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          initialPosition={75}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });
  });

  // ============================================
  // 마우스 상호작용
  // ============================================

  describe('마우스 상호작용', () => {
    it('마우스 다운 이벤트를 처리해야 함', () => {
      const onDragStart = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          onDragStart={onDragStart}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.mouseDown(slider, { clientX: 100, clientY: 100 });

      expect(onDragStart).toHaveBeenCalled();
    });

    it('위치 변경 콜백이 호출되어야 함', async () => {
      const onPositionChange = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          onPositionChange={onPositionChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.mouseDown(slider, { clientX: 50, clientY: 50 });

      // requestAnimationFrame으로 인해 비동기
      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // 키보드 접근성
  // ============================================

  describe('키보드 접근성', () => {
    it('포커스 가능해야 함', () => {
      render(<BeforeAfterSlider beforeImage={mockBeforeImage} afterImage={mockAfterImage} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('tabIndex', '0');
    });

    it('ArrowRight 키로 위치를 증가시켜야 함', async () => {
      const onPositionChange = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          initialPosition={50}
          onPositionChange={onPositionChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });
    });

    it('ArrowLeft 키로 위치를 감소시켜야 함', async () => {
      const onPositionChange = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          initialPosition={50}
          onPositionChange={onPositionChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });
    });

    it('Shift+Arrow 키로 큰 폭으로 이동해야 함', async () => {
      const onPositionChange = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          initialPosition={50}
          onPositionChange={onPositionChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // 방향 테스트
  // ============================================

  describe('방향', () => {
    it('기본 방향은 horizontal이어야 함', async () => {
      const onPositionChange = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          onPositionChange={onPositionChange}
        />
      );

      // 수평 방향에서는 ArrowLeft/Right가 동작
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });
    });

    it('vertical 방향에서는 ArrowUp/Down이 동작해야 함', async () => {
      const onPositionChange = vi.fn();
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          direction="vertical"
          onPositionChange={onPositionChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowUp' });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // aspectRatio 테스트
  // ============================================

  describe('aspectRatio', () => {
    it('기본 aspectRatio는 square여야 함', () => {
      render(<BeforeAfterSlider beforeImage={mockBeforeImage} afterImage={mockAfterImage} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('aspect-square');
    });

    it('다양한 aspectRatio를 지원해야 함', () => {
      const { rerender } = render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          aspectRatio="3/4"
        />
      );

      expect(screen.getByRole('slider')).toHaveClass('aspect-[3/4]');

      rerender(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          aspectRatio="16/9"
        />
      );

      expect(screen.getByRole('slider')).toHaveClass('aspect-video');
    });
  });

  // ============================================
  // className prop
  // ============================================

  describe('className prop', () => {
    it('추가 className이 적용되어야 함', () => {
      render(
        <BeforeAfterSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          className="custom-class"
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('custom-class');
    });
  });
});

// ============================================
// SliderPresetButtons 테스트
// ============================================

describe('SliderPresetButtons', () => {
  it('3개의 프리셋 버튼이 렌더링되어야 함', () => {
    render(<SliderPresetButtons activePreset="natural" onPresetChange={() => {}} />);

    expect(screen.getByText('미묘하게')).toBeInTheDocument();
    expect(screen.getByText('자연스럽게')).toBeInTheDocument();
    expect(screen.getByText('강조')).toBeInTheDocument();
  });

  it('활성 프리셋 버튼이 구분되어야 함', () => {
    render(<SliderPresetButtons activePreset="natural" onPresetChange={() => {}} />);

    const naturalButton = screen.getByText('자연스럽게');
    expect(naturalButton).toHaveClass('bg-primary');
  });

  it('클릭 시 onPresetChange가 호출되어야 함', () => {
    const onPresetChange = vi.fn();
    render(<SliderPresetButtons activePreset="natural" onPresetChange={onPresetChange} />);

    fireEvent.click(screen.getByText('미묘하게'));
    expect(onPresetChange).toHaveBeenCalledWith('subtle');

    fireEvent.click(screen.getByText('강조'));
    expect(onPresetChange).toHaveBeenCalledWith('enhanced');
  });

  it('disabled 상태에서 클릭이 비활성화되어야 함', () => {
    const onPresetChange = vi.fn();
    render(
      <SliderPresetButtons activePreset="natural" onPresetChange={onPresetChange} disabled={true} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

// ============================================
// SliderPositionIndicator 테스트
// ============================================

describe('SliderPositionIndicator', () => {
  it('Before/After 라벨이 표시되어야 함', () => {
    render(<SliderPositionIndicator position={50} />);

    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('위치에 따라 프로그레스 바가 업데이트되어야 함', () => {
    const { container } = render(<SliderPositionIndicator position={75} />);

    // 프로그레스 바 찾기
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('추가 className이 적용되어야 함', () => {
    const { container } = render(
      <SliderPositionIndicator position={50} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
