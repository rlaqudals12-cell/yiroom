/**
 * AI 트윈(내 AI 아바타) HTTP 클라이언트 (웹 API 재사용) — ADR-118 thin client
 *
 * @module lib/api/twin
 * @description
 *   웹 /api/visual/twin(생성/조회) · /api/visual/twin/[id](승인/거부/삭제) ·
 *   /api/visual/twin/compose(착장)를 모바일에서 호출한다. 생성·승인 로직 정본은
 *   웹 서버 1곳(lib/visual-expression/twin) — 모바일은 호출+렌더만 한다(로직 복제 없음).
 *   Clerk JWT를 Bearer로 전달, 서버가 일 5회 상한을 신뢰(클라 중복 구현 없음).
 *
 *   승인 게이트(pending→approved)가 핵심: 서버 GET은 본인 확인을 위해 최신 트윈을
 *   반환할 수 있으나(pending 포함), 표면 노출은 approved만 허용한다. `approvedOnly`가
 *   그 필터를 담당한다(웹 useApprovedTwin과 동일 정책).
 *
 * @see apps/web/app/api/visual/twin/route.ts
 * @see apps/web/lib/visual-expression/twin
 * @see docs/adr/ADR-115-ai-twin.md
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 */

// ============================================
// 1. 타입 (웹 lib/visual-expression/twin/types.ts와 동기화)
// ============================================

export type TwinStatus = 'pending' | 'approved' | 'rejected';

/** 트윈 레코드 (imageUrl = 비공개 버킷 서명 URL) */
export interface TwinRecord {
  id: string;
  imageUrl: string;
  status: TwinStatus;
  /** UI "AI 생성" 라벨 강제 — 응답 방어를 위해 optional */
  aiGenerated?: boolean;
}

/** 트윈 생성 입력 (원본 사진은 저장되지 않음) */
export interface TwinGenerateInput {
  /** 셀카 (data URL, 필수) */
  faceImageBase64: string;
  /** 전신 (data URL, 선택 — 있으면 체형 정합↑) */
  bodyImageBase64?: string;
}

/** 착장(결합) 결과 — 저장되지 않음(다운로드/공유용 data URL) */
export interface TwinComposeOutput {
  imageUrl: string;
  aiGenerated?: boolean;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class TwinApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'TwinApiError';
    this.status = status;
    this.code = code;
  }
}

/** 일 생성 상한 초과 코드 (웹 route 429와 동일) */
export const TWIN_BUDGET_EXCEEDED = 'VISUAL_BUDGET_EXCEEDED';

// ============================================
// 2-1. 변경 알림 (승인/삭제 후 카드 갱신용 경량 pub/sub)
// ============================================
// 스튜디오(별도 화면)에서 승인하면 [나] 탭 카드는 리마운트되지 않으므로, 명시적
// 알림으로 재조회를 유도한다. (포커스 훅 대신 — 렌더 중 setState 루프 회피)

type TwinChangeListener = () => void;
const twinChangeListeners = new Set<TwinChangeListener>();

export function subscribeTwinChanged(listener: TwinChangeListener): () => void {
  twinChangeListeners.add(listener);
  return () => {
    twinChangeListeners.delete(listener);
  };
}

export function notifyTwinChanged(): void {
  twinChangeListeners.forEach((cb) => cb());
}

// ============================================
// 3. 응답 파서 (웹 parseTwinRecord와 동일 — `{ twin }` 래핑/평문 모두 허용)
// ============================================

/**
 * JSON을 TwinRecord로 방어적으로 파싱. `{ twin: {...} }` 래핑과 평문 `{...}` 둘 다 허용.
 * 형식 불충족 시 null.
 */
export function parseTwinRecord(json: unknown): TwinRecord | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  const raw = ('twin' in obj ? obj.twin : obj) as Record<string, unknown> | null;
  if (!raw || typeof raw !== 'object') return null;
  const status = raw.status;
  if (
    typeof raw.id === 'string' &&
    typeof raw.imageUrl === 'string' &&
    (status === 'pending' || status === 'approved' || status === 'rejected')
  ) {
    return {
      id: raw.id,
      imageUrl: raw.imageUrl,
      status,
      aiGenerated: raw.aiGenerated === true,
    };
  }
  return null;
}

/**
 * 승인 게이트 필터 — approved만 표면 노출 대상으로 통과시킨다.
 * pending/rejected/null은 모두 null(어떤 카드/화면에도 노출 금지).
 */
export function approvedOnly(record: TwinRecord | null): TwinRecord | null {
  return record?.status === 'approved' ? record : null;
}

// ============================================
// 4. 공통 HTTP 헬퍼
// ============================================

function resolveBaseUrl(baseUrl?: string): string {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new TwinApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }
  return url;
}

