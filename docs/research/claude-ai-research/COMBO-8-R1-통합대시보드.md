# 전체 통합 대시보드

> **ID**: COMBO-8
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/app/(main)/dashboard/

---

## 1. 개요

### 1.1 통합 대시보드의 필요성

```
문제:
├── 분석 결과가 여러 페이지에 분산
├── 사용자가 전체 그림 파악 어려움
└── 크로스도메인 인사이트 놓침

해결:
├── 핵심 지표를 한 화면에
├── 모듈 간 연결 시각화
└── 개인화된 액션 아이템
```

### 1.2 UX 원칙 (2025 트렌드)

| 원칙 | 적용 |
|------|------|
| **정보 과부하 방지** | 핵심 지표만 표시, 상세는 드릴다운 |
| **액션 가능성** | 숫자만 X, 구체적 행동 제안 |
| **개인화** | 사용자 목표에 맞는 정보 강조 |
| **계층적 정보** | 개요 → 상세 → 깊은 분석 |

---

## 2. 대시보드 구조

### 2.1 레이아웃 설계

```
┌─────────────────────────────────────────────────────────────┐
│  [웰컴 메시지] "안녕하세요, {이름}님! 오늘의 인사이트입니다"  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 피부 점수   │  │ 영양 점수   │  │ 활동 점수   │         │
│  │    78/100   │  │    65/100   │  │    82/100   │         │
│  │  ↑5 이번주  │  │  ↓3 이번주  │  │  ↑12 이번주 │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [크로스 인사이트]                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔗 피부 수분도 ↓ + 물 섭취량 ↓ = 연관성 발견       │   │
│  │    → 물 섭취를 하루 500ml 늘려보세요               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [오늘의 액션]                        [최근 활동]          │
│  □ 비타민C 세럼 바르기                ✓ 피부 분석 완료    │
│  □ 스쿼트 3세트                       ✓ 영양 기록         │
│  □ 물 2L 마시기                       ✓ 아침 운동         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 모델

```typescript
// lib/dashboard/types.ts
export interface DashboardData {
  user: UserSummary;
  scores: ModuleScores;
  crossInsights: CrossInsight[];
  todayActions: ActionItem[];
  recentActivities: Activity[];
  weeklyTrend: WeeklyTrend;
  goals: GoalProgress[];
}

export interface ModuleScores {
  skin: ScoreData;
  nutrition: ScoreData;
  fitness: ScoreData;
  personalColor: ScoreData;
  bodyType: ScoreData;
}

export interface ScoreData {
  current: number;
  max: number;
  change: number; // 이번 주 변화량
  changeDirection: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  details?: Record<string, number>; // 세부 점수
}

