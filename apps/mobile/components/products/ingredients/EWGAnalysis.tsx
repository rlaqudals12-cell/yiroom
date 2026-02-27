/**
 * EWG 성분 분석 컴포넌트
 * @description 화장품 성분의 EWG 등급 및 안전성 표시
 */

import * as Haptics from 'expo-haptics';
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme, typography} from '../../../lib/theme';

import { useAppPreferencesStore } from '@/lib/stores';

// EWG 등급 타입
export type EWGGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface IngredientInfo {
  name: string;
  nameKo?: string;
  ewgGrade?: EWGGrade;
  functions: string[];
  isCaution?: boolean;
  isAllergen?: boolean;
  description?: string;
}

interface EWGAnalysisProps {
  /** 성분 목록 */
  ingredients: IngredientInfo[];
  /** 사용자 피부 타입 */
  skinType?: 'dry' | 'oily' | 'sensitive' | 'combination' | 'normal';
}

function getEWGCategory(grade?: EWGGrade) {
  if (!grade) return null;
  if (grade <= 2) return 'low';
  if (grade <= 6) return 'moderate';
  return 'high';
}

export function EWGAnalysis({ ingredients, skinType }: EWGAnalysisProps) {
  const { colors, status, typography } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 테마 기반 EWG 등급 설정
  const ewgConfig = useMemo(
    () => ({
      low: { label: '안전', color: status.success, bgColor: status.success + '20' },
      moderate: { label: '보통', color: status.warning, bgColor: status.warning + '20' },
      high: { label: '주의', color: status.error, bgColor: status.error + '20' },
    }),
    [status]
  );

  function getConfig(grade?: EWGGrade) {
    const category = getEWGCategory(grade);
    if (!category) return null;
    return ewgConfig[category];
  }

  // 성분 통계 계산
  const stats = {
    total: ingredients.length,
    safe: ingredients.filter((i) => i.ewgGrade && i.ewgGrade <= 2).length,
    moderate: ingredients.filter((i) => i.ewgGrade && i.ewgGrade >= 3 && i.ewgGrade <= 6).length,
    caution: ingredients.filter((i) => i.ewgGrade && i.ewgGrade >= 7).length,
    allergen: ingredients.filter((i) => i.isAllergen).length,
  };

  // 주의 성분 (EWG 7+ 또는 주의/알레르기 표시)
  const cautionIngredients = ingredients.filter(
    (i) => (i.ewgGrade && i.ewgGrade >= 7) || i.isCaution || i.isAllergen
  );

  // 표시할 성분 (기본 10개, 더보기 시 전체)
  const displayIngredients = showAll ? ingredients : ingredients.slice(0, 10);

  const handleIngredientPress = (name: string) => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    setExpandedIngredient(expandedIngredient === name ? null : name);
  };

  const renderEWGBadge = (grade?: EWGGrade) => {
    const config = getConfig(grade);
    if (!config || !grade) {
      return (
        <View style={[styles.ewgBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.ewgGrade, { color: colors.mutedForeground }]}>-</Text>
        </View>
      );
    }

    return (
      <View style={[styles.ewgBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.ewgGrade, { color: config.color }]}>{grade}</Text>
      </View>
    );
  };

  return (
    <View testID="ewg-analysis" style={[styles.container, { backgroundColor: colors.card }]}>
      {/* 요약 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>성분 분석</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          총 {stats.total}개 성분 중 {stats.safe}개 안전
        </Text>
      </View>

      {/* 등급 분포 */}
      <View style={[styles.statsRow, { backgroundColor: colors.secondary }]}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: status.success }]} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>안전 (1-2)</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.safe}개</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: status.warning }]} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>보통 (3-6)</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.moderate}개</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: status.error }]} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>주의 (7+)</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.caution}개</Text>
        </View>
      </View>

      {/* 주의 성분 알림 */}
      {cautionIngredients.length > 0 && (
        <View style={[styles.cautionBox, { backgroundColor: status.error + '15' }]}>
          <Text style={[styles.cautionTitle, { color: status.error }]}>⚠️ 주의 성분</Text>
          <Text style={[styles.cautionText, { color: status.error }]}>
            {cautionIngredients.map((i) => i.nameKo || i.name).join(', ')}
          </Text>
          {skinType === 'sensitive' && (
            <Text style={[styles.cautionWarning, { color: status.error }]}>
              민감성 피부에는 패치 테스트를 권장합니다.
            </Text>
          )}
        </View>
      )}

      {/* 성분 목록 */}
      <View style={styles.ingredientList}>
        {displayIngredients.map((ingredient) => {
          const isExpanded = expandedIngredient === ingredient.name;
          const config = getConfig(ingredient.ewgGrade);

          return (
            <Pressable
              key={ingredient.name}
              onPress={() => handleIngredientPress(ingredient.name)}
              style={({ pressed }) => [
                styles.ingredientItem,
                { backgroundColor: isExpanded ? colors.secondary : colors.background },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.ingredientHeader}>
                {renderEWGBadge(ingredient.ewgGrade)}
                <View style={styles.ingredientInfo}>
                  <Text style={[styles.ingredientName, { color: colors.foreground }]}>
                    {ingredient.nameKo || ingredient.name}
                  </Text>
                  {ingredient.nameKo && (
                    <Text style={[styles.ingredientNameEn, { color: colors.mutedForeground }]}>
                      {ingredient.name}
                    </Text>
                  )}
                </View>
                {ingredient.isAllergen && (
                  <View style={[styles.allergenBadge, { backgroundColor: status.error + '20' }]}>
                    <Text style={[styles.allergenText, { color: status.error }]}>알레르기</Text>
                  </View>
                )}
              </View>

              {isExpanded && (
                <View style={[styles.ingredientDetails, { borderTopColor: colors.border }]}>
                  {ingredient.functions.length > 0 && (
                    <View style={styles.functionRow}>
                      <Text style={[styles.functionLabel, { color: colors.mutedForeground }]}>
                        기능:
                      </Text>
                      <Text style={[styles.functionText, { color: colors.mutedForeground }]}>
                        {ingredient.functions.join(', ')}
                      </Text>
                    </View>
                  )}
                  {ingredient.description && (
                    <Text style={[styles.descriptionText, { color: colors.mutedForeground }]}>
                      {ingredient.description}
                    </Text>
                  )}
                  {config && (
                    <Text style={[styles.safetyText, { color: config.color }]}>
                      EWG {config.label} 등급 ({ingredient.ewgGrade}/10)
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 더보기 버튼 */}
      {ingredients.length > 10 && (
        <Pressable
          onPress={() => {
            if (hapticEnabled) Haptics.selectionAsync();
            setShowAll(!showAll);
          }}
          style={({ pressed }) => [styles.showMoreButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.showMoreText, { color: status.info }]}>
            {showAll ? '접기' : `+${ingredients.length - 10}개 더보기`}
          </Text>
        </Pressable>
      )}

      {/* 출처 안내 */}
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        * EWG (Environmental Working Group) 등급 기준
      </Text>
    </View>
  );
}

/**
 * EWG 분석 스켈레톤
 */
export function EWGAnalysisSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.skeleton, { width: 80, height: 20, backgroundColor: colors.border }]} />
        <View style={[styles.skeleton, { width: 120, height: 14, marginTop: 4, backgroundColor: colors.border }]} />
      </View>
      <View style={[styles.statsRow, { backgroundColor: colors.secondary }]}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statItem}>
            <View style={[styles.skeleton, { width: 60, height: 16, backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeleton, { height: 56, marginTop: 8, backgroundColor: colors.border }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.weight.semibold,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
  },
  cautionBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cautionTitle: {
    fontSize: 14,
    fontWeight: typography.weight.semibold,
    marginBottom: 4,
  },
  cautionText: {
    fontSize: 13,
  },
  cautionWarning: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  ingredientList: {
    gap: 8,
  },
  ingredientItem: {
    borderRadius: 8,
    padding: 12,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ewgBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ewgGrade: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: typography.weight.medium,
  },
  ingredientNameEn: {
    fontSize: 11,
  },
  allergenBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  allergenText: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
  },
  ingredientDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  functionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  functionLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  functionText: {
    fontSize: 12,
    flex: 1,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: typography.weight.medium,
    marginTop: 8,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: typography.weight.medium,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  skeleton: {
    borderRadius: 4,
  },
});
