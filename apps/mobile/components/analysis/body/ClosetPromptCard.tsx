/**
 * 옷장 연결 CTA (Mobile) — C-1 결과 3섹션 구조 ③ (ADR-098)
 *
 * 장기 목표: 내 옷장에 있는 아이템을 퍼스널컬러/체형 원칙과 매칭해
 *   "오늘 뭐 입지?"를 해결. 무료 경로(쇼핑 없이 가치 제공).
 *
 * FEATURE_FLAGS.CLOSET_INTEGRATION:
 *   - true: 실제 옷장 화면(`/(closet)`)으로 이동 — 모바일은 인벤토리 구현 있음
 *   - false: "준비 중" 안내 (Phase 1.5)
 *
 * 웹 버전과 동일 UX, 링크만 모바일 라우트로 변경.
 */

import { FolderHeart, ChevronRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

import { FEATURE_FLAGS } from '@yiroom/shared';

export function ClosetPromptCard() {
  const isClosetActive = FEATURE_FLAGS.CLOSET_INTEGRATION;

  return (
    <View
      testID="closet-prompt-card"
      accessibilityLabel="내 옷장과 연결"
      className="overflow-hidden rounded-2xl border border-pink-200/60 bg-pink-50 p-5"
    >
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-pink-100">
          <FolderHeart size={16} color="#db2777" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">내 옷장과 연결</Text>
          <Text className="text-xs text-slate-600">
            오늘 뭐 입지? 체형·컬러 원칙으로 지금 있는 옷을 조합해봐요
          </Text>
        </View>
      </View>

      {isClosetActive ? (
        <Pressable
          testID="closet-prompt-link"
          onPress={() => router.push('/(closet)')}
          className="rounded-xl bg-white/90 p-3"
          accessibilityRole="button"
          accessibilityLabel="내 옷장으로 이동"
        >
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#ec4899" />
              <Text className="text-sm font-medium text-slate-900">
                내 옷장으로 이동해서 조합 보기
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </View>
        </Pressable>
      ) : (
        <View testID="closet-prompt-coming-soon" className="rounded-xl bg-white/90 p-3">
          <View className="mb-2 flex-row items-center gap-1.5">
            <View className="rounded-full bg-amber-100 px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-amber-800">준비 중</Text>
            </View>
            <Text className="text-xs text-slate-500">Phase 1.5 —</Text>
          </View>
          <Text className="text-xs leading-5 text-slate-900">
            옷장에 있는 아이템을 찍어두면, 체형·퍼스널컬러 원칙에 맞춰 오늘의 코디를 자동으로
            제안해드릴 예정이에요.
          </Text>
          <Text className="mt-2 text-[11px] text-slate-500">
            앱에서 먼저 옷장 기능을 이용해보실 수 있어요.
          </Text>
        </View>
      )}
    </View>
  );
}
