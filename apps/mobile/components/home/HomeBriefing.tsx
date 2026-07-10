/**
 * HomeBriefing — [오늘] 탭 상단 "전속 뷰티팀의 아침 메시지" (ADR-114 / ADR-118)
 *
 * 웹 홈(DailyBriefing)의 모바일 패리티. 문장·배색은 웹 /api/briefing이 조립하고(정본 1곳),
 * 이 컴포넌트는 렌더만 한다. 구성:
 *   1) 브리핑 레터 — 인사 · 관찰 · 조언 · 맺음말
 *   2) 나의 퍼스널컬러 스와치(이름 포함)
 *   3) 오늘의 스타일 배색 블록(색 + 역할)
 *   4) 물어보기 인풋 → /(tabs)/ask
 *
 * 신규 유저(분석 0건)면 렌더하지 않는다(홈의 기존 첫 분석 유도 유지). 오프라인이면
 * 마지막 브리핑을 "오프라인" 배너와 함께 보여준다(홈이 비지 않게 — 정직 안내).
 *
 * @see apps/web/app/(main)/home/_components/DailyBriefing.tsx
 */
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronRight, Shirt, Sparkles, WifiOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { useBriefing } from '../../hooks/useBriefing';
import { useTheme } from '../../lib/theme';

export interface HomeBriefingProps {
  style?: ViewStyle;
  testID?: string;
}

