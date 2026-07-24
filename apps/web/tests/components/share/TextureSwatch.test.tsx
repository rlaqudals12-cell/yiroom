import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TextureSwatch, type TextureKind } from '@/components/share/TextureSwatch';

const KINDS: TextureKind[] = ['powder', 'lip', 'mascara', 'foundation'];

describe('TextureSwatch', () => {
  it.each(KINDS)('%s 질감이 진단 hex로 렌더된다', (kind) => {
    const { getByTestId } = render(<TextureSwatch hex="#B4586C" kind={kind} />);
    const svg = getByTestId(`texture-swatch-${kind}`);
    expect(svg).toBeInTheDocument();
    // 색은 진단 hex 그대로 틴팅(fill 또는 stroke) — 제3색 반입 금지 계약
    expect(svg.innerHTML).toContain('#B4586C');
  });

  it('width에 비례한 고정 비율(64:44) 높이를 가진다', () => {
    const { getByTestId } = render(<TextureSwatch hex="#8C6A5E" kind="powder" width={128} />);
    const svg = getByTestId('texture-swatch-powder');
    expect(svg.getAttribute('width')).toBe('128');
    expect(svg.getAttribute('height')).toBe('88');
  });

  it('다중 인스턴스에서 필터 id가 충돌하지 않는다', () => {
    const { container } = render(
      <>
        <TextureSwatch hex="#B4586C" kind="powder" />
        <TextureSwatch hex="#7A5C8E" kind="powder" />
      </>
    );
    const ids = Array.from(container.querySelectorAll('filter')).map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('외부 리소스 참조가 없다(캡처 안전 — 인라인 SVG만)', () => {
    const { container } = render(<TextureSwatch hex="#B4586C" kind="lip" />);
    expect(container.innerHTML).not.toMatch(/https?:\/\//);
  });
});
