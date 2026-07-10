/**
 * loadFaceApiModels 테스트 — face-api.js 모델 로더 타임아웃
 * @see components/analysis/skin/loadFaceApiModels.ts
 *
 * 왜: 모델 로드 Promise가 영원히 pending이면 시각화 탭에 "AI 모델 로딩 중…"
 * 스피너가 무한 지속됐다(2026-07-10 피드백). 타임아웃으로 실패로 떨어뜨리는지 검증.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const loadFromUri = vi.fn();

vi.mock('face-api.js', () => ({
  nets: {
    tinyFaceDetector: { loadFromUri: (...a: unknown[]) => loadFromUri(...a) },
    faceLandmark68Net: { loadFromUri: (...a: unknown[]) => loadFromUri(...a) },
  },
}));

import { loadFaceApiModels } from '@/components/analysis/skin/loadFaceApiModels';

describe('loadFaceApiModels', () => {
  beforeEach(() => {
    loadFromUri.mockReset();
  });

  it('모델 로드 성공 시 resolve하고 두 모델을 모두 로드한다', async () => {
    loadFromUri.mockResolvedValue(undefined);
    await expect(loadFaceApiModels(1000)).resolves.toBeUndefined();
    expect(loadFromUri).toHaveBeenCalledTimes(2);
  });

  it('모델 로드 실패 시 reject한다', async () => {
    loadFromUri.mockRejectedValue(new Error('CDN down'));
    await expect(loadFaceApiModels(1000)).rejects.toThrow('CDN down');
  });

  it('타임아웃 초과 시 reject한다 (무한 로딩 방지)', async () => {
    // CDN hang 시뮬레이션 — 영원히 pending
    loadFromUri.mockReturnValue(new Promise<void>(() => {}));
    await expect(loadFaceApiModels(20)).rejects.toThrow('FACE_API_MODEL_TIMEOUT');
  });

  it('타임아웃이 이긴 뒤 늦게 load가 실패해도 unhandled rejection을 만들지 않는다', async () => {
    const rejections: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    // 타임아웃(20ms) 뒤에 뒤늦게 reject되는 load(버려진 Promise)
    loadFromUri.mockReturnValue(
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('late CDN fail')), 60))
    );

    await expect(loadFaceApiModels(20)).rejects.toThrow('FACE_API_MODEL_TIMEOUT');

    // 늦은 reject가 실제로 발생할 시간을 준 뒤 unhandledRejection이 없었는지 확인
    await new Promise((r) => setTimeout(r, 120));
    process.off('unhandledRejection', onUnhandled);

    expect(rejections).toHaveLength(0);
  });
});
