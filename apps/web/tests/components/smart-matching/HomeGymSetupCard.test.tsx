/**
 * HomeGymSetupCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeGymSetupCard } from '@/components/smart-matching/HomeGymSetupCard';
import type { HomeGymSetup } from '@/lib/smart-matching/equipment-recommend';

describe('HomeGymSetupCard', () => {
  const mockSetup: HomeGymSetup = {
    budget: 'intermediate',
    spaceSize: 'medium',
    goals: ['weight_loss', 'health'],
    essentialSet: {
      items: [
        {
          id: 'eq-3',
          name: '줄넘기',
          category: 'cardio',
          priority: 'essential',
          priceRange: { min: 10000, max: 30000 },
          description: '고강도 유산소',
          reason: '적은 비용으로 높은 효과',
        },
        {
          id: 'eq-9',
          name: '요가 매트',
          category: 'flexibility',
          priority: 'essential',
          priceRange: { min: 20000, max: 60000 },
          description: '운동의 기본 매트',
          reason: '모든 바닥 운동에 필수',
        },
      ],
      totalCost: 30000,
      description: '홈짐 시작을 위한 필수 장비 세트',
    },
    expandedSet: {
      items: [
        {
          id: 'eq-10',
          name: '폼롤러',
          category: 'flexibility',
          priority: 'recommended',
          priceRange: { min: 15000, max: 40000 },
          description: '근막 이완용 롤러',
          reason: '운동 전후 근육 회복',
        },
      ],
      totalCost: 15000,
      description: '운동 효과 극대화를 위한 추가 장비',
    },
    purchasePlan: [
      {
        phase: 1,
        items: [
          {
            id: 'eq-3',
            name: '줄넘기',
            category: 'cardio',
            priority: 'essential',
            priceRange: { min: 10000, max: 30000 },
            description: '고강도 유산소',
            reason: '적은 비용으로 높은 효과',
          },
        ],
        cost: 10000,
        description: '운동 시작을 위한 기본 장비',
      },
      {
        phase: 2,
        items: [
          {
            id: 'eq-9',
            name: '요가 매트',
            category: 'flexibility',
            priority: 'essential',
            priceRange: { min: 20000, max: 60000 },
            description: '운동의 기본 매트',
            reason: '모든 바닥 운동에 필수',
          },
        ],
        cost: 20000,
        description: '루틴 정착 후 추가 장비',
      },
    ],
  };

  it('홈짐 구성 카드를 렌더링한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByTestId('home-gym-setup-card')).toBeInTheDocument();
    expect(screen.getByText('홈짐 구성 추천')).toBeInTheDocument();
  });

  it('예산과 공간 정보를 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText(/중급/)).toBeInTheDocument();
    expect(screen.getByText(/중형/)).toBeInTheDocument();
  });

  it('필수 장비 세트를 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText('필수 장비 세트')).toBeInTheDocument();
    // 줄넘기는 필수 세트와 1단계 계획에 모두 표시됨
    expect(screen.getAllByText('줄넘기').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('요가 매트')).toBeInTheDocument();
  });

  it('필수 세트 비용을 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText('30,000원')).toBeInTheDocument();
  });

  it('확장 세트를 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText('추가 장비 세트')).toBeInTheDocument();
    expect(screen.getByText('폼롤러')).toBeInTheDocument();
  });

  it('확장 세트가 없으면 표시하지 않는다', () => {
    const setupWithoutExpanded = { ...mockSetup, expandedSet: undefined };
    render(<HomeGymSetupCard setup={setupWithoutExpanded} />);

    expect(screen.queryByText('추가 장비 세트')).not.toBeInTheDocument();
  });

  it('단계별 구매 계획을 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText('단계별 구매 계획')).toBeInTheDocument();
    expect(screen.getByText('1단계')).toBeInTheDocument();
    expect(screen.getByText('2단계')).toBeInTheDocument();
  });

  it('단계 탭을 클릭하면 해당 단계 정보를 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    // 1단계가 기본 선택됨
    expect(screen.getByText('운동 시작을 위한 기본 장비')).toBeInTheDocument();

    // 2단계 클릭
    fireEvent.click(screen.getByText('2단계'));

    expect(screen.getByText('루틴 정착 후 추가 장비')).toBeInTheDocument();
  });

  it('총 비용을 계산하여 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    // 필수 30000 + 확장 15000 = 45000
    expect(screen.getByText('45,000원')).toBeInTheDocument();
  });

  it('장비 선택 콜백을 호출한다', () => {
    const onSelectEquipment = vi.fn();
    render(<HomeGymSetupCard setup={mockSetup} onSelectEquipment={onSelectEquipment} />);

    // 필수 세트의 장비 클릭 (첫 번째 줄넘기 버튼)
    const jumpRopeButtons = screen.getAllByText('줄넘기');
    fireEvent.click(jumpRopeButtons[0]);

    expect(onSelectEquipment).toHaveBeenCalledWith(mockSetup.essentialSet.items[0]);
  });

  it('단계 보기 콜백을 호출한다', () => {
    const onViewPhase = vi.fn();
    render(<HomeGymSetupCard setup={mockSetup} onViewPhase={onViewPhase} />);

    // 2단계 클릭
    fireEvent.click(screen.getByText('2단계'));

    expect(onViewPhase).toHaveBeenCalledWith(2);
  });

  it('필수 세트 설명을 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText('홈짐 시작을 위한 필수 장비 세트')).toBeInTheDocument();
  });

  it('예상 총 비용 라벨을 표시한다', () => {
    render(<HomeGymSetupCard setup={mockSetup} />);

    expect(screen.getByText('예상 총 비용')).toBeInTheDocument();
  });
});
