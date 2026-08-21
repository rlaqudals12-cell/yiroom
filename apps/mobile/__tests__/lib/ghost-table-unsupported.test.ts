import type { SupabaseClient } from '@supabase/supabase-js';

import { submitFeedback, getMyFeedbacks } from '@/lib/feedback';
import { getUserMessages, getUnreadCount, markAsRead, sendSystemMessage } from '@/lib/messages';
import { getLatestAnalysisScores } from '@/lib/wellness/queries';
import { achieveMilestone, getUserMilestones } from '@/lib/milestones/index';
import { getRecentScans, recordScan } from '@/lib/scan';

const from = jest.fn();
const supabase = { from } as unknown as SupabaseClient;

describe('대응 API가 없는 레거시 저장 기능', () => {
  beforeEach(() => from.mockClear());

  it('피드백 레거시 함수는 성공을 반환하지 않는다', async () => {
    await expect(
      submitFeedback(supabase, 'user-1', 'bug', '제목입니다', '충분히 긴 내용입니다')
    ).resolves.toBe(false);
    await expect(getMyFeedbacks(supabase, 'user-1')).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it('유령 메시지 저장은 빈 조회와 명시 실패를 반환한다', async () => {
    await expect(getUserMessages(supabase, 'user-1')).resolves.toEqual([]);
    await expect(getUnreadCount(supabase, 'user-1')).resolves.toBe(0);
    await expect(markAsRead(supabase, 'message-1')).rejects.toThrow('현재 지원하지 않아요');
    await expect(
      sendSystemMessage(supabase, 'user-1', {
        type: 'system',
        title: '알림',
        body: '내용',
        icon: 'i',
      })
    ).rejects.toThrow('현재 지원하지 않아요');
    expect(from).not.toHaveBeenCalled();
  });

  it('웰니스 분석 점수는 없는 테이블 대신 null을 반환한다', async () => {
    await expect(getLatestAnalysisScores(supabase, 'user-1')).resolves.toEqual({
      skinScore: null,
      bodyScore: null,
      postureScore: null,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('레거시 스캔·마일스톤도 성공을 가장하지 않는다', async () => {
    await expect(getRecentScans(supabase, 'user-1')).resolves.toEqual([]);
    await expect(recordScan(supabase, 'user-1', '8801234', null)).rejects.toThrow(
      '현재 지원하지 않아요'
    );
    await expect(getUserMilestones(supabase, 'user-1')).resolves.toEqual([]);
    await expect(achieveMilestone(supabase, 'user-1', 'ms-1', 1)).resolves.toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});
