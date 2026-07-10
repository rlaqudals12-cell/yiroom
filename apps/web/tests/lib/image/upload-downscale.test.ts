/**
 * 업로드 전 축소 유틸 — Vercel 413 근본 수리 (2026-07-11)
 *
 * jsdom은 Image.onload가 발화하지 않으므로 prepareUploadBlob의 DOM 경로 대신
 * 순수 판정 함수와 에러 매핑을 고정한다(재발 방지). 소비 페이지 테스트는
 * 이 모듈을 목으로 대체한다.
 */
import { describe, it, expect } from 'vitest';
import {
  needsDownscale,
  downscaleRatio,
  dataUrlToBlobSync,
  uploadErrorMessage,
  MAX_UPLOAD_DIMENSION,
  UPLOAD_SAFE_BYTES,
} from '@/lib/image/upload-downscale';

describe('needsDownscale', () => {
  it('안전 한도 이하 + 최대 변 이하 → 축소 불필요', () => {
    expect(needsDownscale(1024 * 1024, 800, 600)).toBe(false);
  });

  it('용량이 안전 한도(4MB) 초과 → 축소 필요 (413 재발 방지 핵심)', () => {
    expect(needsDownscale(UPLOAD_SAFE_BYTES + 1, 800, 600)).toBe(true);
  });

  it('한 변이 최대 변(1536px) 초과 → 축소 필요', () => {
    expect(needsDownscale(1000, MAX_UPLOAD_DIMENSION + 1, 100)).toBe(true);
    expect(needsDownscale(1000, 100, MAX_UPLOAD_DIMENSION + 1)).toBe(true);
  });
});

describe('downscaleRatio', () => {
  it('큰 이미지는 최대 변이 1536이 되도록 축소', () => {
    expect(downscaleRatio(3072, 1536)).toBeCloseTo(0.5);
    expect(downscaleRatio(1000, 4096)).toBeCloseTo(MAX_UPLOAD_DIMENSION / 4096);
  });

  it('작은 이미지는 확대하지 않는다(배율 1 상한)', () => {
    expect(downscaleRatio(800, 600)).toBe(1);
  });
});

describe('dataUrlToBlobSync', () => {
  it('data URL을 MIME 보존하며 Blob으로 변환', () => {
    // 1x1 투명 PNG
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlobSync(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('uploadErrorMessage', () => {
  it('413 → 용량 초과를 정직하게 안내(일반 문구로 뭉개지 않음)', () => {
    expect(uploadErrorMessage(413)).toContain('용량');
  });

  it('401 → 로그인 안내', () => {
    expect(uploadErrorMessage(401)).toContain('로그인');
  });

  it('기타 → 일반 재시도 안내', () => {
    expect(uploadErrorMessage(500)).toContain('다시 시도');
  });
});
