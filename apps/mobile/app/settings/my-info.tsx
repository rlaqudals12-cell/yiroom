/**
 * 내 정보 수정 화면
 * 닉네임, 생년월일, 성별, 키, 몸무게, 피부 타입 편집
 */

import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '../../lib/supabase';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { GlassCard, ScreenContainer } from '../../components/ui';

type Gender = 'male' | 'female' | 'other';

type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

interface UserInfo {
  nickname: string;
  birthdate: string;
  gender: Gender | null;
  heightCm: string;
  weightKg: string;
  skinType: SkinType | null;
}

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: 'male', label: '남성' },
  { key: 'female', label: '여성' },
  { key: 'other', label: '기타' },
];

const SKIN_TYPE_OPTIONS: { key: SkinType; label: string }[] = [
  { key: 'dry', label: '건성' },
  { key: 'oily', label: '지성' },
  { key: 'combination', label: '복합성' },
  { key: 'sensitive', label: '민감성' },
  { key: 'normal', label: '중성' },
];

export default function MyInfoScreen(): React.JSX.Element {
  const { colors, brand } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [info, setInfo] = useState<UserInfo>({
    nickname: '',
    birthdate: '',
    gender: null,
    heightCm: '',
    weightKg: '',
    skinType: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // DB에서 기존 정보 로드
  useEffect(() => {
    async function loadUserInfo(): Promise<void> {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('users')
          .select('nickname, birthdate, gender, height_cm, weight_kg, skin_type')
          .eq('clerk_user_id', user.id)
          .single();

        if (data) {
          setInfo({
            nickname: data.nickname || user.firstName || '',
            birthdate: data.birthdate || '',
            gender: data.gender as Gender | null,
            heightCm: data.height_cm ? String(data.height_cm) : '',
            weightKg: data.weight_kg ? String(data.weight_kg) : '',
            skinType: data.skin_type as SkinType | null,
          });
        } else {
          // DB에 없으면 Clerk 이름으로 초기화
          setInfo((prev) => ({ ...prev, nickname: user.firstName || '' }));
        }
      } catch {
        // 컬럼 미존재 등 — 조용히 실패
        setInfo((prev) => ({ ...prev, nickname: user.firstName || '' }));
      } finally {
        setIsLoading(false);
      }
    }
    loadUserInfo();
  }, [user?.id, supabase]);

  const handleChange = <K extends keyof UserInfo>(key: K, value: UserInfo[K]): void => {
    setInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenderSelect = (gender: Gender): void => {
    Haptics.selectionAsync();
    handleChange('gender', gender);
  };

  const handleSkinTypeSelect = (skinType: SkinType): void => {
    Haptics.selectionAsync();
    handleChange('skinType', skinType);
  };

  const handleSave = useCallback(async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!info.nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    if (!user?.id) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        nickname: info.nickname.trim(),
        gender: info.gender,
        skin_type: info.skinType,
      };

      if (info.birthdate) updateData.birthdate = info.birthdate;
      if (info.heightCm) updateData.height_cm = parseInt(info.heightCm, 10) || null;
      if (info.weightKg) updateData.weight_kg = parseInt(info.weightKg, 10) || null;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      Alert.alert('저장 완료', '내 정보가 저장되었어요.');
    } catch (error) {
      console.error('[MyInfo] Save error:', error);
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [info, user?.id, supabase]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '내 정보 수정',
          headerBackTitle: '설정',
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenContainer
          testID="settings-my-info-screen"
          edges={['bottom']}
          backgroundGradient="profile"
        >
          {/* 기본 정보 */}
          <Animated.View
            entering={FadeInUp.delay(0).duration(TIMING.normal)}
            style={styles.section}
          >
            <Text
              accessibilityRole="header"
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              기본 정보
            </Text>
            <GlassCard shadowSize="md" style={styles.card}>
              {/* 닉네임 */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>닉네임</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={info.nickname}
                  onChangeText={(value) => handleChange('nickname', value)}
                  placeholder="닉네임을 입력해주세요"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={20}
                  accessibilityLabel="닉네임 입력"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 생년월일 */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>생년월일</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={info.birthdate}
                  onChangeText={(value) => handleChange('birthdate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={10}
                  accessibilityLabel="생년월일 입력"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 성별 */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>성별</Text>
                <View style={styles.optionRow}>
                  {GENDER_OPTIONS.map((option) => {
                    const isSelected = info.gender === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={[
                          styles.optionButton,
                          { backgroundColor: colors.muted },
                          isSelected && { backgroundColor: brand.primary },
                        ]}
                        onPress={() => handleGenderSelect(option.key)}
                        accessibilityRole="radio"
                        accessibilityLabel={option.label}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.optionButtonText,
                            { color: colors.foreground },
                            isSelected && { color: brand.primaryForeground },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* 신체 정보 */}
          <Animated.View
            entering={FadeInUp.delay(80).duration(TIMING.normal)}
            style={styles.section}
          >
            <Text
              accessibilityRole="header"
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              신체 정보
            </Text>
            <GlassCard shadowSize="md" style={styles.card}>
              {/* 키 */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>키</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.unitInput,
                      {
                        backgroundColor: colors.muted,
                        color: colors.foreground,
                        borderColor: colors.border,
                      },
                    ]}
                    value={info.heightCm}
                    onChangeText={(value) => handleChange('heightCm', value)}
                    placeholder="170"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={3}
                    accessibilityLabel="키 입력"
                  />
                  <Text style={[styles.unitLabel, { color: colors.mutedForeground }]}>cm</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 몸무게 */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>몸무게</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.unitInput,
                      {
                        backgroundColor: colors.muted,
                        color: colors.foreground,
                        borderColor: colors.border,
                      },
                    ]}
                    value={info.weightKg}
                    onChangeText={(value) => handleChange('weightKg', value)}
                    placeholder="65"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={3}
                    accessibilityLabel="몸무게 입력"
                  />
                  <Text style={[styles.unitLabel, { color: colors.mutedForeground }]}>kg</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* 피부 타입 */}
          <Animated.View
            entering={FadeInUp.delay(160).duration(TIMING.normal)}
            style={styles.section}
          >
            <Text
              accessibilityRole="header"
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              피부 타입
            </Text>
            <GlassCard shadowSize="md" style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>피부 타입</Text>
                <View style={styles.skinTypeGrid}>
                  {SKIN_TYPE_OPTIONS.map((option) => {
                    const isSelected = info.skinType === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={[
                          styles.skinTypeButton,
                          { backgroundColor: colors.muted },
                          isSelected && { backgroundColor: brand.primary },
                        ]}
                        onPress={() => handleSkinTypeSelect(option.key)}
                        accessibilityRole="radio"
                        accessibilityLabel={`피부 타입 ${option.label}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.skinTypeButtonText,
                            { color: colors.foreground },
                            isSelected && { color: brand.primaryForeground },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* 저장 버튼 */}
          <Pressable
            style={[styles.saveButton, { backgroundColor: brand.primary, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="정보 저장"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={brand.primaryForeground} />
            ) : (
              <Text style={[styles.saveButtonText, { color: brand.primaryForeground }]}>저장</Text>
            )}
          </Pressable>

          {/* 안내 */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              입력한 정보는 맞춤형 분석과 추천에 활용돼요.{'\n'}
              정확한 정보를 입력할수록 더 정확한 결과를 받을 수 있어요.
            </Text>
          </View>
        </ScreenContainer>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    overflow: 'hidden',
  },
  fieldGroup: {
    padding: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.smd,
  },
  textInput: {
    height: 44,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.smx,
    fontSize: 15,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.smd,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unitInput: {
    flex: 1,
  },
  unitLabel: {
    fontSize: typography.size.sm,
    width: 30,
  },
  skinTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skinTypeButton: {
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
  },
  skinTypeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  saveButton: {
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  infoSection: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.size.xs,
    lineHeight: 18,
    textAlign: 'center',
  },
});
