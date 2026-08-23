import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    Camera: createMockIcon('Camera'),
    FileImage: createMockIcon('FileImage'),
    Shield: createMockIcon('Shield'),
    ExternalLink: createMockIcon('ExternalLink'),
    Loader2: createMockIcon('Loader2'),
  };
});

import { ImageConsentModal } from '@/components/analysis/consent/ImageConsentModal';

describe('ImageConsentModal', () => {
  const defaultProps = {
    isOpen: true,
    onConsent: vi.fn(),
    onSkip: vi.fn(),
    analysisType: 'skin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('정상 케이스', () => {
    it('모달이 올바르게 렌더링된다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      expect(screen.getByTestId('image-consent-modal')).toBeInTheDocument();
      expect(screen.getByText('피부 분석 사진을 저장할까요?')).toBeInTheDocument();
    });

    it('피부 분석 타입에 맞는 라벨을 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} analysisType="skin" />);

      expect(screen.getByText('피부 분석 사진을 저장할까요?')).toBeInTheDocument();
    });

    it('체형 분석 타입에 맞는 라벨을 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} analysisType="body" />);

      expect(screen.getByText('체형 분석 사진을 저장할까요?')).toBeInTheDocument();
    });

    it('혜택 목록을 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      expect(
        screen.getByText('피부 분석에 사용한 사진을 분석 기록과 함께 저장해요')
      ).toBeInTheDocument();
      expect(
        screen.getByText('저장된 사진은 해당 분석 결과에서 다시 확인할 수 있어요')
      ).toBeInTheDocument();
      expect(screen.getByText('저장하지 않아도 이번 분석은 그대로 진행돼요')).toBeInTheDocument();
    });

    it('저장 정보를 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      expect(screen.getByText(/저장 기간:/)).toBeInTheDocument();
      expect(screen.getByText(/동의일로부터 최대 1년/)).toBeInTheDocument();
      expect(screen.getByText(/저장 위치:/)).toBeInTheDocument();
      expect(screen.getByText(/암호화된 비공개 클라우드/)).toBeInTheDocument();
      expect(screen.getByText(/동의 철회·삭제 요청 시 저장 사진 파기/)).toBeInTheDocument();
    });

    it('동의 버전을 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} consentVersion="v1.0" />);

      expect(screen.getByText(/동의서 버전: v1\.0/)).toBeInTheDocument();
    });

    it('개인정보처리방침 링크를 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      const privacyLink = screen.getByRole('link', {
        name: /자세한 개인정보처리방침 보기/,
      });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('버튼 동작', () => {
    it('저장하기 버튼 클릭 시 onConsent 콜백을 호출한다', () => {
      const onConsent = vi.fn();
      render(<ImageConsentModal {...defaultProps} onConsent={onConsent} />);

      const consentButton = screen.getByTestId('consent-agree-button');
      fireEvent.click(consentButton);

      expect(onConsent).toHaveBeenCalledTimes(1);
    });

    it('건너뛰기 버튼 클릭 시 onSkip 콜백을 호출한다', () => {
      const onSkip = vi.fn();
      render(<ImageConsentModal {...defaultProps} onSkip={onSkip} />);

      const skipButton = screen.getByTestId('consent-skip-button');
      fireEvent.click(skipButton);

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('동의와 건너뛰기 버튼을 같은 시각 위계로 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      const consentButton = screen.getByTestId('consent-agree-button');
      const skipButton = screen.getByTestId('consent-skip-button');

      expect(consentButton).toHaveClass('flex-1');
      expect(skipButton).toHaveClass('flex-1');
      expect(consentButton.className).toBe(skipButton.className);
    });

    it('로딩 중일 때 버튼들이 비활성화된다', () => {
      render(<ImageConsentModal {...defaultProps} isLoading={true} />);

      const consentButton = screen.getByTestId('consent-agree-button');
      const skipButton = screen.getByTestId('consent-skip-button');

      expect(consentButton).toBeDisabled();
      expect(skipButton).toBeDisabled();
    });

    it('로딩 중일 때 Loader 아이콘을 표시한다', () => {
      render(<ImageConsentModal {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('모달 상태', () => {
    it('isOpen이 false일 때 모달이 표시되지 않는다', () => {
      render(<ImageConsentModal {...defaultProps} isOpen={false} />);

      // Dialog가 닫힌 상태에서는 내용이 DOM에 없음
      expect(screen.queryByTestId('image-consent-modal')).not.toBeInTheDocument();
    });

    it('isOpen이 true일 때 모달이 표시된다', () => {
      render(<ImageConsentModal {...defaultProps} isOpen={true} />);

      expect(screen.getByTestId('image-consent-modal')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('Dialog에 적절한 ARIA 속성이 있다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      // DialogDescription이 sr-only로 존재
      expect(screen.getByText('피부 분석 사진 저장 동의 요청')).toBeInTheDocument();
    });

    it('닫기 버튼은 건너뛰기와 동일하게 처리한다', () => {
      const onSkip = vi.fn();
      render(<ImageConsentModal {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByRole('button', { name: '닫기' }));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('Escape로 닫으면 건너뛰기와 동일하게 처리한다', () => {
      const onSkip = vi.fn();
      render(<ImageConsentModal {...defaultProps} onSkip={onSkip} />);

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('모달 바깥을 누르면 건너뛰기와 동일하게 처리한다', async () => {
      const onSkip = vi.fn();
      render(<ImageConsentModal {...defaultProps} onSkip={onSkip} />);

      // Radix DismissableLayer는 마운트 직후 다음 태스크에서 바깥 pointer 리스너를 연결한다.
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.pointerDown(document.body, {
        button: 0,
        ctrlKey: false,
        pointerType: 'mouse',
      });
      fireEvent.click(document.body);

      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('엣지 케이스', () => {
    it('consentVersion이 없을 때 기본값을 사용한다', () => {
      render(<ImageConsentModal {...defaultProps} />);

      // 기본값 v1.0이 표시됨
      expect(screen.getByText(/동의서 버전: v1\.0/)).toBeInTheDocument();
    });

    it('모든 분석 타입에 대해 라벨을 표시한다', () => {
      const { rerender } = render(<ImageConsentModal {...defaultProps} analysisType="skin" />);
      expect(screen.getByText('피부 분석 사진을 저장할까요?')).toBeInTheDocument();

      rerender(<ImageConsentModal {...defaultProps} analysisType="body" />);
      expect(screen.getByText('체형 분석 사진을 저장할까요?')).toBeInTheDocument();

      rerender(<ImageConsentModal {...defaultProps} analysisType="personal-color" />);
      expect(screen.getByText('퍼스널 컬러 사진을 저장할까요?')).toBeInTheDocument();

      rerender(<ImageConsentModal {...defaultProps} analysisType="hair" />);
      expect(screen.getByText('헤어 분석 사진을 저장할까요?')).toBeInTheDocument();

      rerender(<ImageConsentModal {...defaultProps} analysisType="makeup" />);
      expect(screen.getByText('메이크업 분석 사진을 저장할까요?')).toBeInTheDocument();
    });
  });
});