function authHeaders(clerkToken: string, withBody: boolean): Record<string, string> {
  return {
    ...(withBody ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${clerkToken}`,
    // 서버사이드 계측용 플랫폼 식별 (통합분석/브리핑과 동일 관례 — ADR-103)
    'x-yiroom-client': 'mobile',
  };
}

/** 에러 응답 본문에서 메시지/코드 추출 (웹 route는 { error, code } 또는 { error:{...} } 혼재) */
function extractError(json: unknown, fallback: string): { message: string; code?: string } {
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    // 평문 { error: '...', code: '...' } (트윈 429/생성 실패)
    if (typeof obj.error === 'string') {
      return {
        message: obj.error,
        code: typeof obj.code === 'string' ? obj.code : undefined,
      };
    }
    // 표준 { error: { userMessage?, message, code } } (error-response.ts)
    if (obj.error && typeof obj.error === 'object') {
      const e = obj.error as Record<string, unknown>;
      const message =
        (typeof e.userMessage === 'string' && e.userMessage) ||
        (typeof e.message === 'string' && e.message) ||
        fallback;
      return { message, code: typeof e.code === 'string' ? e.code : undefined };
    }
  }
  return { message: fallback };
}

// ============================================
// 5. 클라이언트 함수
// ============================================

/**
 * 내 트윈 조회. GET /api/visual/twin → `{ twin: TwinRecord | null }`.
 * approved 우선(없으면 최신)으로 서버가 반환한다. 승인 필터는 호출 측(approvedOnly).
 *
 * @returns 파싱된 트윈(pending 포함) 또는 null
 */
export async function fetchMyTwin(
  clerkToken: string,
  baseUrl?: string
): Promise<TwinRecord | null> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/visual/twin`, {
      method: 'GET',
      headers: authHeaders(clerkToken, false),
    });
  } catch {
    throw new TwinApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    // 조회 실패는 "트윈 없음"과 구분하기 위해 던진다(카드가 에러/빈 상태 결정)
    const json = await response.json().catch(() => null);
    const { message, code } = extractError(json, '트윈을 불러올 수 없어요.');
    throw new TwinApiError(message, response.status, code);
  }

  const json = await response.json().catch(() => null);
  return parseTwinRecord(json);
}

/**
 * 트윈 생성. POST /api/visual/twin → TwinRecord(status: pending).
 * 성공해도 pending — 반드시 승인(approveTwin)해야 표면에 노출된다.
 *
 * @throws TwinApiError 상한 초과(429, code TWIN_BUDGET_EXCEEDED)·생성 실패·네트워크
 */
export async function generateTwin(
  input: TwinGenerateInput,
  clerkToken: string,
  baseUrl?: string
): Promise<TwinRecord> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/visual/twin`, {
      method: 'POST',
      headers: authHeaders(clerkToken, true),
      body: JSON.stringify({
        faceImageBase64: input.faceImageBase64,
        ...(input.bodyImageBase64 ? { bodyImageBase64: input.bodyImageBase64 } : {}),
      }),
    });
  } catch {
    throw new TwinApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const { message, code } = extractError(
      json,
      '지금은 AI 아바타를 만들 수 없어요. 잠시 후 다시 시도해 주세요.'
    );
    throw new TwinApiError(message, response.status, code);
  }

  const record = parseTwinRecord(json);
  if (!record) {
    throw new TwinApiError(
      '지금은 AI 아바타를 만들 수 없어요. 잠시 후 다시 시도해 주세요.',
      response.status,
      'PARSE_ERROR'
    );
  }
  return record;
}

/**
 * 트윈 승인/거부. PATCH /api/visual/twin/[id] → TwinRecord.
 * approve 시 기존 approved는 서버가 rejected로 강등(사용자당 approved 1개).
 */
export async function setTwinStatus(
  id: string,
  action: 'approve' | 'reject',
  clerkToken: string,
  baseUrl?: string
): Promise<TwinRecord> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/visual/twin/${id}`, {
      method: 'PATCH',
      headers: authHeaders(clerkToken, true),
      body: JSON.stringify({ action }),
    });
  } catch {
    throw new TwinApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const { message, code } = extractError(json, '트윈 상태를 변경할 수 없어요.');
    throw new TwinApiError(message, response.status, code);
  }

  const record = parseTwinRecord(json);
  if (!record) {
    throw new TwinApiError('트윈 상태를 변경할 수 없어요.', response.status, 'PARSE_ERROR');
  }
  return record;
}

/** 트윈 삭제. DELETE /api/visual/twin/[id]. Storage 파일 + DB 행 동시 삭제(서버). */
export async function deleteTwin(id: string, clerkToken: string, baseUrl?: string): Promise<void> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/visual/twin/${id}`, {
      method: 'DELETE',
      headers: authHeaders(clerkToken, false),
    });
  } catch {
    throw new TwinApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const { message, code } = extractError(json, '트윈을 삭제할 수 없어요.');
    throw new TwinApiError(message, response.status, code);
  }
}

/**
 * 착장(결합). POST /api/visual/twin/compose → { imageUrl, aiGenerated }.
 * 승인된 트윈에만 적용(서버가 검증). 결과는 저장되지 않는다(다운로드/공유용).
 *
 * @throws TwinApiError 상한 초과(429)·미승인(403)·생성 실패·네트워크
 */
export async function composeOnTwin(
  twinId: string,
  garmentImageUrl: string,
  clerkToken: string,
  baseUrl?: string
): Promise<TwinComposeOutput> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/visual/twin/compose`, {
      method: 'POST',
      headers: authHeaders(clerkToken, true),
      body: JSON.stringify({ twinId, garmentImageUrl }),
    });
  } catch {
    throw new TwinApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const { message, code } = extractError(
      json,
      '지금은 입혀볼 수 없어요. 잠시 후 다시 시도해 주세요.'
    );
    throw new TwinApiError(message, response.status, code);
  }

  if (
    json &&
    typeof json === 'object' &&
    typeof (json as { imageUrl?: unknown }).imageUrl === 'string'
  ) {
    const obj = json as { imageUrl: string; aiGenerated?: unknown };
    return { imageUrl: obj.imageUrl, aiGenerated: obj.aiGenerated === true };
  }
  throw new TwinApiError(
    '지금은 입혀볼 수 없어요. 잠시 후 다시 시도해 주세요.',
    response.status,
    'PARSE_ERROR'
  );
}
