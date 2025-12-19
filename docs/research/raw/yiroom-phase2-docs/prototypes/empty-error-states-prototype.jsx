import React, { useState } from 'react';

// ============================================
// 빈 상태 컴포넌트들
// ============================================

// 기본 빈 상태
const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <span className="text-5xl">{icon}</span>
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-500 mb-6 max-w-xs">{description}</p>
    )}
    {action && (
      <button 
        onClick={action.onClick}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        {action.label}
      </button>
    )}
  </div>
);

// 운동 기록 없음
const WorkoutHistoryEmpty = () => (
  <EmptyState
    icon="🏋️"
    title="아직 운동 기록이 없어요"
    description="첫 운동을 완료하면 여기에 기록이 쌓여요. 오늘 시작해볼까요?"
    action={{
      label: "첫 운동 시작하기",
      onClick: () => console.log('Navigate to workout')
    }}
  />
);

// 식단 기록 없음
const NutritionLogEmpty = () => (
  <EmptyState
    icon="🥗"
    title="오늘 기록한 식단이 없어요"
    description="건강한 식습관의 첫 걸음! 지금 먹은 음식을 기록해보세요."
    action={{
      label: "식단 기록하기",
      onClick: () => console.log('Navigate to food log')
    }}
  />
);

// 검색 결과 없음
const SearchResultEmpty = ({ query }) => (
  <EmptyState
    icon="🔍"
    title="검색 결과가 없어요"
    description={`"${query}"에 대한 결과를 찾지 못했어요. 다른 키워드로 검색해보세요.`}
  />
);

// 즐겨찾기 없음
const FavoritesEmpty = ({ type }) => (
  <EmptyState
    icon={type === 'workout' ? '💪' : '⭐'}
    title={`저장한 ${type === 'workout' ? '운동' : '음식'}이 없어요`}
    description={`마음에 드는 ${type === 'workout' ? '운동' : '음식'}의 하트를 눌러 저장해보세요.`}
    action={{
      label: `${type === 'workout' ? '운동' : '음식'} 탐색하기`,
      onClick: () => console.log('Navigate to explore')
    }}
  />
);

// 추천 없음 (온보딩 미완료)
const RecommendationEmpty = () => (
  <EmptyState
    icon="✨"
    title="맞춤 추천을 준비 중이에요"
    description="몇 가지 질문에 답하면 당신에게 딱 맞는 추천을 받을 수 있어요."
    action={{
      label: "시작하기",
      onClick: () => console.log('Navigate to onboarding')
    }}
  />
);

// ============================================
// 에러 상태 컴포넌트들
// ============================================

// 기본 에러 상태
const ErrorState = ({ icon = '😢', title, message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
      <span className="text-5xl">{icon}</span>
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-xs">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
      >
        다시 시도하기
      </button>
    )}
  </div>
);

// 네트워크 에러
const NetworkError = ({ onRetry }) => (
  <ErrorState
    icon="📡"
    title="연결할 수 없어요"
    message="인터넷 연결을 확인하고 다시 시도해주세요."
    onRetry={onRetry}
  />
);

// 서버 에러
const ServerError = ({ onRetry }) => (
  <ErrorState
    icon="🔧"
    title="문제가 발생했어요"
    message="잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요."
    onRetry={onRetry}
  />
);

// 권한 에러
const PermissionError = ({ type }) => (
  <ErrorState
    icon="🔒"
    title={`${type} 권한이 필요해요`}
    message={`이 기능을 사용하려면 ${type} 접근 권한을 허용해주세요.`}
  />
);

