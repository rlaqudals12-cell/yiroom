import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotocardTilt } from '@/components/share/PhotocardTilt';

/** jsdom엔 레이아웃이 없다 — 정규화 좌표 계산을 위해 크기를 주입 */
function stubRect(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
    }) as DOMRect;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PhotocardTilt — 포토카드 3D 틸트 인터랙션', () => {
  it('자식을 렌더하고 기본은 평면(perspective만)이다', () => {
    render(
      <PhotocardTilt>
        <div>카드</div>
      </PhotocardTilt>
    );
    const frame = screen.getByTestId('photocard-tilt');
    expect(frame).toHaveTextContent('카드');
    expect(frame.style.transform).toBe('perspective(900px)');
  });

  it('포인터 이동 시 기울고, 벗어나면 평면으로 복귀한다', () => {
    render(
      <PhotocardTilt>
        <div>카드</div>
      </PhotocardTilt>
    );
    const frame = screen.getByTestId('photocard-tilt');
    // jsdom 레이아웃은 0×0 — 크기를 주입해 정규화 좌표가 계산되게 한다
    frame.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 400,
        height: 400,
        right: 400,
        bottom: 400,
        x: 0,
        y: 0,
      }) as DOMRect;

    // jsdom엔 PointerEvent가 없어 fireEvent.pointerMove는 좌표를 못 싣는다 — MouseEvent로 디스패치
    fireEvent(frame, new MouseEvent('pointermove', { clientX: 400, clientY: 0, bubbles: true }));
    expect(frame.style.transform).toContain('rotateX(6');
    expect(frame.style.transform).toContain('rotateY(6');

    fireEvent.pointerLeave(frame);
    expect(frame.style.transform).toBe('perspective(900px)');
  });

  it('prefers-reduced-motion: reduce면 포인터가 움직여도 기울지 않는다', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
      }))
    );

    render(
      <PhotocardTilt>
        <div>카드</div>
      </PhotocardTilt>
    );
    const frame = screen.getByTestId('photocard-tilt');
    stubRect(frame);

    fireEvent(frame, new MouseEvent('pointermove', { clientX: 400, clientY: 0, bubbles: true }));

    expect(frame.style.transform).toBe('perspective(900px)');
  });

  it('모션 축소 선호가 아니면 기존대로 기운다', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );

    render(
      <PhotocardTilt>
        <div>카드</div>
      </PhotocardTilt>
    );
    const frame = screen.getByTestId('photocard-tilt');
    stubRect(frame);

    fireEvent(frame, new MouseEvent('pointermove', { clientX: 400, clientY: 0, bubbles: true }));

    expect(frame.style.transform).toContain('rotateY(6');
  });
});
