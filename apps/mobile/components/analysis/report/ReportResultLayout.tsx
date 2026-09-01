import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View, type ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentReportModal } from '@/components/reporting';
import { trackAnalysisResultView, type MobileAnalysisType } from '@/lib/analytics/tracker';
import { shadows } from '@/lib/theme';

import { ReportDivider } from './ReportDivider';
import { ReportEvidenceDisclosure } from './ReportEvidenceDisclosure';
import { ReportHero } from './ReportHero';
import { reportResultStyles as styles } from './ReportResultLayout.styles';
import { REPORT_COLORS } from './tokens';

export type ReportModuleKey = 'personalColor' | 'skin' | 'body' | 'hair' | 'makeup';

export interface ReportSection {
  key: string;
  title: string;
  summary?: string;
  content: ReactNode;
}

export interface ReportResultLayoutProps {
  moduleKey: ReportModuleKey;
  eyebrow: string;
  verdict: string;
  subtitle?: string;
  imageUri?: string;
  imageStyle?: ImageStyle;
  attributes?: ReactNode;
  conclusion?: ReactNode;
  /** 진단지 본문과 분리해 보여줄 공유·저장 후속 표면. */
  shareContent?: ReactNode;
  sections: ReportSection[];
  confidence?: number;
  /** 같은 사진에서 같은 판정을 지향하는 설계 목표 안내. */
  reproducibilityText?: string;
  usedFallback?: boolean;
  saveFailed?: boolean;
  onSaveRetry?: () => void;
  primaryActionText: string;
  onPrimaryAction: () => void;
  retryPath: string;
  /** 저장된 분석 row id. 저장 실패 결과는 `unsaved:<axis>`로 명시한다. */
  reportTargetId: string;
  testID?: string;
}

const RESULT_ANALYSIS_TYPES: Record<ReportModuleKey, MobileAnalysisType> = {
  personalColor: 'personal-color',
  skin: 'skin',
  body: 'body',
  hair: 'hair',
  makeup: 'makeup',
};

const NEXT_ACTION_MAP: Record<
  ReportModuleKey,
  { label: string; description: string; route: string }
> = {
  personalColor: {
    label: '피부 분석도 이어서 해보세요',
    description: '색에 이어 피부 상태까지 함께 확인해요.',
    route: '/(analysis)/skin',
  },
  skin: {
    label: '체형 분석도 이어서 해보세요',
    description: '피부에 이어 나에게 맞는 실루엣을 확인해요.',
    route: '/(analysis)/body',
  },
  body: {
    label: '헤어 분석도 이어서 해보세요',
    description: '체형에 이어 모발과 두피 상태를 확인해요.',
    route: '/(analysis)/hair',
  },
  hair: {
    label: '메이크업 분석도 이어서 해보세요',
    description: '헤어에 이어 얼굴형과 메이크업 방향을 확인해요.',
    route: '/(analysis)/makeup',
  },
  makeup: {
    label: '퍼스널 컬러도 이어서 확인해보세요',
    description: '메이크업 색을 고를 기준을 함께 확인해요.',
    route: '/(analysis)/personal-color',
  },
};

/**
 * 5축 결과 전용 진단지 셸.
 * 구형 ResultLayout과 분리해 축별 전환·검증이 끝난 화면만 이 계약을 사용한다.
 */
