import { fireEvent } from '@testing-library/react-native';

import { WishlistItemCard } from '../../../app/products/WishlistItemCard';
import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return { Trash2: (props: Record<string, unknown>) => <View {...props} /> };
});

const BASE_ITEM = {
  id: '11111111-1111-4111-8111-111111111111',
  clerkUserId: 'user-1',
  productId: '22222222-2222-4222-8222-222222222222',
  createdAt: '2026-08-21T00:00:00.000Z',
  name: '수분 크림',
};

describe('WishlistItemCard', () => {
  it('실존 모바일 상세 경로가 있는 화장품만 카드 전체를 버튼으로 만든다', () => {
    const onOpen = jest.fn();
    const { getByTestId } = renderWithTheme(
      <WishlistItemCard
        item={{ ...BASE_ITEM, productType: 'cosmetic' }}
        onOpen={onOpen}
        onRemove={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('wishlist-item'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('상세 경로가 없는 유형은 가짜 Pressable 대신 미지원 고지를 표시한다', () => {
    const onOpen = jest.fn();
    const { getByTestId, getByText, queryByTestId } = renderWithTheme(
      <WishlistItemCard
        item={{ ...BASE_ITEM, productType: 'workout_equipment' }}
        onOpen={onOpen}
        onRemove={jest.fn()}
      />
    );

    expect(getByTestId('wishlist-item-unavailable')).toBeTruthy();
    expect(getByText('이 유형의 모바일 상세 보기는 아직 지원하지 않아요.')).toBeTruthy();
    expect(queryByTestId('wishlist-item')).toBeNull();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
