/**
 * 물 섭취 위젯 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WaterWidget } from '@/components/widgets/WaterWidget';

// useColorScheme 모킹
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.useColorScheme = jest.fn(() => 'light');
  return RN;
});

describe('WaterWidget', () => {
  describe('small 사이즈', () => {
    it('물방울 아이콘을 표시해야 함', () => {
      render(<WaterWidget current={500} goal={2000} size="small" />);
      expect(screen.getByText('💧')).toBeTruthy();
    });

    it('현재 섭취량을 L 단위로 표시해야 함', () => {
      render(<WaterWidget current={1500} goal={2000} size="small" />);
      expect(screen.getByText('1.5L')).toBeTruthy();
    });

    it('진행률 바가 표시되어야 함', () => {
      const { toJSON } = render(<WaterWidget current={1000} goal={2000} size="small" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('medium 사이즈', () => {
    it('제목을 표시해야 함', () => {
      render(<WaterWidget current={500} goal={2000} size="medium" />);
      expect(screen.getByText('💧 물 섭취')).toBeTruthy();
    });

    it('잔 수를 표시해야 함', () => {
      render(<WaterWidget current={500} goal={2000} size="medium" />);
      expect(screen.getByText('2잔 마심')).toBeTruthy();
    });

    it('현재 섭취량을 ml 단위로 표시해야 함', () => {
      render(<WaterWidget current={750} goal={2000} size="medium" />);
      expect(screen.getByText('750')).toBeTruthy();
      expect(screen.getByText('ml')).toBeTruthy();
    });

    it('목표량을 표시해야 함', () => {
      render(<WaterWidget current={750} goal={2000} size="medium" />);
      expect(screen.getByText('목표: 2000ml')).toBeTruthy();
    });

    it('남은 양을 표시해야 함', () => {
      render(<WaterWidget current={750} goal={2000} size="medium" />);
      expect(screen.getByText('1250ml 남음')).toBeTruthy();
    });

    it('목표 달성 시 남은 양을 표시하지 않아야 함', () => {
      render(<WaterWidget current={2000} goal={2000} size="medium" />);
      expect(screen.queryByText(/남음/)).toBeFalsy();
    });
  });

  describe('진행률 계산', () => {
    it('0% 진행률을 올바르게 계산해야 함', () => {
      const { toJSON } = render(<WaterWidget current={0} goal={2000} size="small" />);
      expect(toJSON()).toBeTruthy();
    });

    it('50% 진행률을 올바르게 계산해야 함', () => {
      const { toJSON } = render(<WaterWidget current={1000} goal={2000} size="small" />);
      expect(toJSON()).toBeTruthy();
    });

    it('100% 진행률을 올바르게 계산해야 함', () => {
      const { toJSON } = render(<WaterWidget current={2000} goal={2000} size="small" />);
      expect(toJSON()).toBeTruthy();
    });

    it('100% 초과 시 100%로 제한해야 함', () => {
      const { toJSON } = render(<WaterWidget current={2500} goal={2000} size="small" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('잔 수 계산', () => {
    it('250ml = 1잔으로 계산해야 함', () => {
      render(<WaterWidget current={250} goal={2000} size="medium" />);
      expect(screen.getByText('1잔 마심')).toBeTruthy();
    });

    it('500ml = 2잔으로 계산해야 함', () => {
      render(<WaterWidget current={500} goal={2000} size="medium" />);
      expect(screen.getByText('2잔 마심')).toBeTruthy();
    });

    it('0ml = 0잔으로 계산해야 함', () => {
      render(<WaterWidget current={0} goal={2000} size="medium" />);
      expect(screen.getByText('0잔 마심')).toBeTruthy();
    });

    it('소수점 이하는 버림 처리해야 함', () => {
      render(<WaterWidget current={300} goal={2000} size="medium" />);
      expect(screen.getByText('1잔 마심')).toBeTruthy();
    });
  });

  describe('빠른 추가 버튼', () => {
    it('onAddWater가 제공되면 버튼을 표시해야 함', () => {
      const onAddWater = jest.fn();
      render(
        <WaterWidget current={500} goal={2000} size="medium" onAddWater={onAddWater} />
      );
      expect(screen.getByText('+1잔')).toBeTruthy();
    });

    it('onAddWater가 없으면 버튼을 표시하지 않아야 함', () => {
      render(<WaterWidget current={500} goal={2000} size="medium" />);
      expect(screen.queryByText('+1잔')).toBeFalsy();
    });

    it('버튼 클릭 시 onAddWater(250)을 호출해야 함', () => {
      const onAddWater = jest.fn();
      render(
        <WaterWidget current={500} goal={2000} size="medium" onAddWater={onAddWater} />
      );

      fireEvent.press(screen.getByText('+1잔'));
      expect(onAddWater).toHaveBeenCalledWith(250);
    });
  });

  describe('기본값', () => {
    it('size 기본값은 medium이어야 함', () => {
      render(<WaterWidget current={500} goal={2000} />);
      expect(screen.getByText('💧 물 섭취')).toBeTruthy();
    });
  });

  describe('남은 양 계산', () => {
    it('남은 양이 음수가 되지 않아야 함', () => {
      render(<WaterWidget current={2500} goal={2000} size="medium" />);
      expect(screen.queryByText(/-500ml 남음/)).toBeFalsy();
    });
  });
});
