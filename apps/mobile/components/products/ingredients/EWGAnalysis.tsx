/**
 * EWG 성분 분석 컴포넌트
 * @description 화장품 성분의 EWG 등급 및 안전성 표시
 */

import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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

// EWG 등급별 설정
const EWG_CONFIG = {
  low: { min: 1, max: 2, label: '안전', color: '#22C55E', bgColor: '#DCFCE7' },
  moderate: {
    min: 3,
    max: 6,
    label: '보통',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  high: {
    min: 7,
    max: 10,
    label: '주의',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
};

function getEWGCategory(grade?: EWGGrade) {
  if (!grade) return null;
  if (grade <= 2) return 'low';
  if (grade <= 6) return 'moderate';
  return 'high';
}

function getEWGConfig(grade?: EWGGrade) {
  const category = getEWGCategory(grade);
  if (!category) return null;
  return EWG_CONFIG[category];
}

export function EWGAnalysis({ ingredients, skinType }: EWGAnalysisProps) {
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(
    null
  );
  const [showAll, setShowAll] = useState(false);

  // 성분 통계 계산
  const stats = {
    total: ingredients.length,
    safe: ingredients.filter((i) => i.ewgGrade && i.ewgGrade <= 2).length,
    moderate: ingredients.filter(
      (i) => i.ewgGrade && i.ewgGrade >= 3 && i.ewgGrade <= 6
    ).length,
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
    const config = getEWGConfig(grade);
    if (!config || !grade) {
      return (
        <View style={[styles.ewgBadge, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.ewgGrade, { color: '#6B7280' }]}>-</Text>
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
    <View style={styles.container}>
      {/* 요약 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>성분 분석</Text>
        <Text style={styles.headerSubtitle}>
          총 {stats.total}개 성분 중 {stats.safe}개 안전
        </Text>
      </View>

      {/* 등급 분포 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.statLabel}>안전 (1-2)</Text>
          <Text style={styles.statValue}>{stats.safe}개</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.statLabel}>보통 (3-6)</Text>
          <Text style={styles.statValue}>{stats.moderate}개</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.statLabel}>주의 (7+)</Text>
          <Text style={styles.statValue}>{stats.caution}개</Text>
        </View>
      </View>

      {/* 주의 성분 알림 */}
      {cautionIngredients.length > 0 && (
        <View style={styles.cautionBox}>
          <Text style={styles.cautionTitle}>⚠️ 주의 성분</Text>
          <Text style={styles.cautionText}>
            {cautionIngredients.map((i) => i.nameKo || i.name).join(', ')}
          </Text>
          {skinType === 'sensitive' && (
            <Text style={styles.cautionWarning}>
              민감성 피부에는 패치 테스트를 권장합니다.
            </Text>
          )}
        </View>
      )}

      {/* 성분 목록 */}
      <View style={styles.ingredientList}>
        {displayIngredients.map((ingredient) => {
          const isExpanded = expandedIngredient === ingredient.name;
          const config = getEWGConfig(ingredient.ewgGrade);

          return (
            <Pressable
              key={ingredient.name}
              onPress={() => handleIngredientPress(ingredient.name)}
              style={({ pressed }) => [
                styles.ingredientItem,
                isExpanded && styles.ingredientItemExpanded,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.ingredientHeader}>
                {renderEWGBadge(ingredient.ewgGrade)}
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>
                    {ingredient.nameKo || ingredient.name}
                  </Text>
                  {ingredient.nameKo && (
                    <Text style={styles.ingredientNameEn}>
                      {ingredient.name}
                    </Text>
                  )}
                </View>
                {ingredient.isAllergen && (
                  <View style={styles.allergenBadge}>
                    <Text style={styles.allergenText}>알레르기</Text>
                  </View>
                )}
              </View>

              {isExpanded && (
                <View style={styles.ingredientDetails}>
                  {ingredient.functions.length > 0 && (
                    <View style={styles.functionRow}>
                      <Text style={styles.functionLabel}>기능:</Text>
                      <Text style={styles.functionText}>
                        {ingredient.functions.join(', ')}
                      </Text>
                    </View>
                  )}
                  {ingredient.description && (
                    <Text style={styles.descriptionText}>
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
          style={({ pressed }) => [
            styles.showMoreButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.showMoreText}>
            {showAll ? '접기' : `+${ingredients.length - 10}개 더보기`}
          </Text>
        </Pressable>
      )}

      {/* 출처 안내 */}
      <Text style={styles.disclaimer}>
        * EWG (Environmental Working Group) 등급 기준
      </Text>
    </View>
  );
}

/**
 * EWG 분석 스켈레톤
 */
export function EWGAnalysisSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.skeleton, { width: 80, height: 20 }]} />
        <View
          style={[styles.skeleton, { width: 120, height: 14, marginTop: 4 }]}
        />
      </View>
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statItem}>
            <View style={[styles.skeleton, { width: 60, height: 16 }]} />
          </View>
        ))}
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeleton, { height: 56, marginTop: 8 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
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
    color: '#6B7280',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  cautionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cautionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  cautionText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  cautionWarning: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  ingredientList: {
    gap: 8,
  },
  ingredientItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  ingredientItemExpanded: {
    backgroundColor: '#F3F4F6',
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
    fontWeight: '700',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  ingredientNameEn: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  allergenBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  allergenText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
  },
  ingredientDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  functionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  functionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  functionText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  descriptionText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 4,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});
