/**
 * 메이크업 분석 결과 카드
 *
 * 언더톤 기반 메이크업 추천
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';

export type UndertoneType = 'warm' | 'cool' | 'neutral';

export interface MakeupColorCategory {
  id: string;
  category: string;
  colors: Array<{ name: string; hex: string }>;
}

export interface MakeupStyle {
  id: string;
  name: string;
  description: string;
  suitability: number;
}

export interface MakeupResultCardProps {
  undertone: UndertoneType;
  overallScore: number;
  confidence: number;
  /** 얼굴 특징 */
  features?: {
    eyeShape?: string;
    lipShape?: string;
    faceShape?: string;
  };
  /** 추천 컬러 카테고리 */
  colorCategories?: MakeupColorCategory[];
  /** 추천 스타일 */
  styles?: MakeupStyle[];
  /** 인사이트 텍스트 */
  insight?: string;
}

const UNDERTONE_INFO: Record<UndertoneType, { label: string; emoji: string; description: string }> = {
  warm: { label: '웜톤', emoji: '🌅', description: '노란/골드 계열이 잘 어울려요' },
  cool: { label: '쿨톤', emoji: '❄️', description: '핑크/실버 계열이 잘 어울려요' },
  neutral: { label: '뉴트럴', emoji: '⚖️', description: '다양한 색상이 잘 어울려요' },
};

type TabType = 'colors' | 'styles';

export function MakeupResultCard({
  undertone,
  overallScore,
  confidence,
  features,
  colorCategories = [],
  styles: makeupStyles = [],
  insight,
}: MakeupResultCardProps): React.ReactElement {
  const { colors, brand, module, status, typography, radii, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const toneInfo = UNDERTONE_INFO[undertone];

  const handleTabChange = useCallback((tab: TabType) => setActiveTab(tab), []);

  return (
    <View
      testID="makeup-result-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`메이크업 분석 결과: ${toneInfo.label}, 점수 ${overallScore}점`}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: `${module.makeup.base}15`, padding: spacing.md }]}>
        <Text style={{ fontSize: typography.size['2xl'] }}>{toneInfo.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.toneLabel, { color: colors.foreground, fontSize: typography.size.lg }]}>
            {toneInfo.label}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            {toneInfo.description}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: colors.background, borderRadius: radii.md }]}>
          <Text style={{ color: module.makeup.base, fontSize: typography.size.xl, fontWeight: '700' }}>
            {overallScore}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>점</Text>
        </View>
      </View>

      {/* 얼굴 특징 뱃지 */}
      {features && (
        <View style={[styles.featureRow, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
          {features.eyeShape && (
            <View style={[styles.featureBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
              <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>
                👁️ {features.eyeShape}
              </Text>
            </View>
          )}
          {features.lipShape && (
            <View style={[styles.featureBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
              <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>
                👄 {features.lipShape}
              </Text>
            </View>
          )}
          {features.faceShape && (
            <View style={[styles.featureBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
              <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>
                🔲 {features.faceShape}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 인사이트 */}
      {insight && (
        <View style={[styles.insightBox, { backgroundColor: `${module.makeup.base}10`, margin: spacing.md, borderRadius: radii.md, padding: spacing.sm }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, lineHeight: 20 }}>
            💡 {insight}
          </Text>
        </View>
      )}

      {/* 탭 */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, marginHorizontal: spacing.md }]}>
        {[
          { key: 'colors' as TabType, label: '추천 컬러' },
          { key: 'styles' as TabType, label: '추천 스타일' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: module.makeup.base, borderBottomWidth: 2 }]}
          >
            <Text
              style={{
                color: activeTab === tab.key ? module.makeup.base : colors.mutedForeground,
                fontSize: typography.size.sm,
                fontWeight: activeTab === tab.key ? '600' : '400',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      <View style={{ padding: spacing.md }}>
        {activeTab === 'colors' && (
          <View>
            {colorCategories.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                추천 컬러 정보가 없습니다
              </Text>
            ) : (
              colorCategories.map((cat) => (
                <View key={cat.id} style={[styles.colorCategory, { marginBottom: spacing.md }]}>
                  <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: 8 }}>
                    {cat.category}
                  </Text>
                  <View style={styles.swatchRow}>
                    {cat.colors.slice(0, 6).map((c, i) => (
                      <View key={i} style={styles.swatchItem}>
                        <View
                          style={[styles.swatch, { backgroundColor: c.hex, borderRadius: radii.full, borderColor: colors.border }]}
                        />
                        <Text style={{ color: colors.mutedForeground, fontSize: 10, textAlign: 'center' }}>
                          {c.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'styles' && (
          <View>
            {makeupStyles.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                추천 스타일 정보가 없습니다
              </Text>
            ) : (
              makeupStyles.slice(0, 6).map((s) => (
                <View key={s.id} style={[styles.styleItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.styleHeader}>
                    <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>
                      {s.name}
                    </Text>
                    <Text style={{ color: module.makeup.base, fontSize: typography.size.xs, fontWeight: '600' }}>
                      {s.suitability}%
                    </Text>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginTop: 2 }}>
                    {s.description}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smx },
  headerText: { flex: 1 },
  toneLabel: { fontWeight: '700' },
  scoreBadge: { alignItems: 'center', paddingHorizontal: spacing.smx, paddingVertical: 6 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  insightBox: {},
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginTop: spacing.sm },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.smd },
  colorCategory: {},
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.smd },
  swatchItem: { alignItems: 'center', width: 44 },
  swatch: { width: 32, height: 32, borderWidth: 1, marginBottom: spacing.xs },
  styleItem: { paddingVertical: spacing.smd, borderBottomWidth: 1 },
  styleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
