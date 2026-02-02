/**
 * K-3 자세 교정 가이드 컴포넌트
 *
 * @description 체형별 자세 교정 운동 및 일상 팁 표시
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */
'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Info,
  Lightbulb,
  Target,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  BodyShape7,
  CorrectionExercise,
  PostureCorrectionGuide,
  PostureIssue,
  PostureIssueDetail,
} from '@/lib/body';
import {
  getPostureCorrectionGuide,
  getPostureIssueDetail,
  filterExercisesByDifficulty,
  POSTURE_ISSUES,
} from '@/lib/body';

interface PostureGuideProps {
  bodyType: BodyShape7;
  detectedIssues?: PostureIssue[];
  onExerciseSelect?: (exercise: CorrectionExercise) => void;
  className?: string;
}

// 자세 문제 한국어 이름
const ISSUE_NAMES: Record<PostureIssue, string> = {
  forward_head: '거북목',
  rounded_shoulders: '굽은 어깨',
  kyphosis: '등굽음',
  lordosis: '요추 과전만',
  anterior_pelvic_tilt: '골반 전방경사',
  posterior_pelvic_tilt: '골반 후방경사',
  scoliosis: '척추측만',
  flat_back: '일자허리',
  uneven_shoulders: '어깨 비대칭',
  leg_length_discrepancy: '다리 길이 차이',
};

// 체형별 한국어 이름
const BODY_TYPE_NAMES: Record<BodyShape7, string> = {
  hourglass: '모래시계형',
  pear: '배형',
  invertedTriangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴형',
  oval: '타원형',
};

// 난이도 레이블
const DIFFICULTY_LABELS: Record<1 | 2 | 3, { label: string; color: string }> = {
  1: { label: '쉬움', color: 'bg-green-100 text-green-700' },
  2: { label: '보통', color: 'bg-yellow-100 text-yellow-700' },
  3: { label: '어려움', color: 'bg-red-100 text-red-700' },
};

