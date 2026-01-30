import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisResultCard } from '@/components/analysis/AnalysisResultCard';

// ARIA 알림 함수 모킹
vi.mock('@/lib/a11y/aria-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/a11y/aria-utils')>('@/lib/a11y/aria-utils');
  return {
    ...actual,
    announceAnalysisComplete: vi.fn(),
  };
});

describe('AnalysisResultCard', () => {
  describe('기본 렌더링', () => {
    it('should render children content', () => {
      render(
        <AnalysisResultCard>
          <p>분석 결과 내용</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('분석 결과 내용')).toBeInTheDocument();
    });

    it('should render with data-testid', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByTestId('analysis-result-card')).toBeInTheDocument();
    });

    it('should show AIBadge with default label', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByTestId('ai-badge')).toBeInTheDocument();
      expect(screen.getByText('AI 분석 결과')).toBeInTheDocument();
    });

    it('should show AITransparencyNotice by default', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(
        screen.getByTestId('ai-transparency-notice-compact')
      ).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <AnalysisResultCard className="custom-card-class">
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card).toHaveClass('custom-card-class');
    });
  });

  describe('분석 타입별 라벨', () => {
    it('should show skin analysis label', () => {
      render(
        <AnalysisResultCard analysisType="skin">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 피부 분석')).toBeInTheDocument();
    });

    it('should show personal-color analysis label', () => {
      render(
        <AnalysisResultCard analysisType="personal-color">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 퍼스널컬러 분석')).toBeInTheDocument();
    });

    it('should show body analysis label', () => {
      render(
        <AnalysisResultCard analysisType="body">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 체형 분석')).toBeInTheDocument();
    });

    it('should show hair analysis label', () => {
      render(
        <AnalysisResultCard analysisType="hair">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 헤어 분석')).toBeInTheDocument();
    });

    it('should show makeup analysis label', () => {
      render(
        <AnalysisResultCard analysisType="makeup">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 메이크업 분석')).toBeInTheDocument();
    });

    it('should show nutrition analysis label', () => {
      render(
        <AnalysisResultCard analysisType="nutrition">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 영양 분석')).toBeInTheDocument();
    });

    it('should show workout analysis label', () => {
      render(
        <AnalysisResultCard analysisType="workout">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('AI 운동 분석')).toBeInTheDocument();
    });
  });

  describe('Mock 데이터 표시', () => {
    it('should show MockDataNotice when usedMock is true', () => {
      render(
        <AnalysisResultCard usedMock>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByTestId('mock-data-notice')).toBeInTheDocument();
    });

    it('should not show MockDataNotice when usedMock is false', () => {
      render(
        <AnalysisResultCard usedMock={false}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.queryByTestId('mock-data-notice')).not.toBeInTheDocument();
    });

    it('should have data-used-mock attribute', () => {
      render(
        <AnalysisResultCard usedMock>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card).toHaveAttribute('data-used-mock', 'true');
    });

    it('should show fallback description in AIBadge when usedMock', () => {
      render(
        <AnalysisResultCard usedMock>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const badge = screen.getByTestId('ai-badge');
      expect(badge).toHaveAttribute(
        'title',
        '이 결과는 AI 서비스 불가로 샘플 데이터입니다'
      );
    });
  });

  describe('신뢰도 표시', () => {
    it('should show confidence badge when provided', () => {
      render(
        <AnalysisResultCard confidence={85}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('신뢰도 85%')).toBeInTheDocument();
    });

    it('should show green styling for high confidence (>=80)', () => {
      render(
        <AnalysisResultCard confidence={85}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const confidenceBadge = screen.getByText('신뢰도 85%');
      expect(confidenceBadge).toHaveClass('bg-green-100');
      expect(confidenceBadge).toHaveClass('text-green-700');
    });

    it('should show yellow styling for medium confidence (60-79)', () => {
      render(
        <AnalysisResultCard confidence={70}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const confidenceBadge = screen.getByText('신뢰도 70%');
      expect(confidenceBadge).toHaveClass('bg-yellow-100');
      expect(confidenceBadge).toHaveClass('text-yellow-700');
    });

    it('should show red styling for low confidence (<60)', () => {
      render(
        <AnalysisResultCard confidence={45}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const confidenceBadge = screen.getByText('신뢰도 45%');
      expect(confidenceBadge).toHaveClass('bg-red-100');
      expect(confidenceBadge).toHaveClass('text-red-700');
    });

    it('should not show confidence badge when usedMock is true', () => {
      render(
        <AnalysisResultCard usedMock confidence={85}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.queryByText('신뢰도 85%')).not.toBeInTheDocument();
    });

    it('should not show confidence badge when not provided', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.queryByText(/신뢰도/)).not.toBeInTheDocument();
    });
  });

  describe('제목 표시', () => {
    it('should show title when provided', () => {
      render(
        <AnalysisResultCard title="피부 분석 결과">
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(screen.getByText('피부 분석 결과')).toBeInTheDocument();
    });

    it('should not show title when not provided', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card.querySelector('h2')).toBeNull();
    });
  });

  describe('투명성 고지 제어', () => {
    it('should show disclaimer by default', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(
        screen.getByTestId('ai-transparency-notice-compact')
      ).toBeInTheDocument();
    });

    it('should hide disclaimer when showDisclaimer is false', () => {
      render(
        <AnalysisResultCard showDisclaimer={false}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      expect(
        screen.queryByTestId('ai-transparency-notice-compact')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('ai-transparency-notice')
      ).not.toBeInTheDocument();
    });
  });

  describe('ARIA 접근성', () => {
    it('should have role article', () => {
      render(
        <AnalysisResultCard analysisType="skin">
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card.tagName.toLowerCase()).toBe('article');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should have aria-label when no title', () => {
      render(
        <AnalysisResultCard analysisType="personal-color">
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card).toHaveAttribute('aria-label', 'AI 퍼스널컬러 분석');
    });

    it('should have aria-labelledby when title exists', () => {
      render(
        <AnalysisResultCard analysisType="skin" title="피부 분석 결과">
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card).toHaveAttribute('aria-labelledby');

      // 제목 ID와 연결 확인
      const labelledbyId = card.getAttribute('aria-labelledby');
      const title = screen.getByText('피부 분석 결과');
      expect(title).toHaveAttribute('id', labelledbyId);
    });

    it('should have header and section elements', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card.querySelector('header')).toBeInTheDocument();
      expect(card.querySelector('section')).toBeInTheDocument();
    });

    it('should have section with aria-label for content', () => {
      render(
        <AnalysisResultCard>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const section = screen.getByTestId('analysis-result-card').querySelector('section');
      expect(section).toHaveAttribute('aria-label', '분석 결과 상세');
    });

    it('should have data-analysis-type attribute', () => {
      render(
        <AnalysisResultCard analysisType="hair">
          <p>Content</p>
        </AnalysisResultCard>
      );

      const card = screen.getByTestId('analysis-result-card');
      expect(card).toHaveAttribute('data-analysis-type', 'hair');
    });

    it('should have aria-label on confidence badge', () => {
      render(
        <AnalysisResultCard confidence={85}>
          <p>Content</p>
        </AnalysisResultCard>
      );

      const confidenceBadge = screen.getByText('신뢰도 85%');
      expect(confidenceBadge).toHaveAttribute('aria-label');
      expect(confidenceBadge.getAttribute('aria-label')).toContain('높습니다');
    });
  });
});
