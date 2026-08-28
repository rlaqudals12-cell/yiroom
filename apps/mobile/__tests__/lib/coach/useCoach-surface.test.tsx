import { act, renderHook } from '@testing-library/react-native';

const mockUseWorkoutData = jest.fn(() => ({
  streak: { currentStreak: 7 },
  analysis: { workoutType: 'strength', goals: ['fitness'], fitnessLevel: 'beginner' },
  todayWorkout: { exercises: [{ name: '스쿼트' }] },
}));
const mockUseNutritionData = jest.fn(() => ({
  settings: { dailyCalorieGoal: 2000 },
  streak: { currentStreak: 5 },
}));
const mockSendCoachMessage = jest.fn<
  Promise<{ message: string; suggestedQuestions: string[] }>,
  [string, unknown[], string | undefined, Record<string, unknown>]
>(async () => ({
  message: '뷰티 답변입니다.',
  suggestedQuestions: ['다음 뷰티 질문'],
}));
const mockGetCoachSessions = jest.fn<Promise<never[]>, unknown[]>(async () => []);
const mockCreateCoachSession = jest.fn<Promise<null>, unknown[]>(async () => null);
const mockGetSessionMessages = jest.fn<Promise<never[] | null>, unknown[]>(async () => []);

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: jest.fn(async () => 'token-1') }),
  useUser: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: () => ({
    personalColor: { season: 'summer', tone: 'cool' },
    skinAnalysis: { skinType: 'dry', concerns: ['건조'] },
    bodyAnalysis: { bodyType: 'rectangle', height: 165, weight: 55, bmi: 20.2 },
    hairAnalysis: { hairType: 'straight', concerns: ['건조'] },
    makeupAnalysis: { undertone: 'cool', faceShape: 'oval' },
  }),
}));

jest.mock('../../../hooks/useWorkoutData', () => ({
  useWorkoutData: () => mockUseWorkoutData(),
}));

jest.mock('../../../hooks/useNutritionData', () => ({
  useNutritionData: () => mockUseNutritionData(),
}));

jest.mock('../../../lib/offline', () => ({
  useNetworkStatus: () => ({ isConnected: true }),
}));

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({ from: jest.fn() }),
}));

jest.mock('../../../lib/coach', () => ({
  BEAUTY_TEAM_QUICK_QUESTIONS: {
    general: ['오늘 뭐 입을까요?', '머리 어떻게 자를까요?', '오늘 화장 어떻게 할까요?'],
  },
  sendCoachMessage: (
    message: string,
    history: unknown[],
    token: string | undefined,
    context: Record<string, unknown>
  ) => mockSendCoachMessage(message, history, token, context),
  getMockResponse: () => ({ message: '오프라인 답변', suggestedQuestions: [] }),
}));

jest.mock('../../../lib/coach/history', () => ({
  BEAUTY_COACH_SESSION_CATEGORY: 'beauty-team',
  LEGACY_COACH_SESSION_CATEGORY: 'legacy-wellness',
  createCoachSession: (...args: unknown[]) => mockCreateCoachSession(...args),
  getCoachSessions: (...args: unknown[]) => mockGetCoachSessions(...args),
  getSessionMessages: (...args: unknown[]) => mockGetSessionMessages(...args),
  saveCoachMessage: jest.fn(async () => undefined),
}));

jest.mock('../../../lib/utils/logger', () => ({
  coachLogger: { error: jest.fn() },
}));

import { useBeautyTeamCoach } from '../../../lib/coach/useCoach';

describe('useBeautyTeamCoach 컨텍스트 경계', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSessionMessages.mockResolvedValue([]);
  });

  it('운동·영양 훅을 호출하지 않고 5축 컨텍스트만 전송한다', async () => {
    const { result } = renderHook(() => useBeautyTeamCoach());

    await act(async () => {
      await result.current.sendMessage('오늘 메이크업을 추천해 주세요');
    });

    expect(mockUseWorkoutData).not.toHaveBeenCalled();
    expect(mockUseNutritionData).not.toHaveBeenCalled();
    expect(mockSendCoachMessage).toHaveBeenCalledTimes(1);

    const sentContext = mockSendCoachMessage.mock.calls[0][3];
    expect(sentContext).toMatchObject({
      personalColor: { season: 'summer', tone: 'cool' },
      skinAnalysis: { skinType: 'dry', concerns: ['건조'] },
      bodyAnalysis: { bodyType: 'rectangle' },
      hairAnalysis: { hairType: 'straight' },
      makeupAnalysis: { undertone: 'cool', faceShape: 'oval' },
    });
    expect(sentContext).not.toHaveProperty('workout');
    expect(sentContext).not.toHaveProperty('nutrition');
    expect(sentContext).not.toHaveProperty('recentActivity');
    expect(mockGetCoachSessions).toHaveBeenCalledWith(expect.anything(), 'user-1', {
      category: 'beauty-team',
    });
    expect(mockCreateCoachSession).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      '오늘 메이크업을 추천해 주세요',
      'beauty-team'
    );
  });

  it('뷰티 출처가 아닌 sessionId는 현재 세션으로 채택하지 않는다', async () => {
    mockGetSessionMessages.mockResolvedValue(null);
    const { result } = renderHook(() => useBeautyTeamCoach());

    await act(async () => {
      await result.current.loadSession('legacy-session-1');
    });

    expect(mockGetSessionMessages).toHaveBeenCalledWith(
      expect.anything(),
      'legacy-session-1',
      'beauty-team'
    );
    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.error).toBe('이 대화 기록을 불러올 수 없어요.');
  });
});
