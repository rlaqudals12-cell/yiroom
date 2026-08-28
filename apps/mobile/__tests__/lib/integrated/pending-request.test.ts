import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearPendingIntegratedRequest,
  getOrCreatePendingIntegratedRequest,
  readPendingIntegratedRequest,
} from '@/lib/integrated/pending-request';

const USER_ID = 'user-pending-test';
const REQUEST_ID = '11111111-2222-4333-8444-555555555555';

describe('통합분석 pending request 저장소', () => {
  it('컴포넌트 remount·프로세스 재시작에 해당하는 재조회에서도 같은 ID를 보존한다', async () => {
    const createRequestId = jest.fn(() => REQUEST_ID);

    const first = await getOrCreatePendingIntegratedRequest(USER_ID, createRequestId);
    const restored = await getOrCreatePendingIntegratedRequest(USER_ID, createRequestId);

    expect(first).toBe(REQUEST_ID);
    expect(restored).toBe(REQUEST_ID);
    expect(createRequestId).toHaveBeenCalledTimes(1);
    await expect(readPendingIntegratedRequest(USER_ID)).resolves.toBe(REQUEST_ID);
  });

  it('성공 또는 명시 포기 뒤 marker를 제거한다', async () => {
    await getOrCreatePendingIntegratedRequest(USER_ID, () => REQUEST_ID);

    await clearPendingIntegratedRequest(USER_ID);

    await expect(readPendingIntegratedRequest(USER_ID)).resolves.toBeNull();
  });

  it('손상된 marker는 세션을 추측하지 않고 제거한다', async () => {
    await AsyncStorage.setItem(`yiroom:integrated:pending:${USER_ID}`, 'old-timestamp-marker');

    await expect(readPendingIntegratedRequest(USER_ID)).resolves.toBeNull();
    await expect(AsyncStorage.getItem(`yiroom:integrated:pending:${USER_ID}`)).resolves.toBeNull();
  });
});

