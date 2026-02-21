/**
 * 알림 인박스 스크린
 * 받은 알림 목록 표시
 */
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/theme';

// 알림 항목 (향후 DB 연동)
interface NotificationItem {
  id: string;
  emoji: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// 초기에는 빈 상태 + 샘플 알림으로 구성
const SAMPLE_NOTIFICATIONS: NotificationItem[] = [];

export default function NotificationsScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();

  const notifications = SAMPLE_NOTIFICATIONS;

  return (
    <SafeAreaView
      testID="notifications-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md + 4 }}>
        {/* 헤더 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            알림
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            최근 받은 알림을 확인하세요
          </Text>
        </View>

        {/* 알림 목록 */}
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: item.read ? colors.card : brand.primary + '10',
                borderRadius: radii.lg,
                padding: spacing.md,
                marginBottom: spacing.sm,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.sm + 2,
              }}
            >
              <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: typography.size.base,
                      fontWeight: item.read
                        ? typography.weight.normal
                        : typography.weight.semibold,
                      color: colors.foreground,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                    }}
                  >
                    {item.time}
                  </Text>
                </View>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: typography.size.sm,
                    color: colors.mutedForeground,
                    lineHeight: 20,
                  }}
                >
                  {item.body}
                </Text>
              </View>
            </View>
          ))
        ) : (
          /* 빈 상태 */
          <View
            style={{
              alignItems: 'center',
              paddingVertical: spacing.xl + spacing.lg,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔔</Text>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              아직 알림이 없어요
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              운동 리마인더, 식단 기록 알림 등{'\n'}설정에서 알림을 활성화해보세요
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
