/**
 * Virtual Try-On 서버 API
 *
 * @route POST /api/fitting/try-on
 * @auth required
 * @description 모바일 Thin Client용 VTO 엔진.
 *   base64 이미지 + 설정을 받아 sharp SVG compositing으로
 *   메이크업/헤어 컬러를 적용한 결과 이미지를 반환한다.
 *
 * @see ADR-088 VTO 모바일 렌더링 전략
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';
import { z } from 'zod';

// 색상 스키마
const rgbaSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
  a: z.number().min(0).max(1),
});

// 요청 스키마
const tryOnRequestSchema = z.object({
  imageBase64: z.string().min(1),
  type: z.enum(['lip', 'blush', 'hair-color', 'eyeshadow', 'foundation']),
  color: rgbaSchema,
  opacity: z.number().min(0).max(1).optional(),
});

type TryOnRequest = z.infer<typeof tryOnRequestSchema>;

/** 응답 타입 */
interface TryOnResponse {
  success: boolean;
  data?: {
    resultBase64: string;
    processingTimeMs: number;
    type: string;
  };
  error?: {
    code: string;
    message: string;
    userMessage: string;
  };
}

// 기본 불투명도
const DEFAULT_OPACITY: Record<string, number> = {
  lip: 0.45,
  blush: 0.3,
  'hair-color': 0.35,
  eyeshadow: 0.35,
  foundation: 0.2,
};

/**
 * 메이크업 타입별 SVG 오버레이 생성
 *
 * selfie 중심 휴리스틱: 정면 셀피 기준으로
 * 얼굴 영역을 이미지 비율로 추정하여 색상 오버레이 적용
 */
function createMakeupSvg(
  width: number,
  height: number,
  type: string,
  color: { r: number; g: number; b: number },
  opacity: number
): string {
  const fill = `rgba(${color.r},${color.g},${color.b},${opacity})`;

  switch (type) {
    case 'lip': {
      // 입술: 하단 중앙 타원
      const cx = width * 0.5;
      const cy = height * 0.72;
      const rx = width * 0.12;
      const ry = height * 0.035;
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur"><feGaussianBlur stdDeviation="${Math.max(2, width * 0.005)}"/></filter>
        </defs>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" filter="url(#blur)"/>
      </svg>`;
    }

    case 'blush': {
      // 양볼: 좌우 타원 2개
      const cy = height * 0.58;
      const rx = width * 0.08;
      const ry = height * 0.055;
      const blur = Math.max(3, width * 0.015);
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur"><feGaussianBlur stdDeviation="${blur}"/></filter>
        </defs>
        <ellipse cx="${width * 0.3}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" filter="url(#blur)"/>
        <ellipse cx="${width * 0.7}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" filter="url(#blur)"/>
      </svg>`;
    }

    case 'eyeshadow': {
      // 양눈 상부: 작은 타원 2개
      const cy = height * 0.38;
      const rx = width * 0.07;
      const ry = height * 0.025;
      const blur = Math.max(2, width * 0.01);
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur"><feGaussianBlur stdDeviation="${blur}"/></filter>
        </defs>
        <ellipse cx="${width * 0.35}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" filter="url(#blur)"/>
        <ellipse cx="${width * 0.65}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" filter="url(#blur)"/>
      </svg>`;
    }

    case 'foundation': {
      // 얼굴 전체: 큰 타원
      const cx = width * 0.5;
      const cy = height * 0.48;
      const rx = width * 0.25;
      const ry = height * 0.35;
      const blur = Math.max(5, width * 0.025);
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur"><feGaussianBlur stdDeviation="${blur}"/></filter>
        </defs>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" filter="url(#blur)"/>
      </svg>`;
    }

    case 'hair-color': {
      // 헤어: 상단 영역 그래디언트
      const gradientHeight = height * 0.4;
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(${color.r},${color.g},${color.b},${opacity})"/>
            <stop offset="70%" stop-color="rgba(${color.r},${color.g},${color.b},${opacity * 0.5})"/>
            <stop offset="100%" stop-color="rgba(${color.r},${color.g},${color.b},0)"/>
          </linearGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="${Math.max(3, width * 0.01)}"/></filter>
        </defs>
        <ellipse cx="${width * 0.5}" cy="${gradientHeight * 0.3}" rx="${width * 0.35}" ry="${gradientHeight * 0.7}" fill="url(#hairGrad)" filter="url(#blur)"/>
      </svg>`;
    }

    default:
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<TryOnResponse>> {
  const startTime = performance.now();

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User not authenticated',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    // 2. 요청 검증
    const body = await request.json();
    const validated = tryOnRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            userMessage: '입력 정보를 확인해주세요.',
          },
        },
        { status: 400 }
      );
    }

    const { imageBase64, type, color, opacity } = validated.data;

    // 3. base64 → Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 4. 이미지 메타데이터
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width ?? 512;
    const height = metadata.height ?? 683;

    // 5. SVG 오버레이 생성
    const effectiveOpacity = opacity ?? DEFAULT_OPACITY[type] ?? 0.3;
    const svgOverlay = createMakeupSvg(width, height, type, color, effectiveOpacity);
    const svgBuffer = Buffer.from(svgOverlay);

    // 6. sharp compositing
    const resultBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .composite([{ input: svgBuffer, blend: 'over' }])
      .jpeg({ quality: 85 })
      .toBuffer();

    // 7. 결과 base64
    const resultBase64 = `data:image/jpeg;base64,${resultBuffer.toString('base64')}`;
    const processingTimeMs = Math.round(performance.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        resultBase64,
        processingTimeMs,
        type,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/fitting/try-on error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'VTO processing failed',
          userMessage: '시뮬레이션 처리 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
