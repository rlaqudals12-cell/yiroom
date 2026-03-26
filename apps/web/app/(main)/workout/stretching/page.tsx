'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Loader2,
  AlertCircle,
  Clock,
  Play,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Expand,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 스트레칭 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체', icon: Expand },
  { id: 'upper', label: '상체', icon: ArrowUpFromLine },
  { id: 'lower', label: '하체', icon: ArrowDownFromLine },
  { id: 'full', label: '전신', icon: Expand },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

// 스트레칭 루틴 데이터
interface StretchRoutine {
  id: string;
  title: string;
  category: 'upper' | 'lower' | 'full';
  duration: number;
  exercises: number;
  difficulty: '초급' | '중급' | '고급';
  description: string;
  rating: number;
  completed: boolean;
}

const STRETCH_ROUTINES: StretchRoutine[] = [
  {
    id: '1',
    title: '아침 기상 스트레칭',
    category: 'full',
    duration: 10,
    exercises: 8,
    difficulty: '초급',
    description: '하루를 시작하는 부드러운 전신 스트레칭이에요',
    rating: 4.8,
    completed: false,
  },
  {
    id: '2',
    title: '목·어깨 풀기',
    category: 'upper',
    duration: 7,
    exercises: 6,
    difficulty: '초급',
    description: '거북목과 어깨 결림을 풀어주는 루틴이에요',
    rating: 4.9,
    completed: true,
  },
  {
    id: '3',
    title: '하체 유연성 향상',
    category: 'lower',
    duration: 15,
    exercises: 10,
    difficulty: '중급',
    description: '햄스트링과 고관절 유연성을 높여줘요',
    rating: 4.6,
    completed: false,
  },
  {
    id: '4',
    title: '등·허리 스트레칭',
    category: 'upper',
    duration: 12,
    exercises: 8,
    difficulty: '초급',
    description: '장시간 앉아있는 분께 추천하는 등·허리 루틴이에요',
    rating: 4.7,
    completed: false,
  },
  {
    id: '5',
    title: '운동 전 워밍업',
    category: 'full',
    duration: 8,
    exercises: 7,
    difficulty: '초급',
    description: '운동 전 부상을 예방하는 동적 스트레칭이에요',
    rating: 4.5,
    completed: false,
  },
  {
    id: '6',
    title: '운동 후 쿨다운',
    category: 'full',
    duration: 10,
    exercises: 8,
    difficulty: '초급',
    description: '운동 후 근육 회복을 도와주는 정적 스트레칭이에요',
    rating: 4.7,
    completed: true,
  },
  {
    id: '7',
    title: '골반·고관절 교정',
    category: 'lower',
    duration: 20,
    exercises: 12,
    difficulty: '중급',
    description: '틀어진 골반을 바로잡는 체형 교정 루틴이에요',
    rating: 4.8,
    completed: false,
  },
  {
    id: '8',
    title: '팔·손목 스트레칭',
    category: 'upper',
    duration: 5,
    exercises: 5,
    difficulty: '초급',
    description: '타이핑이 많은 분을 위한 팔·손목 케어에요',
    rating: 4.3,
    completed: false,
  },
  {
    id: '9',
    title: '전신 딥 스트레칭',
    category: 'full',
    duration: 25,
    exercises: 15,
    difficulty: '고급',
    description: '전신 유연성을 최대로 끌어올리는 고급 루틴이에요',
    rating: 4.9,
    completed: false,
  },
  {
    id: '10',
    title: '종아리·발목 강화',
    category: 'lower',
    duration: 10,
    exercises: 7,
    difficulty: '초급',
    description: '종아리 뭉침과 발목 가동성을 개선해줘요',
    rating: 4.4,
    completed: false,
  },
];

// 난이도별 색상
function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case '초급':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case '중급':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case '고급':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function StretchingPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [routines, setRoutines] = useState<StretchRoutine[]>(STRETCH_ROUTINES);

  // 필터링된 루틴
  const filteredRoutines = useMemo(() => {
    if (selectedCategory === 'all') return routines;
    return routines.filter((r) => r.category === selectedCategory);
  }, [routines, selectedCategory]);

  // 완료 토글
  const toggleCompleted = (id: string): void => {
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));
  };

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div
        data-testid="stretching-page-loading"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">스트레칭 루틴을 불러오고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 (미로그인)
  if (!user) {
    return (
      <div
        data-testid="stretching-page-error"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-lg font-semibold mb-1">로그인이 필요해요</p>
          <p className="text-muted-foreground">스트레칭 가이드를 보려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  // 완료 수
  const completedCount = routines.filter((r) => r.completed).length;

  return (
    <div data-testid="stretching-page" className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Expand className="w-7 h-7 text-purple-500" />
          스트레칭 가이드
        </h1>
        <p className="text-muted-foreground mt-1">
          유연성을 높이고 부상을 예방해보세요
          {completedCount > 0 && (
            <span className="ml-2 text-green-600 font-medium">({completedCount}개 완료)</span>
          )}
        </p>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 gap-1.5"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {filteredRoutines.length === 0 ? (
        <div data-testid="stretching-empty" className="text-center py-16">
          <Expand className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">이 카테고리의 루틴이 없어요</p>
        </div>
      ) : (
        /* 루틴 카드 목록 */
        <div className="space-y-3">
          {filteredRoutines.map((routine) => (
            <Card
              key={routine.id}
              className={`overflow-hidden transition-all ${
                routine.completed ? 'opacity-70 border-green-300 dark:border-green-800' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{routine.title}</h3>
                      {routine.completed && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {routine.duration}분
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {routine.exercises}개 동작
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(routine.difficulty)}`}
                      >
                        {routine.difficulty}
                      </span>
                      <span className="flex items-center gap-0.5 text-sm">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {routine.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={routine.completed ? 'outline' : 'default'}
                      className="gap-1"
                      onClick={() => toggleCompleted(routine.id)}
                    >
                      {routine.completed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          완료
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          시작
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
