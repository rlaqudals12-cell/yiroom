/**
 * 이미지 처리 유틸리티
 * - 배경 제거: @imgly/background-removal (브라우저)
 * - 색상 추출: Canvas API
 * - AI 분류: Gemini Vision
 */

import { inventoryLogger } from '@/lib/utils/logger';
import { ClothingCategory, Pattern } from '@/types/inventory';

// @imgly/background-removal 타입 (패키지 미설치 시에도 동작)
interface RemoveBackgroundOptions {
  model?: 'small' | 'medium' | 'large';
  output?: {
    format?: string;
    quality?: number;
  };
}

type RemoveBackgroundFn = (imageBlob: Blob, options?: RemoveBackgroundOptions) => Promise<Blob>;

// 색상 이름 매핑 (HEX -> 한글)
const COLOR_NAMES: Record<string, string> = {
  '#FFFFFF': '화이트',
  '#000000': '블랙',
  '#F5F5DC': '베이지',
  '#000080': '네이비',
  '#808080': '그레이',
  '#A52A2A': '브라운',
  '#FF0000': '레드',
  '#0000FF': '블루',
  '#008000': '그린',
  '#FFFF00': '옐로우',
  '#FFC0CB': '핑크',
  '#800080': '퍼플',
  '#FFA500': '오렌지',
  '#C0C0C0': '실버',
  '#FFD700': '골드',
  '#F5DEB3': '카멜',
  '#D2B48C': '탄',
  '#E6E6FA': '라벤더',
  '#40E0D0': '민트',
  '#FF6B6B': '코랄',
};

/**
 * RGB를 HEX로 변환
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/**
 * 두 색상 간의 거리 계산 (Euclidean)
 */
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * 가장 가까운 색상 이름 찾기
 */
function getClosestColorName(hex: string): string {
  let closest = '기타';
  let minDistance = Infinity;

  for (const [colorHex, colorName] of Object.entries(COLOR_NAMES)) {
    const distance = colorDistance(hex, colorHex);
    if (distance < minDistance) {
      minDistance = distance;
      closest = colorName;
    }
  }

  // 거리가 너무 크면 HEX 코드 그대로 반환
  if (minDistance > 100) {
    return hex;
  }

  return closest;
}

/**
 * 이미지에서 주요 색상 추출 (Canvas API 사용)
 * 브라우저에서만 동작
 */
export async function extractDominantColors(imageBlob: Blob, count: number = 3): Promise<string[]> {
  // 서버 환경에서는 빈 배열 반환
  if (typeof window === 'undefined') {
    return [];
  }

  const img = await createImageBitmap(imageBlob);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  // 색상 빈도 맵
  const colorCounts: Map<string, number> = new Map();

  // 샘플링 (모든 픽셀을 분석하면 느림)
  const sampleRate = Math.max(1, Math.floor(data.length / 4 / 10000));

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // 투명 픽셀 무시
    if (a < 128) continue;

    // 양자화 (색상 수 감소)
    const quantized = rgbToHex(
      Math.round(r / 32) * 32,
      Math.round(g / 32) * 32,
      Math.round(b / 32) * 32
    );

    colorCounts.set(quantized, (colorCounts.get(quantized) || 0) + 1);
  }

  // 빈도순 정렬
  const sorted = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([hex]) => getClosestColorName(hex));

  // 중복 제거
  return [...new Set(sorted)];
}

/**
 * 배경 제거 (브라우저 전용)
 * @imgly/background-removal 패키지 필요
 */
export async function removeBackgroundClient(imageBlob: Blob): Promise<Blob> {
  // Dynamic import (브라우저에서만)
  if (typeof window === 'undefined') {
    throw new Error('Background removal is only available in browser');
  }

  try {
    // @imgly/background-removal 패키지가 설치되어 있어야 동작
    const mod = await import('@imgly/background-removal' as string);
    const removeBackground = mod.removeBackground as RemoveBackgroundFn;

    const result = await removeBackground(imageBlob, {
      model: 'medium',
      output: {
        format: 'image/png',
        quality: 0.8,
      },
    });

    return result;
  } catch (error) {
    inventoryLogger.error('Background removal failed:', error);
    // 실패 시 원본 반환
    return imageBlob;
  }
}

/**
 * 의류 분류 결과 타입
 */
export interface ClothingClassificationResult {
  category: ClothingCategory;
  subCategory: string;
  suggestedName: string;
  colors: string[];
  pattern?: Pattern;
  confidence: number;
}

/**
 * AI로 의류 분류 (Gemini Vision)
 */
export async function classifyClothing(imageUrl: string): Promise<ClothingClassificationResult> {
  try {
    const response = await fetch('/api/inventory/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Classification API failed');
    }

    return await response.json();
  } catch (error) {
    inventoryLogger.error('Classification failed:', error);
    // Fallback: 기본값 반환
    return {
      category: 'top',
      subCategory: '기타',
      suggestedName: '의류',
      colors: [],
      confidence: 0,
    };
  }
}

/**
 * 이미지 리사이즈 (업로드 전)
 */
export async function resizeImage(
  imageBlob: Blob,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  if (typeof window === 'undefined') {
    return imageBlob;
  }

  const img = await createImageBitmap(imageBlob);

  let width = img.width;
  let height = img.height;

  // 비율 유지하며 리사이즈
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.convertToBlob({
    type: 'image/png',
    quality,
  });
}

/**
 * 이미지 파일 유효성 검사
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'JPG, PNG, WebP, HEIC 형식만 지원됩니다.',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: '파일 크기는 10MB 이하여야 합니다.',
    };
  }

  return { valid: true };
}

/**
 * Data URL을 Blob으로 변환
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

/**
 * Blob을 Data URL로 변환
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
