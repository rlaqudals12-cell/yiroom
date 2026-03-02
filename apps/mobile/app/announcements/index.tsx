/**
 * 공지사항 화면 — 공지 목록 + BottomSheet 상세
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, ChevronRight, Megaphone, AlertTriangle, Sparkles, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing} from '@/lib/theme';
import { ScreenContainer, BottomSheet } from '@/components/ui';

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

// 샘플 데이터 (향후 API 연동)
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: '이룸 v2.0 업데이트 안내',
    content: '안녕하세요, 이룸팀이에요!\n\n이번 업데이트에서는 다음과 같은 기능이 추가되었어요:\n\n• AI 피부 분석 정확도 향상\n• 구강건강 분석 모듈 추가\n• 다크모드 지원\n• 접근성 개선\n\n더 나은 이룸으로 찾아뵐게요. 감사합니다!',
    category: 'update',
    date: '2026-03-01',
    isImportant: true,
  },
  {
    id: '2',
    title: '3월 뷰티 챌린지 시작!',
    content: '3월 한 달간 매일 스킨케어 루틴을 기록하고 뱃지를 획득하세요!\n\n🎯 참여 방법: 피부 일기 매일 작성\n🏆 보상: 스킨케어 마스터 뱃지\n📅 기간: 3/1 ~ 3/31',
    category: 'event',
    date: '2026-03-01',
    isImportant: false,
  },
  {
    id: '3',
    title: '서비스 이용약관 변경 안내',
    content: '2026년 3월 15일부터 개정된 이용약관이 적용돼요.\n\n주요 변경 사항:\n• AI 분석 결과의 참고용 안내 강화\n• 개인정보 보호 조항 구체화\n• 사용자 권리 보호 강화\n\n자세한 내용은 설정 > 이용약관에서 확인해주세요.',
    category: 'notice',
    date: '2026-02-28',
    isImportant: false,
  },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function AnnouncementsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { colors, spacing, radii, typography, brand, status } = theme;

  const [selected, setSelected] = useState<Announcement | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const handleSelect = useCallback(
    (item: Announcement) => {
      Haptics.selectionAsync();
      setSelected(item);
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
    },
    []
  );

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
                borderRadius: radii.lg,
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
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: brand.primary },
                      ]}
                    />
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
    <ScreenContainer testID="announcements-screen" scrollable={false} edges={['bottom']}>
      <FlatList
        data={ANNOUNCEMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
          flexGrow: ANNOUNCEMENTS.length === 0 ? 1 : undefined,
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
