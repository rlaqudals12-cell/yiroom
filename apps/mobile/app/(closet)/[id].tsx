/**
 * 옷장 아이템 상세 페이지
 */

import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Trash2, Edit2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useTheme } from '@/lib/theme';

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
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { items, isLoading, toggleFavorite, deleteItem } = useCloset();

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <SkeletonCard style={{ width: '100%', aspectRatio: 1 }} />
          <SkeletonCard style={{ marginHorizontal: 16, marginTop: 16, height: 120, borderRadius: 12 }} />
          <SkeletonCard style={{ marginHorizontal: 16, marginTop: 16, height: 80, borderRadius: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            아이템을 찾을 수 없어요
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    <SafeAreaView
      testID="closet-detail-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 이미지 */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.muted }]}>
              <Text style={styles.placeholderText}>📷</Text>
            </View>
          )}
        </View>

        {/* 기본 정보 */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderContent}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.itemCategory, { color: colors.mutedForeground }]}>
                {CLOTHING_CATEGORY_LABELS[item.subCategory as ClothingCategory] || item.subCategory}
              </Text>
            </View>
            <TouchableOpacity onPress={handleFavorite}>
              <Heart
                size={28}
                color={item.isFavorite ? '#ef4444' : colors.mutedForeground}
                fill={item.isFavorite ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>
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
        </View>

        {/* 색상 */}
        {metadata.color && metadata.color.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>색상</Text>
            <View style={styles.tagsContainer}>
              {metadata.color.map((color, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: '#8b5cf620' }]}>
                  <Text style={[styles.tagText, { color: '#8b5cf6' }]}>{color}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 계절 */}
        {metadata.season && metadata.season.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>계절</Text>
            <View style={styles.tagsContainer}>
              {metadata.season.map((season, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: '#3b82f620' }]}>
                  <Text style={[styles.tagText, { color: '#3b82f6' }]}>
                    {SEASON_LABELS[season]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 상황 */}
        {metadata.occasion && metadata.occasion.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>상황</Text>
            <View style={styles.tagsContainer}>
              {metadata.occasion.map((occasion, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: '#22c55e20' }]}>
                  <Text style={[styles.tagText, { color: '#22c55e' }]}>
                    {OCCASION_LABELS[occasion]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 태그 */}
        {item.tags && item.tags.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>태그</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Trash2 size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>삭제</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            Haptics.selectionAsync();
            Alert.alert(
              '곧 추가될 예정이에요',
              '편집 기능을 준비하고 있어요. 조금만 기다려주세요!'
            );
          }}
        >
          <Edit2 size={20} color="#fff" />
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>편집</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  editButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
