/** 통합 분석 결과: 세션 로딩·계측만 맡기고 진단지 표현은 공용 컴포넌트에 위임한다. */
import { useAuth } from '@clerk/clerk-expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IntegratedResultReport } from '@/components/analysis/integrated';
import { REPORT_COLORS } from '@/components/analysis/report';
import { useHasClosetItems } from '@/hooks/useHasClosetItems';
import { useIntegratedSession } from '@/hooks/useIntegratedSession';
import { trackAnalysisResultView } from '@/lib/analytics/tracker';
import { isIntegratedAnalysisResult, type IntegratedAnalysisResult } from '@/lib/api/integrated';
import { radii, spacing, typography } from '@/lib/theme';

export default function IntegratedResultScreen(): React.JSX.Element {
  const { getToken } = useAuth();
  const { sessionId, payload } = useLocalSearchParams<{
    sessionId: string;
    payload?: string;
  }>();

  const initialResult = useMemo<IntegratedAnalysisResult | null>(() => {
    if (!payload || typeof payload !== 'string') return null;
    try {
      const parsed: unknown = JSON.parse(decodeURIComponent(payload));
      // 멱등 재사용 응답은 {sessionId,status,reused}뿐이라 axes가 없다. 이를 완전 결과로
      // 단언하면 보고서가 axes 접근에서 크래시하므로, 불완전 payload는 저장 결과 조회로 넘긴다.
      return isIntegratedAnalysisResult(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [payload]);

  const { result, isLoading, error } = useIntegratedSession(
    typeof sessionId === 'string' ? sessionId : null,
    initialResult
  );
  const resultSource = initialResult ? 'fresh' : 'history';
  const resultSessionId = result?.sessionId ?? null;
  const trackedResultViewRef = useRef<string | null>(null);
  const hasClosetItems = useHasClosetItems();

  useEffect(() => {
    if (!resultSessionId) return;
    const viewKey = `${resultSessionId}:${resultSource}`;
    if (trackedResultViewRef.current === viewKey) return;
    trackedResultViewRef.current = viewKey;

    void getToken()
      .catch(() => null)
      .then((token) => trackAnalysisResultView('integrated', resultSource, token));
  }, [getToken, resultSessionId, resultSource]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.ground} testID="integrated-result-loading">
        <View style={styles.state}>
          <ActivityIndicator color={REPORT_COLORS.ink} size="large" />
          <Text style={styles.stateText}>결과를 불러오는 중이에요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.ground} testID="integrated-result-error">
        <View style={styles.state}>
          <Text style={styles.stateTitle}>
            {error ? '결과를 불러오지 못했어요.' : '세션을 찾을 수 없어요.'}
          </Text>
          <Text style={styles.stateText}>새 분석을 시작해주세요.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(analysis)/integrated' as never)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>다시 시작</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <IntegratedResultReport hasClosetItems={hasClosetItems} result={result} />;
}

const styles = StyleSheet.create({
  ground: {
    backgroundColor: REPORT_COLORS.ground,
    flex: 1,
  },
  state: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stateTitle: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  stateText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: REPORT_COLORS.ink,
    borderRadius: radii.lg,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: REPORT_COLORS.paper,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
