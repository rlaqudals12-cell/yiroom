/**
 * ActiveDailyInsight 컴포넌트 테스트
 *
 * P-UX3: 시간대 + 분석결과 기반 개인화 한 줄 제안
 * 8블록 시간대 + 분석 데이터 조합으로 다양한 메시지 생성 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActiveDailyInsight from '@/app/(main)/home/_components/ActiveDailyInsight';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

// 테스트용 AnalysisSummary 팩토리
function mockAnalysis(
  overrides: Partial<AnalysisSummary> & Pick<AnalysisSummary, 'type'>
): AnalysisSummary {
  return {
    id: `test-${overrides.type}`,
    createdAt: new Date('2026-03-15'),
    summary: '',
    ...overrides,
  };
}

// lucide-react 아이콘 mock
vi.mock('lucide-react', () => ({
  Sparkles: () => <svg data-testid="sparkles-icon" />,
}));

describe('ActiveDailyInsight', () => {
  beforeEach(() => {
    // 기본: 2026년 3월 15일 오전 9시 (morning 블록)
    vi.setSystemTime(new Date(2026, 2, 15, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<ActiveDailyInsight analyses={[]} />);
      expect(screen.getByTestId('home-active-daily-insight')).toBeInTheDocument();
    });

    it('aria-live="polite" 접근성 속성이 있다', () => {
      render(<ActiveDailyInsight analyses={[]} />);
      const container = screen.getByTestId('home-active-daily-insight');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('빈 분석 배열', () => {
    it('분석 데이터 없이 기본 메시지를 표시한다', () => {
      render(<ActiveDailyInsight analyses={[]} />);
      // morning 블록 기본 메시지 중 하나
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const morningMessages = ['자외선 차단 잊지 마세요!', '아침 식사로 피부에 영양을 공급해요'];
      expect(morningMessages.some((msg) => text?.includes(msg))).toBe(true);
    });

    it('0개 분석 기반 맞춤 제안 자막을 표시한다', () => {
      render(<ActiveDailyInsight analyses={[]} />);
      expect(screen.getByText('0개 분석 기반 맞춤 제안')).toBeInTheDocument();
    });
  });

  describe('분석 개수 자막', () => {
    it('분석 개수가 자막에 올바르게 표시된다', () => {
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'personal-color', summary: '봄 웜' }),
        mockAnalysis({ type: 'skin', skinScore: 45 }),
        mockAnalysis({ type: 'body' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(screen.getByText('3개 분석 기반 맞춤 제안')).toBeInTheDocument();
    });
  });

  describe('피부 점수 기반 메시지', () => {
    it('skinScore < 50이고 morning 블록일 때 건조 피부 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 9, 0, 0)); // morning
      const analyses: AnalysisSummary[] = [mockAnalysis({ type: 'skin', skinScore: 40 })];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(screen.getByText('피부가 건조해요. 보습에 집중해주세요')).toBeInTheDocument();
    });

    it('skinScore < 50이고 afternoon 블록일 때 미스트 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 15, 0, 0)); // afternoon
      const analyses: AnalysisSummary[] = [mockAnalysis({ type: 'skin', skinScore: 30 })];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(screen.getByText('오후에는 미스트로 수분을 보충해주세요')).toBeInTheDocument();
    });

    it('skinScore < 50이고 evening 블록일 때 마스크팩 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 20, 0, 0)); // evening
      const analyses: AnalysisSummary[] = [mockAnalysis({ type: 'skin', skinScore: 25 })];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(screen.getByText('집중 보습 마스크팩으로 피부를 달래주세요')).toBeInTheDocument();
    });

    it('skinScore >= 85이고 morning 블록일 때 좋은 컨디션 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0)); // morning
      const analyses: AnalysisSummary[] = [mockAnalysis({ type: 'skin', skinScore: 90 })];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(
        screen.getByText('피부 컨디션이 좋아요! 오늘의 메이크업을 즐겨보세요')
      ).toBeInTheDocument();
    });
  });

  describe('퍼스널컬러 기반 메시지', () => {
    it('morning 블록에서 시즌 메이크업 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0)); // morning
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'personal-color', summary: '봄 웜' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(
        screen.getByText('봄 웜에 어울리는 오늘의 메이크업을 확인해보세요')
      ).toBeInTheDocument();
    });

    it('early_morning 블록에서도 시즌 메이크업 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 7, 0, 0)); // early_morning
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'personal-color', summary: '가을 뮤트' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(
        screen.getByText('가을 뮤트에 어울리는 오늘의 메이크업을 확인해보세요')
      ).toBeInTheDocument();
    });

    it('afternoon 블록에서 터치업 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 15, 0, 0)); // afternoon
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'personal-color', summary: '여름 쿨' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(
        screen.getByText('여름 쿨 톤에 맞는 오후 터치업 팁을 확인해보세요')
      ).toBeInTheDocument();
    });
  });

  describe('우선순위 처리', () => {
    it('피부 점수 메시지가 퍼스널컬러보다 우선한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0)); // morning
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'skin', skinScore: 40 }),
        mockAnalysis({ type: 'personal-color', summary: '봄 웜' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      // 피부 점수 < 50, morning 블록 → 피부 메시지 우선
      expect(screen.getByText('피부가 건조해요. 보습에 집중해주세요')).toBeInTheDocument();
    });

    it('피부 점수에 해당 시간대 메시지 없으면 퍼스널컬러 메시지로 폴백한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 15, 0, 0)); // afternoon
      // skinScore 70~84 범위: afternoon에 해당하는 메시지 없음 → null
      // 하지만 < 70이면 afternoon에 미스트 메시지가 있음
      // 75점은 70~84 구간이고 afternoon 메시지 없음 → 퍼스널컬러로 폴백
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'skin', skinScore: 75 }),
        mockAnalysis({ type: 'personal-color', summary: '겨울 딥' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      expect(
        screen.getByText('겨울 딥 톤에 맞는 오후 터치업 팁을 확인해보세요')
      ).toBeInTheDocument();
    });
  });

  describe('시간대별 기본 메시지', () => {
    it('late_night 블록(새벽 1시)에 수면 관련 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 1, 0, 0)); // late_night
      render(<ActiveDailyInsight analyses={[]} />);
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const lateNightMessages = [
        '충분한 수면이 최고의 스킨케어예요',
        '잠들기 전 수분크림을 한 번 더 발라보세요',
      ];
      expect(lateNightMessages.some((msg) => text?.includes(msg))).toBe(true);
    });

    it('dawn 블록(새벽 4시)에 새벽 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 4, 0, 0)); // dawn
      render(<ActiveDailyInsight analyses={[]} />);
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const dawnMessages = [
        '이른 아침, 하루를 위한 준비를 시작해요',
        '새벽 공기처럼 맑은 피부를 위해 세안부터!',
      ];
      expect(dawnMessages.some((msg) => text?.includes(msg))).toBe(true);
    });

    it('lunch 블록(오후 1시)에 점심 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 13, 0, 0)); // lunch
      render(<ActiveDailyInsight analyses={[]} />);
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const lunchMessages = ['점심 식사 후 가벼운 산책은 어떨까요?', '수분 섭취를 잊지 마세요!'];
      expect(lunchMessages.some((msg) => text?.includes(msg))).toBe(true);
    });

    it('night 블록(밤 10시)에 나이트 케어 메시지를 표시한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 22, 0, 0)); // night
      render(<ActiveDailyInsight analyses={[]} />);
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const nightMessages = [
        '오늘 하루도 수고했어요. 나이트 케어를 시작해요',
        '수면 전 보습이 내일의 피부를 결정해요',
      ];
      expect(nightMessages.some((msg) => text?.includes(msg))).toBe(true);
    });
  });

  describe('피부/컬러 데이터에 해당 시간대 메시지가 없을 때', () => {
    it('late_night에 skinScore가 있어도 기본 메시지로 폴백한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 1, 0, 0)); // late_night
      // skinScore < 50이지만 late_night에 해당 메시지 없음
      const analyses: AnalysisSummary[] = [mockAnalysis({ type: 'skin', skinScore: 40 })];
      render(<ActiveDailyInsight analyses={analyses} />);
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const lateNightMessages = [
        '충분한 수면이 최고의 스킨케어예요',
        '잠들기 전 수분크림을 한 번 더 발라보세요',
      ];
      expect(lateNightMessages.some((msg) => text?.includes(msg))).toBe(true);
    });

    it('night에 퍼스널컬러만 있으면 기본 메시지로 폴백한다', () => {
      vi.setSystemTime(new Date(2026, 2, 15, 22, 0, 0)); // night
      // getSeasonMessage는 night 블록에 null 반환
      const analyses: AnalysisSummary[] = [
        mockAnalysis({ type: 'personal-color', summary: '봄 웜' }),
      ];
      render(<ActiveDailyInsight analyses={analyses} />);
      const text = screen.getByTestId('home-active-daily-insight').textContent;
      const nightMessages = [
        '오늘 하루도 수고했어요. 나이트 케어를 시작해요',
        '수면 전 보습이 내일의 피부를 결정해요',
      ];
      expect(nightMessages.some((msg) => text?.includes(msg))).toBe(true);
    });
  });
});
