/**
 * 이미지 처리 유틸리티
 * - 색상 추출: Canvas API
 * - AI 분류: Gemini Vision
 *
 * 배경 제거는 없다(2026-08 수리). 과거 `removeBackgroundClient()`가
 * `@imgly/background-removal`을 동적 import 했지만 패키지가 설치된 적이 없어
 * 호출은 항상 throw → 원본 반환이었고, UI만 "배경 제거 중…"을 표시해 하지도 않는 일을
 * 했다고 말했다. 죽은 경로와 그 위의 거짓 안내를 함께 걷어냈다.
 * 실제 배선(패키지 도입 또는 서버 처리)은 별도 결정 대기 — 되살릴 땐 UI 문구도 같이 살린다.
 */

import { inventoryLogger } from '@/lib/utils/logger';
import { ClothingCategory, Pattern, Season, Occasion } from '@/types/inventory';

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
 * 의류 분류 결과 타입
 */
export interface ClothingClassificationResult {
  category: ClothingCategory;
  subCategory: string;
  suggestedName: string;
  colors: string[];
  pattern?: Pattern;
  /** AI 추정 착용 시즌 (판단 불가 시 빈 배열) — 일괄 등록·TPO 코디용 */
  seasons?: Season[];
  /** AI 추정 착용 상황 (판단 불가 시 빈 배열) */
  occasions?: Occasion[];
  confidence: number;
  /**
   * AI 판정이 아니라 폴백(자리표시자)임을 알리는 표식.
   *
   * true면 필드 값은 "지어낸 기본값"이므로 저장·자동 채택 금지 — 사용자에게
   * 자동 분류 실패를 알리고 직접 입력받아야 한다. 신뢰도(confidence) 수치로
   * 유추하지 않고 명시 불리언 하나로 규약을 통일한다(소비처마다 임계값이 달라지는 것 방지).
   */
  usedFallback?: boolean;
}

/**
 * AI로 의류 분류 (Gemini Vision)
 *
 * 반환값의 `usedFallback: true`는 "AI가 판정하지 못했다"는 뜻 — 호출측은 그 값을
 * 자동 채택·저장하지 말고 사용자에게 직접 입력받아야 한다(지어낸 분류 영구 저장 방지).
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

    // 서버가 폴백을 반환했을 수 있으므로 표식을 그대로 통과시킨다(여기서 지우지 않는다)
    return (await response.json()) as ClothingClassificationResult;
  } catch (error) {
    inventoryLogger.error('Classification failed:', error);
    // Fallback: 판정 불가 표식과 함께 자리표시자 반환 (confidence 수치가 아닌 명시 불리언)
    return {
      category: 'top',
      subCategory: '기타',
      suggestedName: '의류',
      colors: [],
      confidence: 0,
      usedFallback: true,
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
  const mime = parts[0].match(/:([a-zA-Z0-9/+.-]{1,100});/)?.[1] || 'image/png';
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
