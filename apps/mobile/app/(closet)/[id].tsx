/**
 * 옷장 아이템 상세 페이지
 */

import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Trash2, Edit2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { TwinTryonButton } from '@/components/visual-expression';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

import {
  useCloset,
  CLOTHING_CATEGORY_LABELS,
  SEASON_LABELS,
  OCCASION_LABELS,
  type ClothingCategory,
  type Season,
  type Occasion,
} from '../../lib/inventory';

export default function ItemDetailScreen() {
  const { colors, status, module: moduleTheme, spacing, radii } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { items, isLoading, toggleFavorite, deleteItem, refetch: refetchCloset } = useCloset();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCloset();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCloset]);

  const item = useMemo(() => {
    return items.find((i) => i.id === id);
  }, [items, id]);

  const handleFavorite = async () => {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(item.id);
  };

  const handleDelete = () => {
    Alert.alert('아이템 삭제', '이 아이템을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (!item) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          const success = await deleteItem(item.id);
          if (success) {
            router.back();
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <SkeletonCard style={{ width: '100%', aspectRatio: 1 }} />
          <SkeletonCard
            style={{
              marginHorizontal: spacing.md,
              marginTop: spacing.md,
              height: 120,
              borderRadius: radii.xl,
            }}
          />
          <SkeletonCard
            style={{
              marginHorizontal: spacing.md,
              marginTop: spacing.md,
              height: 80,
              borderRadius: radii.xl,
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (!item) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            아이템을 찾을 수 없어요
          </Text>
          <Pressable
            style={[styles.backButton, { backgroundColor: moduleTheme.body.dark }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.overlayForeground }]}>
              돌아가기
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const metadata = item.metadata as {
    color?: string[];
    season?: Season[];
    occasion?: Occasion[];
    size?: string;
    brand?: string;
  };

  return (
    <ScreenContainer
      testID="closet-detail-screen"
      backgroundGradient="style"
      edges={['bottom']}
      contentPadding={0}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      {/* 이미지 */}
      <Animated.View
        entering={FadeInUp.delay(0).duration(TIMING.normal)}
        style={styles.imageContainer}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.muted }]}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
      </Animated.View>

      {/* 기본 정보 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.infoCard }}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderContent}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.itemCategory, { color: colors.mutedForeground }]}>
                {CLOTHING_CATEGORY_LABELS[item.subCategory as ClothingCategory] || item.subCategory}
              </Text>
            </View>
            <Pressable onPress={handleFavorite}>
              <Heart
                size={28}
                color={item.isFavorite ? colors.destructive : colors.mutedForeground}
                fill={item.isFavorite ? colors.destructive : 'transparent'}
              />
            </Pressable>
          </View>

          {item.brand && (
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>브랜드</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.brand}</Text>
            </View>
          )}

          {metadata.size && (
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>사이즈</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{metadata.size}</Text>
            </View>
          )}

          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>착용 횟수</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.useCount}회</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 색상 */}
      {metadata.color && metadata.color.length > 0 && (
        <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.infoCard }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>색상</Text>
            <View style={styles.tagsContainer}>
              {metadata.color.map((color, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: moduleTheme.body.dark + '20' }]}
                >
                  <Text style={[styles.tagText, { color: moduleTheme.body.dark }]}>{color}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* 계절 */}
      {metadata.season && metadata.season.length > 0 && (
        <Animated.View entering={FadeInUp.delay(240).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.infoCard }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>계절</Text>
            <View style={styles.tagsContainer}>
              {metadata.season.map((season, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: status.info + '20' }]}>
                  <Text style={[styles.tagText, { color: status.info }]}>
                    {SEASON_LABELS[season]}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* 상황 */}
      {metadata.occasion && metadata.occasion.length > 0 && (
        <Animated.View entering={FadeInUp.delay(320).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.infoCard }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>상황</Text>
            <View style={styles.tagsContainer}>
              {metadata.occasion.map((occasion, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: status.success + '20' }]}>
                  <Text style={[styles.tagText, { color: status.success }]}>
                    {OCCASION_LABELS[occasion]}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* 태그 */}
      {item.tags && item.tags.length > 0 && (
        <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.infoCard }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>태그</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}
      {/* 내 AI 아바타에게 입혀보기 (ADR-115) — 승인된 트윈 + 이미지 URL 있을 때만 노출 */}
      <Animated.View
        entering={FadeInUp.delay(440).duration(TIMING.normal)}
        style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}
      >
        <TwinTryonButton garmentImageUrl={item.imageUrl} />
      </Animated.View>

      {/* 하단 액션 버튼 */}
      <View
        style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.destructive + '15' }]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color={colors.destructive} />
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>삭제</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: moduleTheme.body.dark }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/(closet)/${id}/edit`);
          }}
        >
          <Edit2 size={20} color={colors.overlayForeground} />
          <Text style={[styles.actionButtonText, { color: colors.overlayForeground }]}>편집</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoHeaderContent: {
    flex: 1,
    marginRight: spacing.smx,
  },
  itemName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: typography.size.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.smx,
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: typography.size.sm,
  },
  infoValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.smx,
    paddingVertical: 6,
    borderRadius: radii.xl,
  },
  tagText: {
    fontSize: 13,
    fontWeight: typography.weight.medium,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.smx,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.xl,
    gap: spacing.sm,
  },
  deleteButton: {},
  editButton: {},
  actionButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: spacing.md,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smx,
    borderRadius: radii.xl,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
});
