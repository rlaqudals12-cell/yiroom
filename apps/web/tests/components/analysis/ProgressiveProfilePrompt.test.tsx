import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProgressiveProfilePrompt } from '@/components/analysis/ProgressiveProfilePrompt';

describe('ProgressiveProfilePrompt', () => {
  describe('렌더링', () => {
    it('지원되는 모듈에서 프롬프트를 렌더링한다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      expect(screen.getByTestId('progressive-profile-prompt')).toBeInTheDocument();
      expect(screen.getByText('더 정확한 결과를 원하시나요?')).toBeInTheDocument();
    });

    it('지원되지 않는 모듈에서는 null을 반환한다', () => {
      const { container } = render(<ProgressiveProfilePrompt moduleId="unknown-module" />);
      expect(container.firstChild).toBeNull();
    });

    it('현재 신뢰도를 표시한다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" currentConfidence={78} />);
      expect(screen.getByText(/현재 78%/)).toBeInTheDocument();
    });

    it('접힌 상태에서 필드가 보이지 않는다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      expect(screen.queryByText('주요 피부 고민')).not.toBeInTheDocument();
    });
  });

  describe('인터랙션', () => {
    it('클릭하면 필드가 펼쳐진다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('주요 피부 고민')).toBeInTheDocument();
    });

    it('select 옵션을 선택할 수 있다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      const blueButton = screen.getByText('파란색/보라색');
      fireEvent.click(blueButton);
      expect(blueButton.className).toContain('pink-500');
    });

    it('multiselect에서 여러 옵션을 선택할 수 있다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      fireEvent.click(screen.getByText('여드름/트러블'));
      fireEvent.click(screen.getByText('건조함/당김'));
      expect(screen.getByText('여드름/트러블').className).toContain('pink-500');
      expect(screen.getByText('건조함/당김').className).toContain('pink-500');
    });

    it('정보 저장 후 감사 메시지를 표시한다', async () => {
      const onSubmit = vi.fn();
      // fetch mock (handleSubmit에서 API 호출)
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      render(<ProgressiveProfilePrompt moduleId="personal-color" onSubmit={onSubmit} />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      fireEvent.click(screen.getByText('파란색/보라색'));
      fireEvent.click(screen.getByText('정보 저장하기'));
      await waitFor(() => {
        expect(screen.getByTestId('progressive-profile-thanks')).toBeInTheDocument();
      });
      expect(onSubmit).toHaveBeenCalledWith({ veinColor: 'blue' });
    });

    it('선택 없으면 저장 버튼이 비활성화된다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      const submitButton = screen.getByText('정보 저장하기');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('모듈별 필드', () => {
    it('personal-color 모듈은 혈관 색상 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('손목 혈관 색상')).toBeInTheDocument();
    });

    it('skin 모듈은 피부 고민 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('주요 피부 고민')).toBeInTheDocument();
    });

    it('body 모듈은 건강 상태 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="body" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('건강 상태 (선택)')).toBeInTheDocument();
    });

    it('nutrition 모듈은 건강 상태 + 영양제 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="nutrition" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('건강 상태 (선택)')).toBeInTheDocument();
      expect(screen.getByText('복용 중인 영양제')).toBeInTheDocument();
    });

    it('hair 모듈은 시술 이력 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="hair" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('최근 시술 이력')).toBeInTheDocument();
    });
  });

  describe('정확도 부스트 표시', () => {
    it('각 필드에 정확도 부스트가 표시된다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('더 정확한 결과를 원하시나요?'));
      expect(screen.getByText('+10-15% 정확도')).toBeInTheDocument();
    });
  });
});
