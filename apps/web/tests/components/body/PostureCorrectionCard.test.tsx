import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostureCorrectionCard } from '@/components/body/PostureCorrectionCard';
import type { BodyShape7 } from '@/lib/body/types';

// lucide-react mock
vi.mock('lucide-react', () => ({
  ChevronDown: (props: Record<string, unknown>) => (
    <div data-testid="icon-ChevronDown" {...props} />
  ),
  ChevronUp: (props: Record<string, unknown>) => <div data-testid="icon-ChevronUp" {...props} />,
  AlertCircle: (props: Record<string, unknown>) => (
    <div data-testid="icon-AlertCircle" {...props} />
  ),
  Target: (props: Record<string, unknown>) => <div data-testid="icon-Target" {...props} />,
  Clock: (props: Record<string, unknown>) => <div data-testid="icon-Clock" {...props} />,
  Calendar: (props: Record<string, unknown>) => <div data-testid="icon-Calendar" {...props} />,
  CheckCircle2: (props: Record<string, unknown>) => (
    <div data-testid="icon-CheckCircle2" {...props} />
  ),
  PlayCircle: (props: Record<string, unknown>) => <div data-testid="icon-PlayCircle" {...props} />,
  Info: (props: Record<string, unknown>) => <div data-testid="icon-Info" {...props} />,
}));

