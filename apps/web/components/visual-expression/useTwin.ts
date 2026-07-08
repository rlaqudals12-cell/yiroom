'use client';

/**
 * AI 트윈 조회 훅 + 응답 파서 (ADR-115)
 *
 * 엔진/API는 O가 동시 구현 중이므로(SDD §3 스키마가 계약), 응답 래핑 여부가
 * 확정되기 전이다. `{ twin }` 래핑과 평문 레코드 양쪽을 모두 방어적으로 파싱한다.
 * 승인(approved)된 트윈만 표면에 노출한다 — pending/rejected는 어떤 화면에도
 * 내보내지 않는다(핵심 정책, SDD §5).
 */

import { useCallback, useEffect, useState } from 'react';

export type TwinStatus = 'pending' | 'approved' | 'rejected';

/** 트윈 레코드 (SDD §2 — 응답 필드 방어: undefined 허용) */
export interface TwinRecord {
  id: string;
  imageUrl: string;
  status: TwinStatus;
  aiGenerated?: boolean;
}

/**
 * API 응답(JSON)을 TwinRecord로 방어적으로 파싱.
 * `{ twin: {...} }` 래핑과 평문 `{...}` 둘 다 허용. 형식 불충족 시 null.
 */
export function parseTwinRecord(json: unknown): TwinRecord | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  const raw = (obj.twin ?? obj) as Record<string, unknown>;
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

interface UseApprovedTwinResult {
  /** 승인된 트윈만 반환(pending/rejected는 null 처리) */
  approvedTwin: TwinRecord | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * 내 트윈 조회. GET /api/visual/twin.
 * approved 상태만 노출 대상으로 반환한다.
 */
export function useApprovedTwin(): UseApprovedTwinResult {
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visual/twin');
      if (!res.ok) {
        setTwin(null);
        return;
      }
      const json = await res.json().catch(() => null);
      setTwin(parseTwinRecord(json));
    } catch {
      setTwin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 승인된 트윈만 노출 — pending/rejected는 어떤 표면에도 내보내지 않는다
  const approvedTwin = twin?.status === 'approved' ? twin : null;

  return { approvedTwin, loading, refetch: load };
}
