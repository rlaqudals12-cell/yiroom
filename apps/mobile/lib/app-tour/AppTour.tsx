/**
 * 앱 투어 컴포넌트
 * React Native 모달 기반 UI
 */

import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';

import { useAppTour, type UseAppTourOptions } from './useAppTour';

// ============================================================
// Props 타입
// ============================================================

interface AppTourProps extends UseAppTourOptions {
  /** 자동 시작 여부 */
  autoStart?: boolean;
}

// ============================================================
// 앱 투어 컴포넌트
// ============================================================

export function AppTour({ autoStart = true, steps }: AppTourProps) {
  const {
    isActive,
    isLoading,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useAppTour({ autoStart, steps });

  if (isLoading || !isActive || !currentStep) {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={skipTour}
    >
      <View className="flex-1 bg-black/60 justify-end">
        {/* 카드 컨테이너 */}
        <View className="bg-white dark:bg-neutral-900 rounded-t-3xl p-6 pb-10">
          {/* 헤더: 진행률 + 건너뛰기 */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {currentStepIndex + 1} / {totalSteps}
            </Text>
            <Pressable onPress={skipTour} hitSlop={8}>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                건너뛰기
              </Text>
            </Pressable>
          </View>

          {/* 아이콘 + 제목 */}
          <View className="items-center mb-4">
            {currentStep.icon && (
              <Text className="text-4xl mb-2">{currentStep.icon}</Text>
            )}
            <Text className="text-xl font-bold text-neutral-900 dark:text-white">
              {currentStep.title}
            </Text>
          </View>

          {/* 설명 */}
          <Text className="text-center text-neutral-600 dark:text-neutral-300 mb-6 leading-6">
            {currentStep.description}
          </Text>

          {/* 진행률 인디케이터 */}
          <View className="flex-row items-center justify-center gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentStepIndex
                    ? 'bg-violet-500'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </View>

          {/* 네비게이션 버튼 */}
          <View className="flex-row items-center gap-3">
            {/* 이전 버튼 */}
            <Pressable
              onPress={prevStep}
              disabled={isFirstStep}
              className={`flex-1 py-3 rounded-xl border ${
                isFirstStep
                  ? 'border-neutral-200 dark:border-neutral-700'
                  : 'border-neutral-300 dark:border-neutral-600 active:bg-neutral-100 dark:active:bg-neutral-800'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  isFirstStep
                    ? 'text-neutral-300 dark:text-neutral-600'
                    : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                이전
              </Text>
            </Pressable>

            {/* 다음/완료 버튼 */}
            <Pressable
              onPress={nextStep}
              className="flex-1 py-3 rounded-xl bg-violet-500 active:bg-violet-600"
            >
              <Text className="text-center font-medium text-white">
                {isLastStep ? '완료' : '다음'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default AppTour;