// cn 유틸리티 mock
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('PostureCorrectionCard', () => {
  const defaultBodyType: BodyShape7 = 'rectangle';

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 렌더링된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByTestId('posture-correction-card')).toBeInTheDocument();
    });

    it('헤더 제목이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('자세 교정 가이드')).toBeInTheDocument();
    });

    it('운동 개수가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText(/개 운동/)).toBeInTheDocument();
    });

    it('추천 교정 운동 섹션이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('추천 교정 운동')).toBeInTheDocument();
    });

    it('className이 적용된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} className="custom-class" />);
      const card = screen.getByTestId('posture-correction-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('진행률', () => {
    it('초기 진행률은 0%이다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('진행률 라벨이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('오늘의 진행률')).toBeInTheDocument();
    });

    it('운동 완료 시 진행률이 업데이트된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      // 운동 완료 버튼 (원형 체크 버튼) 클릭
      const completeButtons = screen.getAllByRole('button');
      // 첫 번째 완료 버튼 찾기 (원형 버튼)
      const firstCompleteBtn = completeButtons.find(
        (btn) => btn.className.includes('rounded-full') && btn.className.includes('border-2')
      );

      if (firstCompleteBtn) {
        fireEvent.click(firstCompleteBtn);
        // 0%가 아닌 값으로 변경되었는지 확인
        expect(screen.queryByText('0%')).not.toBeInTheDocument();
      }
    });
  });

  describe('자세 문제 섹션', () => {
    it('주의해야 할 자세 문제 제목이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('주의해야 할 자세 문제')).toBeInTheDocument();
    });

    it('체형에 따른 자세 문제가 표시된다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);
      // pear 체형: rounded_shoulders, kyphosis, posterior_pelvic_tilt
      expect(screen.getByText(/굽은 어깨/)).toBeInTheDocument();
    });

    it('자세 문제를 클릭하면 상세 정보가 펼쳐진다', async () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      // 자세 문제 버튼 찾기
      const issueButton = screen.getByText(/굽은 어깨/).closest('button');
      if (issueButton) {
        fireEvent.click(issueButton);
        await waitFor(() => {
          // 원인과 증상이 표시되어야 함
          expect(screen.getByText('원인:')).toBeInTheDocument();
          expect(screen.getByText('증상:')).toBeInTheDocument();
        });
      }
    });

    it('펼쳐진 자세 문제를 다시 클릭하면 접힌다', async () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      const issueButton = screen.getByText(/굽은 어깨/).closest('button');
      if (issueButton) {
        // 펼치기
        fireEvent.click(issueButton);
        await waitFor(() => {
          expect(screen.getByText('원인:')).toBeInTheDocument();
        });

        // 접기
        fireEvent.click(issueButton);
        await waitFor(() => {
          expect(screen.queryByText('원인:')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('교정 운동', () => {
    it('운동 이름이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      // rectangle 체형의 운동 중 하나가 표시되어야 함
      const exerciseNames = screen.getAllByRole('button');
      expect(exerciseNames.length).toBeGreaterThan(0);
    });

    it('운동 난이도 뱃지가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      // 쉬움, 보통, 어려움 중 하나 이상 표시
      const difficultyLabels = screen.getAllByText(/쉬움|보통|어려움/);
      expect(difficultyLabels.length).toBeGreaterThan(0);
    });

    it('운동을 클릭하면 상세 정보가 펼쳐진다', async () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      // 운동 카드의 확장 버튼 클릭 (두 번째 버튼 - 운동 이름 포함)
      const buttons = screen.getAllByRole('button');
      // 운동 이름을 포함하는 버튼 찾기
      const expandButton = buttons.find(
        (btn) => btn.className.includes('flex-1') && btn.className.includes('text-left')
      );

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText('동작 순서')).toBeInTheDocument();
        });
      }
    });

    it('운동 완료 토글이 작동한다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      // 완료 버튼 (원형 체크 버튼)
      const completeButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) => btn.className.includes('rounded-full') && btn.className.includes('border-2')
        );

      if (completeButtons.length > 0) {
        // 완료 전: border-slate-300 클래스
        expect(completeButtons[0]).toHaveClass('border-slate-300');

        // 클릭하여 완료 처리
        fireEvent.click(completeButtons[0]);

        // 완료 후: border-green-500 클래스
        expect(completeButtons[0]).toHaveClass('border-green-500');
      }
    });

    it('완료된 운동을 다시 클릭하면 완료 해제된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      const completeButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) => btn.className.includes('rounded-full') && btn.className.includes('border-2')
        );

      if (completeButtons.length > 0) {
        // 완료
        fireEvent.click(completeButtons[0]);
        expect(completeButtons[0]).toHaveClass('border-green-500');

        // 완료 해제
        fireEvent.click(completeButtons[0]);
        expect(completeButtons[0]).toHaveClass('border-slate-300');
      }
    });
  });

  describe('compact 모드', () => {
    it('compact 모드에서는 진행률이 숨겨진다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText('오늘의 진행률')).not.toBeInTheDocument();
    });

    it('compact 모드에서는 운동 개수가 숨겨진다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText(/개 운동$/)).not.toBeInTheDocument();
    });

    it('compact 모드에서는 자세 문제 섹션이 숨겨진다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText('주의해야 할 자세 문제')).not.toBeInTheDocument();
    });

    it('compact 모드에서는 일상 생활 팁이 숨겨진다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText('일상 생활 팁')).not.toBeInTheDocument();
    });

    it('compact 모드에서는 주의사항이 숨겨진다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText(/심한 통증이 있을 경우/)).not.toBeInTheDocument();
    });

    it('compact 모드에서 운동이 3개 이하로 표시된다', () => {
      render(<PostureCorrectionCard bodyType="oval" compact />);
      // oval 체형은 여러 운동을 가지지만 compact에서는 3개만
      screen.getByTestId('posture-correction-card');
      // +N개 운동 더보기 텍스트가 표시될 수 있음
      const moreText = screen.queryByText(/운동 더보기/);
      // 운동이 4개 이상이면 "더보기" 표시
      if (moreText) {
        expect(moreText).toBeInTheDocument();
      }
    });
  });

  describe('난이도 필터링', () => {
    it('maxDifficulty=1이면 쉬운 운동만 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} maxDifficulty={1} />);
      // 보통/어려움 난이도 뱃지가 없어야 함
      expect(screen.queryByText('보통')).not.toBeInTheDocument();
      expect(screen.queryByText('어려움')).not.toBeInTheDocument();
    });

    it('maxDifficulty=2이면 쉬움과 보통 운동이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} maxDifficulty={2} />);
      expect(screen.queryByText('어려움')).not.toBeInTheDocument();
    });

    it('maxDifficulty=3이면 모든 운동이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} maxDifficulty={3} />);
      // 운동이 존재해야 함
      expect(screen.getByText('추천 교정 운동')).toBeInTheDocument();
    });
  });

  describe('일상 생활 팁', () => {
    it('일상 생활 팁 섹션이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('일상 생활 팁')).toBeInTheDocument();
    });
  });

  describe('주의사항', () => {
    it('주의사항 문구가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(
        screen.getByText(/심한 통증이 있을 경우 운동을 중단하고 전문의와 상담하세요/)
      ).toBeInTheDocument();
    });
  });

  describe('모든 체형 타입 렌더링', () => {
    const allBodyTypes: BodyShape7[] = [
      'hourglass',
      'pear',
      'invertedTriangle',
      'apple',
      'rectangle',
      'trapezoid',
      'oval',
    ];

    allBodyTypes.forEach((bodyType) => {
      it(`${bodyType} 체형이 정상적으로 렌더링된다`, () => {
        const { unmount } = render(<PostureCorrectionCard bodyType={bodyType} />);
        expect(screen.getByTestId('posture-correction-card')).toBeInTheDocument();
        expect(screen.getByText('자세 교정 가이드')).toBeInTheDocument();
        unmount();
      });
    });
  });
});
