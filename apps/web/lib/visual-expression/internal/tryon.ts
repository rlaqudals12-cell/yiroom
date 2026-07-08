/**
 * 가상 착장 (Virtual Try-On) — FASHN.ai 어댑터 (ADR-113)
 *
 * FASHN.ai 전용 VTON API(run → status 폴링)를 래핑한다.
 * `FASHN_API_KEY`가 없으면 `isTryonAvailable()=false` → 기능 표면 자체 비노출.
 *
 * @module lib/visual-expression/internal/tryon
 * @see ADR-113, SDD-VISUAL-EXPRESSION §3, https://docs.fashn.ai
 */

import type { TryonInput, TryonOutput } from '../types';

const FASHN_API_KEY = process.env.FASHN_API_KEY;
const FASHN_API_URL = process.env.FASHN_API_URL || 'https://api.fashn.ai/v1';

// FASHN VTON 모델 (2026 기준 v1.6)
const FASHN_MODEL_NAME = 'tryon-v1.6';

// 폴링 파라미터
const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 40_000;

interface FashnRunResponse {
  id?: string;
  error?: string | null;
}

interface FashnStatusResponse {
  id?: string;
  status?: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[] | null;
  error?: string | { message?: string } | null;
}

/** FASHN_API_KEY 존재 여부 — 표면 노출 게이팅용 */
export function isTryonAvailable(): boolean {
  return !!FASHN_API_KEY;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractError(error: FashnStatusResponse['error']): string {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  return error.message ?? 'unknown error';
}

/**
 * 가상 착장 생성 (run → status 폴링)
 *
 * @throws 키 미설정·API 오류·타임아웃·실패 시 Error
 */
export async function generateTryon(input: TryonInput): Promise<TryonOutput> {
  if (!FASHN_API_KEY) {
    throw new Error('FASHN_API_KEY not configured');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${FASHN_API_KEY}`,
  };

  // 1) 작업 시작 (run)
  const runRes = await fetch(`${FASHN_API_URL}/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model_name: FASHN_MODEL_NAME,
      inputs: {
        model_image: input.modelImageBase64,
        garment_image: input.garmentImageUrl,
        category: input.category,
      },
    }),
  });

  if (!runRes.ok) {
    throw new Error(`FASHN run failed: ${runRes.status}`);
  }

  const runData = (await runRes.json()) as FashnRunResponse;
  if (runData.error || !runData.id) {
    throw new Error(`FASHN run error: ${runData.error ?? 'no job id'}`);
  }

  const jobId = runData.id;

  // 2) 상태 폴링
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await fetch(`${FASHN_API_URL}/status/${jobId}`, {
      method: 'GET',
      headers,
    });

    if (!statusRes.ok) {
      throw new Error(`FASHN status failed: ${statusRes.status}`);
    }

    const statusData = (await statusRes.json()) as FashnStatusResponse;

    if (statusData.status === 'completed') {
      const imageUrl = statusData.output?.[0];
      if (!imageUrl) {
        throw new Error('FASHN completed but no output image');
      }
      return { imageUrl, aiGenerated: true };
    }

    if (statusData.status === 'failed') {
      throw new Error(`FASHN generation failed: ${extractError(statusData.error)}`);
    }
    // starting/in_queue/processing → 계속 폴링
  }

  throw new Error('FASHN generation timed out');
}