export interface CrossInsight {
  id: string;
  type: 'correlation' | 'suggestion' | 'warning';
  modules: string[]; // 연관 모듈
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActionItem {
  id: string;
  module: string;
  title: string;
  completed: boolean;
  dueTime?: string;
  impact: string; // "피부 수분도 개선"
}
```

### 2.3 데이터 집계

```typescript
// lib/dashboard/aggregator.ts
export async function aggregateDashboardData(
  userId: string
): Promise<DashboardData> {
  // 병렬로 모든 모듈 데이터 조회
  const [
    skinAnalysis,
    nutritionData,
    fitnessData,
    personalColorData,
    bodyTypeData,
    activities,
  ] = await Promise.all([
    getLatestSkinAnalysis(userId),
    getLatestNutritionData(userId),
    getLatestFitnessData(userId),
    getLatestPersonalColorData(userId),
    getLatestBodyTypeData(userId),
    getRecentActivities(userId, 7), // 최근 7일
  ]);

  // 점수 계산
  const scores = calculateModuleScores({
    skin: skinAnalysis,
    nutrition: nutritionData,
    fitness: fitnessData,
    personalColor: personalColorData,
    bodyType: bodyTypeData,
  });

  // 크로스 인사이트 생성
  const crossInsights = generateCrossInsights({
    skin: skinAnalysis,
    nutrition: nutritionData,
    fitness: fitnessData,
  });

  // 오늘의 액션 생성
  const todayActions = generateTodayActions(scores, crossInsights);

  // 주간 트렌드 계산
  const weeklyTrend = calculateWeeklyTrend(activities);

  return {
    user: await getUserSummary(userId),
    scores,
    crossInsights,
    todayActions,
    recentActivities: activities.slice(0, 5),
    weeklyTrend,
    goals: await getUserGoals(userId),
  };
}

function generateCrossInsights(data: ModuleData): CrossInsight[] {
  const insights: CrossInsight[] = [];

  // 피부 수분도 + 물 섭취량 상관관계
  if (data.skin?.hydration < 50 && data.nutrition?.waterIntake < 2000) {
    insights.push({
      id: 'skin-hydration-water',
      type: 'correlation',
      modules: ['skin', 'nutrition'],
      title: '수분 부족 감지',
      description: '피부 수분도와 물 섭취량이 모두 낮습니다.',
      action: '하루 물 섭취량을 500ml 늘려보세요.',
      priority: 'high',
    });
  }

  // 피부 컨디션 + 수면 시간
  if (data.skin?.dullness > 60 && data.fitness?.sleepHours < 7) {
    insights.push({
      id: 'skin-dullness-sleep',
      type: 'correlation',
      modules: ['skin', 'fitness'],
      title: '수면과 피부 상태',
      description: '수면 부족이 피부 칙칙함에 영향을 줄 수 있습니다.',
      action: '7시간 이상 수면을 목표로 해보세요.',
      priority: 'medium',
    });
  }

  // 운동량 + 단백질 섭취
  if (data.fitness?.exerciseMinutes > 60 && data.nutrition?.protein < 50) {
    insights.push({
      id: 'exercise-protein',
      type: 'suggestion',
      modules: ['fitness', 'nutrition'],
      title: '단백질 보충 권장',
      description: '운동량 대비 단백질 섭취가 부족합니다.',
      action: '운동 후 단백질 쉐이크를 섭취해보세요.',
      priority: 'high',
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

---

## 3. UI 컴포넌트

### 3.1 점수 카드

```tsx
// components/dashboard/ScoreCard.tsx
export function ScoreCard({
  module,
  score,
  onClick,
}: {
  module: string;
  score: ScoreData;
  onClick: () => void;
}) {
  const getModuleIcon = (module: string) => {
    const icons = {
      skin: '✨',
      nutrition: '🥗',
      fitness: '💪',
      personalColor: '🎨',
      bodyType: '👤',
    };
    return icons[module] || '📊';
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition"
      onClick={onClick}
      data-testid={`score-card-${module}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{getModuleIcon(module)}</span>
          <Badge variant={score.changeDirection === 'up' ? 'default' : 'secondary'}>
            {score.changeDirection === 'up' && '↑'}
            {score.changeDirection === 'down' && '↓'}
            {Math.abs(score.change)}
          </Badge>
        </div>

        <h3 className="font-medium text-sm text-muted-foreground mb-1">
          {getModuleKoreanName(module)}
        </h3>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{score.current}</span>
          <span className="text-muted-foreground">/{score.max}</span>
        </div>

        {/* 프로그레스 바 */}
        <Progress
          value={(score.current / score.max) * 100}
          className="mt-2 h-2"
        />
      </CardContent>
    </Card>
  );
}
```

### 3.2 크로스 인사이트 카드

```tsx
// components/dashboard/CrossInsightCard.tsx
export function CrossInsightCard({ insight }: { insight: CrossInsight }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'correlation': return '🔗';
      case 'suggestion': return '💡';
      case 'warning': return '⚠️';
      default: return '📌';
    }
  };

  return (
    <Card
      className={cn(
        'border-l-4',
        insight.priority === 'high' && 'border-l-primary',
        insight.priority === 'medium' && 'border-l-yellow-500',
        insight.priority === 'low' && 'border-l-secondary'
      )}
      data-testid="cross-insight-card"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">{getTypeIcon(insight.type)}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{insight.title}</h4>
              {insight.modules.map(m => (
                <Badge key={m} variant="outline" className="text-xs">
                  {getModuleKoreanName(m)}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {insight.description}
            </p>
            {insight.action && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded text-sm">
                <span>👉</span>
                <span className="font-medium">{insight.action}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3.3 메인 대시보드 레이아웃

```tsx
// app/(main)/dashboard/page.tsx
export default async function DashboardPage() {
  const { userId } = await auth();
  const dashboardData = await aggregateDashboardData(userId);

  return (
    <div data-testid="dashboard" className="space-y-6 p-6">
      {/* 환영 메시지 */}
      <section>
        <h1 className="text-2xl font-bold">
          안녕하세요, {dashboardData.user.name}님!
        </h1>
        <p className="text-muted-foreground">
          오늘의 웰니스 인사이트를 확인해보세요.
        </p>
      </section>

      {/* 점수 카드 그리드 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">나의 웰니스 점수</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(dashboardData.scores).map(([module, score]) => (
            <ScoreCard
              key={module}
              module={module}
              score={score}
              onClick={() => router.push(`/analysis/${module}`)}
            />
          ))}
        </div>
      </section>

      {/* 크로스 인사이트 */}
      {dashboardData.crossInsights.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">발견한 인사이트</h2>
          <div className="space-y-3">
            {dashboardData.crossInsights.slice(0, 3).map(insight => (
              <CrossInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* 하단 2열 레이아웃 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 오늘의 액션 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">오늘의 액션</h2>
          <Card>
            <CardContent className="p-4">
              <ActionChecklist items={dashboardData.todayActions} />
            </CardContent>
          </Card>
        </section>

        {/* 최근 활동 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">최근 활동</h2>
          <Card>
            <CardContent className="p-4">
              <ActivityFeed activities={dashboardData.recentActivities} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* 주간 트렌드 차트 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">주간 트렌드</h2>
        <Card>
          <CardContent className="p-4">
            <WeeklyTrendChart data={dashboardData.weeklyTrend} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
```

### 3.4 주간 트렌드 차트

```tsx
// components/dashboard/WeeklyTrendChart.tsx
'use client';

import { Line } from 'react-chartjs-2';

export function WeeklyTrendChart({ data }: { data: WeeklyTrend }) {
  const chartData = {
    labels: data.dates.map(d => formatDate(d, 'E')), // 월, 화, 수...
    datasets: [
      {
        label: '피부',
        data: data.skin,
        borderColor: '#F472B6',
        backgroundColor: '#F472B620',
        fill: true,
        tension: 0.4,
      },
      {
        label: '영양',
        data: data.nutrition,
        borderColor: '#34D399',
        backgroundColor: '#34D39920',
        fill: true,
        tension: 0.4,
      },
      {
        label: '활동',
        data: data.fitness,
        borderColor: '#60A5FA',
        backgroundColor: '#60A5FA20',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div data-testid="weekly-trend-chart">
      <Line data={chartData} options={options} />
    </div>
  );
}
```

---

## 4. 성능 최적화

### 4.1 데이터 캐싱

```typescript
// lib/dashboard/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedDashboardData = unstable_cache(
  async (userId: string) => aggregateDashboardData(userId),
  ['dashboard-data'],
  {
    tags: ['dashboard'],
    revalidate: 60, // 60초 캐시
  }
);

// 캐시 무효화
export async function invalidateDashboardCache(userId: string) {
  revalidateTag('dashboard');
}
```

### 4.2 스켈레톤 로딩

```tsx
// components/dashboard/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* 환영 메시지 스켈레톤 */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-secondary rounded" />
        <div className="h-4 w-48 bg-secondary rounded" />
      </div>

      {/* 점수 카드 스켈레톤 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-secondary rounded-lg" />
        ))}
      </div>

      {/* 인사이트 스켈레톤 */}
      <div className="space-y-3">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-secondary rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

---

## 5. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 점수 카드 컴포넌트
- [ ] 기본 레이아웃
- [ ] 데이터 집계 함수

### 단기 적용 (P1)

- [ ] 크로스 인사이트 생성
- [ ] 주간 트렌드 차트
- [ ] 캐싱 최적화

### 장기 적용 (P2)

- [ ] AI 기반 인사이트
- [ ] 개인화 위젯
- [ ] 푸시 알림 연동

---

## 6. 참고 자료

- [Google Design - Beyond Steps UX](https://design.google/library/the-goal-behind-the-goal)
- [Personalized Health Dashboards Guide](https://basishealth.io/blog/personalized-health-dashboards-design-guide-and-best-practices)
- [Health Data Visualization PWA](https://dev.to/wellallytech/health-data-visualization-take-control-of-your-wellness-metrics-with-a-custom-pwa-1apk)
- [UX Trends in Healthcare 2025](https://www.compunnel.com/blogs/ux-ui-trends-in-healthcare/)

---

**Version**: 1.0 | **Priority**: P0 High
