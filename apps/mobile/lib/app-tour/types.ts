/**
 * 앱 투어 타입 정의
 */

// ============================================================
// 투어 스텝 타입
// ============================================================

export type TourPosition = 'top' | 'bottom' | 'center';

export interface AppTourStep {
  id: string;
  title: string;
  description: string;
  tabKey?: string; // 연결된 탭 키
  position?: TourPosition;
  icon?: string; // 이모지 아이콘
}

// ============================================================
// 훅 반환 타입
// ============================================================

export interface UseAppTourReturn {
  isActive: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  currentStepIndex: number;
  currentStep: AppTourStep | null;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => Promise<void>;
}

// ============================================================
// 기본 투어 스텝 (5개 탭 기준)
// ============================================================

export const DEFAULT_APP_TOUR_STEPS: AppTourStep[] = [
  {
    id: 'home-tab',
    title: '홈',
    description: '오늘의 추천, 미션, 대시보드를 한눈에 확인하세요.',
    tabKey: 'index',
    position: 'bottom',
    icon: '🏠',
  },
  {
    id: 'beauty-tab',
    title: '뷰티',
    description: '피부 분석 결과를 바탕으로 맞춤 화장품을 추천받아보세요.',
    tabKey: 'beauty',
    position: 'bottom',
    icon: '💄',
  },
  {
    id: 'style-tab',
    title: '스타일',
    description: '체형에 맞는 코디와 스타일을 확인해보세요.',
    tabKey: 'style',
    position: 'bottom',
    icon: '👗',
  },
  {
    id: 'records-tab',
    title: '기록',
    description: '운동과 영양 기록을 한곳에서 관리하세요.',
    tabKey: 'records',
    position: 'bottom',
    icon: '📊',
  },
  {
    id: 'profile-tab',
    title: '프로필',
    description:
      '내 정보, 친구, 챌린지, 배지를 확인하세요.\n설정에서 투어를 다시 볼 수 있어요.',
    tabKey: 'profile',
    position: 'bottom',
    icon: '👤',
  },
];

// ============================================================
// 스토리지 키
// ============================================================

export const STORAGE_KEY = 'yiroom_app_tour_completed';
export const CURRENT_STEP_KEY = 'yiroom_app_tour_current_step';
