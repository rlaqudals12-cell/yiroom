/**
 * Dynamic OG Image API — E+ 에디토리얼 미니 (링크 미리보기 = 카드 유입 첫인상)
 * GET /api/og/[type]?label=뮤티드 서머&colors=#C79AA0,#9A86A6,...
 *
 * next/og (ImageResponse) 기반 1200x630 PNG. 2026-07-23 개편:
 * - 기존 모듈별 8색 무지개+이모지 테마 = AI-slop·디자인 정본(ADR-120) 위반 → E+ 카드
 *   문법(크림 지면·세리프 히어로·진단 hex 팔레트 밴드·헥사곤-Y 인장)의 미니 버전으로 교체.
 * - 한글 세리프: Google Fonts css2 `text=` 런타임 서브셋(표제 분량 TTF ~15KB 실측) —
 *   전체 Noto Serif KR은 수 MB라 번들 임베드 불가, satori 요구 포맷(TTF)과 일치.
 *   실패 시 폰트 없이 렌더(내장 loadDynamicAsset이 한글 산세리프로 폴백 — 우아한 실패).
 * - runtime='edge' 제거: Vercel 공식이 OG 생성을 Node 런타임 정본으로 안내(번들 한도 완화).
 * - 종이 그레인은 미적용(satori의 SVG 필터 미지원) — 크롤러용 저해상 미니라 무해.
 *
 * 역할 경계: 이 라우트 = 크롤러 1200×630 미리보기 전용. 유저 대면 고해상 산출물은
 * 클라이언트 캡처(html-to-image, 서버 비용 0)가 담당 — 서로 대체하지 않는다.
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// E+ 고정 팔레트 (PersonaShareCard와 동일 hex — 캡처/미리보기 표면 공통 지면)
const CREAM = '#FBF3F1';
const INK = '#2B2320';
const ROSE = '#C56A84';
const MUTED = '#8C7F78';
const FAINT = '#B6A9A1';

// 분석 타입별 한국어 모듈명 (서브카피용)
const MODULE_NAMES: Record<string, string> = {
  report: '스타일 리포트',
  'personal-color': '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

/**
 * 표제 분량 텍스트만 담은 Noto Serif KR 600 런타임 서브셋(TTF).
 * 모듈 스코프 캐시 — 동일 텍스트 재요청 시 페치 0회.
 */
const fontCache = new Map<string, ArrayBuffer | null>();

async function loadSerifSubset(text: string): Promise<ArrayBuffer | null> {
  const cached = fontCache.get(text);
  if (cached !== undefined) return cached;
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    // css2는 UA에 따라 woff2를 줄 수 있어 satori 호환(truetype/opentype) 소스만 채택
    const match = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('(?:truetype|opentype)'\)/);
    if (!match) {
      fontCache.set(text, null);
      return null;
    }
    const res = await fetch(match[1]);
    const data = res.ok ? await res.arrayBuffer() : null;
    fontCache.set(text, data);
    return data;
  } catch {
    fontCache.set(text, null);
    return null;
  }
}

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const label = searchParams.get('label') || '';
  const moduleName = MODULE_NAMES[type] || '분석';

  // 베스트 컬러 스와치 — 진단 hex가 주인공 (#RGB/#RRGGBB만, 최대 6 = E+ 밴드 관습)
  const swatches = (searchParams.get('colors') || '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c))
    .slice(0, 6);

  // 세리프가 실제로 그릴 글자만 서브셋(히어로 라벨 + 워드마크)
  const heroText = label || '온전한 나를 찾는 여정';
  const serif = await loadSerifSubset(`${heroText}Yiroom`);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: CREAM,
        padding: '56px 72px 0',
      }}
    >
      {/* 브랜드 로우 — 헥사곤-Y 인장 + 세리프 워드마크 + 모듈명 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l8.5 5v10L12 22 3.5 17V7z" stroke={ROSE} strokeWidth="1.5" />
          <path d="M9.2 9.4l2.8 2.6 2.8-2.6M12 12v3.4" stroke={ROSE} strokeWidth="1.5" />
        </svg>
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            color: INK,
            fontFamily: serif ? 'NotoSerifKR' : undefined,
          }}
        >
          Yiroom
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: FAINT }}>{moduleName}</div>
      </div>

      {/* 히어로 — 진단명(자랑 라벨), 세리프 */}
      <div
        style={{
          display: 'flex',
          marginTop: 64,
          fontSize: 96,
          fontWeight: 600,
          color: INK,
          letterSpacing: '-0.02em',
          fontFamily: serif ? 'NotoSerifKR' : undefined,
        }}
      >
        {heroText}
      </div>

      {/* 서브 — 초대 한 줄 (카드=테스트 초대장 루프) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: MUTED }}>너의 계절은?</div>
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 600, color: INK }}>yiroom.app</div>
      </div>

      {/* 팔레트 밴드 — 풀블리드 하드엣지(E+ 관습). 스와치 없으면 로즈 헤어라인만 */}
      {swatches.length > 0 ? (
        <div style={{ display: 'flex', height: 120, margin: '0 -72px' }}>
          {swatches.map((hex) => (
            <div key={hex} style={{ display: 'flex', flex: 1, backgroundColor: hex }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', height: 8, margin: '0 -72px', backgroundColor: ROSE }} />
      )}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: serif
        ? [{ name: 'NotoSerifKR', data: serif, weight: 600, style: 'normal' }]
        : undefined,
    }
  );
}
