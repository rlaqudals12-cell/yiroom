import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutStyleCard from '@/components/workout/result/WorkoutStyleCard';
import type { PersonalColorSeason, BodyType } from '@/types/workout';
import { PC_COLORS, PC_ACCESSORIES, BODY_TYPE_FITS } from '@/lib/workout/styleRecommendations';

describe('WorkoutStyleCard', () => {
  const personalColors: PersonalColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const bodyTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

  describe('기본 렌더링', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<WorkoutStyleCard personalColor="Spring" bodyType={null} />);

      expect(screen.getByTestId('workout-style-card')).toBeInTheDocument();
      expect(screen.getByText('운동복 스타일 가이드')).toBeInTheDocument();
    });

    it.each(personalColors)('PC 타입 %s에 맞는 라벨이 표시된다', (pc) => {
      render(<WorkoutStyleCard personalColor={pc} bodyType={null} />);

      const labels: Record<PersonalColorSeason, string> = {
        Spring: '봄 웜톤',
        Summer: '여름 쿨톤',
        Autumn: '가을 웜톤',
        Winter: '겨울 쿨톤',
      };

      expect(screen.getByText(new RegExp(labels[pc]))).toBeInTheDocument();
    });

    it.each(personalColors)('PC 타입 %s에 맞는 이모지가 표시된다', (pc) => {
      render(<WorkoutStyleCard personalColor={pc} bodyType={null} />);

      const emojis: Record<PersonalColorSeason, string> = {
        Spring: '🌸',
        Summer: '🌊',
        Autumn: '🍂',
        Winter: '❄️',
      };

      expect(screen.getByText(new RegExp(emojis[pc]))).toBeInTheDocument();
    });
  });

  describe('추천 색상', () => {
    it('추천 색상이 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Spring" bodyType={null} />);

      expect(screen.getByTestId('recommended-colors')).toBeInTheDocument();
      expect(screen.getByText('추천 색상')).toBeInTheDocument();
    });

    it.each(personalColors)('PC 타입 %s의 첫 번째 추천 색상이 표시된다', (pc) => {
      render(<WorkoutStyleCard personalColor={pc} bodyType={null} />);

      const firstColor = PC_COLORS[pc][0];
      expect(screen.getByText(firstColor.name)).toBeInTheDocument();
    });
  });

  describe('확장 기능', () => {
    it('펼치기 버튼이 있다', () => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType={null} />);

      expect(screen.getByLabelText('펼치기')).toBeInTheDocument();
    });

    it('펼치면 참고 색상이 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType={null} />);

      // 초기에는 참고 색상이 보이지 않음
      expect(screen.queryByTestId('avoid-colors')).not.toBeInTheDocument();

      // 펼치기 버튼 클릭
      fireEvent.click(screen.getByLabelText('펼치기'));

      // 펼치면 참고 색상이 보임
      expect(screen.getByTestId('avoid-colors')).toBeInTheDocument();
      expect(screen.getByText('참고 색상')).toBeInTheDocument();
    });

    it('펼치면 운동 소품이 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Autumn" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('accessories')).toBeInTheDocument();
      expect(screen.getByText('운동 소품 색상')).toBeInTheDocument();

      // 첫 번째 소품 확인
      const firstAccessory = PC_ACCESSORIES['Autumn'][0];
      expect(screen.getByText(firstAccessory.item)).toBeInTheDocument();
    });

    it('펼치면 운동 분위기가 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Winter" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText('어울리는 운동 분위기')).toBeInTheDocument();
      expect(screen.getByText(/강렬하고 시크한/)).toBeInTheDocument();
    });

    it('접기 버튼으로 닫을 수 있다', () => {
      render(<WorkoutStyleCard personalColor="Spring" bodyType={null} />);

      // 펼치기
      fireEvent.click(screen.getByLabelText('펼치기'));
      expect(screen.getByTestId('avoid-colors')).toBeInTheDocument();

      // 접기
      fireEvent.click(screen.getByLabelText('접기'));
      expect(screen.queryByTestId('avoid-colors')).not.toBeInTheDocument();
    });
  });

  describe('체형 기반 핏 추천', () => {
    it('체형이 없으면 핏 추천이 표시되지 않는다', () => {
      render(<WorkoutStyleCard personalColor="Spring" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.queryByText(/자 체형 맞춤 핏/)).not.toBeInTheDocument();
    });

    it.each(bodyTypes)('체형 %s에 맞는 핏 추천이 표시된다', (bodyType) => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType={bodyType} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText(`${bodyType}자 체형 맞춤 핏`)).toBeInTheDocument();

      const fitRecommendation = BODY_TYPE_FITS[bodyType];
      expect(screen.getByText(fitRecommendation.top)).toBeInTheDocument();
      expect(screen.getByText(fitRecommendation.bottom)).toBeInTheDocument();
    });
  });

  describe('스타일 팁', () => {
    it('스타일 팁이 항상 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Autumn" bodyType="X" />);

      // 스타일 팁은 펼치지 않아도 보여야 함
      // 랜덤이므로 특정 텍스트 대신 존재 여부만 확인
      const styleTipContainer = screen.getByTestId('workout-style-card');
      expect(styleTipContainer.textContent).toMatch(/(어스톤|테라코타|골드|브론즈)/);
    });
  });

  describe('쇼핑 링크', () => {
    it('펼치면 쇼핑 섹션이 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Winter" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('shopping-section')).toBeInTheDocument();
      expect(screen.getByText('쇼핑몰에서 찾아보기')).toBeInTheDocument();
    });

    it('카테고리 선택 버튼이 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('category-selector')).toBeInTheDocument();
      expect(screen.getByText('상의')).toBeInTheDocument();
      expect(screen.getByText('하의')).toBeInTheDocument();
      expect(screen.getByText('소품')).toBeInTheDocument();
    });

    it('3개 플랫폼 쇼핑 링크가 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Spring" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('shopping-links')).toBeInTheDocument();
      expect(screen.getByTestId('shop-link-musinsa')).toBeInTheDocument();
      expect(screen.getByTestId('shop-link-ably')).toBeInTheDocument();
      expect(screen.getByTestId('shop-link-coupang')).toBeInTheDocument();
    });

    it('플랫폼별 이름이 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Autumn" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText('무신사')).toBeInTheDocument();
      expect(screen.getByText('에이블리')).toBeInTheDocument();
      expect(screen.getByText('쿠팡')).toBeInTheDocument();
    });

    it('쇼핑 링크 클릭 시 새 탭에서 열린다', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(<WorkoutStyleCard personalColor="Winter" bodyType="X" />);

      fireEvent.click(screen.getByLabelText('펼치기'));
      fireEvent.click(screen.getByTestId('shop-link-musinsa'));

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('musinsa.com'),
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('카테고리 변경 시 버튼 상태가 변경된다', () => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      // 초기에는 상의가 선택됨
      const topButton = screen.getByText('상의');
      expect(topButton).toHaveAttribute('aria-pressed', 'true');

      // 하의 클릭
      fireEvent.click(screen.getByText('하의'));
      expect(screen.getByText('하의')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('상의')).toHaveAttribute('aria-pressed', 'false');
    });

    it('PC 타입에 맞는 색상 힌트가 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText(/여름 쿨톤 타입에 어울리는 색상으로 검색됩니다/)).toBeInTheDocument();
    });
  });

  describe('PC와 체형 조합', () => {
    it('PC와 체형 모두 있을 때 전체 정보가 표시된다', () => {
      render(<WorkoutStyleCard personalColor="Summer" bodyType="X" />);

      // 헤더에 PC 정보
      expect(screen.getByText(/여름 쿨톤 맞춤 추천/)).toBeInTheDocument();

      // 펼치기
      fireEvent.click(screen.getByLabelText('펼치기'));

      // 추천 색상
      expect(screen.getByTestId('recommended-colors')).toBeInTheDocument();

      // 피해야 할 색상
      expect(screen.getByTestId('avoid-colors')).toBeInTheDocument();

      // 핏 추천 (X자 체형)
      expect(screen.getByText('X자 체형 맞춤 핏')).toBeInTheDocument();

      // 소품
      expect(screen.getByTestId('accessories')).toBeInTheDocument();

      // 분위기
      expect(screen.getByText('어울리는 운동 분위기')).toBeInTheDocument();
    });
  });
});
