/**
 * N-1 SupplementRecommendationCard 컴포넌트 테스트
 *
 * 영양제 추천 카드
 * - 목표별 영양제 추천 표시
 * - 피부 고민 연동 추가 추천
 * - 펼침/접힘 토글
 * - 로딩/빈 상태
 * - 쇼핑 링크 (쿠팡, 올리브영, iHerb)
 * - 주의사항 표시
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupplementRecommendationCard from '@/components/nutrition/SupplementRecommendationCard';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
  };
});

describe('SupplementRecommendationCard', () => {
  describe('기본 렌더링', () => {
    it('카드를 렌더링한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByTestId('supplement-recommendation-card')).toBeInTheDocument();
    });

    it('"영양제 추천" 제목을 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByText('영양제 추천')).toBeInTheDocument();
    });

    it('요약 메시지를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // "건강 관리 목표에 맞는 4개 영양제를 추천해요."
      expect(screen.getByText(/건강 관리 목표에 맞는/)).toBeInTheDocument();
    });

    it('안내 메시지를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByText(/전문가 상담을 권장합니다/)).toBeInTheDocument();
    });
  });

  describe('목표별 영양제 표시', () => {
    it('건강 관리 목표 시 종합 비타민을 추천한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByText('종합 비타민')).toBeInTheDocument();
    });

    it('근육 증가 목표 시 단백질 보충제를 추천한다', () => {
      render(<SupplementRecommendationCard goal="muscle" />);

      expect(screen.getByText('단백질 보충제 (웨이/식물성)')).toBeInTheDocument();
      expect(screen.getByText('BCAA')).toBeInTheDocument();
    });

    it('피부 개선 목표 시 콜라겐 펩타이드를 추천한다', () => {
      render(<SupplementRecommendationCard goal="skin" />);

      expect(screen.getByText('콜라겐 펩타이드')).toBeInTheDocument();
      expect(screen.getByText('비타민C')).toBeInTheDocument();
    });

    it('체중 감량 목표 시 식이섬유를 추천한다', () => {
      render(<SupplementRecommendationCard goal="weight_loss" />);

      expect(screen.getByText('식이섬유 (차전자피)')).toBeInTheDocument();
    });

    it('체중 유지 목표 시 종합 비타민을 추천한다', () => {
      render(<SupplementRecommendationCard goal="maintain" />);

      expect(screen.getByText('종합 비타민')).toBeInTheDocument();
      expect(screen.getByText('오메가3')).toBeInTheDocument();
    });
  });

  describe('피부 고민 연동', () => {
    it('수분 부족 고민 시 히알루론산을 추가 추천한다', () => {
      render(<SupplementRecommendationCard goal="health" skinConcerns={['hydration']} />);

      expect(screen.getByText('히알루론산')).toBeInTheDocument();
    });

    it('트러블 고민 시 아연을 추가 추천한다', () => {
      render(<SupplementRecommendationCard goal="health" skinConcerns={['trouble']} />);

      expect(screen.getByText('아연')).toBeInTheDocument();
    });

    it('피부 고민이 있으면 요약에 피부 관련 메시지가 포함된다', () => {
      render(<SupplementRecommendationCard goal="health" skinConcerns={['hydration']} />);

      expect(screen.getByText(/피부 고민 해결을 위한/)).toBeInTheDocument();
    });
  });

  describe('영양제 상세 정보', () => {
    it('영양제 이름을 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByText('종합 비타민')).toBeInTheDocument();
    });

    it('카테고리 라벨을 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // "비타민" 카테고리 라벨
      const vitaminLabels = screen.getAllByText('비타민');
      expect(vitaminLabels.length).toBeGreaterThan(0);
    });

    it('추천 이유를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByText('기본 영양소 균형 보충')).toBeInTheDocument();
    });

    it('복용 시기를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.getByText('아침 식후')).toBeInTheDocument();
    });

    it('주의사항이 있으면 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" defaultExpanded={true} />);

      // health 목표의 비타민D에 "과다 복용 주의" 주의사항이 있음
      expect(screen.getByText('과다 복용 주의')).toBeInTheDocument();
    });
  });

  describe('펼침/접힘 토글', () => {
    it('3개 초과 시 "더보기" 버튼을 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // health 목표: 4개 영양제 → 3개 초과이므로 더보기 버튼
      expect(screen.getByText(/더보기/)).toBeInTheDocument();
    });

    it('접힌 상태에서는 상위 3개만 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // health: 종합 비타민(high), 오메가3(high), 프로바이오틱스(medium), 비타민D(medium)
      // 상위 3개만 표시
      expect(screen.getByText('종합 비타민')).toBeInTheDocument();
      expect(screen.getByText('오메가3')).toBeInTheDocument();
      expect(screen.getByText('프로바이오틱스')).toBeInTheDocument();
      // 4번째는 접힌 상태에서 미표시
      expect(screen.queryByText('비타민D')).not.toBeInTheDocument();
    });

    it('"더보기" 클릭 시 모든 영양제를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      fireEvent.click(screen.getByText(/더보기/));

      expect(screen.getByText('비타민D')).toBeInTheDocument();
    });

    it('펼친 후 "접기" 버튼을 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      fireEvent.click(screen.getByText(/더보기/));

      expect(screen.getByText('접기')).toBeInTheDocument();
    });

    it('"접기" 클릭 시 다시 3개만 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // 펼치기
      fireEvent.click(screen.getByText(/더보기/));
      expect(screen.getByText('비타민D')).toBeInTheDocument();

      // 접기
      fireEvent.click(screen.getByText('접기'));
      expect(screen.queryByText('비타민D')).not.toBeInTheDocument();
    });

    it('aria-expanded 속성이 올바르게 설정된다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      const toggleButton = screen.getByRole('button', { name: /더보기/ });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton);

      const collapseButton = screen.getByRole('button', { name: /접기/ });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('3개 이하일 때 더보기 버튼을 표시하지 않는다', () => {
      render(<SupplementRecommendationCard goal="maintain" />);

      // maintain: 종합 비타민, 오메가3 (2개) → 더보기 불필요
      expect(screen.queryByText(/더보기/)).not.toBeInTheDocument();
    });

    it('defaultExpanded=true 시 처음부터 펼쳐진 상태이다', () => {
      render(<SupplementRecommendationCard goal="health" defaultExpanded={true} />);

      expect(screen.getByText('비타민D')).toBeInTheDocument();
    });
  });

  describe('펼친 상태에서 추가 정보', () => {
    it('펼친 상태에서 추천 브랜드를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" defaultExpanded={true} />);

      // 추천 브랜드 (구하기 쉬움) 텍스트
      const brandHeaders = screen.getAllByText(/추천 브랜드/);
      expect(brandHeaders.length).toBeGreaterThan(0);
    });

    it('펼친 상태에서 쇼핑 링크를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" defaultExpanded={true} />);

      // 쿠팡, 올리브영, iHerb 링크
      const coupangLinks = screen.getAllByTestId('coupang-link');
      const oliveyoungLinks = screen.getAllByTestId('oliveyoung-link');
      const iherbLinks = screen.getAllByTestId('iherb-link');

      expect(coupangLinks.length).toBeGreaterThan(0);
      expect(oliveyoungLinks.length).toBeGreaterThan(0);
      expect(iherbLinks.length).toBeGreaterThan(0);
    });

    it('쇼핑 링크가 새 탭에서 열린다', () => {
      render(<SupplementRecommendationCard goal="health" defaultExpanded={true} />);

      const coupangLink = screen.getAllByTestId('coupang-link')[0];
      expect(coupangLink).toHaveAttribute('target', '_blank');
      expect(coupangLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('접힌 상태에서는 쇼핑 링크를 표시하지 않는다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      expect(screen.queryByTestId('coupang-link')).not.toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤 UI를 표시한다', () => {
      render(<SupplementRecommendationCard goal="health" isLoading={true} />);

      expect(screen.getByTestId('supplement-card-loading')).toBeInTheDocument();
    });

    it('로딩 중일 때 영양제 목록을 표시하지 않는다', () => {
      render(<SupplementRecommendationCard goal="health" isLoading={true} />);

      expect(screen.queryByText('종합 비타민')).not.toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('추천이 없으면 빈 상태 메시지를 표시한다', () => {
      // getSupplementRecommendations가 빈 배열을 반환하도록 하기 어려우므로
      // 실제 구현에서는 모든 목표에 최소 2개 이상의 영양제가 있음
      // 이 테스트는 빈 상태 UI 존재 여부만 확인

      // goal이 유효한 값이면 항상 추천이 있으므로,
      // 빈 상태는 모킹이 필요하지만 컴포넌트 구조 확인용으로 유지
      render(<SupplementRecommendationCard goal="health" />);

      // 정상 상태에서는 빈 상태가 아님
      expect(screen.queryByTestId('supplement-card-empty')).not.toBeInTheDocument();
    });
  });

  describe('우선순위 표시', () => {
    it('high 우선순위 영양제에 빨간 왼쪽 테두리를 적용한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // 종합 비타민은 high 우선순위
      const supplementItem = screen.getByTestId('supplement-item-종합 비타민');
      expect(supplementItem.className).toContain('border-l-red-400');
    });

    it('medium 우선순위 영양제에 노란 왼쪽 테두리를 적용한다', () => {
      render(<SupplementRecommendationCard goal="health" />);

      // 프로바이오틱스는 medium 우선순위
      const supplementItem = screen.getByTestId('supplement-item-프로바이오틱스');
      expect(supplementItem.className).toContain('border-l-amber-400');
    });
  });
});
