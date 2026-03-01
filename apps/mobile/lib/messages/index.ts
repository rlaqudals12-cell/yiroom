/**
 * 인앱 메시징 모듈
 *
 * 격려 메시지, 시스템 알림, 친구 메시지
 *
 * @module lib/messages
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export interface AppMessage {
  id: string;
  type: MessageType;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export type MessageType =
  | 'encouragement'
  | 'achievement'
  | 'friend_request'
  | 'friend_activity'
  | 'system'
  | 'reminder'
  | 'tip';

export interface MessageTemplate {
  type: MessageType;
  title: string;
  body: string;
  icon: string;
}

// ─── 격려 메시지 템플릿 ───────────────────────────────

export const ENCOURAGEMENT_MESSAGES: MessageTemplate[] = [
  // 스트릭 격려
  { type: 'encouragement', title: '연속 기록 유지 중!', body: '오늘도 이어가고 있어요. 멋져요! 🔥', icon: '🔥' },
  { type: 'encouragement', title: '꾸준함이 힘이에요', body: '매일 조금씩, 큰 변화를 만들어가고 있어요', icon: '💪' },
  { type: 'encouragement', title: '오늘의 한 걸음', body: '작은 노력이 모여 큰 결과를 만들어요', icon: '👣' },

  // 운동 격려
  { type: 'encouragement', title: '운동 시작이 반!', body: '오늘 운동 계획을 세워볼까요?', icon: '🏋️' },
  { type: 'encouragement', title: '몸이 기억해요', body: '꾸준한 운동이 체형을 바꿔요', icon: '💪' },

  // 영양 격려
  { type: 'encouragement', title: '균형 잡힌 하루', body: '오늘 식단을 기록하면 영양 밸런스를 확인할 수 있어요', icon: '🥗' },
  { type: 'encouragement', title: '물 한 잔 어때요?', body: '수분 섭취는 피부 건강의 기본이에요', icon: '💧' },

  // 뷰티 격려
  { type: 'encouragement', title: '피부 관리 시간', body: '오늘의 스킨케어 루틴을 완료해보세요', icon: '✨' },
  { type: 'encouragement', title: '변화를 느껴보세요', body: '정기적인 분석으로 변화를 추적해요', icon: '📊' },

  // 일반 격려
  { type: 'encouragement', title: '당신은 잘하고 있어요', body: '꾸준히 자기 관리를 하는 것 자체가 대단해요', icon: '🌟' },
  { type: 'encouragement', title: '오늘도 빛나는 하루', body: '이룸과 함께 더 나은 나를 만들어가요', icon: '✨' },
];

// ─── 팁 메시지 ────────────────────────────────────────

export const TIP_MESSAGES: MessageTemplate[] = [
  { type: 'tip', title: '스킨케어 팁', body: '세안 후 3분 이내에 토너를 발라야 수분이 유지돼요', icon: '💡' },
  { type: 'tip', title: '운동 팁', body: '공복 운동보다 가벼운 간식 후 운동이 효과적이에요', icon: '💡' },
  { type: 'tip', title: '영양 팁', body: '단백질은 한 끼에 20-30g이 최적 흡수량이에요', icon: '💡' },
  { type: 'tip', title: '수면 팁', body: '7-8시간 수면이 피부 재생에 가장 좋아요', icon: '💡' },
  { type: 'tip', title: '자세 팁', body: '1시간마다 스트레칭을 하면 자세 개선에 도움돼요', icon: '💡' },
  { type: 'tip', title: '퍼스널컬러 팁', body: '자연광에서 촬영하면 더 정확한 분석이 가능해요', icon: '💡' },
];

// ─── 시간대별 인사 메시지 ──────────────────────────────

/**
 * 시간대별 인사 메시지
 */
export function getGreetingMessage(hour?: number): MessageTemplate {
  const h = hour ?? new Date().getHours();

  if (h >= 5 && h < 9) {
    return { type: 'encouragement', title: '좋은 아침이에요! ☀️', body: '상쾌한 하루를 시작해볼까요?', icon: '☀️' };
  }
  if (h >= 9 && h < 12) {
    return { type: 'encouragement', title: '활기찬 오전이에요! 🌤️', body: '오늘의 목표를 확인해보세요', icon: '🌤️' };
  }
  if (h >= 12 && h < 14) {
    return { type: 'encouragement', title: '점심시간이에요! 🍽️', body: '균형 잡힌 식사를 즐겨보세요', icon: '🍽️' };
  }
  if (h >= 14 && h < 18) {
    return { type: 'encouragement', title: '오후도 파이팅! 💪', body: '잠깐 스트레칭은 어때요?', icon: '💪' };
  }
  if (h >= 18 && h < 21) {
    return { type: 'encouragement', title: '수고한 하루! 🌇', body: '오늘의 기록을 정리해보세요', icon: '🌇' };
  }
  return { type: 'encouragement', title: '편안한 밤이에요 🌙', body: '내일을 위한 충분한 휴식을 취하세요', icon: '🌙' };
}

// ─── 랜덤 메시지 ──────────────────────────────────────

/**
 * 랜덤 격려 메시지
 */
export function getRandomEncouragement(): MessageTemplate {
  const index = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
  return ENCOURAGEMENT_MESSAGES[index];
}

/**
 * 랜덤 팁 메시지
 */
export function getRandomTip(): MessageTemplate {
  const index = Math.floor(Math.random() * TIP_MESSAGES.length);
  return TIP_MESSAGES[index];
}

// ─── DB 연동 ──────────────────────────────────────────

/**
 * 사용자 메시지 조회
 */
export async function getUserMessages(
  supabase: SupabaseClient,
  userId: string,
  limit = 30
): Promise<AppMessage[]> {
  const { data } = await supabase
    .from('user_messages')
    .select('id, type, title, body, icon, read, created_at, data')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    icon: row.icon ?? '📩',
    read: row.read ?? false,
    createdAt: row.created_at,
    data: row.data ?? undefined,
  }));
}

/**
 * 안읽은 메시지 수
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('user_messages')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .eq('read', false);

  return count ?? 0;
}

/**
 * 메시지 읽음 처리
 */
export async function markAsRead(
  supabase: SupabaseClient,
  messageId: string
): Promise<void> {
  await supabase
    .from('user_messages')
    .update({ read: true })
    .eq('id', messageId);
}

/**
 * 모든 메시지 읽음 처리
 */
export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from('user_messages')
    .update({ read: true })
    .eq('clerk_user_id', userId)
    .eq('read', false);
}

/**
 * 시스템 메시지 전송
 */
export async function sendSystemMessage(
  supabase: SupabaseClient,
  userId: string,
  template: MessageTemplate,
  data?: Record<string, unknown>
): Promise<void> {
  await supabase.from('user_messages').insert({
    clerk_user_id: userId,
    type: template.type,
    title: template.title,
    body: template.body,
    icon: template.icon,
    read: false,
    data: data ?? null,
  });
}
