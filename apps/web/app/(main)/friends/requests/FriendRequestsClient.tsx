'use client';

import { useState } from 'react';
import { FriendRequestCard } from '@/components/friends';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/friends/mutations';
import { useAuth } from '@clerk/nextjs';
import type { FriendRequest } from '@/types/friends';
import { useRouter } from 'next/navigation';
import { UserX } from 'lucide-react';

interface FriendRequestsClientProps {
  initialRequests: FriendRequest[];
}

export function FriendRequestsClient({ initialRequests }: FriendRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = useClerkSupabaseClient();
  const { userId } = useAuth();
  const router = useRouter();

  const handleAccept = async (requestId: string) => {
    if (!userId) return;

    setProcessingId(requestId);
    try {
      const result = await acceptFriendRequest(supabase, userId, requestId);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      }
    } catch (error) {
      console.error('[FriendRequests] Accept error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!userId) return;

    setProcessingId(requestId);
    try {
      const result = await rejectFriendRequest(supabase, userId, requestId);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      }
    } catch (error) {
      console.error('[FriendRequests] Reject error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12" data-testid="friend-requests-empty">
        <UserX className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">받은 친구 요청이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="friend-requests-list">
      {requests.map((request) => (
        <FriendRequestCard
          key={request.id}
          request={request}
          onAccept={handleAccept}
          onReject={handleReject}
          isProcessing={processingId === request.id}
        />
      ))}
    </div>
  );
}
