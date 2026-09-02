/**
 * 의류 AI 분류 API
 * Gemini Vision을 사용하여 이미지에서 의류 카테고리, 색상 등 자동 추출
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateContent, isGeminiAvailable, FAST_MODEL } from '@/lib/gemini/client';
import type { ClothingCategory, Pattern, Season, Occasion } from '@/types/inventory';
import { extractJsonObject } from '@/lib/utils/json-extract';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { INVENTORY_IMAGE_BUCKET, isInventoryStoragePath } from '@/lib/inventory/image-url';

// 의류 분류 Mock 결과
//
// ⚠️ 이 값은 "AI가 판정하지 못했다"는 자리표시자이지 분류 결과가 아니다.
// 그대로 저장되면 사용자 옷장에 지어낸 분류('티셔츠/화이트')가 영구 기록되므로,
// 응답에는 반드시 usedFallback: true를 실어 소비처가 채택하지 않도록 한다
// (설계 계약: AI 호출 불변식 — 폴백은 표식과 함께 정직하게 노출).
const generateMockClassification = () => ({
  category: 'top' as ClothingCategory,
  subCategory: '티셔츠',
  suggestedName: '캐주얼 티셔츠',
  colors: ['화이트'],
  pattern: 'solid' as Pattern,
  seasons: [] as Season[],
  occasions: [] as Occasion[],
  confidence: 0.5,
  usedFallback: true as const,
});

const VALID_SEASONS: ReadonlySet<string> = new Set(['spring', 'summer', 'autumn', 'winter']);
const VALID_OCCASIONS: ReadonlySet<string> = new Set([
  'casual',
  'formal',
  'workout',
  'date',
  'travel',
  'work',
  'wedding_guest',
]);

/**
 * SSRF 방지: 서버가 직접 fetch할 수 있는 이미지 URL 화이트리스트 검증.
 *
 * 인벤토리(옷장) 이미지는 Supabase Storage 비공개 버킷에만 저장되므로
 * Supabase 호스트로만 제한한다. 이렇게 하지 않으면 사용자가 임의의 URL을
 * 넘겨 서버가 내부망(localhost·사설 IP·클라우드 메타데이터 endpoint 등)이나
 * 임의 외부 호스트로 요청하도록 유도할 수 있다(OWASP A10:2021 SSRF).
 */
export function isAllowedImageUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // HTTPS만 허용 (http/data/file/gopher 등 차단)
  if (parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();

  // Supabase Storage 도메인 (프로젝트별 서브도메인 포함)
  if (host === 'supabase.co' || host.endsWith('.supabase.co')) return true;

  // 환경변수로 지정된 Supabase 프로젝트 호스트 정확 매칭 (self-host 대비)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const configuredHost = new URL(supabaseUrl).hostname.toLowerCase();
      if (host === configuredHost) return true;
    } catch {
      // 잘못된 env는 화이트리스트에 반영하지 않음
    }
  }

  return false;
}

/**
 * 입력값에서 `inventory-images` 버킷의 스토리지 경로를 뽑아낸다.
 *
 * 버킷이 비공개가 되면서 `fetch(공개 URL)`은 더 이상 동작하지 않는다.
 * 저장된 값(=경로)이 그대로 넘어오는 경우와, 레거시로 남은 절대 공개/서명 URL이
 * 넘어오는 경우를 모두 경로로 환원해 service role 다운로드로 처리한다.
 *
 * 경로가 아니면(외부 URL 등) null — 호출측이 기존 SSRF 화이트리스트 경로로 넘긴다.
 */
export function extractInventoryStoragePath(rawValue: string): string | null {
  // DB에 저장된 값 = 스토리지 경로 그 자체
  if (isInventoryStoragePath(rawValue)) return rawValue;

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    return null;
  }

  // https://<proj>.supabase.co/storage/v1/object/{public|sign|authenticated}/inventory-images/<path>
  const marker = `/storage/v1/object/`;
  const markerIndex = parsed.pathname.indexOf(marker);
  if (markerIndex === -1) return null;

  const afterMarker = parsed.pathname.slice(markerIndex + marker.length);
  const segments = afterMarker.split('/');
  // [0] = public|sign|authenticated, [1] = bucket, 나머지 = 경로
  if (segments.length < 3 || segments[1] !== INVENTORY_IMAGE_BUCKET) return null;

  const path = segments.slice(2).join('/');
  return path ? decodeURIComponent(path) : null;
}

/**
 * 비공개 버킷에서 이미지를 직접 내려받아 base64로 변환한다.
 *
 * service role을 쓰되 **경로 첫 세그먼트 == 요청자 userId**를 강제한다 —
 * 이 검사가 없으면 남의 사진 경로를 넘겨 내용을 훔쳐볼 수 있다
 * (service role은 RLS를 우회하므로 소유권 가드는 여기가 유일하다).
 */
