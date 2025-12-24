'use server';

/**
 * 피드백 제출 서버 액션
 * Sprint D Day 9: 운영 기능
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { SubmitFeedbackRequest, SubmitFeedbackResult, Feedback } from '@/types/feedback';
import { toFeedback } from './index';

/**
 * 피드백 제출
 */
export async function submitFeedback(
  data: SubmitFeedbackRequest
): Promise<SubmitFeedbackResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      };
    }

    const supabase = createClerkSupabaseClient();

    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        clerk_user_id: userId,
        type: data.type,
        title: data.title,
        content: data.content,
        contact_email: data.contactEmail || null,
        screenshot_url: data.screenshotUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Feedback] Insert error:', error);
      return {
        success: false,
        error: '피드백 저장에 실패했습니다.',
      };
    }

    return {
      success: true,
      feedback: toFeedback(feedback),
    };
  } catch (error) {
    console.error('[Feedback] Submit error:', error);
    return {
      success: false,
      error: '피드백 전송 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 내 피드백 목록 조회
 */
export async function getMyFeedbacks(): Promise<Feedback[]> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return [];
    }

    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Feedback] Fetch error:', error);
      return [];
    }

    return data.map(toFeedback);
  } catch (error) {
    console.error('[Feedback] Get my feedbacks error:', error);
    return [];
  }
}
