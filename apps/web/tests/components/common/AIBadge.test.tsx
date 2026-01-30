import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';

describe('AIBadge', () => {
  it('should render with default props', () => {
    render(<AIBadge />);
    
    const badge = screen.getByTestId('ai-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('AI 분석 결과')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<AIBadge label="AI 생성" />);
    
    expect(screen.getByText('AI 생성')).toBeInTheDocument();
  });

  it('should apply small variant styles', () => {
    render(<AIBadge variant="small" />);
    
    const badge = screen.getByTestId('ai-badge');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
  });

  it('should apply inline variant styles', () => {
    render(<AIBadge variant="inline" />);
    
    const badge = screen.getByTestId('ai-badge');
    expect(badge).toHaveClass('px-1.5');
  });

  it('should apply card variant styles', () => {
    render(<AIBadge variant="card" />);
    
    const badge = screen.getByTestId('ai-badge');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
  });

  it('should have accessibility attributes', () => {
    render(<AIBadge description="Custom description" />);

    const badge = screen.getByTestId('ai-badge');
    expect(badge).toHaveAttribute('title', 'Custom description');
    expect(badge).toHaveAttribute('aria-label', 'Custom description');
  });

  it('should have role status', () => {
    render(<AIBadge />);

    const badge = screen.getByTestId('ai-badge');
    expect(badge).toHaveAttribute('role', 'status');
  });

  it('should have aria-hidden on icon', () => {
    render(<AIBadge />);

    const badge = screen.getByTestId('ai-badge');
    // lucide-react 아이콘은 SVG로 렌더링되며 aria-hidden 속성을 가짐
    const icon = badge.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<AIBadge className="my-custom-class" />);
    
    const badge = screen.getByTestId('ai-badge');
    expect(badge).toHaveClass('my-custom-class');
  });
});

describe('AITransparencyNotice', () => {
  it('should render full notice by default', () => {
    render(<AITransparencyNotice />);
    
    const notice = screen.getByTestId('ai-transparency-notice');
    expect(notice).toBeInTheDocument();
    expect(screen.getByText('AI 기술 사용 안내')).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini AI/)).toBeInTheDocument();
  });

  it('should render compact notice when compact prop is true', () => {
    render(<AITransparencyNotice compact />);
    
    const notice = screen.getByTestId('ai-transparency-notice-compact');
    expect(notice).toBeInTheDocument();
    expect(screen.getByText(/AI 기술을 사용하여 분석 결과를 제공합니다/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<AITransparencyNotice className="my-custom-class" />);
    
    const notice = screen.getByTestId('ai-transparency-notice');
    expect(notice).toHaveClass('my-custom-class');
  });

  it('should include professional consultation recommendation', () => {
    render(<AITransparencyNotice />);

    expect(screen.getByText(/전문가 상담을 권장합니다/)).toBeInTheDocument();
  });

  it('should have role note', () => {
    render(<AITransparencyNotice />);

    const notice = screen.getByTestId('ai-transparency-notice');
    expect(notice.tagName.toLowerCase()).toBe('aside');
    expect(notice).toHaveAttribute('role', 'note');
  });

  it('should have aria-labelledby linking to title', () => {
    render(<AITransparencyNotice />);

    const notice = screen.getByTestId('ai-transparency-notice');
    expect(notice).toHaveAttribute('aria-labelledby', 'ai-notice-title');

    const title = screen.getByText('AI 기술 사용 안내');
    expect(title).toHaveAttribute('id', 'ai-notice-title');
  });

  it('should have role note on compact version', () => {
    render(<AITransparencyNotice compact />);

    const notice = screen.getByTestId('ai-transparency-notice-compact');
    expect(notice.tagName.toLowerCase()).toBe('aside');
    expect(notice).toHaveAttribute('role', 'note');
  });

  it('should have aria-label on compact version', () => {
    render(<AITransparencyNotice compact />);

    const notice = screen.getByTestId('ai-transparency-notice-compact');
    expect(notice).toHaveAttribute('aria-label', 'AI 기술 사용 안내');
  });

  it('should have aria-hidden on decorative icon', () => {
    render(<AITransparencyNotice />);

    const notice = screen.getByTestId('ai-transparency-notice');
    const iconContainer = notice.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });
});
