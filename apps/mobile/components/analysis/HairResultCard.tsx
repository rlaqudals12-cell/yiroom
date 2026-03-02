/**
 * 헤어 분석 결과 카드
 *
 * 얼굴형 기반 헤어스타일/컬러 추천
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';

export type FaceShapeType =
  | 'oval' | 'round' | 'square' | 'heart'
  | 'oblong' | 'diamond' | 'rectangle';

export interface HairStyle {
  id: string;
  name: string;
  suitability: number;
  description?: string;
}

export interface HairColor {
  id: string;
  name: string;
  hexColor: string;
  suitability: number;
}

export interface HairCareTip {
  id: string;
  title: string;
  description: string;
}

export interface HairResultCardProps {
  faceShape: FaceShapeType;
  confidence: number;
  recommendedStyles: HairStyle[];
  recommendedColors?: HairColor[];
  careTips?: HairCareTip[];
  /** 현재 헤어 정보 */
  currentHairInfo?: {
    length?: string;
    texture?: string;
    thickness?: string;
    scalpCondition?: string;
  };
}

const FACE_SHAPE_LABELS: Record<FaceShapeType, { label: string; emoji: string }> = {
  oval: { label: '타원형', emoji: '🥚' },
  round: { label: '둥근형', emoji: '🟡' },
  square: { label: '각진형', emoji: '⬜' },
  heart: { label: '하트형', emoji: '💛' },
  oblong: { label: '긴 얼굴형', emoji: '📐' },
  diamond: { label: '다이아몬드형', emoji: '💎' },
  rectangle: { label: '직사각형', emoji: '▬' },
};

type TabType = 'styles' | 'colors' | 'tips';

export function HairResultCard({
  faceShape,
  confidence,
  recommendedStyles,
  recommendedColors = [],
  careTips = [],
  currentHairInfo,
}: HairResultCardProps): React.ReactElement {
  const { colors, brand, module, typography, radii, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('styles');
  const shapeInfo = FACE_SHAPE_LABELS[faceShape];

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return (
    <View
      testID="hair-result-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`헤어 분석 결과: ${shapeInfo.label}, 신뢰도 ${confidence}%`}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: `${module.hair.base}15`, padding: spacing.md }]}>
        <Text style={{ fontSize: typography.size['2xl'] }}>{shapeInfo.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.faceShapeLabel, { color: colors.foreground, fontSize: typography.size.lg }]}>
            {shapeInfo.label}
          </Text>
          <View style={[styles.badge, { backgroundColor: `${module.hair.base}20`, borderRadius: radii.full }]}>
            <Text style={[styles.badgeText, { color: module.hair.base, fontSize: typography.size.xs }]}>
              신뢰도 {confidence}%
            </Text>
          </View>
        </View>
      </View>

      {/* 현재 헤어 정보 */}
      {currentHairInfo && (
        <View style={[styles.infoRow, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
          {currentHairInfo.length && (
            <View style={[styles.infoBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
              <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>
                {currentHairInfo.length}
              </Text>
            </View>
          )}
          {currentHairInfo.texture && (
            <View style={[styles.infoBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
              <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>
                {currentHairInfo.texture}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 탭 */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, marginHorizontal: spacing.md }]}>
        {[
          { key: 'styles' as TabType, label: '추천 스타일' },
          { key: 'colors' as TabType, label: '추천 컬러' },
          { key: 'tips' as TabType, label: '관리 팁' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: module.hair.base, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={{
                color: activeTab === tab.key ? module.hair.base : colors.mutedForeground,
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
        {activeTab === 'styles' && (
          <View>
            {recommendedStyles.slice(0, 5).map((style) => (
              <View key={style.id} style={[styles.styleCard, { borderBottomColor: colors.border }]}>
                <View style={styles.styleHeader}>
                  <Text style={[styles.styleName, { color: colors.foreground, fontSize: typography.size.base }]}>
                    {style.name}
                  </Text>
                  <Text style={{ color: module.hair.base, fontSize: typography.size.sm, fontWeight: '600' }}>
                    {style.suitability}%
                  </Text>
                </View>
                {/* 적합도 바 */}
                <View style={[styles.progressBg, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${style.suitability}%`,
                        backgroundColor: module.hair.base,
                        borderRadius: radii.full,
                      },
                    ]}
                  />
                </View>
                {style.description && (
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginTop: 4 }}>
                    {style.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'colors' && (
          <View>
            {recommendedColors.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                추천 컬러 정보가 없습니다
              </Text>
            ) : (
              recommendedColors.slice(0, 6).map((color) => (
                <View key={color.id} style={[styles.colorCard, { borderBottomColor: colors.border }]}>
                  <View style={[styles.colorSwatch, { backgroundColor: color.hexColor, borderRadius: radii.sm }]} />
                  <View style={styles.colorInfo}>
                    <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '500' }}>
                      {color.name}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
                      적합도 {color.suitability}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'tips' && (
          <View>
            {careTips.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                관리 팁 정보가 없습니다
              </Text>
            ) : (
              careTips.slice(0, 5).map((tip, index) => (
                <View key={tip.id} style={[styles.tipCard, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: module.hair.base, fontSize: typography.size.sm, fontWeight: '700' }}>
                    {index + 1}.
                  </Text>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>
                      {tip.title}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginTop: 2 }}>
                      {tip.description}
                    </Text>
                  </View>
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
  faceShapeLabel: { fontWeight: '700' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, marginTop: spacing.xs },
  badgeText: { fontWeight: '600' },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginTop: spacing.sm },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.smd },
  styleCard: { paddingVertical: spacing.smd, borderBottomWidth: 1 },
  styleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  styleName: { fontWeight: '600' },
  progressBg: { height: 6 },
  progressFill: { height: 6 },
  colorCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.smd, borderBottomWidth: 1 },
  colorSwatch: { width: 36, height: 36, marginRight: spacing.smx },
  colorInfo: { flex: 1 },
  tipCard: { flexDirection: 'row', paddingVertical: spacing.smd, borderBottomWidth: 1 },
});
