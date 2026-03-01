/**
 * 공지사항 화면
 *
 * 앱 업데이트, 이벤트, 서비스 안내 등 공지사항을 표시한다.
 */
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useTheme } from '../../lib/theme';
import { ScreenContainer } from '../../components/ui';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'update' | 'event' | 'notice' | 'maintenance';
  isNew: boolean;
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string }> = {
  update: { emoji: '🚀', label: '업데이트' },
  event: { emoji: '🎉', label: '이벤트' },
  notice: { emoji: '📢', label: '공지' },
  maintenance: { emoji: '🔧', label: '점검' },
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: '이룸 v1.0 출시!',
    content:
      '이룸이 정식 출시되었어요! 퍼스널컬러, 피부, 체형 분석과 운동/영양 관리를 한곳에서 만나보세요.',
    date: '2026-03-01',
    type: 'update',
    isNew: true,
  },
  {
    id: '2',
    title: '헤어/메이크업 분석 추가',
    content:
      'AI 헤어 분석과 메이크업 분석 기능이 추가되었어요. 프로필에서 바로 시작해보세요!',
    date: '2026-02-28',
    type: 'update',
    isNew: true,
  },
  {
    id: '3',
    title: '봄맞이 코디 챌린지',
    content:
      '봄 시즌 코디 챌린지에 참여하고 뱃지를 받아가세요! 참여 방법: 봄 코디 사진을 올려주세요.',
    date: '2026-02-25',
    type: 'event',
    isNew: false,
  },
  {
    id: '4',
    title: '서비스 점검 안내 (완료)',
    content:
      '2/20 새벽 2시~4시 서버 점검이 완료되었어요. 이용에 불편을 드려 죄송합니다.',
    date: '2026-02-20',
    type: 'maintenance',
    isNew: false,
  },
  {
    id: '5',
    title: '개인정보처리방침 변경 안내',
    content:
      '2026년 2월 20일부터 변경된 개인정보처리방침이 적용돼요. 소셜 기능 및 AI 코치 관련 항목이 추가되었어요.',
    date: '2026-02-18',
    type: 'notice',
    isNew: false,
  },
];

export default function AnnouncementsScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string): void => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScreenContainer testID="announcements-screen" edges={['bottom']}>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        공지사항
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        이룸의 최신 소식을 확인하세요
      </Text>

      {/* 공지 목록 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_ANNOUNCEMENTS.map((item) => {
          const config = TYPE_CONFIG[item.type];
          const expanded = expandedId === item.id;

          return (
            <Pressable
              key={item.id}
              accessibilityLabel={`${item.title}${item.isNew ? ', 새 공지' : ''}`}
              onPress={() => toggleExpand(item.id)}
              style={{
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderLeftWidth: item.isNew ? 3 : 0,
                borderLeftColor: item.isNew ? brand.primary : undefined,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: typography.size.sm, marginRight: spacing.xs }}>{config?.emoji}</Text>
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                    borderRadius: radii.full,
                    backgroundColor: colors.secondary,
                    marginRight: spacing.sm,
                  }}
                >
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                    {config?.label}
                  </Text>
                </View>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, flex: 1 }}>
                  {item.date}
                </Text>
                {item.isNew && (
                  <View
                    style={{
                      paddingHorizontal: spacing.xs,
                      paddingVertical: 1,
                      borderRadius: radii.full,
                      backgroundColor: status.error,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: typography.weight.bold }}>
                      NEW
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                }}
              >
                {item.title}
              </Text>

              {expanded && (
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    color: colors.mutedForeground,
                    marginTop: spacing.sm,
                    lineHeight: 22,
                  }}
                >
                  {item.content}
                </Text>
              )}

              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  textAlign: 'right',
                  marginTop: spacing.xs,
                }}
              >
                {expanded ? '접기 ▲' : '더보기 ▼'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}
