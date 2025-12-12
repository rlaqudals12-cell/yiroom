import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserList, getDashboardStats } from '@/lib/admin';
import { StatCard } from '../_components/StatCard';

export default async function AdminUsersPage() {
  const [{ users, total }, stats] = await Promise.all([
    getUserList(1, 50),
    getDashboardStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
        <p className="text-gray-500 mt-1">등록된 사용자를 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats.users.total}
          icon="users"
        />
        <StatCard
          title="오늘 가입"
          value={stats.users.today}
          icon="userPlus"
          description="신규 가입"
        />
        <StatCard
          title="이번 주"
          value={stats.users.thisWeek}
          icon="userPlus"
        />
        <StatCard
          title="이번 달"
          value={stats.users.thisMonth}
          icon="userPlus"
        />
      </div>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            최근 가입 사용자
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              등록된 사용자가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      사용자
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      분석 현황
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      가입일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.clerkUserId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || '이름 없음'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {user.clerkUserId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {user.hasPersonalColor && (
                            <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-700 rounded">
                              PC
                            </span>
                          )}
                          {user.hasSkin && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                              피부
                            </span>
                          )}
                          {user.hasBody && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              체형
                            </span>
                          )}
                          {user.hasWorkout && (
                            <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                              운동
                            </span>
                          )}
                          {user.hasNutrition && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              영양
                            </span>
                          )}
                          {!user.hasPersonalColor &&
                            !user.hasSkin &&
                            !user.hasBody &&
                            !user.hasWorkout &&
                            !user.hasNutrition && (
                              <span className="text-gray-400 text-xs">
                                분석 없음
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 50 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              {total}명 중 최근 50명 표시
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
