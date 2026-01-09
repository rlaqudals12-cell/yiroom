/**
 * LightingGuide.tsx 테스트
 * @description 조명 가이드 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LightingGuide } from '@/components/analysis/visual-report/LightingGuide';

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('LightingGuide', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      render(<LightingGuide />);
      expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
    });

    it('타이틀이 표시되어야 함', () => {
      render(<LightingGuide />);
      expect(screen.getByText('촬영 환경 체크')).toBeInTheDocument();
    });

    it('세 가지 체크 항목이 표시되어야 함', () => {
      render(<LightingGuide />);
      expect(screen.getByText(/밝기/)).toBeInTheDocument();
      expect(screen.getByText(/조명/)).toBeInTheDocument();
      expect(screen.getByText(/그림자/)).toBeInTheDocument();
    });
  });

  // ============================================
  // 밝기 상태 테스트
  // ============================================

  describe('밝기 상태', () => {
    it('brightness=ok일 때 "밝기 충분"이 표시되어야 함', () => {
      render(<LightingGuide brightness="ok" />);
      expect(screen.getByText('밝기 충분')).toBeInTheDocument();
    });

    it('brightness=low일 때 "밝기 부족"이 표시되어야 함', () => {
      render(<LightingGuide brightness="low" />);
      expect(screen.getByText('밝기 부족')).toBeInTheDocument();
    });

    it('brightness=high일 때 "밝기 과다"가 표시되어야 함', () => {
      render(<LightingGuide brightness="high" />);
      expect(screen.getByText('밝기 과다')).toBeInTheDocument();
    });
  });

  // ============================================
  // 균일성 상태 테스트
  // ============================================

  describe('균일성 상태', () => {
    it('uniformity=ok일 때 "균일한 조명"이 표시되어야 함', () => {
      render(<LightingGuide uniformity="ok" />);
      expect(screen.getByText('균일한 조명')).toBeInTheDocument();
    });

    it('uniformity=uneven일 때 "조명 불균일"이 표시되어야 함', () => {
      render(<LightingGuide uniformity="uneven" />);
      expect(screen.getByText('조명 불균일')).toBeInTheDocument();
    });
  });

  // ============================================
  // 그림자 상태 테스트
  // ============================================

  describe('그림자 상태', () => {
    it('hasShadow=false일 때 "그림자 없음"이 표시되어야 함', () => {
      render(<LightingGuide hasShadow={false} />);
      expect(screen.getByText('그림자 없음')).toBeInTheDocument();
    });

    it('hasShadow=true일 때 "그림자가 있어요"가 표시되어야 함', () => {
      render(<LightingGuide hasShadow={true} />);
      expect(screen.getByText('그림자가 있어요')).toBeInTheDocument();
    });
  });

  // ============================================
  // 권장 사항 테스트
  // ============================================

  describe('권장 사항', () => {
    it('모든 항목 통과 시 긍정적 메시지가 표시되어야 함', () => {
      render(<LightingGuide brightness="ok" uniformity="ok" hasShadow={false} />);
      expect(screen.getByText('촬영 환경이 좋아요!')).toBeInTheDocument();
    });

    it('일부 항목 실패 시 개선 권장 메시지가 표시되어야 함', () => {
      render(<LightingGuide brightness="low" uniformity="ok" hasShadow={false} />);
      expect(screen.getByText('창가로 이동하면 더 정확해요')).toBeInTheDocument();
    });

    it('커스텀 recommendation이 표시되어야 함', () => {
      render(<LightingGuide recommendation="커스텀 메시지입니다" />);
      expect(screen.getByText('커스텀 메시지입니다')).toBeInTheDocument();
    });
  });

  // ============================================
  // 스타일 테스트
  // ============================================

  describe('스타일', () => {
    it('모든 항목 통과 시 emerald 배경이 적용되어야 함', () => {
      render(<LightingGuide brightness="ok" uniformity="ok" hasShadow={false} />);
      const card = screen.getByTestId('lighting-guide');
      expect(card).toHaveClass('bg-emerald-50');
    });

    it('일부 항목 실패 시 amber 배경이 적용되어야 함', () => {
      render(<LightingGuide brightness="low" />);
      const card = screen.getByTestId('lighting-guide');
      expect(card).toHaveClass('bg-amber-50');
    });

    it('className이 적용되어야 함', () => {
      render(<LightingGuide className="custom-class" />);
      const card = screen.getByTestId('lighting-guide');
      expect(card).toHaveClass('custom-class');
    });
  });
});
