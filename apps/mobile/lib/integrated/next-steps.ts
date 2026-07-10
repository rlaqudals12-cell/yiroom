/**
 * 통합분석 결과 "다음 단계" 링크 정의
 *
 * 각 축의 다음 단계는 라벨 의도에 맞는 실존 뷰티 목적지로 연결한다.
 * (이전엔 색·피부·체형이 모두 게이팅된 [기록] 탭 `/(tabs)/records`으로 잘못 연결돼 있었음)
 */
import type { AxisCode } from '@/lib/api';

export interface NextStep {
  axis: AxisCode;
  label: string;
  description: string;
  href: string;
}

export const ALL_STEPS: NextStep[] = [
  {
    axis: 'personal_color',
    label: '내 색 기반 화장품 보기',
    description: '어울리는 립·아이섀도 추천',
    href: '/(tabs)/beauty',
  },
  {
    axis: 'skin',
    label: '피부 타입 맞춤 추천',
    description: '스킨케어 루틴',
    href: '/(analysis)/skin/routine',
  },
  {
    axis: 'body',
    label: '체형별 코디 가이드',
    description: '옷장 조합',
    href: '/(tabs)/style',
  },
  {
    axis: 'hair',
    label: '헤어스타일 추천 자세히',
    description: '얼굴형 기반 컷',
    href: '/(analysis)/hair',
  },
  {
    axis: 'makeup',
    label: '메이크업 튜토리얼',
    description: '단계별 가이드',
    href: '/(analysis)/makeup',
  },
];
