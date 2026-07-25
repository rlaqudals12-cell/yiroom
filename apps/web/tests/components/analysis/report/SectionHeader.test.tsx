/**
 * SectionHeader 테스트 — 러닝넘버 섹션 헤더 프리미티브
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from '@/components/analysis/report';

describe('SectionHeader', () => {
  it('러닝넘버를 01 형태로 패딩해 렌더한다', () => {
    render(<SectionHeader no={1} title="진단 속성" />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('진단 속성')).toBeInTheDocument();
  });

  it('두 자리 번호는 그대로 렌더한다', () => {
    render(<SectionHeader no={12} title="추천 제품" />);

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('제목을 h2 헤딩으로 렌더한다', () => {
    render(<SectionHeader no={2} title="컬러 팔레트" />);

    expect(screen.getByRole('heading', { level: 2, name: '컬러 팔레트' })).toBeInTheDocument();
  });

  it('러닝넘버는 장식이므로 스크린리더에서 숨긴다', () => {
    render(<SectionHeader no={3} title="스타일 가이드" />);

    expect(screen.getByText('03')).toHaveAttribute('aria-hidden', 'true');
  });
});
