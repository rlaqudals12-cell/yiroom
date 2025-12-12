import { getDashboardStats, getRecentActivities } from '@/lib/admin';
import { StatCard } from './_components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const recentActivities = await getRecentActivities(10);

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
        <p className="text-gray-500 mt-1">이룸 서비스 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 사용자 통계 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">사용자</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="전체 사용자"
            value={stats.users.total}
            icon="users"
          />
          <StatCard
            title="오늘 가입"
            value={stats.users.today}
            description="신규 사용자"
            icon="users"
          />
          <StatCard
            title="이번 주 가입"
            value={stats.users.thisWeek}
            icon="users"
          />
          <StatCard
            title="이번 달 가입"
            value={stats.users.thisMonth}
            icon="users"
          />
        </div>
      </section>

      {/* 분석 통계 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">분석 완료</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="퍼스널 컬러"
            value={stats.analyses.personalColor}
            icon="palette"
          />
          <StatCard
            title="피부 분석"
            value={stats.analyses.skin}
            icon="sparkles"
          />
          <StatCard
            title="체형 분석"
            value={stats.analyses.body}
            icon="activity"
          />
          <StatCard
            title="운동 타입"
            value={stats.analyses.workout}
            icon="dumbbell"
          />
          <StatCard
            title="영양 설정"
            value={stats.analyses.nutrition}
            icon="apple"
          />
        </div>
      </section>

      {/* 제품 & 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 제품 통계 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">제품 DB</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="화장품"
              value={stats.products.cosmetics}
              icon="package"
            />
            <StatCard
              title="영양제"
              value={stats.products.supplements}
              icon="package"
            />
            <StatCard
              title="운동기구"
              value={stats.products.equipment}
              icon="dumbbell"
            />
            <StatCard
              title="건강식품"
              value={stats.products.healthFoods}
              icon="apple"
            />
          </div>
        </section>

        {/* 활동 통계 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">사용자 활동</h3>
          <div className="grid grid-cols-1 gap-4">
            <StatCard
              title="운동 기록"
              value={stats.activity.workoutLogs}
              description="총 운동 세션"
              icon="dumbbell"
            />
            <StatCard
              title="식사 기록"
              value={stats.activity.mealRecords}
              description="총 식사 기록"
              icon="apple"
            />
            <StatCard
              title="위시리스트"
              value={stats.activity.wishlists}
              description="찜한 제품"
              icon="heart"
            />
          </div>
        </section>
      </div>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">최근 활동이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === 'workout'
                          ? 'bg-indigo-500'
                          : activity.type === 'meal'
                            ? 'bg-green-500'
                            : 'bg-pink-500'
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      {activity.description}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}