// 자세 교정 가이드 UI
export function PostureGuide({
  bodyType,
  detectedIssues,
  onExerciseSelect,
  className,
}: PostureGuideProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<1 | 2 | 3>(2);
  const [activeTab, setActiveTab] = useState<'exercises' | 'tips' | 'issues'>('exercises');

  // 체형별 교정 가이드 조회
  const guide: PostureCorrectionGuide = useMemo(
    () => getPostureCorrectionGuide(bodyType),
    [bodyType]
  );

  // 감지된 문제 또는 체형 기본 문제 사용
  const relevantIssues = detectedIssues || guide.commonIssues;

  // 난이도별 운동 필터링
  const filteredExercises = useMemo(
    () => filterExercisesByDifficulty(guide.exercises, selectedDifficulty),
    [guide.exercises, selectedDifficulty]
  );

  // 진행률 계산 (예시: 완료된 운동 수 / 전체 운동 수)
  const progressPercentage = useMemo(() => {
    if (guide.exercises.length === 0) return 0;
    // 실제로는 완료 상태를 추적해야 함 - 여기서는 예시
    return 0;
  }, [guide.exercises.length]);

  return (
    <div className={cn('space-y-4', className)} data-testid="posture-guide">
      {/* 헤더 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">자세 교정 가이드</CardTitle>
                <CardDescription>
                  {BODY_TYPE_NAMES[bodyType]} 체형을 위한 맞춤 운동
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {guide.exercises.length}개 운동
            </Badge>
          </div>
        </CardHeader>

        {/* 진행률 (추후 구현용) */}
        {progressPercentage > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">오늘의 진행률</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* 감지된 자세 문제 알림 */}
      {relevantIssues.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-medium text-amber-800">
                주의가 필요한 자세 문제
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {relevantIssues.map((issue) => (
                <Badge
                  key={issue}
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                  data-testid={`issue-badge-${issue}`}
                >
                  {ISSUE_NAMES[issue]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메인 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exercises" className="gap-1">
            <Dumbbell className="h-4 w-4" />
            운동
          </TabsTrigger>
          <TabsTrigger value="tips" className="gap-1">
            <Lightbulb className="h-4 w-4" />
            생활 팁
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-1">
            <Info className="h-4 w-4" />
            문제 상세
          </TabsTrigger>
        </TabsList>

        {/* 운동 탭 */}
        <TabsContent value="exercises" className="mt-4 space-y-4">
          {/* 난이도 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">난이도:</span>
            {([1, 2, 3] as const).map((level) => (
              <Button
                key={level}
                variant={selectedDifficulty >= level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty(level)}
                className="h-8"
                data-testid={`difficulty-${level}`}
              >
                {DIFFICULTY_LABELS[level].label}
              </Button>
            ))}
          </div>

          {/* 운동 목록 */}
          <div className="space-y-3">
            {filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={onExerciseSelect}
                />
              ))
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  선택한 난이도에 해당하는 운동이 없습니다.
                </p>
                <Button
                  variant="link"
                  onClick={() => setSelectedDifficulty(3)}
                  className="mt-2"
                >
                  모든 난이도 보기
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 생활 팁 탭 */}
        <TabsContent value="tips" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                일상 생활 팁
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {guide.dailyTips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm"
                    data-testid={`daily-tip-${index}`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Card className="mt-4 border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                주의사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guide.warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-red-700"
                    data-testid={`warning-${index}`}
                  >
                    <span className="text-red-500">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 자세 문제 상세 탭 */}
        <TabsContent value="issues" className="mt-4">
          <Accordion type="single" collapsible className="space-y-2">
            {relevantIssues.map((issue) => {
              const detail = getPostureIssueDetail(issue);
              return (
                <AccordionItem
                  key={issue}
                  value={issue}
                  className="border rounded-lg px-4"
                  data-testid={`issue-detail-${issue}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium">{detail.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <IssueDetail detail={detail} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 운동 카드 컴포넌트
function ExerciseCard({
  exercise,
  onSelect,
}: {
  exercise: CorrectionExercise;
  onSelect?: (exercise: CorrectionExercise) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const difficultyStyle = DIFFICULTY_LABELS[exercise.difficulty];

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded(!expanded)}
      data-testid={`exercise-card-${exercise.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{exercise.name}</h4>
              <Badge className={cn('text-xs', difficultyStyle.color)} variant="secondary">
                {difficultyStyle.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {exercise.description}
            </p>
          </div>
          <ChevronRight
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform',
              expanded && 'rotate-90'
            )}
          />
        </div>

        {/* 확장된 상세 정보 */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* 메타 정보 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">타겟:</span>
                <span>{exercise.targetArea}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">시간:</span>
                <span>{exercise.duration}</span>
              </div>
            </div>

            {/* 운동 단계 */}
            <div>
              <h5 className="text-sm font-medium mb-2">운동 방법</h5>
              <ol className="space-y-2">
                {exercise.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 주의사항 */}
            {exercise.cautions.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <h5 className="text-sm font-medium text-amber-800 mb-1">주의사항</h5>
                <ul className="space-y-1">
                  {exercise.cautions.map((caution, idx) => (
                    <li key={idx} className="text-xs text-amber-700 flex items-start gap-1">
                      <span>•</span>
                      <span>{caution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 선택 버튼 */}
            {onSelect && (
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(exercise);
                }}
                data-testid={`select-exercise-${exercise.id}`}
              >
                이 운동 시작하기
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 자세 문제 상세 컴포넌트
function IssueDetail({ detail }: { detail: PostureIssueDetail }) {
  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground">{detail.description}</p>

      {/* 원인 */}
      <div>
        <h5 className="text-sm font-medium mb-2">주요 원인</h5>
        <ul className="space-y-1">
          {detail.causes.map((cause, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 증상 */}
      <div>
        <h5 className="text-sm font-medium mb-2">관련 증상</h5>
        <div className="flex flex-wrap gap-2">
          {detail.symptoms.map((symptom, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {symptom}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PostureGuide;
