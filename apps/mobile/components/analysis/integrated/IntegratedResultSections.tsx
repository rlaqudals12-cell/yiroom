import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ReportEvidenceDisclosure,
  ReportTextList,
  REPORT_COLORS,
} from '@/components/analysis/report';
import type { AxisCode, PersonaProfile } from '@/lib/api';
import { BEAUTY_TEAM_QUICK_QUESTIONS } from '@/lib/coach';
import { getHorizonLabel, type ActionPlan } from '@/lib/integrated/action-plan';
import type { CrossInsights } from '@/lib/integrated/cross-insights';
import type { Curation } from '@/lib/integrated/curation';
import { ALL_STEPS } from '@/lib/integrated/next-steps';
import { radii, spacing, typography } from '@/lib/theme';

export interface IntegratedResultSectionsProps {
  persona: PersonaProfile | null;
  actionPlan: ActionPlan;
  insights: CrossInsights;
  curation: Curation;
  axesCompleted: AxisCode[];
}

const BEAUTY_TEAM_FOLLOW_UP_QUESTIONS = [
  ...BEAUTY_TEAM_QUICK_QUESTIONS.style,
  ...BEAUTY_TEAM_QUICK_QUESTIONS.color,
] as const;

/** 통합 결과의 설명·추천·후속 이동은 결론 뒤 기본 접힘으로 모은다. */
export function IntegratedResultSections({
  persona,
  actionPlan,
  insights,
  curation,
  axesCompleted,
}: IntegratedResultSectionsProps): React.JSX.Element {
  const completed = new Set(axesCompleted);
  const nextSteps = ALL_STEPS.filter((step) => completed.has(step.axis));

  return (
    <View testID="integrated-result-evidence">
      {actionPlan.items.length > 0 ? (
        <ReportEvidenceDisclosure
          summary={actionPlan.items[0]?.title}
          testID="action-plan-section"
          title="다음 행동"
        >
          <ReportTextList
            items={actionPlan.items.map(
              (item) => `${getHorizonLabel(item.horizon)} — ${item.title}. ${item.why}`
            )}
            testID="action-plan-items"
          />
        </ReportEvidenceDisclosure>
      ) : null}

      {insights.items.length > 0 ? (
        <ReportEvidenceDisclosure
          summary={insights.items[0]?.title}
          testID="cross-insights-section"
          title="축 조합 근거"
        >
          <ReportTextList
            items={insights.items.map((item) => `${item.combo} — ${item.title}. ${item.body}`)}
            testID="cross-insight-items"
          />
        </ReportEvidenceDisclosure>
      ) : null}

      {curation.items.length > 0 ? (
        <ReportEvidenceDisclosure
          summary={curation.items[0]?.title}
          testID="curation-section"
          title="통합 큐레이션"
        >
          <View style={styles.links}>
            {curation.items.map((item) => (
              <Pressable
                accessibilityRole="link"
                key={`${item.category}-${item.title}`}
                onPress={() => router.push(item.href as never)}
                style={styles.linkRow}
                testID={`curation-item-${item.category}`}
              >
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{item.title}</Text>
                  <Text style={styles.linkDescription}>{item.reason}</Text>
                </View>
                <Text style={styles.linkCta}>{item.cta}</Text>
              </Pressable>
            ))}
          </View>
        </ReportEvidenceDisclosure>
      ) : null}

      {persona && persona.keyInsights.length > 0 ? (
        <ReportEvidenceDisclosure
          summary={persona.keyInsights[0]}
          testID="persona-key-insights"
          title="정체성 해석 근거"
        >
          <ReportTextList items={persona.keyInsights} testID="persona-key-insight-items" />
        </ReportEvidenceDisclosure>
      ) : null}

      {nextSteps.length > 0 ? (
        <ReportEvidenceDisclosure
          summary={nextSteps[0]?.label}
          testID="integrated-next-steps"
          title="축별 결과 이어보기"
        >
          <View style={styles.links}>
            {nextSteps.map((step) => (
              <Pressable
                accessibilityRole="link"
                key={step.axis}
                onPress={() => router.push(step.href as never)}
                style={styles.linkRow}
              >
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{step.label}</Text>
                  <Text style={styles.linkDescription}>{step.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ReportEvidenceDisclosure>
      ) : null}

      <ReportEvidenceDisclosure
        summary={BEAUTY_TEAM_FOLLOW_UP_QUESTIONS[0]}
        testID="beauty-team-ask-section"
        title="뷰티팀에게 물어보기"
      >
        <View style={styles.questions}>
          {BEAUTY_TEAM_FOLLOW_UP_QUESTIONS.map((question, index) => (
            <Pressable
              accessibilityLabel={question}
              accessibilityRole="button"
              key={question}
              onPress={() =>
                router.push({ pathname: '/(tabs)/ask', params: { q: question } } as never)
              }
              style={styles.questionChip}
              testID={`beauty-team-question-${index}`}
            >
              <Text style={styles.questionText}>{question}</Text>
            </Pressable>
          ))}
        </View>
      </ReportEvidenceDisclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  links: {
    gap: spacing.sm,
  },
  linkRow: {
    alignItems: 'center',
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.smd,
  },
  linkText: {
    flex: 1,
    gap: spacing.xxs,
  },
  linkTitle: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  linkDescription: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  linkCta: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.xs,
    textDecorationLine: 'underline',
  },
  questions: {
    gap: spacing.smd,
  },
  questionChip: {
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
    padding: spacing.md,
  },
  questionText: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
  },
});