export function HomeBriefing({
  style,
  testID = 'home-briefing',
}: HomeBriefingProps): React.JSX.Element | null {
  const { colors, brand, spacing, radii, typography, isDark } = useTheme();
  const router = useRouter();
  const { data, stale, isLoading } = useBriefing();
  const [question, setQuestion] = useState('');

  // 로딩 중이거나, 브리핑이 없거나(에러·캐시 없음), 신규 유저(분석 0건)면
  // 브리핑 섹션을 숨긴다 — 홈의 기존 퀵액션/첫 분석 유도가 그대로 노출된다.
  if (isLoading || !data || !data.hasAnalyses) return null;

  const { briefing, myColors, todayStyle } = data;

  function handleAsk(): void {
    const q = question.trim();
    // 라우트 그룹 경로는 타입 라우터가 리터럴로 못 잡아 as never (index.tsx 관례와 동일)
    router.push(
      q ? ({ pathname: '/(tabs)/ask', params: { q } } as never) : ('/(tabs)/ask' as never)
    );
  }

  return (
    <View style={[{ marginBottom: spacing.md }, style]} testID={testID}>
      {/* 오프라인 배너 — 마지막 브리핑임을 정직하게 안내 */}
      {stale && (
        <View
          style={[
            styles.staleBanner,
            {
              backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB',
              borderRadius: radii.lg,
            },
          ]}
          testID="home-briefing-stale"
        >
          <WifiOff size={14} color={isDark ? '#FBBF24' : '#B45309'} strokeWidth={2} />
          <Text style={{ color: isDark ? '#FBBF24' : '#B45309', fontSize: typography.size.xs }}>
            오프라인 — 마지막 브리핑이에요
          </Text>
        </View>
      )}

      {/* 1) 브리핑 레터 */}
      <View
        style={[
          styles.letter,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? 'rgba(236,72,153,0.25)' : '#FBD5E6',
            borderRadius: radii.xl,
            padding: spacing.md + 2,
          },
        ]}
        testID="home-briefing-letter"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.smx }}>
          <View
            style={[styles.avatar, { backgroundColor: brand.primary, marginRight: spacing.xs }]}
          >
            <Sparkles size={14} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            전속 뷰티팀
          </Text>
        </View>

        <Text
          style={{
            color: colors.foreground,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
          }}
        >
          {briefing.greeting}
        </Text>

        {briefing.observation ? (
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.sm,
              marginTop: spacing.xs,
              lineHeight: typography.size.sm * 1.5,
            }}
          >
            {briefing.observation}
          </Text>
        ) : null}

        {briefing.advice.length > 0 && (
          <View style={{ marginTop: spacing.smx, gap: spacing.xs }}>
            {briefing.advice.map((line, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}
              >
                <ArrowRight
                  size={14}
                  color={brand.primary}
                  strokeWidth={2}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{
                    flex: 1,
                    color: colors.foreground,
                    fontSize: typography.size.sm,
                    lineHeight: typography.size.sm * 1.5,
                  }}
                >
                  {line}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
            marginTop: spacing.smx,
          }}
        >
          {briefing.closing}
        </Text>
      </View>

      {/* 2) 나의 퍼스널컬러 스와치 */}
      {myColors && myColors.colors.length > 0 && (
        <View style={{ marginTop: spacing.smx }} testID="home-briefing-my-colors">
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
              marginBottom: spacing.xs,
              paddingHorizontal: spacing.xxs,
            }}
          >
            나의 퍼스널컬러
          </Text>
          <View
            style={[
              styles.swatchRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
                padding: spacing.md,
              },
            ]}
          >
            <View style={{ flex: 1, flexDirection: 'row', gap: spacing.xs }}>
              {myColors.colors.slice(0, 4).map((c, i) => (
                <View key={`${c.hex}-${i}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View
                    style={[styles.swatch, { backgroundColor: c.hex }]}
                    testID="home-briefing-swatch"
                    accessibilityLabel={c.name || c.hex}
                  />
                  {c.name ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 10,
                        textAlign: 'center',
                      }}
                    >
                      {c.name}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={2} />
          </View>
        </View>
      )}

      {/* 3) 오늘의 스타일 배색 */}
      <View style={{ marginTop: spacing.smx }} testID="home-briefing-style">
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            marginBottom: spacing.xs,
            paddingHorizontal: spacing.xxs,
          }}
        >
          오늘의 스타일
        </Text>
        <View
          style={[
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
              padding: spacing.md,
            },
          ]}
        >
          {todayStyle.outfit && (
            <View
              style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.smx }}
              testID="home-briefing-outfit"
            >
              {todayStyle.outfit.colors.map((c) => (
                <View key={c.role} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View
                    style={[styles.outfitBlock, { backgroundColor: c.hex }]}
                    testID="home-briefing-outfit-block"
                    accessibilityLabel={`${c.role} ${c.name}`}
                  />
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 10,
                      fontWeight: typography.weight.medium,
                    }}
                  >
                    {c.role}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={{ color: colors.mutedForeground, fontSize: 9, textAlign: 'center' }}
                  >
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smx }}>
            <View
              style={[
                styles.styleIcon,
                { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)' },
              ]}
            >
              <Shirt size={18} color="#3B82F6" strokeWidth={2} />
            </View>
            <Text style={{ flex: 1, color: colors.foreground, fontSize: typography.size.sm }}>
              {todayStyle.fashionTip ??
                (todayStyle.outfit
                  ? '내 베스트 컬러로 짠 오늘의 배색이에요'
                  : '오늘 날씨와 내 체형에 맞는 코디를 골라줄게요')}
            </Text>
          </View>
        </View>
      </View>

      {/* 4) 물어보기 인풋 → /(tabs)/ask */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.smx,
        }}
        testID="home-briefing-ask"
      >
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="무엇이든 물어보세요 — 피부·옷·헤어"
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={handleAsk}
          returnKeyType="send"
          testID="home-briefing-ask-input"
          style={[
            styles.askInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.full,
              color: colors.foreground,
              fontSize: typography.size.sm,
            },
          ]}
        />
        <Pressable
          onPress={handleAsk}
          accessibilityLabel="물어보기"
          testID="home-briefing-ask-send"
          style={[styles.askSend, { backgroundColor: brand.primary }]}
        >
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  letter: {
    borderWidth: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  outfitBlock: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  styleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askInput: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  askSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
