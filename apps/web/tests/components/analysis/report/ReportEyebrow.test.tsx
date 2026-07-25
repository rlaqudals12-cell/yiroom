/**
 * ReportEyebrow 테스트 — 진단지 아이브로우 프리미티브
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportEyebrow } from '@/components/analysis/report';

describe('ReportEyebrow', () => {
  it('아이브로우 텍스트를 렌더한다', () => {
    render(<ReportEyebrow>PERSONAL COLOR REPORT</ReportEyebrow>);

    expect(screen.getByText('PERSONAL COLOR REPORT')).toBeInTheDocument();
  });

  it('소형 대문자 리포트 라벨 스타일을 적용한다', () => {
    render(<ReportEyebrow>SKIN REPORT</ReportEyebrow>);

    const el = screen.getByText('SKIN REPORT');
    expect(el).toHaveClass('uppercase', 'tracking-widest', 'text-muted-foreground');
  });

  it('className을 병합한다', () => {
    render(<ReportEyebrow className="mt-2">HAIR REPORT</ReportEyebrow>);

    expect(screen.getByText('HAIR REPORT')).toHaveClass('mt-2');
  });
});
