'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/friends';
import { FriendRequestCard } from './FriendRequestCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox } from 'lucide-react';
import type { FriendRequest } from '@/types/friends';

interface ReceivedRequestsSectionProps {
  initialRequests: FriendRequest[];
}

/** 받은 친구 요청 섹션 — 수락/거절 핸들러 포함 */
export function ReceivedRequestsSection({ initialRequests }: ReceivedRequestsSectionProps) {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = useCallback(
    async (requestId: string) => {
      if (!user?.id || processingId) return;
      setProcessingId(requestId);

      const { success } = await acceptFriendRequest(supabase, user.id, requestId);

      if (success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      }

      setProcessingId(null);
    },
    [supabase, user?.id, processingId, router]
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      if (!user?.id || processingId) return;
      setProcessingId(requestId);

      const { success } = await rejectFriendRequest(supabase, user.id, requestId);

      if (success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      }

      setProcessingId(null);
    },
    [supabase, user?.id, processingId, router]
  );

  if (requests.length === 0) return null;

  return (
    <Card data-testid="received-requests-section">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          받은 친구 요청
          <span className="text-sm font-normal text-muted-foreground">({requests.length}건)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
