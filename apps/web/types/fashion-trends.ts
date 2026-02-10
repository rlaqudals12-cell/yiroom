/**
 * 패션 트렌드 타입 정의
 *
 * @description K-2 패션 확장 - 2026년 트렌드 데이터 구조
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */

import type { FitType } from './fashion-fit';
import type { PersonalColorSeason } from '@/lib/shared/integration-types';

// 트렌드 카테고리
export type TrendCategory =
  | 'silhouette' // 실루엣 트렌드
  | 'color' // 컬러 트렌드
  | 'material' // 소재 트렌드
  | 'pattern' // 패턴 트렌드
  | 'style' // 스타일 트렌드
  | 'detail'; // 디테일 트렌드

// 시즌 (PersonalColorSeason SSOT 참조 + 'all' 확장)
export type Season = PersonalColorSeason | 'all';

// 트렌드 아이템
export interface TrendItem {
  id: string;
  name: string;
  nameKo: string;
  category: TrendCategory;
  season: Season[];
  year: number;
  description: string;
  fitTypes: FitType[];
  colorPalette?: string[]; // HEX 색상 코드
  keywords: string[];
  matchingStyles: string[]; // 연관 스타일 카테고리
  difficulty: 'easy' | 'medium' | 'hard'; // 코디 난이도
  imageUrl?: string;
}

// 전체 트렌드 데이터
export interface FashionTrend {
  year: number;
  season: Season;
  title: string;
  subtitle: string;
  overview: string;
  items: TrendItem[];
  colorOfTheYear?: {
    name: string;
    hex: string;
    pantone?: string;
  };
}

// 트렌드 매칭 결과
export interface TrendMatchResult {
  trend: TrendItem;
  matchScore: number; // 0-100
  reasons: string[];
}

// 트렌드 필터 옵션
export interface TrendFilterOptions {
  category?: TrendCategory;
  season?: Season;
  difficulty?: 'easy' | 'medium' | 'hard';
  fitType?: FitType;
}

// 트렌드 아이템 필터링 함수
export function filterTrends(items: TrendItem[], options: TrendFilterOptions): TrendItem[] {
  return items.filter((item) => {
    if (options.category && item.category !== options.category) return false;
    if (options.season && !item.season.includes(options.season) && !item.season.includes('all'))
      return false;
    if (options.difficulty && item.difficulty !== options.difficulty) return false;
    if (options.fitType && !item.fitTypes.includes(options.fitType)) return false;
    return true;
  });
}

// 트렌드 태그 생성
export function generateTrendTags(items: TrendItem[]): string[] {
  const tags = new Set<string>();

  items.forEach((item) => {
    tags.add(item.nameKo);
    item.keywords.forEach((k) => tags.add(k));
  });

  return Array.from(tags);
}
