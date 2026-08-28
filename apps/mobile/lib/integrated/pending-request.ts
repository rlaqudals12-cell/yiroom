/**
 * 통합분석 이탈 복구용 요청 상관 ID 저장소.
 *
 * 얼굴·전신 사진은 생체정보라 영속 저장하지 않는다. 반면 무작위 UUID인
 * clientRequestId는 결과 데이터가 아니므로 사용자별 AsyncStorage에 보존해 앱 재시작 뒤에도
 * 서버에 이미 만들어진 정확한 세션을 다시 찾는다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REQUEST_KEY_PREFIX = 'yiroom:integrated:pending:';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageKey(userId: string): string {
  return `${PENDING_REQUEST_KEY_PREFIX}${userId}`;
}

export async function readPendingIntegratedRequest(userId: string): Promise<string | null> {
  const key = storageKey(userId);
  const requestId = await AsyncStorage.getItem(key);
  if (requestId === null) return null;
  if (UUID_RE.test(requestId)) return requestId;

  // 손상되거나 구형 형식이면 엉뚱한 세션을 추측하지 않고 폐기한다.
  await AsyncStorage.removeItem(key);
  return null;
}

export async function getOrCreatePendingIntegratedRequest(
  userId: string,
  createRequestId: () => string
): Promise<string> {
  const existing = await readPendingIntegratedRequest(userId);
  if (existing) return existing;

  const requestId = createRequestId();
  if (!UUID_RE.test(requestId)) {
    throw new Error('통합분석 요청 ID 형식이 올바르지 않아요.');
  }
  await AsyncStorage.setItem(storageKey(userId), requestId);
  return requestId;
}

export async function clearPendingIntegratedRequest(userId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(userId));
}
