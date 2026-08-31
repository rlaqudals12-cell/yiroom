import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockTrackOutfitSaved = jest.fn();
const mockRecordInventoryOutfitWear = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('clerk-token');
const mockInsert = jest.fn();
const mockSingle = jest.fn();

const mockBuilder: Record<string, jest.Mock> = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  insert: mockInsert,
  single: mockSingle,
};
mockBuilder.select.mockReturnValue(mockBuilder);
mockBuilder.eq.mockReturnValue(mockBuilder);
mockBuilder.insert.mockReturnValue(mockBuilder);

const mockClient = {
  from: jest.fn(() => mockBuilder),
};

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'clerk-user-1' }, isLoaded: true, isSignedIn: true }),
  useAuth: () => ({ getToken: mockGetToken }),
}));

jest.mock('@/lib/supabase', () => ({
  useClerkSupabaseClient: () => mockClient,
}));

jest.mock('@/lib/analytics/tracker', () => ({
  trackOutfitSaved: (...args: unknown[]) => mockTrackOutfitSaved(...args),
}));

jest.mock('@/lib/api/inventory-upload', () => ({
  recordInventoryItemUsage: jest.fn(),
  recordInventoryOutfitWear: (...args: unknown[]) => mockRecordInventoryOutfitWear(...args),
}));

jest.mock('@/lib/utils/logger', () => ({
  closetLogger: { error: jest.fn() },
}));

import { useSavedOutfits } from '../../../lib/inventory/useInventory';

const outfitInput = {
  name: '출근 코디',
  description: null,
  itemIds: ['top-1', 'bottom-1'],
  collageImageUrl: null,
  occasion: 'casual' as const,
  season: ['autumn' as const],
  wearCount: 0,
  lastWornAt: null,
};

const savedRow = {
  id: 'outfit-1',
  clerk_user_id: 'clerk-user-1',
  name: outfitInput.name,
  description: null,
  item_ids: outfitInput.itemIds,
  collage_image_url: null,
  occasion: 'casual',
  season: ['autumn'],
  wear_count: 0,
  last_worn_at: null,
  created_at: '2026-08-20T00:00:00.000Z',
  updated_at: '2026-08-20T00:00:00.000Z',
};

describe('useSavedOutfits analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuilder.select.mockReturnValue(mockBuilder);
    mockBuilder.eq.mockReturnValue(mockBuilder);
    mockBuilder.insert.mockReturnValue(mockBuilder);
    mockBuilder.order.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: savedRow, error: null });
    mockGetToken.mockResolvedValue('clerk-token');
    mockRecordInventoryOutfitWear.mockResolvedValue(undefined);
  });

  it('DB 저장 성공 뒤에만 출처와 아이템 수를 한 번 기록한다', async () => {
    const { result } = renderHook(() => useSavedOutfits());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveOutfit(outfitInput, 'builder')).resolves.toMatchObject({
        id: 'outfit-1',
      });
    });

    await waitFor(() => {
      expect(mockTrackOutfitSaved).toHaveBeenCalledTimes(1);
      expect(mockTrackOutfitSaved).toHaveBeenCalledWith('builder', 2, 'clerk-token');
    });
  });

  it('DB 저장 실패 시 성공 이벤트를 기록하지 않는다', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('insert failed') });
    const { result } = renderHook(() => useSavedOutfits());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveOutfit(outfitInput, 'recommendation')).resolves.toBeNull();
    });

    expect(mockTrackOutfitSaved).not.toHaveBeenCalled();
  });

  it('코디 착용 기록은 Clerk 토큰을 실어 웹 API를 경유한 뒤 화면 수치를 갱신한다', async () => {
    mockBuilder.order.mockResolvedValue({ data: [savedRow], error: null });
    const { result } = renderHook(() => useSavedOutfits());
    await waitFor(() => expect(result.current.outfits).toHaveLength(1));

    await act(async () => {
      await expect(result.current.recordWear('outfit-1')).resolves.toBe(true);
    });

    expect(mockRecordInventoryOutfitWear).toHaveBeenCalledWith('outfit-1', 'clerk-token');
    expect(result.current.outfits[0]).toMatchObject({ wearCount: 1 });
  });

  it('코디 착용 API가 실패하면 성공으로 표시하거나 수치를 올리지 않는다', async () => {
    mockBuilder.order.mockResolvedValue({ data: [savedRow], error: null });
    mockRecordInventoryOutfitWear.mockRejectedValue(new Error('request failed'));
    const { result } = renderHook(() => useSavedOutfits());
    await waitFor(() => expect(result.current.outfits).toHaveLength(1));

    await act(async () => {
      await expect(result.current.recordWear('outfit-1')).resolves.toBe(false);
    });

    expect(result.current.outfits[0]).toMatchObject({ wearCount: 0 });
  });
});