export function ReportResultLayout({
  moduleKey,
  eyebrow,
  verdict,
  subtitle,
  imageUri,
  imageStyle,
  attributes,
  conclusion,
  shareContent,
  sections,
  confidence,
  reproducibilityText,
  usedFallback = false,
  saveFailed = false,
  onSaveRetry,
  primaryActionText,
  onPrimaryAction,
  retryPath,
  reportTargetId,
  testID = 'report-result-layout',
}: ReportResultLayoutProps): React.JSX.Element {
  const { getToken, isSignedIn } = useAuth();
  const trackedResultTypeRef = useRef<MobileAnalysisType | null>(null);
  const analysisType = RESULT_ANALYSIS_TYPES[moduleKey];
  const nextAction = NEXT_ACTION_MAP[moduleKey];
  const [reportVisible, setReportVisible] = useState(false);

  useEffect(() => {
    if (!isSignedIn || trackedResultTypeRef.current === analysisType) return;

    let cancelled = false;
    void getToken()
      .then((token) => {
        if (cancelled || !token || trackedResultTypeRef.current === analysisType) return;
        trackedResultTypeRef.current = analysisType;
        void trackAnalysisResultView(analysisType, 'result-screen', token);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [analysisType, getToken, isSignedIn]);

  const handleGoHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleRetry = useCallback(() => {
    router.replace(retryPath as never);
  }, [retryPath]);

  return (
    <SafeAreaView style={styles.ground} testID={testID}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.sheet, shadows.card]} testID={`${testID}-sheet`}>
          <ReportHero
            eyebrow={eyebrow}
            subtitle={subtitle}
            testID={`${testID}-hero`}
            title={verdict}
          />

          {usedFallback ? (
            <View
              accessibilityRole="alert"
              style={styles.fallbackNotice}
              testID={`${testID}-fallback`}
            >
              <Text style={styles.fallbackTitle}>예시 결과 · 낮은 신뢰도</Text>
              <Text style={styles.fallbackText}>
                AI 분석이 원활하지 않아 예시 결과를 보여드려요. 다시 분석하면 달라질 수 있어요.
              </Text>
            </View>
          ) : null}

          {saveFailed ? (
            <View
              accessibilityRole="alert"
              style={styles.saveNotice}
              testID={`${testID}-save-failed`}
            >
              <View style={styles.saveTitleRow}>
                <AlertTriangle color={REPORT_COLORS.warningInk} size={17} strokeWidth={1.75} />
                <Text style={styles.saveTitle}>분석 결과를 기록에 저장하지 못했어요</Text>
              </View>
              <Text style={styles.saveText}>
                결과는 지금 확인할 수 있지만, 다시 방문하면 불러오지 못할 수 있어요.
              </Text>
              {onSaveRetry ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onSaveRetry}
                  style={styles.saveRetry}
                  testID={`${testID}-save-retry`}
                >
                  <Text style={styles.saveRetryText}>다시 분석하기</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {imageUri ? (
            <Image
              accessibilityLabel={`${eyebrow}에 사용한 분석 사진`}
              resizeMode="cover"
              source={{ uri: imageUri }}
              style={[styles.image, imageStyle]}
              testID={`${testID}-image`}
            />
          ) : null}

          {attributes ? <View style={styles.attributes}>{attributes}</View> : null}
          {conclusion ? <View style={styles.conclusion}>{conclusion}</View> : null}

          {sections.map((section) => (
            <ReportEvidenceDisclosure
              key={section.key}
              summary={section.summary}
              testID={`${testID}-section-${section.key}`}
              title={section.title}
            >
              {section.content}
            </ReportEvidenceDisclosure>
          ))}

          <ReportEvidenceDisclosure
            summary="AI를 활용한 참고용 결과예요"
            testID={`${testID}-section-ai-notice`}
            title="분석 안내"
          >
            <Text style={styles.evidenceText}>
              이룸은 AI 기술을 사용하여 분석 결과를 제공해요. 결과는 참고용이며, 정확한 진단이
              필요한 경우 전문가 상담을 권장해요.
            </Text>
          </ReportEvidenceDisclosure>

          <ReportDivider testID={`${testID}-trust-divider`} />
          <View style={styles.trustFooter} testID={`${testID}-trust`}>
            <Text style={styles.trustText}>
              {usedFallback
                ? '예시 결과 · 낮은 신뢰도'
                : typeof confidence === 'number' && confidence > 0
                  ? `분석 신뢰도 ${Math.round(confidence * 100)}%`
                  : 'AI 분석 결과'}
            </Text>
            {reproducibilityText ? (
              <Text
                style={[styles.trustText, styles.trustDetailText]}
                testID={`${testID}-trust-reproducibility`}
              >
                {reproducibilityText}
              </Text>
            ) : null}
          </View>
        </View>

        {shareContent ? <View testID={`${testID}-share`}>{shareContent}</View> : null}

        <View style={styles.followups} testID={`${testID}-followups`}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(nextAction.route as never)}
            style={styles.followupRow}
            testID={`${testID}-next-analysis`}
          >
            <View style={styles.followupTextArea}>
              <Text style={styles.followupTitle}>{nextAction.label}</Text>
              <Text style={styles.followupDescription}>{nextAction.description}</Text>
            </View>
            <ChevronRight color={REPORT_COLORS.mutedInk} size={18} strokeWidth={1.75} />
          </Pressable>
          <ReportDivider testID={`${testID}-followup-divider`} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(coach)')}
            style={styles.followupRow}
            testID={`${testID}-expert-cta`}
          >
            <View style={styles.followupTextArea}>
              <Text style={styles.followupTitle}>더 자세한 분석이 궁금하신가요?</Text>
              <Text style={styles.followupDescription}>전속 뷰티팀과 이어서 이야기해보세요.</Text>
            </View>
            <ChevronRight color={REPORT_COLORS.mutedInk} size={18} strokeWidth={1.75} />
          </Pressable>
        </View>

        <View style={styles.actions} testID={`${testID}-buttons`}>
          <Pressable
            accessibilityRole="button"
            onPress={onPrimaryAction}
            style={styles.primaryButton}
            testID={`${testID}-buttons-primary`}
          >
            <Text style={styles.primaryButtonText}>{primaryActionText}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleGoHome}
            style={styles.secondaryButton}
            testID={`${testID}-buttons-home`}
          >
            <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={styles.retryButton}
            testID={`${testID}-buttons-retry`}
          >
            <Text style={styles.retryButtonText}>다시 분석하기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이 결과 신고"
            onPress={() => setReportVisible(true)}
            style={styles.reportButton}
            testID={`${testID}-report`}
          >
            <Text style={styles.reportButtonText}>이 결과 신고</Text>
          </Pressable>
        </View>
      </ScrollView>
      <ContentReportModal
        contentExcerpt={verdict}
        onClose={() => setReportVisible(false)}
        targetId={reportTargetId}
        targetType="analysis_result"
        title="분석 결과 신고"
        visible={reportVisible}
      />
    </SafeAreaView>
  );
}
