import { FEATURE_FLAGS, STYLING_PRINCIPLES, type StylingBodyType } from '@yiroom/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getOutfitExamples } from '@/lib/color-recommendations';
import { spacing, typography } from '@/lib/theme';

import { ReportDivider, ReportTextList } from '../report';
import { REPORT_COLORS } from '../report/tokens';

export interface BodyReportEvidenceProps {
  bodyType: StylingBodyType;
  bodyTypeLabel: string;
}

/** 기존 보라·파랑·핑크 카드 3개를 한 장의 접힌 스타일 근거로 합친다. */
export function BodyReportEvidence({
  bodyType,
  bodyTypeLabel,
}: BodyReportEvidenceProps): React.JSX.Element {
  const principles = STYLING_PRINCIPLES[bodyType] ?? [];
  // 퍼스널컬러 미분석 경로의 기존 중립 예시(Autumn)를 유지하되 이를 명시한다.
  const outfits = getOutfitExamples(bodyType, 'Autumn');

  return (
    <View style={styles.container} testID="body-report-style-evidence">
      <ReportTextList
        heading={`${bodyTypeLabel} 스타일링 원칙`}
        items={principles.map(
          (principle) => `${principle.title} — ${principle.rationale} ${principle.application}`
        )}
        testID="body-report-principles"
      />
      {outfits.length > 0 ? (
        <>
          <ReportDivider testID="body-report-outfit-divider" />
          <Text style={styles.note}>퍼스널 컬러를 아직 반영하지 않은 중립 색상 예시예요.</Text>
          <ReportTextList
            heading="추천 코디 예시"
            items={outfits.map((outfit) => `${outfit.title} — ${outfit.items.join(' · ')}`)}
            testID="body-report-outfits"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(analysis)/personal-color')}
            style={styles.link}
            testID="body-report-personal-color-link"
          >
            <Text style={styles.linkText}>퍼스널 컬러 분석으로 내 색 반영하기</Text>
          </Pressable>
        </>
      ) : null}
      <ReportDivider testID="body-report-closet-divider" />
      {FEATURE_FLAGS.CLOSET_INTEGRATION ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(closet)')}
          style={styles.link}
          testID="body-report-closet-link"
        >
          <Text style={styles.linkText}>내 옷장으로 이동해서 조합 보기</Text>
        </Pressable>
      ) : (
        <Text style={styles.note} testID="body-report-closet-coming-soon">
          내 옷장 조합 기능은 준비 중이에요.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  note: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  link: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
  },
  linkText: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    textDecorationLine: 'underline',
  },
});
