/**
 * 분석 결과 페이지 Dynamic OG 메타데이터 헬퍼
 * - 각 분석 모듈의 result/[id]/layout.tsx에서 사용
 * - Supabase에서 결과 조회 → title/description 생성
 */

import type { Metadata } from 'next';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

interface MetadataConfig {
  /** Supabase 테이블명 */
  tableName: string;
  /** 한국어 모듈명 (예: '퍼스널컬러') */
  moduleName: string;
  /** 타이틀에 사용할 필드명 */
  titleField: string;
  /** 필드 값 → 한국어 변환 맵 (선택) */
  titleMapper?: Record<string, string>;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yiroom.app';

/**
 * 분석 결과 페이지 메타데이터 생성
 */
export async function generateAnalysisMetadata(
  id: string,
  config: MetadataConfig
): Promise<Metadata> {
  const { tableName, moduleName, titleField, titleMapper } = config;

  // 기본 메타데이터 (DB 조회 실패 시 폴백)
  const fallback: Metadata = {
    title: `${moduleName} 분석 결과 | 이룸`,
    description: `이룸에서 ${moduleName} 분석 결과를 확인해보세요.`,
    openGraph: {
      title: `${moduleName} 분석 결과 | 이룸`,
      description: `이룸에서 ${moduleName} 분석 결과를 확인해보세요.`,
      url: `${BASE_URL}/analysis/${tableName.replace('_assessments', '')}/result/${id}`,
      siteName: '이룸',
      type: 'article',
    },
  };

  try {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase.from(tableName).select(titleField).eq('id', id).single();

    if (error || !data) {
      return fallback;
    }

    const rawValue = data[titleField];
    // 숫자 값은 '점' 접미사 추가 (예: overall_score → "85점")
    let displayValue = rawValue;
    if (titleMapper && rawValue in titleMapper) {
      displayValue = titleMapper[rawValue];
    } else if (typeof rawValue === 'number') {
      displayValue = `${rawValue}점`;
    }

    const title = `${moduleName}: ${displayValue} | 이룸`;
    const description = `이룸 ${moduleName} 분석 결과 — ${displayValue}. AI 기반 통합 웰니스 분석을 경험해보세요.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/analysis/${tableName.replace('_assessments', '')}/result/${id}`,
        siteName: '이룸',
        type: 'article',
      },
    };
  } catch {
    return fallback;
  }
}

// ============================================================
// 모듈별 설정
// ============================================================

export const PERSONAL_COLOR_META: MetadataConfig = {
  tableName: 'personal_color_assessments',
  moduleName: '퍼스널컬러',
  titleField: 'season',
  titleMapper: {
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  },
};

export const SKIN_META: MetadataConfig = {
  tableName: 'skin_assessments',
  moduleName: '피부',
  titleField: 'skin_type',
  titleMapper: {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  },
};

export const BODY_META: MetadataConfig = {
  tableName: 'body_assessments',
  moduleName: '체형',
  titleField: 'body_type',
};

export const HAIR_META: MetadataConfig = {
  tableName: 'hair_assessments',
  moduleName: '헤어',
  titleField: 'hair_type',
};

export const MAKEUP_META: MetadataConfig = {
  tableName: 'makeup_assessments',
  moduleName: '메이크업',
  titleField: 'face_shape',
};

export const ORAL_HEALTH_META: MetadataConfig = {
  tableName: 'oral_health_assessments',
  moduleName: '구강건강',
  titleField: 'overall_score',
  titleMapper: undefined,
};

export const POSTURE_META: MetadataConfig = {
  tableName: 'posture_assessments',
  moduleName: '자세',
  titleField: 'posture_type',
};
