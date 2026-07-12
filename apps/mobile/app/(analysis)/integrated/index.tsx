/**
 * 통합 분석 입력 페이지 (모바일)
 *
 * @route /(analysis)/integrated
 * @see docs/adr/ADR-102-mobile-integrated-porting.md §5.3
 * @see docs/specs/SDD-MOBILE-INTEGRATED.md §4
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { useUserAnalyses } from '@/hooks/useUserAnalyses';
import { useTheme, typography, radii, spacing } from '@/lib/theme';
import {
  requestIntegratedAnalysis,
  IntegratedApiError,
  fetchBirthdate,
  saveBirthdate,
  evaluateBirthdateGate,
  BirthdateApiError,
  fetchAgreementStatus,
  saveAgreement,
  evaluateAgreementGate,
  AgreementApiError,
  type AgreementGender,
  type AxisCode,
  type IntegratedAnalysisInput,
  type SkinQuestionnaire,
  type HairQuestionnaire,
  type BodyQuestionnaire,
} from '@/lib/api';

// ============================================
// 자가입력 선택지
// ============================================

const SKIN_TYPES: Array<{ value: SkinQuestionnaire['selfReportedType']; label: string }> = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'normal', label: '중성' },
  { value: 'sensitive', label: '민감성' },
  { value: 'unknown', label: '잘 모르겠어요' },
];

const HAIR_LENGTHS: Array<{ value: NonNullable<HairQuestionnaire['length']>; label: string }> = [
  { value: 'very_short', label: '매우 짧음' },
  { value: 'short', label: '짧음' },
  { value: 'medium', label: '중간' },
  { value: 'long', label: '긴 편' },
  { value: 'very_long', label: '매우 김' },
];

// 선택 재분석(ADR-109 2A): 재방문 사용자가 다시 분석할 축만 고름 (웹과 동일)
const AXIS_OPTIONS: Array<{ code: AxisCode; label: string }> = [
  { code: 'personal_color', label: '퍼스널 컬러' },
  { code: 'skin', label: '피부' },
  { code: 'body', label: '체형' },
  { code: 'hair', label: '헤어' },
  { code: 'makeup', label: '메이크업' },
];
const ALL_AXES = AXIS_OPTIONS.map((a) => a.code);

// ============================================
// 메인 화면
// ============================================

export default function IntegratedAnalysisInputScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { getToken } = useAuth();

  // 가입=첫 미팅(ADR-114): 가입 직후 진입 시 강제하지 않고 건너뛰기 경로 제공
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';

  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [skinType, setSkinType] = useState<SkinQuestionnaire['selfReportedType']>('unknown');
  const [hairLength, setHairLength] = useState<HairQuestionnaire['length']>();
  const [body, setBody] = useState<BodyQuestionnaire>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 연령 확인 게이트(만 14세) — 서버는 users.birth_date 없으면 생체분석을 403으로 막는다.
  // 마운트 시 저장 여부를 조회해 이미 있으면 입력을 숨기고(중복 요구 금지), 없으면 입력을 받는다.
  const [birthdate, setBirthdate] = useState('');
  const [hasStoredBirthdate, setHasStoredBirthdate] = useState(false);
  const [birthdateChecked, setBirthdateChecked] = useState(false);

  // 생체정보 동의 게이트(BIPA/PIPA §23) — 서버는 user_agreements.biometric_agreed 없으면 403.
  // 웹은 /agreement 화면이 게이트하지만 모바일엔 없어 온보딩에서 필수 동의를 수집한다.
  const [hasAgreed, setHasAgreed] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeBiometric, setAgreeBiometric] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [gender, setGender] = useState<AgreementGender | undefined>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        // 두 게이트(생년월일·동의)를 병렬 조회 — 각자 실패해도 수집 쪽으로 안전 폴백
        const [birthdateResult, agreementResult] = await Promise.allSettled([
          fetchBirthdate(token),
          fetchAgreementStatus(token),
        ]);
        if (!active) return;
        setHasStoredBirthdate(
          birthdateResult.status === 'fulfilled' && birthdateResult.value.hasBirthDate
        );
        setHasAgreed(agreementResult.status === 'fulfilled' && agreementResult.value.hasAgreed);
      } catch {
        // 조회 실패 시 수집 쪽으로 안전하게 폴백 — 없으면 어차피 서버가 403이므로 입력을 받는다.
        if (active) {
          setHasStoredBirthdate(false);
          setHasAgreed(false);
        }
      } finally {
        if (active) {
          setBirthdateChecked(true);
          setAgreementChecked(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [getToken]);

  // 선택 재분석(2A): 분석 이력이 있는 재방문 사용자에게만 축 선택 노출.
  // 일부 축만 고르면 update 모드 — 나머지 축은 기존 결과 유지(색·체형 안 흔들림).
  const { analyses } = useUserAnalyses();
  const isReturning = analyses.length > 0;
  const [selectedAxes, setSelectedAxes] = useState<AxisCode[]>(ALL_AXES);
  const isPartialUpdate =
    isReturning && selectedAxes.length > 0 && selectedAxes.length < ALL_AXES.length;
  const toggleAxis = (code: AxisCode): void => {
    setSelectedAxes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const pickImage = async (setter: (v: string | null) => void, isFace: boolean) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 선택 권한이 필요해요.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: true,
        aspect: isFace ? [1, 1] : [3, 4],
      });
      if (result.canceled || !result.assets[0]?.base64) return;

      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      setter(`data:${mime};base64,${asset.base64}`);
    } catch {
      Alert.alert('이미지 선택 실패', '다른 사진을 선택해주세요.');
    }
  };

  const canSubmit = faceImage !== null && !isSubmitting;
  const hasBodyMeasurements = body.heightCm !== undefined || body.weightKg !== undefined;
  const needsBodyInput = bodyImage === null && !hasBodyMeasurements;

  const handleSubmit = async (): Promise<void> => {
    if (!faceImage) {
      setError('얼굴 사진이 필요해요.');
      return;
    }

    // 연령 확인 게이트 — 저장 안 됐으면 입력을 검증하고, 만 14세 미만이면 분석을 호출하지 않는다.
    const birthdateGate = evaluateBirthdateGate(hasStoredBirthdate, birthdate);
    if (!birthdateGate.ok) {
      setError(birthdateGate.message);
      return;
    }

    // 생체정보 동의 게이트 — 필수 3종 미체크·성별 미선택이면 분석을 호출하지 않는다(서버도 403).
    const agreementGate = evaluateAgreementGate(
      hasAgreed,
      { terms: agreeTerms, privacy: agreePrivacy, biometric: agreeBiometric },
      gender
    );
    if (!agreementGate.ok) {
      setError(agreementGate.message);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        setError('로그인 세션이 만료됐어요. 다시 로그인해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 생년월일 최초 저장 (성인·유효값만 게이트를 통과). 서버가 만 14세 미만이면 403으로 거부.
      if (birthdateGate.needsSave && birthdateGate.birthDate) {
        await saveBirthdate(birthdateGate.birthDate, token);
      }

      // 필수 동의 최초 저장 — 분석 라우트의 생체동의 게이트(403)를 통과시키는 선행 조건.
      if (agreementGate.needsSave && agreementGate.gender) {
        await saveAgreement(
          { gender: agreementGate.gender, marketingAgreed: agreeMarketing },
          token
        );
        setHasAgreed(true);
      }

      const input: IntegratedAnalysisInput = {
        faceImageBase64: faceImage,
        bodyImageBase64: bodyImage ?? undefined,
        questionnaire: {
          skin: { selfReportedType: skinType, concerns: [] },
          hair: { length: hairLength },
          body,
        },
        options: { locale: 'ko', skipMakeup: false },
        // 선택 재분석: 일부 축만 고르면 그 축만 재실행 (ADR-109 2A, 웹과 동일)
        ...(isPartialUpdate ? { mode: 'update' as const, axes: selectedAxes } : {}),
      };

      const result = await requestIntegratedAnalysis(input, token);

      // 왜: v1 MVP는 POST 응답을 결과 화면에 직접 전달 (재방문 조회는 Phase D.2)
      // Expo Router typed routes 회피를 위해 문자열 경로 + 캐스팅
      router.replace(
        `/(analysis)/integrated/result/${result.sessionId}?payload=${encodeURIComponent(JSON.stringify(result))}` as never
      );
    } catch (e) {
      // 서버 에러 봉투의 userMessage(연령·생체동의 게이트 403 등)를 그대로 노출 — 일반 문구로 뭉개지 않는다.
      const message =
        e instanceof BirthdateApiError || e instanceof AgreementApiError
          ? e.message
          : e instanceof IntegratedApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : '분석 요청에 실패했어요.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  // 로딩 화면 (제출 중)
  if (isSubmitting) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={[styles.loadingTitle, { color: colors.foreground }]}>5축 분석 중...</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}>
            예상 소요 약 10초
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>5축 통합 분석</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            셀카 한 장으로 색·피부·체형·헤어를 한 번에{'\n'}약 2분이면 완료돼요
          </Text>
        </View>

        {/* 선택 재분석 (재방문 사용자만, ADR-109 2A) */}
        {isReturning && (
          <GlassCard style={styles.section} testID="axis-select-section">
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              다시 분석할 축 선택
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              선택하지 않은 축은 기존 결과가 그대로 유지돼요
            </Text>
            <View style={styles.chipGroup}>
              {AXIS_OPTIONS.map((opt) => {
                const active = selectedAxes.includes(opt.code);
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => toggleAxis(opt.code)}
                    testID={`axis-chip-${opt.code}`}
                    accessibilityLabel={`${opt.label} ${active ? '선택됨' : '선택 안 됨'}`}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? '#8B5CF6' : colors.border,
                        backgroundColor: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.chipText, { color: active ? '#8B5CF6' : colors.foreground }]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* 얼굴 셀카 (필수) */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            얼굴 셀카 <Text style={styles.required}>*</Text>
          </Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            자연광에서 정면으로 찍은 사진이 좋아요
          </Text>
          {faceImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: faceImage }} style={styles.imagePreviewImg} />
              <Pressable
                onPress={() => setFaceImage(null)}
                style={styles.removeButton}
                accessibilityLabel="얼굴 사진 제거"
              >
                <Text style={styles.removeButtonText}>제거</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => pickImage(setFaceImage, true)}
              style={[styles.uploadButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.uploadButtonText, { color: colors.foreground }]}>사진 선택</Text>
            </Pressable>
          )}
        </GlassCard>

        {/* 전신 사진 (선택) */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            전신 사진{' '}
            <Text style={[styles.optional, { color: colors.mutedForeground }]}>(선택)</Text>
          </Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            없으면 자가입력으로 체형을 추정해드려요
          </Text>
          {bodyImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: bodyImage }} style={styles.imagePreviewImg} />
              <Pressable
                onPress={() => setBodyImage(null)}
                style={styles.removeButton}
                accessibilityLabel="전신 사진 제거"
              >
                <Text style={styles.removeButtonText}>제거</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => pickImage(setBodyImage, false)}
              style={[styles.uploadButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.uploadButtonText, { color: colors.foreground }]}>사진 선택</Text>
            </Pressable>
          )}
        </GlassCard>

        {/* 피부 타입 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>피부 타입</Text>
          <View style={styles.chipGroup}>
            {SKIN_TYPES.map((opt) => {
              const active = skinType === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSkinType(opt.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? '#EC4899' : colors.border,
                      backgroundColor: active ? 'rgba(236,72,153,0.15)' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, { color: active ? '#EC4899' : colors.foreground }]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* 헤어 길이 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            머리 길이{' '}
            <Text style={[styles.optional, { color: colors.mutedForeground }]}>(선택)</Text>
          </Text>
          <View style={styles.chipGroup}>
            {HAIR_LENGTHS.map((opt) => {
              const active = hairLength === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setHairLength(active ? undefined : opt.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? '#8B5CF6' : colors.border,
                      backgroundColor: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, { color: active ? '#8B5CF6' : colors.foreground }]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* 신체 정보 (전신 사진 없을 때 안내) */}
        {needsBodyInput && (
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              신체 정보{' '}
              <Text style={[styles.optional, { color: colors.mutedForeground }]}>(선택)</Text>
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              전신 사진 없으면 키만 입력해도 분석 가능해요
            </Text>
            <View style={styles.numberInputRow}>
              <NumberField
                label="키 (cm)"
                value={body.heightCm}
                onChange={(v) => setBody((prev) => ({ ...prev, heightCm: v }))}
                min={100}
                max={220}
              />
              <NumberField
                label="몸무게 (kg)"
                value={body.weightKg}
                onChange={(v) => setBody((prev) => ({ ...prev, weightKg: v }))}
                min={30}
                max={200}
              />
            </View>
          </GlassCard>
        )}

        {/* 생년월일 (연령 확인 게이트 — 서버에 저장돼 있지 않을 때만 노출) */}
        {birthdateChecked && !hasStoredBirthdate && (
          <GlassCard style={styles.section} testID="birthdate-section">
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              생년월일 <Text style={styles.required}>*</Text>
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              만 14세 이상 확인을 위해 필요해요 (청소년보호법)
            </Text>
            <TextInput
              value={birthdate}
              onChangeText={setBirthdate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={10}
              accessibilityLabel="생년월일 입력"
              testID="birthdate-input"
              style={[
                styles.birthdateInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
          </GlassCard>
        )}

        {/* 서비스 이용 동의 (생체동의 게이트 — 서버에 동의가 저장돼 있지 않을 때만 노출) */}
        {agreementChecked && !hasAgreed && (
          <GlassCard style={styles.section} testID="agreement-section">
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              서비스 이용 동의 <Text style={styles.required}>*</Text>
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              첫 분석 전에 필수 약관 동의가 필요해요
            </Text>
            <ConsentRow
              checked={agreeTerms && agreePrivacy && agreeBiometric && agreeMarketing}
              onToggle={() => {
                const next = !(agreeTerms && agreePrivacy && agreeBiometric && agreeMarketing);
                setAgreeTerms(next);
                setAgreePrivacy(next);
                setAgreeBiometric(next);
                setAgreeMarketing(next);
              }}
              label="모두 동의 (선택 항목 포함)"
              emphasized
              testID="consent-all"
            />
            <ConsentRow
              checked={agreeTerms}
              onToggle={() => setAgreeTerms((v) => !v)}
              label="[필수] 이용약관 동의"
              onViewDetail={() => router.push('/terms' as never)}
              testID="consent-terms"
            />
            <ConsentRow
              checked={agreePrivacy}
              onToggle={() => setAgreePrivacy((v) => !v)}
              label="[필수] 개인정보 수집·이용 동의"
              onViewDetail={() => router.push('/privacy-policy' as never)}
              testID="consent-privacy"
            />
            <ConsentRow
              checked={agreeBiometric}
              onToggle={() => setAgreeBiometric((v) => !v)}
              label="[필수] 생체정보(얼굴·체형 이미지) 수집·이용 동의"
              description="AI 분석을 위해 이미지가 미국 Google(Gemini)로 전송돼요. 언제든 철회할 수 있어요."
              onViewDetail={() => router.push('/privacy-policy' as never)}
              testID="consent-biometric"
            />
            <ConsentRow
              checked={agreeMarketing}
              onToggle={() => setAgreeMarketing((v) => !v)}
              label="[선택] 마케팅 정보 수신 동의"
              testID="consent-marketing"
            />

            {/* 성별 — 맞춤 분석에 필요 (서버 계약상 동의 저장 시 필수) */}
            <Text style={[styles.genderLabel, { color: colors.foreground }]}>
              성별 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipGroup}>
              {(
                [
                  { value: 'female', label: '여성' },
                  { value: 'male', label: '남성' },
                ] as Array<{ value: AgreementGender; label: string }>
              ).map((opt) => {
                const active = gender === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGender(opt.value)}
                    testID={`gender-${opt.value}`}
                    accessibilityLabel={`성별 ${opt.label} ${active ? '선택됨' : '선택 안 됨'}`}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? '#EC4899' : colors.border,
                        backgroundColor: active ? 'rgba(236,72,153,0.15)' : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.chipText, { color: active ? '#EC4899' : colors.foreground }]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* 에러 메시지 */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 제출 버튼 */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.submitButton,
            {
              opacity: canSubmit ? 1 : 0.5,
              backgroundColor: '#EC4899',
            },
          ]}
          accessibilityLabel="내 정체성 알아보기"
        >
          <Text style={styles.submitButtonText}>내 정체성 알아보기</Text>
        </Pressable>

        {/* 가입 직후 진입 시 이탈 경로 — 분석 강제 금지 */}
        {isOnboarding && (
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.skipButton}
            testID="onboarding-skip-button"
            accessibilityLabel="나중에 할래요"
            accessibilityHint="분석을 건너뛰고 홈으로 이동합니다"
          >
            <Text style={[styles.skipButtonText, { color: colors.mutedForeground }]}>
              나중에 할래요
            </Text>
          </Pressable>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================
// 동의 체크 행 (생체동의 게이트)
// ============================================

interface ConsentRowProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
  /** '모두 동의' 강조 행 여부 */
  emphasized?: boolean;
  onViewDetail?: () => void;
  testID?: string;
}

function ConsentRow({
  checked,
  onToggle,
  label,
  description,
  emphasized,
  onViewDetail,
  testID,
}: ConsentRowProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={[styles.consentRow, emphasized && styles.consentRowEmphasized]}>
      <Pressable
        onPress={onToggle}
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={styles.consentToggle}
      >
        <View
          style={[
            styles.consentBox,
            {
              borderColor: checked ? '#EC4899' : colors.border,
              backgroundColor: checked ? '#EC4899' : 'transparent',
            },
          ]}
        >
          {checked && <Text style={styles.consentCheckMark}>✓</Text>}
        </View>
        <View style={styles.consentLabelWrap}>
          <Text
            style={[
              styles.consentLabel,
              { color: colors.foreground },
              emphasized && styles.consentLabelEmphasized,
            ]}
          >
            {label}
          </Text>
          {description ? (
            <Text style={[styles.consentDesc, { color: colors.mutedForeground }]}>
              {description}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onViewDetail ? (
        <Pressable onPress={onViewDetail} accessibilityLabel={`${label} 내용 보기`} hitSlop={8}>
          <Text style={[styles.consentDetailLink, { color: colors.mutedForeground }]}>보기</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ============================================
// 숫자 입력 필드
// ============================================

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min: number;
  max: number;
}

function NumberField({ label, value, onChange, min, max }: NumberFieldProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.numberFieldWrap}>
      <Text style={[styles.numberFieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        value={value !== undefined ? String(value) : ''}
        onChangeText={(text) => {
          if (text === '') return onChange(undefined);
          const n = Number(text);
          if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
        }}
        style={[styles.numberFieldInput, { color: colors.foreground, borderColor: colors.border }]}
      />
    </View>
  );
}

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
  },
  required: { color: '#EC4899' },
  optional: {
    fontSize: typography.size.sm,
    fontWeight: '400',
  },
  imagePreview: { position: 'relative' },
  imagePreviewImg: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  removeButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: typography.size.base,
    fontWeight: '500',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
  numberInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  numberFieldWrap: { flex: 1 },
  numberFieldLabel: {
    fontSize: typography.size.sm,
    marginBottom: 4,
  },
  numberFieldInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: typography.size.base,
  },
  birthdateInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: typography.size.base,
    marginTop: spacing.xs,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  consentRowEmphasized: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.25)',
    marginBottom: 4,
    paddingBottom: 12,
  },
  consentToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.sm,
  },
  consentBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  consentCheckMark: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 16 },
  consentLabelWrap: { flex: 1 },
  consentLabel: { fontSize: typography.size.sm, fontWeight: '500' },
  consentLabelEmphasized: { fontWeight: '700' },
  consentDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  consentDetailLink: {
    fontSize: typography.size.sm,
    textDecorationLine: 'underline',
    paddingLeft: spacing.sm,
  },
  genderLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#f87171', fontSize: typography.size.sm },
  submitButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.size.sm,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  loadingSubtitle: {
    fontSize: typography.size.sm,
  },
});
