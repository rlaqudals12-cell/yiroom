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
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            아이템을 찾을 수 없어요
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
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
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.placeholder, isDark && styles.placeholderDark]}
            >
              <Text style={styles.placeholderText}>📷</Text>
            </View>
          )}
        </View>

        {/* 기본 정보 */}
        <View style={[styles.infoCard, isDark && styles.cardDark]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderContent}>
              <Text style={[styles.itemName, isDark && styles.textLight]}>
                {item.name}
              </Text>
              <Text style={[styles.itemCategory, isDark && styles.textMuted]}>
                {CLOTHING_CATEGORY_LABELS[
                  item.subCategory as ClothingCategory
                ] || item.subCategory}
              </Text>
            </View>
            <TouchableOpacity onPress={handleFavorite}>
              <Heart
                size={28}
                color={item.isFavorite ? '#ef4444' : '#999'}
                fill={item.isFavorite ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {item.brand && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textMuted]}>
                브랜드
              </Text>
              <Text style={[styles.infoValue, isDark && styles.textLight]}>
                {item.brand}
              </Text>
            </View>
          )}

          {metadata.size && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textMuted]}>
                사이즈
              </Text>
              <Text style={[styles.infoValue, isDark && styles.textLight]}>
                {metadata.size}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDark && styles.textMuted]}>
              착용 횟수
            </Text>
            <Text style={[styles.infoValue, isDark && styles.textLight]}>
              {item.useCount}회
            </Text>
          </View>
        </View>

        {/* 색상 */}
        {metadata.color && metadata.color.length > 0 && (
          <View style={[styles.infoCard, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              색상
            </Text>
            <View style={styles.tagsContainer}>
              {metadata.color.map((color, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: '#8b5cf620' }]}
                >
                  <Text style={[styles.tagText, { color: '#8b5cf6' }]}>
                    {color}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 계절 */}
        {metadata.season && metadata.season.length > 0 && (
          <View style={[styles.infoCard, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              계절
            </Text>
            <View style={styles.tagsContainer}>
              {metadata.season.map((season, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: '#3b82f620' }]}
                >
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
          <View style={[styles.infoCard, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              상황
            </Text>
            <View style={styles.tagsContainer}>
              {metadata.occasion.map((occasion, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: '#22c55e20' }]}
                >
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
          <View style={[styles.infoCard, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              태그
            </Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: '#f5f5f5' }]}
                >
                  <Text style={[styles.tagText, { color: '#666' }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View style={[styles.actionBar, isDark && styles.actionBarDark]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
            삭제
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            // TODO: 편집 화면
            Haptics.selectionAsync();
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
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderDark: {
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    fontSize: 64,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
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
    color: '#111',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionBarDark: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#2a2a2a',
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
    color: '#666',
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
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
