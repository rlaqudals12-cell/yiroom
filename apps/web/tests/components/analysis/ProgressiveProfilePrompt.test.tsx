import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProgressiveProfilePrompt } from '@/components/analysis/ProgressiveProfilePrompt';

describe('ProgressiveProfilePrompt', () => {
  describe('렌더링', () => {
    it('지원되는 모듈에서 프롬프트를 렌더링한다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      expect(screen.getByTestId('progressive-profile-prompt')).toBeInTheDocument();
      expect(screen.getByText('나에 대해 조금 더 알려주실래요?')).toBeInTheDocument();
    });

    it('지원되지 않는 모듈에서는 null을 반환한다', () => {
      const { container } = render(<ProgressiveProfilePrompt moduleId="unknown-module" />);
      expect(container.firstChild).toBeNull();
    });

    it('현재 신뢰도를 표시한다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" currentConfidence={78} />);
      expect(screen.getByText(/현재 분석 신뢰도 78%/)).toBeInTheDocument();
    });

    it('접힌 상태에서 필드가 보이지 않는다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      expect(screen.queryByText('주요 피부 고민')).not.toBeInTheDocument();
    });
  });

  describe('인터랙션', () => {
    it('클릭하면 필드가 펼쳐진다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.getByText('주요 피부 고민')).toBeInTheDocument();
    });

    it('select 옵션을 선택할 수 있다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      const blueButton = screen.getByText('파란색/보라색');
      fireEvent.click(blueButton);
      expect(blueButton.className).toContain('primary');
    });

    it('multiselect에서 여러 옵션을 선택할 수 있다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      fireEvent.click(screen.getByText('여드름/트러블'));
      fireEvent.click(screen.getByText('건조함/당김'));
      expect(screen.getByText('여드름/트러블').className).toContain('primary');
      expect(screen.getByText('건조함/당김').className).toContain('primary');
    });

    it('정보 저장 후 감사 메시지를 표시한다', async () => {
      const onSubmit = vi.fn();
      // fetch mock (handleSubmit에서 API 호출)
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      render(<ProgressiveProfilePrompt moduleId="personal-color" onSubmit={onSubmit} />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      fireEvent.click(screen.getByText('파란색/보라색'));
      fireEvent.click(screen.getByText('정보 저장하기'));
      await waitFor(() => {
        expect(screen.getByTestId('progressive-profile-thanks')).toBeInTheDocument();
      });
      expect(onSubmit).toHaveBeenCalledWith({ veinColor: 'blue' });
    });

    it('선택 없으면 저장 버튼이 비활성화된다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      const submitButton = screen.getByText('정보 저장하기');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('모듈별 필드', () => {
    it('personal-color 모듈은 혈관 색상 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.getByText('손목 혈관 색상')).toBeInTheDocument();
    });

    it('skin 모듈은 피부 고민 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.getByText('주요 피부 고민')).toBeInTheDocument();
    });

    it('body 모듈은 건강 상태 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="body" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.getByText('건강 상태 (선택)')).toBeInTheDocument();
    });

    it('nutrition 모듈은 건강 상태 + 영양제 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="nutrition" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.getByText('건강 상태 (선택)')).toBeInTheDocument();
      expect(screen.getByText('복용 중인 영양제')).toBeInTheDocument();
    });

    it('hair 모듈은 시술 이력 필드를 가진다', () => {
      render(<ProgressiveProfilePrompt moduleId="hair" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.getByText('최근 시술 이력')).toBeInTheDocument();
    });
  });

  // 정직성 계약 — progressive_data를 읽는 분석 경로가 0건이므로
  // "정확도 +N%" / "다음 분석부터 더 정확" 같은 약속을 노출하지 않는다 (2026-08 수리).
  describe('지키지 못할 약속 부재 (정직성)', () => {
    it('필드에 "+N% 정확도" 부스트 배지를 표시하지 않는다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      expect(screen.queryByText('+10-15% 정확도')).not.toBeInTheDocument();
      expect(screen.queryByText(/\+\d+%/)).not.toBeInTheDocument();
    });

    it('헤더가 정확도 향상을 약속하지 않는다', () => {
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      expect(screen.queryByText(/분석 정확도가 올라갑니다/)).not.toBeInTheDocument();
      expect(screen.getByText(/다음 개선에 참고돼요/)).toBeInTheDocument();
    });

    it('신뢰도는 약속이 아니라 현재 값으로만 표기된다', () => {
      render(<ProgressiveProfilePrompt moduleId="skin" currentConfidence={78} />);
      expect(screen.getByText(/현재 분석 신뢰도 78%/)).toBeInTheDocument();
    });

    it('저장 완료 문구가 "다음 분석부터 더 정확"을 약속하지 않는다', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      render(<ProgressiveProfilePrompt moduleId="personal-color" />);
      fireEvent.click(screen.getByText('나에 대해 조금 더 알려주실래요?'));
      fireEvent.click(screen.getByText('파란색/보라색'));
      fireEvent.click(screen.getByText('정보 저장하기'));
      await waitFor(() => {
        expect(screen.getByTestId('progressive-profile-thanks')).toBeInTheDocument();
      });
      expect(screen.queryByText(/다음 분석부터 더 정확한 결과/)).not.toBeInTheDocument();
      expect(screen.getByText(/다음 개선에 참고할게요/)).toBeInTheDocument();
    });
  });
});
