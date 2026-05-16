/**
 * Dynamic OG Image API
 * GET /api/og/[type]?value=spring&label=봄 웜톤
 *
 * next/og (ImageResponse) 기반 1200x630 PNG 생성
 * 분석 결과 페이지 공유 시 사용
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// 분석 모듈별 색상 테마
const MODULE_THEMES: Record<string, { bg: string; accent: string; icon: string }> = {
  'personal-color': { bg: '#FFF5F5', accent: '#E11D48', icon: '🎨' },
  skin: { bg: '#F0FDF4', accent: '#16A34A', icon: '✨' },
  body: { bg: '#EFF6FF', accent: '#2563EB', icon: '💪' },
  hair: { bg: '#FDF4FF', accent: '#9333EA', icon: '💇' },
  makeup: { bg: '#FFF7ED', accent: '#EA580C', icon: '💄' },
  'oral-health': { bg: '#F0FDFA', accent: '#0D9488', icon: '🦷' },
  posture: { bg: '#F5F3FF', accent: '#7C3AED', icon: '🧘' },
};

// 분석 타입별 한국어 모듈명
const MODULE_NAMES: Record<string, string> = {
  'personal-color': '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const label = searchParams.get('label') || '';

  const theme = MODULE_THEMES[type] || MODULE_THEMES['skin'];
  const moduleName = MODULE_NAMES[type] || type;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        fontFamily: 'sans-serif',
      }}
    >
      {/* 로고 영역 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 32,
          fontSize: 28,
          color: '#6B7280',
        }}
      >
        이룸 — 온전한 나는?
      </div>

      {/* 아이콘 */}
      <div style={{ fontSize: 72, marginBottom: 24, display: 'flex' }}>{theme.icon}</div>

      {/* 모듈명 */}
      <div
        style={{
          fontSize: 32,
          color: '#374151',
          marginBottom: 12,
          display: 'flex',
        }}
      >
        {moduleName} 분석 결과
      </div>

      {/* 결과 값 */}
      {label && (
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: theme.accent,
            marginBottom: 32,
            display: 'flex',
          }}
        >
          {label}
        </div>
      )}

      {/* 하단 CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.accent,
          color: 'white',
          padding: '14px 40px',
          borderRadius: 12,
          fontSize: 24,
        }}
      >
        나도 분석해보기 →
      </div>

      {/* 워터마크 */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 32,
          fontSize: 18,
          color: '#9CA3AF',
          display: 'flex',
        }}
      >
        yiroom.app
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
