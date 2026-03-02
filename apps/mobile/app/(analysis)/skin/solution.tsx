/**
 * 피부 솔루션 화면
 * 피부 고민별 타겟 솔루션 + 추천 성분/루틴
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '../../../components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme, brand, typography, spacing, radii } from '../../../lib/theme';

// 고민 카테고리
const CONCERN_CATEGORIES = [
  { id: 'acne', label: '트러블', emoji: '🔴' },
  { id: 'wrinkles', label: '주름', emoji: '〰️' },
  { id: 'pigmentation', label: '색소침착', emoji: '🟤' },
  { id: 'pores', label: '모공', emoji: '⚫' },
  { id: 'dryness', label: '건조', emoji: '💧' },
  { id: 'redness', label: '홍조', emoji: '🩹' },
  { id: 'dullness', label: '칙칙함', emoji: '😶' },
] as const;

type ConcernId = (typeof CONCERN_CATEGORIES)[number]['id'];

interface SolutionData {
  description: string;
  keyIngredients: { name: string; effect: string }[];
  routineTips: string[];
  avoidIngredients: string[];
  lifestyleTips: string[];
}

// 솔루션 데이터 (mock)
const SOLUTIONS: Record<ConcernId, SolutionData> = {
  acne: {
    description: '트러블은 과도한 피지와 모공 막힘이 주원인이에요. 적절한 각질 관리와 진정 케어가 핵심이에요.',
    keyIngredients: [
      { name: '살리실산 (BHA)', effect: '모공 속 각질·피지 용해' },
      { name: '나이아신아마이드', effect: '피지 조절 + 진정' },
      { name: '티트리 오일', effect: '항균·항염 효과' },
      { name: '아젤라산', effect: '여드름 세균 억제' },
    ],
    routineTips: [
      '아침저녁 약산성 클렌저로 이중 세안',
      'BHA 토너를 주 3-4회 저녁에 사용',
      '가벼운 젤 타입 보습제 선택',
      '논코메도제닉 자외선 차단제 필수',
    ],
    avoidIngredients: ['미네랄 오일', '라놀린', '코코넛 오일', '이소프로필 미리스테이트'],
    lifestyleTips: [
      '베개 커버를 주 2회 이상 교체',
      '손으로 얼굴 만지지 않기',
      '설탕/유제품 섭취 줄이기',
      '스트레스 관리 (충분한 수면)',
    ],
  },
  wrinkles: {
    description: '주름은 콜라겐 감소와 자외선 손상이 주원인이에요. 자외선 차단과 세포 재생 촉진이 핵심이에요.',
    keyIngredients: [
      { name: '레티놀 (비타민 A)', effect: '세포 턴오버 촉진' },
      { name: '비타민 C', effect: '콜라겐 합성 촉진' },
      { name: '펩타이드', effect: '피부 탄력 개선' },
      { name: '히알루론산', effect: '수분 보유력 강화' },
    ],
    routineTips: [
      '아침: 비타민 C 세럼 → 보습 → SPF 50',
      '저녁: 레티놀 제품 (소량부터 시작)',
      '아이크림 별도 사용',
      '주 1-2회 콜라겐 마스크팩',
    ],
    avoidIngredients: ['알코올 고농도 제품', '강한 스크럽'],
    lifestyleTips: [
      '자외선 차단제 매일 재도포',
      '충분한 수면 (7-8시간)',
      '항산화 식품 섭취 (베리류, 녹차)',
      '담배·과도한 음주 자제',
    ],
  },
  pigmentation: {
    description: '색소침착은 자외선 노출과 염증 후 과색소침착이 주원인이에요. 멜라닌 생성 억제와 각질 관리가 핵심이에요.',
    keyIngredients: [
      { name: '비타민 C (아스코르브산)', effect: '멜라닌 생성 억제' },
      { name: '알부틴', effect: '미백 효과' },
      { name: '트라넥삼산', effect: '색소 확산 방지' },
      { name: 'AHA (글리콜산)', effect: '각질 제거 + 톤 균일화' },
    ],
    routineTips: [
      '아침: 비타민 C 세럼 필수',
      '저녁: AHA 토너 주 2-3회',
      '미백 에센스 꾸준히 사용',
      'SPF 50+ PA++++ 자외선 차단제 필수',
    ],
    avoidIngredients: ['레몬즙 (피부 직접 도포)', '고농도 하이드로퀴논 (전문의 상담)'],
    lifestyleTips: [
      '외출 시 모자·양산 사용',
      '자외선 차단제 2-3시간마다 재도포',
      '비타민 C 풍부한 과일 섭취',
      '염증 후 색소침착 부위 자극 금지',
    ],
  },
  pores: {
    description: '넓은 모공은 과다 피지와 피부 탄력 저하가 주원인이에요. 피지 조절과 모공 타이트닝이 핵심이에요.',
    keyIngredients: [
      { name: 'BHA (살리실산)', effect: '모공 속 피지 용해' },
      { name: '나이아신아마이드', effect: '모공 축소 + 피지 조절' },
      { name: '레티놀', effect: '피부 재생 + 모공 개선' },
      { name: '클레이', effect: '피지 흡착' },
    ],
    routineTips: [
      'BHA 토너 매일 저녁 사용',
      '주 1회 클레이 마스크',
      '나이아신아마이드 세럼 아침저녁',
      '오일프리 보습제 선택',
    ],
    avoidIngredients: ['무거운 오일류', '바셀린 (코메도제닉 부위)'],
    lifestyleTips: [
      '냉수 마무리 세안',
      '모공 팩 사용 후 수렴 토너',
      '과도한 세안 자제 (피지 반동 유발)',
      '충분한 수분 섭취',
    ],
  },
  dryness: {
    description: '건조한 피부는 수분 장벽 손상과 유·수분 불균형이 주원인이에요. 보습 강화와 장벽 회복이 핵심이에요.',
    keyIngredients: [
      { name: '세라마이드', effect: '피부 장벽 회복' },
      { name: '히알루론산', effect: '수분 흡착·보유' },
      { name: '스쿠알란', effect: '유분 보충' },
      { name: '판테놀 (비타민 B5)', effect: '진정 + 보습' },
    ],
    routineTips: [
      '세안 후 3분 이내 보습제 도포',
      '토너 2-3번 레이어링',
      '저녁에 페이스 오일 추가',
      '가습기로 실내 습도 50-60% 유지',
    ],
    avoidIngredients: ['고농도 알코올', '강한 계면활성제 (SLS)', '레티놀 (건조 심할 때)'],
    lifestyleTips: [
      '뜨거운 물 세안 자제 (미지근한 물)',
      '1일 2L 이상 수분 섭취',
      '오메가-3 풍부한 식품 (연어, 견과류)',
      '실내 가습기 사용',
    ],
  },
  redness: {
    description: '홍조는 혈관 확장과 피부 염증이 주원인이에요. 진정 케어와 자극 최소화가 핵심이에요.',
    keyIngredients: [
      { name: '센텔라아시아티카', effect: '진정 + 재생' },
      { name: '알란토인', effect: '자극 완화' },
      { name: '아즈렌', effect: '항염 효과' },
      { name: '그린티 추출물', effect: '항산화 + 진정' },
    ],
    routineTips: [
      '약산성(pH 5.5) 클렌저 사용',
      '진정 토너 패딩',
      '물리적 자외선 차단제 선택',
      '새 제품 도입 시 패치테스트 필수',
    ],
    avoidIngredients: ['알코올', '향료', '에센셜 오일', '멘톨/캠퍼'],
    lifestyleTips: [
      '급격한 온도 변화 피하기',
      '매운 음식·카페인·알코올 자제',
      '스트레스 관리',
      '자외선 차단 철저히',
    ],
  },
  dullness: {
    description: '칙칙한 피부는 각질 축적과 혈액순환 저하가 주원인이에요. 각질 관리와 영양 공급이 핵심이에요.',
    keyIngredients: [
      { name: '비타민 C', effect: '브라이트닝 + 항산화' },
      { name: 'AHA (글리콜산)', effect: '각질 제거' },
      { name: '나이아신아마이드', effect: '톤 균일화' },
      { name: '글루타치온', effect: '항산화 + 미백' },
    ],
    routineTips: [
      '주 2-3회 AHA 각질 케어',
      '비타민 C 세럼 매일 아침',
      '수분 에센스 레이어링',
      '주 1회 효소 클렌저 사용',
    ],
    avoidIngredients: ['과도한 스크럽 (물리적 자극)'],
    lifestyleTips: [
      '규칙적인 운동 (혈액순환 촉진)',
      '충분한 수면',
      '항산화 식품 섭취',
      '세안 시 가볍게 마사지',
    ],
  },
};

export default function SkinSolutionScreen(): React.JSX.Element {
  const { colors, isDark, typography, spacing} = useTheme();
  const [selectedConcern, setSelectedConcern] = useState<ConcernId>('acne');

  const handleSelectConcern = useCallback((id: ConcernId): void => {
    setSelectedConcern(id);
  }, []);

  const solution = SOLUTIONS[selectedConcern];
  const selectedCategory = CONCERN_CATEGORIES.find((c) => c.id === selectedConcern);

  return (
    <ScreenContainer testID="skin-solution-screen" edges={['bottom']}>
      {/* 고민 선택 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CONCERN_CATEGORIES.map((cat) => {
          const isActive = cat.id === selectedConcern;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? brand.primary : colors.card,
                  borderColor: isActive ? brand.primary : colors.border,
                },
              ]}
              onPress={() => handleSelectConcern(cat.id)}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: isActive ? brand.primaryForeground : colors.foreground },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 설명 */}
      <Animated.View
        entering={staggeredEntry(0)}
        style={[
          styles.descCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.descTitle, { color: colors.foreground }]}>
          {selectedCategory?.emoji} {selectedCategory?.label} 솔루션
        </Text>
        <Text style={[styles.descText, { color: colors.foreground }]}>
          {solution.description}
        </Text>
      </Animated.View>

      {/* 추천 성분 */}
      <Animated.View
        entering={staggeredEntry(1)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          추천 성분
        </Text>
        {solution.keyIngredients.map((ingredient, i) => (
          <View
            key={i}
            style={[
              styles.ingredientRow,
              i < solution.keyIngredients.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.ingredientName, { color: colors.foreground }]}>
              {ingredient.name}
            </Text>
            <Text style={[styles.ingredientEffect, { color: colors.muted }]}>
              {ingredient.effect}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* 루틴 팁 */}
      <Animated.View
        entering={staggeredEntry(2)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          루틴 가이드
        </Text>
        {solution.routineTips.map((tip, i) => (
          <Text key={i} style={[styles.tipText, { color: colors.foreground }]}>
            {i + 1}. {tip}
          </Text>
        ))}
      </Animated.View>

      {/* 피해야 할 성분 */}
      <Animated.View
        entering={staggeredEntry(3)}
        style={[
          styles.sectionCard,
          { backgroundColor: isDark ? colors.card : colors.destructive + '10', borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          피해야 할 성분
        </Text>
        {solution.avoidIngredients.map((item, i) => (
          <Text key={i} style={[styles.avoidText, { color: colors.foreground }]}>
            ⚠️ {item}
          </Text>
        ))}
      </Animated.View>

      {/* 생활 습관 팁 */}
      <Animated.View
        entering={staggeredEntry(4)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          생활 습관 팁
        </Text>
        {solution.lifestyleTips.map((tip, i) => (
          <Text key={i} style={[styles.tipText, { color: colors.foreground }]}>
            • {tip}
          </Text>
        ))}
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // 칩 행
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  chipEmoji: {
    fontSize: typography.size.sm,
  },
  chipLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  // 설명 카드
  descCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  descTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  descText: {
    fontSize: typography.size.base,
    lineHeight: 24,
  },
  // 섹션 카드
  sectionCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  // 성분 행
  ingredientRow: {
    paddingVertical: spacing.sm,
  },
  ingredientName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  ingredientEffect: {
    fontSize: typography.size.sm,
    marginTop: spacing.xxs,
  },
  // 팁 텍스트
  tipText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  // 피해야 할 성분
  avoidText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
});
