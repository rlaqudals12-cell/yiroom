import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchSafetyProfile, saveSafetyProfile, type SafetyProfileData } from '@/lib/api/safety';
import { radii, spacing, typography, useTheme } from '@/lib/theme';
import { RESULT_SERIF_FONT_FAMILY } from '@/lib/theme/fonts';

const CONDITION_KEYS = new Set([
  'pregnancy',
  'pregnant',
  'breastfeeding',
  'lactation',
  'pregnancy_or_breastfeeding',
]);
const MEDICATION_KEYS = new Set(['isotretinoin', 'accutane', 'roaccutane']);

function hasAny(values: string[], keys: Set<string>): boolean {
  return values.some((value) => keys.has(value.trim().toLowerCase()));
}

function withoutKeys(values: string[], keys: Set<string>): string[] {
  return values.filter((value) => !keys.has(value.trim().toLowerCase()));
}

interface SkinSafetyScreeningCardProps {
  onComplete: () => void;
}

/** 피부 촬영 전에 선택적으로 저장하는 안전 문진. 저장·판정은 웹 API 정본을 쓴다. */
export function SkinSafetyScreeningCard({ onComplete }: SkinSafetyScreeningCardProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { colors, brand } = useTheme();
  const [pregnancyOrBreastfeeding, setPregnancyOrBreastfeeding] = useState<boolean | null>(null);
  const [isotretinoin, setIsotretinoin] = useState<boolean | null>(null);
  const [consented, setConsented] = useState(false);
  const [profile, setProfile] = useState<SafetyProfileData>({
    conditions: [],
    medications: [],
    consentGiven: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await getTokenRef.current();
      if (!token) return;
      const saved = await fetchSafetyProfile(token);
      if (!mounted) return;
      setProfile(saved);
      if (saved.consentGiven) {
        setConsented(true);
        setPregnancyOrBreastfeeding(hasAny(saved.conditions, CONDITION_KEYS));
        setIsotretinoin(hasAny(saved.medications, MEDICATION_KEYS));
      }
    })().catch(() => {
      // 조회 실패를 "해당 없음"으로 추측하지 않는다. 미응답 상태로 유지한다.
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!consented) {
      setError('민감정보 수집·이용 동의 후 저장하거나 나중에 입력해주세요.');
      return;
    }
    if (pregnancyOrBreastfeeding === null || isotretinoin === null) {
      setError('두 안전 문항에 모두 답해주세요.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인 정보가 만료됐어요. 다시 로그인해주세요.');
      const conditions = withoutKeys(profile.conditions, CONDITION_KEYS);
      const medications = withoutKeys(profile.medications, MEDICATION_KEYS);
      // 결합 질문을 두 개의 사실로 부풀리지 않고 단일 marker로 보존한다.
      if (pregnancyOrBreastfeeding) conditions.push('pregnancy_or_breastfeeding');
      if (isotretinoin) medications.push('isotretinoin');
      await saveSafetyProfile(
        { conditions, medications, consentGiven: true, consentVersion: '1.0' },
        token
      );
      onComplete();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '안전 문진을 저장할 수 없어요.');
    } finally {
      setSaving(false);
    }
  }, [
    consented,
    getToken,
    isotretinoin,
    onComplete,
    pregnancyOrBreastfeeding,
    profile.conditions,
    profile.medications,
  ]);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="skin-safety-screening"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>먼저 안전 상태를 확인할게요</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        안전한 루틴을 위해 임신·수유와 복용 약을 확인해요. 입력하지 않으면 레티노이드 일정은
        제안하지 않아요.
      </Text>

      <SafetyQuestion
        label="현재 임신 중이거나 수유 중인가요?"
        value={pregnancyOrBreastfeeding}
        onChange={setPregnancyOrBreastfeeding}
        testID="pregnancy-breastfeeding-question"
      />
      <SafetyQuestion
        label="현재 이소트레티노인을 복용 중인가요?"
        value={isotretinoin}
        onChange={setIsotretinoin}
        testID="isotretinoin-question"
      />

      <Pressable
        onPress={() => setConsented((current) => !current)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consented }}
        accessibilityLabel="건강 정보 수집·이용 동의"
        style={styles.consentRow}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: consented ? brand.primary : colors.border },
            consented && { backgroundColor: brand.primary },
          ]}
        />
        <View style={styles.consentCopy}>
          <Text style={[styles.consentTitle, { color: colors.foreground }]}>
            건강 정보 수집·이용에 동의합니다 (선택)
          </Text>
          <Text style={[styles.consentDescription, { color: colors.mutedForeground }]}>
            선택한 정보는 암호화해 루틴·제품 안전 확인에만 사용해요.
          </Text>
        </View>
      </Pressable>

      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={() => void handleSave()}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={[
          styles.primaryButton,
          { backgroundColor: brand.primary },
          saving && styles.disabled,
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
          {saving ? '저장 중...' : '동의하고 계속'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onComplete}
        disabled={saving}
        accessibilityRole="button"
        style={[styles.secondaryButton, { borderColor: colors.border }]}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>나중에 입력</Text>
      </Pressable>
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        이 안내는 의료 조언이 아닌 일반 참고 정보예요. 복용 중인 약이 있다면 전문 의료인과
        상의해주세요.
      </Text>
    </View>
  );
}

function SafetyQuestion({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  testID: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.question, { borderTopColor: colors.border }]} testID={testID}>
      <Text style={[styles.questionLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.answerRow}>
        {[
          { label: '네', answer: true },
          { label: '아니요', answer: false },
        ].map((option) => (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.answer)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option.answer }}
            style={[
              styles.answer,
              {
                borderColor: value === option.answer ? colors.foreground : colors.border,
                backgroundColor: value === option.answer ? colors.muted : colors.card,
              },
            ]}
          >
            <Text
              style={{
                color: value === option.answer ? colors.foreground : colors.mutedForeground,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.mlg, marginBottom: spacing.xl },
  title: {
    fontSize: typography.size.xl,
    fontFamily: RESULT_SERIF_FONT_FAMILY,
    marginBottom: spacing.sm,
  },
  description: { fontSize: typography.size.sm, lineHeight: 21, marginBottom: spacing.md },
  question: { borderTopWidth: 1, paddingVertical: spacing.md },
  questionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  answerRow: { flexDirection: 'row', gap: spacing.sm },
  answer: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderRadius: radii.sm, marginTop: 2 },
  consentCopy: { flex: 1, marginLeft: spacing.sm },
  consentTitle: { fontSize: typography.size.sm },
  consentDescription: { fontSize: typography.size.xs, lineHeight: 18, marginTop: spacing.xxs },
  error: { fontSize: typography.size.sm, marginBottom: spacing.sm },
  primaryButton: {
    minHeight: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  secondaryButtonText: { fontSize: typography.size.sm },
  disclaimer: { fontSize: typography.size.xs, lineHeight: 18, marginTop: spacing.md },
  disabled: { opacity: 0.5 },
});
