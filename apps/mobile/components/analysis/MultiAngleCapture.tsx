/**
 * 다중 각도 촬영 플로우
 *
 * 정면(필수) + 좌측/우측(선택) 3-Step 촬영
 * React Native에서는 expo-image-picker 기반
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';

export type FaceAngle = 'front' | 'left' | 'right';

export interface MultiAngleImages {
  front: string;
  left?: string;
  right?: string;
}

export interface MultiAngleCaptureProps {
  /** 촬영 완료 콜백 */
  onComplete: (images: MultiAngleImages) => void;
  /** 취소 콜백 */
  onCancel?: () => void;
  /** 사진 촬영 콜백 (외부에서 카메라/갤러리 처리) */
  onCapture: (angle: FaceAngle) => Promise<string | null>;
}

const ANGLE_INFO: Record<FaceAngle, { label: string; emoji: string; instruction: string }> = {
  front: { label: '정면', emoji: '🙂', instruction: '정면을 바라봐주세요' },
  left: { label: '좌측 45°', emoji: '👈', instruction: '왼쪽으로 살짝 돌려주세요' },
  right: { label: '우측 45°', emoji: '👉', instruction: '오른쪽으로 살짝 돌려주세요' },
};

type Step = 'front' | 'additional' | 'complete';

export function MultiAngleCapture({
  onComplete,
  onCancel,
  onCapture,
}: MultiAngleCaptureProps): React.ReactElement {
  const { colors, brand, status, typography, radii, spacing } = useTheme();
  const [step, setStep] = useState<Step>('front');
  const [images, setImages] = useState<Partial<MultiAngleImages>>({});

  const handleCapture = useCallback(
    async (angle: FaceAngle) => {
      const uri = await onCapture(angle);
      if (uri) {
        setImages((prev) => ({ ...prev, [angle]: uri }));
        if (angle === 'front') {
          setStep('additional');
        }
      }
    },
    [onCapture],
  );

  const handleComplete = useCallback(() => {
    if (images.front) {
      onComplete({
        front: images.front,
        left: images.left,
        right: images.right,
      });
      setStep('complete');
    }
  }, [images, onComplete]);

  const handleRetake = useCallback((angle: FaceAngle) => {
    setImages((prev) => {
      const next = { ...prev };
      delete next[angle];
      return next;
    });
    if (angle === 'front') {
      setStep('front');
    }
  }, []);

  return (
    <View testID="multi-angle-capture" style={styles.container}>
      {/* 스텝 인디케이터 */}
      <View style={[styles.stepIndicator, { marginBottom: spacing.md }]}>
        {['정면 촬영', '추가 촬영', '완료'].map((label, index) => {
          const isActive = index === (step === 'front' ? 0 : step === 'additional' ? 1 : 2);
          const isDone = index < (step === 'front' ? 0 : step === 'additional' ? 1 : 2);
          return (
            <View key={index} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isDone ? status.success : isActive ? brand.primary : colors.secondary,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Text style={{ color: isDone || isActive ? colors.card : colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>
                  {isDone ? '✓' : index + 1}
                </Text>
              </View>
              <Text style={{ color: isActive ? colors.foreground : colors.mutedForeground, fontSize: typography.size.xs }}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Step 1: 정면 촬영 */}
      {step === 'front' && (
        <View style={styles.captureSection}>
          <Text style={[styles.angleLabel, { color: colors.foreground, fontSize: typography.size.lg }]}>
            {ANGLE_INFO.front.emoji} {ANGLE_INFO.front.label}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center', marginBottom: spacing.md }}>
            {ANGLE_INFO.front.instruction}
          </Text>

          {images.front ? (
            <View style={styles.previewSection}>
              <Image source={{ uri: images.front }} style={[styles.preview, { borderRadius: radii.lg }]} />
              <View style={[styles.actionRow, { marginTop: spacing.sm }]}>
                <Pressable
                  onPress={() => handleRetake('front')}
                  style={[styles.actionBtn, { backgroundColor: colors.secondary, borderRadius: radii.md }]}
                >
                  <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.sm }}>다시 촬영</Text>
                </Pressable>
                <Pressable
                  onPress={() => setStep('additional')}
                  style={[styles.actionBtn, { backgroundColor: brand.primary, borderRadius: radii.md }]}
                >
                  <Text style={{ color: brand.primaryForeground, fontSize: typography.size.sm, fontWeight: '600' }}>다음</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => handleCapture('front')}
              style={[styles.captureBtn, { backgroundColor: brand.primary, borderRadius: radii.lg }]}
              accessibilityRole="button"
              accessibilityLabel="정면 사진 촬영"
            >
              <Text style={{ color: brand.primaryForeground, fontSize: typography.size.base, fontWeight: '600' }}>
                📸 정면 사진 촬영
              </Text>
            </Pressable>
          )}

          {/* 팁 */}
          <View style={[styles.tipsBox, { backgroundColor: colors.secondary, borderRadius: radii.md, padding: spacing.sm, marginTop: spacing.md }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
              💡 자연광에서, 배경이 깔끔한 곳에서 촬영하면 더 정확해요
            </Text>
          </View>
        </View>
      )}

      {/* Step 2: 추가 촬영 (선택) */}
      {step === 'additional' && (
        <View style={styles.captureSection}>
          <Text style={[styles.angleLabel, { color: colors.foreground, fontSize: typography.size.lg }]}>
            추가 각도 (선택)
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center', marginBottom: spacing.md }}>
            더 정확한 분석을 위해 측면 사진도 추가해보세요
          </Text>

          <View style={styles.angleGrid}>
            {(['left', 'right'] as const).map((angle) => {
              const info = ANGLE_INFO[angle];
              const hasImage = !!images[angle];
              return (
                <View key={angle} style={[styles.angleCard, { backgroundColor: colors.secondary, borderRadius: radii.lg }]}>
                  {hasImage ? (
                    <View style={styles.angleCardContent}>
                      <Image source={{ uri: images[angle] }} style={[styles.anglePreview, { borderRadius: radii.md }]} />
                      <Pressable onPress={() => handleRetake(angle)}>
                        <Text style={{ color: status.info, fontSize: typography.size.xs, marginTop: spacing.xs }}>다시 촬영</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleCapture(angle)}
                      style={styles.angleCardContent}
                      accessibilityRole="button"
                      accessibilityLabel={`${info.label} 사진 촬영`}
                    >
                      <Text style={{ fontSize: typography.size['2xl'] }}>{info.emoji}</Text>
                      <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '500' }}>
                        {info.label}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>탭하여 촬영</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={handleComplete}
            style={[styles.completeBtn, { backgroundColor: brand.primary, borderRadius: radii.lg, marginTop: spacing.md }]}
            accessibilityRole="button"
            accessibilityLabel="촬영 완료"
          >
            <Text style={{ color: brand.primaryForeground, fontSize: typography.size.base, fontWeight: '600' }}>
              촬영 완료
            </Text>
          </Pressable>
        </View>
      )}

      {/* Step 3: 완료 */}
      {step === 'complete' && (
        <View style={[styles.completeSection, { padding: spacing.lg }]}>
          <Text style={{ fontSize: typography.size['2xl'], textAlign: 'center' }}>✅</Text>
          <Text style={{ color: colors.foreground, fontSize: typography.size.lg, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm }}>
            촬영이 완료되었습니다
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center', marginTop: spacing.xs }}>
            {Object.keys(images).length}장의 사진이 준비되었어요
          </Text>
        </View>
      )}

      {/* 취소 버튼 */}
      {onCancel && step !== 'complete' && (
        <Pressable
          onPress={onCancel}
          style={[styles.cancelBtn, { marginTop: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="촬영 취소"
        >
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>취소</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  stepItem: { alignItems: 'center', gap: spacing.xs },
  stepDot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  captureSection: { alignItems: 'center' },
  angleLabel: { fontWeight: '700', textAlign: 'center', marginBottom: spacing.xs },
  previewSection: { alignItems: 'center', width: '100%' },
  preview: { width: 200, height: 266 },
  actionRow: { flexDirection: 'row', gap: spacing.smx },
  actionBtn: { paddingHorizontal: spacing.mlg, paddingVertical: spacing.smd },
  captureBtn: { paddingHorizontal: spacing.xl, paddingVertical: 14 },
  tipsBox: {},
  angleGrid: { flexDirection: 'row', gap: spacing.smx, width: '100%' },
  angleCard: { flex: 1, padding: spacing.md },
  angleCardContent: { alignItems: 'center', gap: 6 },
  anglePreview: { width: 80, height: 106 },
  completeBtn: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  completeSection: { alignItems: 'center' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.smd },
});