async function downloadInventoryImage(
  path: string,
  userId: string
): Promise<{ data: string; mimeType: string } | null> {
  if (path.split('/')[0] !== userId) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from(INVENTORY_IMAGE_BUCKET).download(path);

  if (error || !data) {
    console.error('[Classify] Storage download failed:', error?.message);
    return null;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return { data: buffer.toString('base64'), mimeType: data.type || 'image/png' };
}

/** 이미지 로드 결과 — 실패는 사용자 대면 메시지로 돌려준다 */
type LoadedImage = { data: string; mimeType: string } | { error: string };

/**
 * imageUrl(경로 또는 URL)에서 이미지를 읽어 base64로 만든다.
 *
 * 비공개 버킷 경로면 service role 다운로드(소유권 검사 포함),
 * 그 외 외부 URL이면 기존 SSRF 화이트리스트 fetch.
 */
async function loadImageFromUrlOrPath(imageUrl: string, userId: string): Promise<LoadedImage> {
  const storagePath = extractInventoryStoragePath(imageUrl);

  if (storagePath) {
    const downloaded = await downloadInventoryImage(storagePath, userId);
    return downloaded ?? { error: '이미지를 불러오지 못했습니다.' };
  }

  // SSRF 방지: 화이트리스트(Supabase Storage) 도메인만 서버 fetch 허용
  if (!isAllowedImageUrl(imageUrl)) {
    return { error: '허용되지 않은 이미지 URL입니다.' };
  }

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  return {
    data: Buffer.from(imageBuffer).toString('base64'),
    mimeType: imageResponse.headers.get('content-type') || 'image/png',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'imageUrl or imageBase64 is required' }, { status: 400 });
    }

    // Gemini API 키 확인
    if (!isGeminiAvailable()) {
      console.warn('[Classify] Gemini not available, using mock');
      return NextResponse.json(generateMockClassification());
    }

    try {
      // 프롬프트
      const prompt = `You are a fashion expert AI. Analyze this clothing item image and classify it.

Return a JSON object with these fields:
{
  "category": "outer" | "top" | "bottom" | "dress" | "shoes" | "bag" | "accessory",
  "subCategory": "specific type in Korean (e.g., 티셔츠, 청바지, 트렌치코트)",
  "suggestedName": "descriptive Korean name (e.g., 베이지 트렌치코트)",
  "colors": ["primary color in Korean", "secondary color if any"],
  "pattern": "solid" | "stripe" | "check" | "floral" | "dot" | "geometric" | "animal" | "abstract",
  "seasons": ["spring" | "summer" | "autumn" | "winter"],
  "occasions": ["casual" | "formal" | "workout" | "date" | "travel" | "work" | "wedding_guest"],
  "confidence": 0.0-1.0
}

seasons: seasons this item suits based on fabric weight/sleeve length (e.g., padding → ["winter"], linen shirt → ["spring","summer"]). Empty array if not determinable.
occasions: where this item fits. Most items are ["casual"]; office wear adds "work", wedding guest wear adds "wedding_guest", suits/blouses add "formal", athleisure adds "workout". Empty array if not determinable.

Categories:
- outer: coats, jackets, cardigans, paddings
- top: t-shirts, shirts, blouses, knits, hoodies
- bottom: jeans, slacks, skirts, shorts
- dress: dresses, jumpsuits
- shoes: sneakers, boots, heels, sandals
- bag: backpacks, totes, crossbodies
- accessory: hats, scarves, belts, jewelry

Korean color names: 화이트, 블랙, 베이지, 네이비, 그레이, 브라운, 레드, 블루, 그린, 핑크, 옐로우, 카멜, 아이보리

Only return the JSON object, no other text.`;

      const loaded = imageBase64
        ? {
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: 'image/png',
          }
        : await loadImageFromUrlOrPath(imageUrl, userId);

      if ('error' in loaded) {
        return NextResponse.json({ error: loaded.error }, { status: 400 });
      }

      const imagePart = {
        inlineData: { data: loaded.data, mimeType: loaded.mimeType },
      };

      // 구조화 추출 = FAST_MODEL (2026-07-07 A/B: 판정 동일·3~6초·1/6 가격)
      // 일괄 등록에서 N장 연속 호출되므로 속도가 UX에 직결
      const result = await generateContent({
        model: FAST_MODEL,
        contents: [{ text: prompt }, imagePart],
        config: { temperature: 0, thinkingConfig: { thinkingLevel: 'low' } },
      });
      const text = result.text;

      // JSON 파싱 (정규식 대신 문자열 탐색으로 ReDoS 방지)
      const jsonStr = extractJsonObject(text);
      if (!jsonStr) {
        console.error('[Classify] Invalid response format:', text);
        return NextResponse.json(generateMockClassification());
      }

      const classification = JSON.parse(jsonStr);

      return NextResponse.json({
        category: classification.category || 'top',
        subCategory: classification.subCategory || '기타',
        suggestedName: classification.suggestedName || '의류',
        colors: classification.colors || [],
        pattern: classification.pattern || 'solid',
        seasons: Array.isArray(classification.seasons)
          ? classification.seasons.filter((s: string) => VALID_SEASONS.has(s))
          : [],
        occasions: Array.isArray(classification.occasions)
          ? classification.occasions.filter((o: string) => VALID_OCCASIONS.has(o))
          : [],
        confidence: classification.confidence || 0.8,
        // 실제 AI 판정 — 소비처가 안심하고 채택해도 되는 결과
        usedFallback: false,
      });
    } catch (aiError) {
      console.error('[Classify] Gemini error, using mock:', aiError);
      return NextResponse.json(generateMockClassification());
    }
  } catch (error) {
    console.error('[API] POST /api/inventory/classify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
