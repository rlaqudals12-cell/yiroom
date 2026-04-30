/**
 * T-5: 접근성 검증 (sr-only, aria-label, data-testid)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnonymousFaceTemplate } from '@/components/analysis/overlay/anonymous/AnonymousFaceTemplate';
import { AnonymousBodyTemplate } from '@/components/analysis/overlay/anonymous/AnonymousBodyTemplate';
import { ShareModeToggle } from '@/components/analysis/overlay/anonymous/ShareModeToggle';

// (ToothDiagramOverlay 접근성 테스트는 ADR-098 Phase 1 OH-1 제거에 따라 정리됨)

describe('AnonymousFaceTemplate 접근성', () => {
  it('should have data-testid', () => {
    render(<AnonymousFaceTemplate />);
    expect(screen.getByTestId('anonymous-face-template')).toBeInTheDocument();
  });

  it('should have aria-label on SVG with face shape', () => {
    render(<AnonymousFaceTemplate faceShape="round" />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toContain('둥근형');
  });

  it('should render children overlay', () => {
    render(
      <AnonymousFaceTemplate>
        <div data-testid="child-overlay">오버레이</div>
      </AnonymousFaceTemplate>
    );
    expect(screen.getByTestId('child-overlay')).toBeInTheDocument();
  });
});

describe('AnonymousBodyTemplate 접근성', () => {
  it('should have data-testid', () => {
    render(<AnonymousBodyTemplate />);
    expect(screen.getByTestId('anonymous-body-template')).toBeInTheDocument();
  });

  it('should have aria-label with body type', () => {
    render(<AnonymousBodyTemplate bodyType="W" />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toContain('웨이브');
  });
});

describe('ShareModeToggle 접근성', () => {
  it('should have data-testid', () => {
    render(<ShareModeToggle mode="illustration" onModeChange={() => {}} />);
    expect(screen.getByTestId('share-mode-toggle')).toBeInTheDocument();
  });

  it('should have role=radiogroup', () => {
    render(<ShareModeToggle mode="illustration" onModeChange={() => {}} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should have aria-label', () => {
    render(<ShareModeToggle mode="illustration" onModeChange={() => {}} />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label');
  });

  it('should mark illustration as checked by default', () => {
    render(<ShareModeToggle mode="illustration" onModeChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    const illustrationRadio = radios.find((r) => r.getAttribute('aria-checked') === 'true');
    expect(illustrationRadio).toBeInTheDocument();
  });
});
