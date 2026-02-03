/**
 * AI 코치 채팅 히스토리 관리 (Mobile)
 * @description 채팅 기록 저장/조회 - Supabase 연동
 */

import { SupabaseClient } from '@supabase/supabase-js';

import { coachLogger } from '../utils/logger';

import type { CoachMessage } from './index';

/**
 * 채팅 세션 타입
 */
export interface CoachSession {
  id: string;
  clerkUserId: string;
  title: string | null;
  category: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 새 채팅 세션 생성
 */
export async function createCoachSession(
  supabase: SupabaseClient,
  clerkUserId: string,
  firstMessage?: string
): Promise<CoachSession | null> {
  // 첫 메시지에서 제목 추출 (최대 50자)
  const title = firstMessage
    ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    : null;

  const { data, error } = await supabase
    .from('coach_sessions')
    .insert({
      clerk_user_id: clerkUserId,
      title,
      category: 'general',
    })
    .select()
    .single();

  if (error) {
    coachLogger.error('[Coach History] Session create error:', error);
    return null;
  }

  return {
    id: data.id,
    clerkUserId: data.clerk_user_id,
    title: data.title,
    category: data.category,
    messageCount: data.message_count,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * 채팅 메시지 저장
 */
export async function saveCoachMessage(
  supabase: SupabaseClient,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  suggestedQuestions?: string[]
): Promise<string | null> {
  const { data, error } = await supabase
    .from('coach_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      suggested_questions: suggestedQuestions || null,
    })
    .select('id')
    .single();

  if (error) {
    coachLogger.error('[Coach History] Message save error:', error);
    return null;
  }

  return data.id;
}

/**
 * 사용자의 채팅 세션 목록 조회
 */
export async function getCoachSessions(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit = 20
): Promise<CoachSession[]> {
  const { data, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    coachLogger.error('[Coach History] Sessions fetch error:', error);
    return [];
  }

  return data.map((session) => ({
    id: session.id,
    clerkUserId: session.clerk_user_id,
    title: session.title,
    category: session.category,
    messageCount: session.message_count,
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
  }));
}

/**
 * 특정 세션의 메시지 조회
 */
export async function getSessionMessages(
  supabase: SupabaseClient,
  sessionId: string
): Promise<CoachMessage[]> {
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    coachLogger.error('[Coach History] Messages fetch error:', error);
    return [];
  }

  return data.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
  }));
}

/**
 * 세션 삭제
 */
export async function deleteCoachSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('coach_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    coachLogger.error('[Coach History] Session delete error:', error);
    return false;
  }

  return true;
}