// AI 인식 실패
const AIRecognitionError = ({ onManualInput, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
      <span className="text-4xl">🤔</span>
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">음식을 인식하지 못했어요</h3>
    <p className="text-gray-500 mb-6 max-w-xs">
      사진이 흐릿하거나 음식이 잘 보이지 않을 수 있어요.
    </p>
    <div className="flex gap-3">
      <button 
        onClick={onRetry}
        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
      >
        다시 촬영
      </button>
      <button 
        onClick={onManualInput}
        className="px-5 py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"
      >
        직접 입력하기
      </button>
    </div>
  </div>
);

// ============================================
// 로딩 상태 컴포넌트들
// ============================================

// 기본 로딩 스피너
const LoadingSpinner = ({ size = 'md', message }) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${sizes[size]} border-purple-200 border-t-purple-500 rounded-full animate-spin`} />
      {message && (
        <p className="mt-4 text-gray-500 text-sm">{message}</p>
      )}
    </div>
  );
};

// 전체 화면 로딩
const FullScreenLoading = ({ message, icon }) => (
  <div className="fixed inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-50">
    {icon ? (
      <div className="relative">
        <div className="w-20 h-20 border-4 border-purple-300/30 border-t-purple-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    ) : (
      <div className="w-16 h-16 border-4 border-purple-300/30 border-t-purple-500 rounded-full animate-spin" />
    )}
    {message && (
      <p className="mt-6 text-white font-medium">{message}</p>
    )}
  </div>
);

// AI 분석 중 로딩
const AIAnalyzingLoader = () => (
  <FullScreenLoading 
    icon="🔍" 
    message="AI가 음식을 분석 중이에요..." 
  />
);

// 스켈레톤 카드
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

// 스켈레톤 대시보드
const SkeletonDashboard = () => (
  <div className="space-y-4 animate-pulse">
    {/* 프로그레스 링 스켈레톤 */}
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex justify-center">
        <div className="w-40 h-40 bg-gray-200 rounded-full" />
      </div>
    </div>
    
    {/* 카드 스켈레톤 */}
    <div className="space-y-3">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

// ============================================
// 오프라인 상태
// ============================================

const OfflineBanner = () => (
  <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center gap-3">
    <span className="text-yellow-600">📡</span>
    <p className="text-sm text-yellow-700">
      오프라인 상태예요. 일부 기능이 제한될 수 있어요.
    </p>
  </div>
);

// ============================================
// 데모 페이지
// ============================================

export default function EmptyErrorStatesDemo() {
  const [currentView, setCurrentView] = useState('empty-workout');
  
  const views = {
    'empty-workout': { label: '운동 기록 없음', component: <WorkoutHistoryEmpty /> },
    'empty-nutrition': { label: '식단 기록 없음', component: <NutritionLogEmpty /> },
    'empty-search': { label: '검색 결과 없음', component: <SearchResultEmpty query="치킨" /> },
    'empty-favorites': { label: '즐겨찾기 없음', component: <FavoritesEmpty type="workout" /> },
    'empty-recommend': { label: '추천 없음', component: <RecommendationEmpty /> },
    'error-network': { label: '네트워크 에러', component: <NetworkError onRetry={() => alert('Retry')} /> },
    'error-server': { label: '서버 에러', component: <ServerError onRetry={() => alert('Retry')} /> },
    'error-permission': { label: '권한 에러', component: <PermissionError type="카메라" /> },
    'error-ai': { label: 'AI 인식 실패', component: <AIRecognitionError onRetry={() => alert('Retry')} onManualInput={() => alert('Manual')} /> },
    'loading-basic': { label: '기본 로딩', component: <LoadingSpinner size="lg" message="불러오는 중..." /> },
    'loading-ai': { label: 'AI 분석 중', component: <AIAnalyzingLoader /> },
    'loading-skeleton': { label: '스켈레톤', component: <SkeletonDashboard /> },
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 오프라인 배너 데모 */}
      <OfflineBanner />
      
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">빈 상태 & 에러 UI</h1>
      </div>
      
      {/* 탭 선택 */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {Object.entries(views).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                currentView === key
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 미리보기 */}
      <div className="px-5 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-[400px] flex items-center justify-center">
          {views[currentView].component}
        </div>
      </div>
      
      {/* 사용 가이드 */}
      <div className="px-5 pb-8">
        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-2">💡 사용 가이드</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>빈 상태</strong>: 데이터가 없을 때 친절한 안내와 CTA 제공</li>
            <li>• <strong>에러 상태</strong>: 문제 상황을 명확히 설명하고 해결 방법 제시</li>
            <li>• <strong>로딩 상태</strong>: 작업 진행 중임을 시각적으로 표시</li>
            <li>• <strong>오프라인</strong>: 네트워크 상태 변화 시 배너 표시</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
