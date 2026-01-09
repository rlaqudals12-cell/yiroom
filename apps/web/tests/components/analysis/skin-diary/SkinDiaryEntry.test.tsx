/**
 * SkinDiaryEntry 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkinDiaryEntry, type DiaryEntry } from '@/components/analysis/skin-diary';

describe('SkinDiaryEntry 컴포넌트', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const testDate = new Date('2026-01-09');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('날짜를 표시한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText(/2026년 1월 9일/)).toBeInTheDocument();
    });

    it('피부 컨디션 섹션을 표시한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('피부 컨디션')).toBeInTheDocument();
    });

    it('생활 요인 섹션을 표시한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('생활 요인')).toBeInTheDocument();
      expect(screen.getByText('수면 시간')).toBeInTheDocument();
      expect(screen.getByText('수면 품질')).toBeInTheDocument();
      expect(screen.getByText(/수분 섭취/)).toBeInTheDocument();
      expect(screen.getByText(/스트레스/)).toBeInTheDocument();
    });

    it('외부 요인 섹션을 표시한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('외부 요인')).toBeInTheDocument();
      expect(screen.getByText('오늘 날씨')).toBeInTheDocument();
      expect(screen.getByText(/야외 활동/)).toBeInTheDocument();
    });

    it('스킨케어 섹션을 표시한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('스킨케어')).toBeInTheDocument();
      expect(screen.getByText('아침 루틴 완료')).toBeInTheDocument();
      expect(screen.getByText('저녁 루틴 완료')).toBeInTheDocument();
      expect(screen.getByText('오늘 한 특별 케어')).toBeInTheDocument();
    });

    it('취소 및 저장 버튼을 표시한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /저장/ })).toBeInTheDocument();
    });
  });

  describe('피부 컨디션 선택', () => {
    it('이모지를 클릭하면 컨디션을 변경한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      // 매우 좋음 이모지 클릭
      const happyEmoji = screen.getByText('😊');
      fireEvent.click(happyEmoji);

      // 선택된 상태 표시 확인 (라벨)
      expect(screen.getByText('매우 좋음')).toBeInTheDocument();
    });
  });

  describe('날씨 선택', () => {
    it('날씨 버튼을 클릭하면 선택된다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const sunnyButton = screen.getByRole('button', { name: /맑음/ });
      fireEvent.click(sunnyButton);

      // 선택된 스타일 확인 (bg-primary 클래스 포함)
      expect(sunnyButton).toHaveClass('bg-primary');
    });
  });

  describe('특별 케어 선택', () => {
    it('특별 케어 뱃지를 클릭하면 토글된다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const maskBadge = screen.getByText('시트마스크');
      fireEvent.click(maskBadge);

      // 체크 아이콘이 나타나야 함
      expect(maskBadge.parentElement).toContainHTML('Check');
    });
  });

  describe('기존 엔트리 로드', () => {
    it('기존 데이터로 폼을 채운다', () => {
      const existingEntry: Partial<DiaryEntry> = {
        skinCondition: 5,
        conditionNotes: '오늘 피부가 좋아요',
        sleepHours: 8,
        sleepQuality: 5,
        waterIntakeMl: 2000,
        stressLevel: 1,
        weather: 'sunny',
        outdoorHours: 3,
        morningRoutineCompleted: true,
        eveningRoutineCompleted: true,
        specialTreatments: ['시트마스크', '필링'],
      };

      render(
        <SkinDiaryEntry
          date={testDate}
          existingEntry={existingEntry}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // 상태 라벨 확인
      expect(screen.getByText('매우 좋음')).toBeInTheDocument();

      // 메모 확인
      expect(screen.getByDisplayValue('오늘 피부가 좋아요')).toBeInTheDocument();

      // 수면 시간 확인
      expect(screen.getByText('8시간')).toBeInTheDocument();

      // 수분 섭취 확인
      expect(screen.getByText('2000ml')).toBeInTheDocument();
    });
  });

  describe('저장 기능', () => {
    it('저장 버튼 클릭 시 onSave를 호출한다', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByRole('button', { name: /저장/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      // 호출된 데이터 확인
      const savedEntry = mockOnSave.mock.calls[0][0] as DiaryEntry;
      expect(savedEntry.skinCondition).toBeDefined();
      expect(savedEntry.morningRoutineCompleted).toBeDefined();
      expect(savedEntry.eveningRoutineCompleted).toBeDefined();
      expect(savedEntry.specialTreatments).toBeDefined();
    });

    it('저장 중 버튼이 비활성화된다', () => {
      render(
        <SkinDiaryEntry
          date={testDate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isSaving={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /저장 중/ });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('취소 기능', () => {
    it('취소 버튼 클릭 시 onCancel을 호출한다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /취소/ });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성', () => {
    it('data-testid가 있다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByTestId('skin-diary-entry')).toBeInTheDocument();
    });

    it('스위치에 라벨이 연결되어 있다', () => {
      render(<SkinDiaryEntry date={testDate} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText('아침 루틴 완료')).toBeInTheDocument();
      expect(screen.getByLabelText('저녁 루틴 완료')).toBeInTheDocument();
    });
  });
});
