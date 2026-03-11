/**
 * 공지사항 화면 — 공지 목록 + BottomSheet 상세
 */
import * as Haptics from 'expo-haptics';
import { Bell, ChevronRight, Megaphone, AlertTriangle, Sparkles, Info } from 'lucide-react-native';
import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenContainer, BottomSheet } from '@/components/ui';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'update' | 'notice' | 'event' | 'maintenance';
  date: string;
  isImportant: boolean;
}

const CATEGORY_CONFIG: Record<
  Announcement['category'],
  { label: string; color: (t: ReturnType<typeof useTheme>) => string; Icon: typeof Bell }
> = {
  update: { label: '업데이트', color: (t) => t.brand.primary, Icon: Sparkles },
  notice: { label: '공지', color: (t) => t.status.info, Icon: Info },
  event: { label: '이벤트', color: (t) => t.status.success, Icon: Megaphone },
  maintenance: { label: '점검', color: (t) => t.status.warning, Icon: AlertTriangle },
};

// 샘플 데이터 (DB 비어있을 때 폴백)
const FALLBACK_announcements: Announcement[] = [
  {
    id: 'fallback-1',
    title: '이룸에 오신 것을 환영해요!',
    content:
      '안녕하세요, 이룸팀이에요!\n\n이룸은 AI 기반 통합 웰니스 플랫폼이에요.\n\n• 퍼스널컬러, 피부, 체형 AI 분석\n• 맞춤 운동·영양 플랜\n• 뷰티 제품 추천\n\n새로운 소식이 생기면 이곳에서 알려드릴게요.',
    category: 'notice',
    date: new Date().toISOString().split('T')[0],
    isImportant: false,
  },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function AnnouncementsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { colors, spacing, radii, typography, brand } = theme;
  const supabase = useClerkSupabaseClient();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Supabase에서 공지사항 조회
  useEffect(() => {
    async function fetchAnnouncements(): Promise<void> {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, content, category, created_at, is_important')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          setAnnouncements(
            data.map((row) => ({
              id: row.id,
              title: row.title,
              content: row.content,
              category: row.category as Announcement['category'],
              date: row.created_at?.split('T')[0] ?? '',
              isImportant: row.is_important ?? false,
            }))
          );
        } else {
          setAnnouncements(FALLBACK_announcements);
        }
      } catch {
        // DB 테이블 미존재 또는 에러 시 폴백
        setAnnouncements(FALLBACK_announcements);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnouncements();
  }, [supabase]);

  const handleSelect = useCallback((item: Announcement) => {
    Haptics.selectionAsync();
    setSelected(item);
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Announcement; index: number }) => {
      const isRead = readIds.has(item.id);
      const config = CATEGORY_CONFIG[item.category];
      const catColor = config.color(theme);
      const CatIcon = config.Icon;

      return (
        <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
          <Pressable
            style={[
              styles.announcementItem,
              {
                backgroundColor: isRead ? colors.card : colors.card,
                borderColor: item.isImportant ? catColor + '40' : colors.border,
                borderRadius: radii.xl,
                padding: spacing.md,
                marginBottom: spacing.sm,
                opacity: isRead ? 0.7 : 1,
              },
            ]}
            onPress={() => handleSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={`${config.label}: ${item.title}${isRead ? ', 읽음' : ', 안 읽음'}`}
          >
            <View style={styles.itemHeader}>
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor: catColor + '15',
                    borderRadius: radii.full,
                    width: 36,
                    height: 36,
                  },
                ]}
              >
                <CatIcon size={18} color={catColor} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <View style={styles.titleRow}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: typography.size.sm,
                      fontWeight: isRead ? typography.weight.normal : typography.weight.semibold,
                      color: colors.foreground,
                    }}
                  >
                    {item.title}
                  </Text>
                  {!isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: brand.primary }]} />
                  )}
                </View>
                <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: catColor + '15',
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xxs,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: catColor,
                        fontWeight: typography.weight.medium,
                      }}
                    >
                      {config.label}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                      marginLeft: spacing.sm,
                    }}
                  >
                    {formatDate(item.date)}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [readIds, colors, spacing, radii, typography, brand, theme, handleSelect]
  );

  return (
    <ScreenContainer
      testID="announcements-screen"
      scrollable={false}
      edges={['bottom']}
      backgroundGradient="profile"
    >
      {isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      )}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
          flexGrow: announcements.length === 0 ? 1 : undefined,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📢</Text>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.xs,
              }}
            >
              공지사항이 없어요
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                textAlign: 'center',
              }}
            >
              새로운 소식이 생기면 알려드릴게요
            </Text>
          </View>
        }
      />

      {/* 상세 BottomSheet */}
      <BottomSheet
        isVisible={!!selected}
        onClose={() => setSelected(null)}
        snapPoints={['80%']}
        title={selected?.title}
        testID="announcement-detail-sheet"
      >
        {selected && (
          <View>
            <View style={[styles.detailMeta, { marginBottom: spacing.md }]}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: CATEGORY_CONFIG[selected.category].color(theme) + '15',
                    borderRadius: radii.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: CATEGORY_CONFIG[selected.category].color(theme),
                    fontWeight: typography.weight.medium,
                  }}
                >
                  {CATEGORY_CONFIG[selected.category].label}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginLeft: spacing.sm,
                }}
              >
                {formatDate(selected.date)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                lineHeight: typography.size.sm * 1.8,
              }}
            >
              {selected.content}
            </Text>
          </View>
        )}
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  announcementItem: {
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {},
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
