// ============================================================
// 친구 시스템 변경 함수
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// 친구 요청 보내기
export async function sendFriendRequest(
  supabase: SupabaseClient,
  clerkUserId: string,
  targetUserId: string
): Promise<{ success: boolean; friendshipId?: string; error?: string }> {
  // 자기 자신에게 요청 방지
  if (clerkUserId === targetUserId) {
    return { success: false, error: '자기 자신에게 친구 요청을 보낼 수 없습니다.' };
  }

  // 기존 관계 확인
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${clerkUserId},addressee_id.eq.${targetUserId}),` +
        `and(addressee_id.eq.${clerkUserId},requester_id.eq.${targetUserId})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, error: '이미 친구입니다.' };
    }
    if (existing.status === 'pending') {
      return { success: false, error: '이미 요청을 보냈거나 받았습니다.' };
    }
    if (existing.status === 'blocked') {
      return { success: false, error: '차단된 사용자입니다.' };
    }
  }

  // 친구 요청 생성
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: clerkUserId,
      addressee_id: targetUserId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Friends] Error sending request:', error);
    return { success: false, error: '친구 요청을 보내는 데 실패했습니다.' };
  }

  return { success: true, friendshipId: data.id };
}

// 친구 요청 수락
export async function acceptFriendRequest(
  supabase: SupabaseClient,
  clerkUserId: string,
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', friendshipId)
    .eq('addressee_id', clerkUserId)
    .eq('status', 'pending');

  if (error) {
    console.error('[Friends] Error accepting request:', error);
    return { success: false, error: '친구 요청을 수락하는 데 실패했습니다.' };
  }

  return { success: true };
}

// 친구 요청 거절
export async function rejectFriendRequest(
  supabase: SupabaseClient,
  clerkUserId: string,
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', friendshipId)
    .eq('addressee_id', clerkUserId)
    .eq('status', 'pending');

  if (error) {
    console.error('[Friends] Error rejecting request:', error);
    return { success: false, error: '친구 요청을 거절하는 데 실패했습니다.' };
  }

  return { success: true };
}

// 친구 요청 취소 (보낸 요청)
export async function cancelFriendRequest(
  supabase: SupabaseClient,
  clerkUserId: string,
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('requester_id', clerkUserId)
    .eq('status', 'pending');

  if (error) {
    console.error('[Friends] Error canceling request:', error);
    return { success: false, error: '친구 요청을 취소하는 데 실패했습니다.' };
  }

  return { success: true };
}

// 친구 삭제
export async function removeFriend(
  supabase: SupabaseClient,
  clerkUserId: string,
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`requester_id.eq.${clerkUserId},addressee_id.eq.${clerkUserId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('[Friends] Error removing friend:', error);
    return { success: false, error: '친구를 삭제하는 데 실패했습니다.' };
  }

  return { success: true };
}

// 사용자 차단
export async function blockUser(
  supabase: SupabaseClient,
  clerkUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  // 기존 관계 확인
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(requester_id.eq.${clerkUserId},addressee_id.eq.${targetUserId}),` +
        `and(addressee_id.eq.${clerkUserId},requester_id.eq.${targetUserId})`
    )
    .maybeSingle();

  if (existing) {
    // 기존 관계를 차단으로 변경
    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'blocked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[Friends] Error blocking user:', error);
      return { success: false, error: '사용자를 차단하는 데 실패했습니다.' };
    }
  } else {
    // 새로운 차단 관계 생성
    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: clerkUserId,
        addressee_id: targetUserId,
        status: 'blocked',
      });

    if (error) {
      console.error('[Friends] Error blocking user:', error);
      return { success: false, error: '사용자를 차단하는 데 실패했습니다.' };
    }
  }

  return { success: true };
}

// 차단 해제
export async function unblockUser(
  supabase: SupabaseClient,
  clerkUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${clerkUserId},addressee_id.eq.${targetUserId}),` +
        `and(addressee_id.eq.${clerkUserId},requester_id.eq.${targetUserId})`
    )
    .eq('status', 'blocked');

  if (error) {
    console.error('[Friends] Error unblocking user:', error);
    return { success: false, error: '차단을 해제하는 데 실패했습니다.' };
  }

  return { success: true };
}
