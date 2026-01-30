# COMBO-10: AI 코치 통합 응답 (AI Coach Integrated Response)

> 크로스도메인 분석 10/10 - 다중 모듈 데이터를 통합한 AI 웰니스 코치 시스템

---

## 1. 연구 개요

### 1.1 목적

피부, 영양, 운동, 체형, 퍼스널컬러 등 모든 분석 데이터를 통합하여:
- **맞춤형 조언** 제공
- **대화형 인터페이스** 구현
- **실시간 질의응답** 지원
- **통합적 웰니스 가이드** 역할

### 1.2 시장 동향 (2025)

| 서비스 | 특징 | AI 기술 |
|--------|------|---------|
| **Fitbit AI Coach** | Gemini 기반 대화형 코치 | Google Gemini |
| **WHOOP Coach** | 실시간 피드백, 수면 최적화 | GPT 계열 |
| **Apple Fitness+** | 운동 추천, 동기부여 | On-device ML |
| **Noom** | 심리 기반 행동 변화 | NLP + CBT |

### 1.3 핵심 질문

| 질문 | 답변 방향 |
|------|----------|
| 어떤 AI 모델? | Gemini 3 Flash (기존 인프라 활용) |
| 대화 컨텍스트? | 모든 모듈 분석 결과 통합 |
| 응답 스타일? | 친근하고 전문적인 한국어 |
| 개인화 수준? | 사용자 프로필 + 분석 히스토리 기반 |

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI 코치 시스템 아키텍처                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   사용자 질문                                                    │
│       ↓                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              컨텍스트 수집 레이어                         │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│   │  │ 피부    │ │ 영양    │ │ 운동    │ │ 체형    │ ...   │   │
│   │  │ 분석    │ │ 데이터  │ │ 기록    │ │ 분석    │       │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│   └─────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              프롬프트 엔지니어링 레이어                   │   │
│   │  - 시스템 프롬프트 (코치 페르소나)                       │   │
│   │  - 컨텍스트 주입 (사용자 데이터)                         │   │
│   │  - 질문 분류 (intent detection)                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Gemini 3 Flash API                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              응답 후처리 레이어                           │   │
│   │  - 응답 검증 (안전성, 의료 면책)                         │   │
│   │  - 액션 추출 (추천 행동)                                 │   │
│   │  - 포맷팅 (마크다운, 이모지)                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│   AI 코치 응답                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 타입 정의

```typescript
// types/ai-coach.ts

export interface UserContext {
  profile: UserProfile;
  analyses: AnalysisSummaries;
  recentActivities: RecentActivity[];
  goals: UserGoal[];
  preferences: UserPreferences;
}

export interface UserProfile {
  userId: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  memberSince: Date;
}

export interface AnalysisSummaries {
  skin?: SkinSummary;
  nutrition?: NutritionSummary;
  fitness?: FitnessSummary;
  bodyType?: BodyTypeSummary;
  personalColor?: PersonalColorSummary;
  posture?: PostureSummary;
}

export interface SkinSummary {
  skinType: string;
  mainConcerns: string[];
  recentTrend: 'improving' | 'declining' | 'stable';
  lastAnalysisDate: Date;
  hydrationScore: number;
  overallScore: number;
}

export interface NutritionSummary {
  nutritionScore: number;
  deficiencies: string[];
  recentCalories: number;
  waterIntake: number;
  recommendations: string[];
}

export interface FitnessSummary {
  weeklyWorkouts: number;
  preferredExercises: string[];
  recentCaloriesBurned: number;
  activeMinutes: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface BodyTypeSummary {
  bodyType: string;
  posture: string;
  targetAreas: string[];
}

export interface PersonalColorSummary {
  season: string;
  subSeason: string;
  bestColors: string[];
  avoidColors: string[];
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    relatedModules?: string[];
    suggestedActions?: SuggestedAction[];
  };
}

export interface SuggestedAction {
  type: 'navigate' | 'log' | 'reminder' | 'learn';
  label: string;
  target: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CoachResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
  relatedTopics?: string[];
  disclaimer?: string;
}
```

---

## 3. 컨텍스트 수집

### 3.1 통합 컨텍스트 빌더

```typescript
// lib/ai-coach/context-builder.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { UserContext, AnalysisSummaries } from '@/types/ai-coach';

export async function buildUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  // 병렬로 모든 데이터 조회
  const [
    profile,
    skinAnalysis,
    nutritionData,
    fitnessData,
    bodyTypeData,
    personalColorData,
    postureData,
    recentActivities,
    goals,
    preferences,
  ] = await Promise.all([
    getUserProfile(supabase, userId),
    getLatestSkinAnalysis(supabase, userId),
    getLatestNutritionData(supabase, userId),
    getLatestFitnessData(supabase, userId),
    getLatestBodyTypeData(supabase, userId),
    getLatestPersonalColorData(supabase, userId),
    getLatestPostureData(supabase, userId),
    getRecentActivities(supabase, userId, 7), // 최근 7일
    getUserGoals(supabase, userId),
    getUserPreferences(supabase, userId),
  ]);

  return {
    profile,
    analyses: {
      skin: skinAnalysis ? summarizeSkinAnalysis(skinAnalysis) : undefined,
      nutrition: nutritionData ? summarizeNutrition(nutritionData) : undefined,
      fitness: fitnessData ? summarizeFitness(fitnessData) : undefined,
      bodyType: bodyTypeData ? summarizeBodyType(bodyTypeData) : undefined,
      personalColor: personalColorData ? summarizePersonalColor(personalColorData) : undefined,
      posture: postureData ? summarizePosture(postureData) : undefined,
    },
    recentActivities,
    goals,
    preferences,
  };
}

// 피부 분석 요약
function summarizeSkinAnalysis(analysis: any): SkinSummary {
  return {
    skinType: analysis.skin_type,
    mainConcerns: analysis.concerns || [],
    recentTrend: analysis.trend || 'stable',
    lastAnalysisDate: new Date(analysis.created_at),
    hydrationScore: analysis.scores?.hydration || 0,
    overallScore: analysis.overall_score || 0,
  };
}

// 영양 데이터 요약
function summarizeNutrition(data: any): NutritionSummary {
  const recent = data.recent_logs || [];
  const avgCalories = recent.length > 0
    ? recent.reduce((sum: number, log: any) => sum + log.calories, 0) / recent.length
    : 0;

  return {
    nutritionScore: data.score || 0,
    deficiencies: data.deficiencies || [],
    recentCalories: Math.round(avgCalories),
    waterIntake: data.water_intake || 0,
    recommendations: data.recommendations || [],
  };
}

// 운동 데이터 요약
function summarizeFitness(data: any): FitnessSummary {
  return {
    weeklyWorkouts: data.weekly_count || 0,
    preferredExercises: data.preferred_exercises || [],
    recentCaloriesBurned: data.calories_burned || 0,
    activeMinutes: data.active_minutes || 0,
    trend: data.trend || 'stable',
  };
}
```

### 3.2 컨텍스트 직렬화

```typescript
// lib/ai-coach/context-serializer.ts

export function serializeContextForPrompt(context: UserContext): string {
  const parts: string[] = [];

  // 프로필 정보
  parts.push(`## 사용자 프로필`);
  if (context.profile.nickname) {
    parts.push(`- 닉네임: ${context.profile.nickname}`);
  }
  if (context.profile.age) {
    parts.push(`- 연령대: ${getAgeGroup(context.profile.age)}`);
  }
  parts.push(`- 가입 기간: ${getDaysSince(context.profile.memberSince)}일`);

  // 분석 요약
  if (context.analyses.skin) {
    parts.push(`\n## 피부 상태`);
    parts.push(`- 피부 타입: ${context.analyses.skin.skinType}`);
    parts.push(`- 주요 고민: ${context.analyses.skin.mainConcerns.join(', ') || '없음'}`);
    parts.push(`- 수분 점수: ${context.analyses.skin.hydrationScore}/100`);
    parts.push(`- 최근 추세: ${translateTrend(context.analyses.skin.recentTrend)}`);
  }

  if (context.analyses.nutrition) {
    parts.push(`\n## 영양 상태`);
    parts.push(`- 영양 점수: ${context.analyses.nutrition.nutritionScore}/100`);
    parts.push(`- 부족 영양소: ${context.analyses.nutrition.deficiencies.join(', ') || '없음'}`);
    parts.push(`- 평균 칼로리: ${context.analyses.nutrition.recentCalories}kcal/일`);
  }

  if (context.analyses.fitness) {
    parts.push(`\n## 운동 현황`);
    parts.push(`- 주간 운동: ${context.analyses.fitness.weeklyWorkouts}회`);
    parts.push(`- 선호 운동: ${context.analyses.fitness.preferredExercises.join(', ') || '미정'}`);
    parts.push(`- 활동량 추세: ${translateTrend(context.analyses.fitness.trend)}`);
  }

  if (context.analyses.personalColor) {
    parts.push(`\n## 퍼스널컬러`);
    parts.push(`- 시즌: ${context.analyses.personalColor.season} ${context.analyses.personalColor.subSeason}`);
    parts.push(`- 추천 컬러: ${context.analyses.personalColor.bestColors.slice(0, 3).join(', ')}`);
  }

  if (context.analyses.bodyType) {
    parts.push(`\n## 체형 정보`);
    parts.push(`- 체형: ${context.analyses.bodyType.bodyType}`);
    parts.push(`- 자세: ${context.analyses.bodyType.posture}`);
  }

  // 목표
  if (context.goals.length > 0) {
    parts.push(`\n## 현재 목표`);
    context.goals.forEach(goal => {
      parts.push(`- ${goal.title} (진행률: ${goal.progress}%)`);
    });
  }

  // 최근 활동
  if (context.recentActivities.length > 0) {
    parts.push(`\n## 최근 7일 활동`);
    const activitySummary = summarizeActivities(context.recentActivities);
    parts.push(activitySummary);
  }

  return parts.join('\n');
}

function getAgeGroup(age: number): string {
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  return '50대 이상';
}

function getDaysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function translateTrend(trend: string): string {
  const map: Record<string, string> = {
    improving: '개선 중',
    increasing: '증가 중',
    declining: '하락 중',
    decreasing: '감소 중',
    stable: '안정적',
  };
  return map[trend] || trend;
}

function summarizeActivities(activities: any[]): string {
  const counts: Record<string, number> = {};
  activities.forEach(a => {
    counts[a.type] = (counts[a.type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => `- ${type}: ${count}회`)
    .join('\n');
}
```

---

## 4. 프롬프트 엔지니어링

### 4.1 시스템 프롬프트

```typescript
// lib/ai-coach/prompts.ts

export const COACH_SYSTEM_PROMPT = `당신은 "이룸"의 AI 웰니스 코치입니다.

## 역할
- 사용자의 피부, 영양, 운동, 체형, 스타일을 통합적으로 관리하는 친근한 코치
- 과학적 근거에 기반한 조언 제공
- 사용자의 라이프스타일에 맞는 실천 가능한 제안

## 성격
- 친근하고 따뜻한 톤 (존댓말 사용)
- 격려와 동기부여 중심
- 복잡한 내용을 쉽게 설명
- 유머를 적절히 활용

## 응답 가이드라인
1. **개인화**: 사용자의 분석 데이터와 목표를 참조하여 맞춤형 조언
2. **실천 가능성**: 구체적이고 실천 가능한 행동 제안
3. **통합적 관점**: 여러 영역(피부, 영양, 운동 등)의 연관성 설명
4. **긍정적 강화**: 작은 성취도 인정하고 격려
5. **안전 우선**: 의료 조언은 하지 않음, 전문가 상담 권유

## 응답 형식
- 간결하게 (150자 이내 권장, 최대 300자)
- 핵심 메시지 먼저
- 필요시 번호 목록 사용
- 이모지는 최소한으로 (문장 끝에 1개 정도)

## 금지 사항
- 의료 진단이나 처방 제안
- 특정 제품 브랜드 추천 (성분/유형은 가능)
- 극단적인 다이어트나 운동 권유
- 사용자 데이터 외 추측성 발언

## 면책 조항
건강 관련 조언 후에는 다음 문구 추가:
"더 정확한 정보는 전문가와 상담해 주세요."`;

export const INTENT_CLASSIFICATION_PROMPT = `사용자 질문의 의도를 분류해주세요.

카테고리:
- skin: 피부 관련 (스킨케어, 피부 고민, 제품)
- nutrition: 영양 관련 (식단, 영양소, 음식)
- fitness: 운동 관련 (운동 방법, 루틴, 체력)
- style: 스타일 관련 (퍼스널컬러, 패션, 메이크업)
- body: 체형/자세 관련
- general: 일반 웰니스, 동기부여, 기타
- progress: 진행 상황, 변화 추적 관련
- goal: 목표 설정, 계획 관련

질문: "{question}"

JSON 형식으로 응답:
{
  "primary_intent": "카테고리",
  "secondary_intents": ["카테고리"],
  "confidence": 0.0-1.0
}`;
```

### 4.2 컨텍스트 주입 템플릿

```typescript
// lib/ai-coach/prompt-builder.ts

export function buildCoachPrompt(
  userContext: UserContext,
  userMessage: string,
  conversationHistory: CoachMessage[],
  intent?: string
): string {
  const contextSerialized = serializeContextForPrompt(userContext);

  // 최근 대화 히스토리 (최대 5개)
  const recentHistory = conversationHistory.slice(-5);
  const historyText = recentHistory.length > 0
    ? recentHistory.map(m => `${m.role === 'user' ? '사용자' : '코치'}: ${m.content}`).join('\n')
    : '(첫 대화)';

  return `${COACH_SYSTEM_PROMPT}

---

## 사용자 데이터
${contextSerialized}

---

## 대화 히스토리
${historyText}

---

## 현재 질문
사용자: ${userMessage}

${intent ? `(감지된 의도: ${intent})` : ''}

---

위 정보를 바탕으로 사용자에게 맞춤형 조언을 제공해 주세요.`;
}
```

---

## 5. AI 코치 서비스

### 5.1 코어 서비스

```typescript
// lib/ai-coach/coach-service.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CoachMessage, CoachResponse, UserContext } from '@/types/ai-coach';
import { buildCoachPrompt, INTENT_CLASSIFICATION_PROMPT } from './prompt-builder';
import { buildUserContext } from './context-builder';
import { extractActions, validateResponse } from './response-processor';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function getCoachResponse(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string,
  conversationHistory: CoachMessage[]
): Promise<CoachResponse> {
  // 1. 사용자 컨텍스트 수집
  const userContext = await buildUserContext(supabase, userId);

  // 2. 의도 분류 (선택적)
  const intent = await classifyIntent(userMessage);

  // 3. 프롬프트 구성
  const prompt = buildCoachPrompt(
    userContext,
    userMessage,
    conversationHistory,
    intent
  );

  // 4. Gemini API 호출
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
      topK: 40,
      topP: 0.95,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // 5. 응답 후처리
    const validated = validateResponse(response);
    const actions = extractActions(response, intent, userContext);

    return {
      message: validated,
      suggestedActions: actions,
      relatedTopics: getRelatedTopics(intent),
      disclaimer: needsDisclaimer(intent)
        ? '더 정확한 정보는 전문가와 상담해 주세요.'
        : undefined,
    };
  } catch (error) {
    console.error('[AICoach] Gemini error:', error);
    return {
      message: '죄송해요, 잠시 문제가 생겼어요. 다시 한번 질문해 주시겠어요?',
      suggestedActions: [{
        type: 'navigate',
        label: '대시보드 보기',
        target: '/dashboard',
        priority: 'low',
      }],
    };
  }
}

async function classifyIntent(message: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 100,
      },
    });

    const prompt = INTENT_CLASSIFICATION_PROMPT.replace('{question}', message);
    const result = await model.generateContent(prompt);
    const json = JSON.parse(result.response.text());

    return json.primary_intent || 'general';
  } catch {
    return 'general';
  }
}

function getRelatedTopics(intent: string): string[] {
  const topicMap: Record<string, string[]> = {
    skin: ['영양이 피부에 미치는 영향', '수면과 피부 건강', '운동과 피부 결'],
    nutrition: ['피부를 위한 식단', '운동 전후 영양', '체중 관리'],
    fitness: ['체형별 운동 추천', '운동과 피부 건강', '식단과 운동 조합'],
    style: ['퍼스널컬러 활용법', '체형별 패션 팁', '메이크업 트렌드'],
    body: ['자세 교정 운동', '체형 관리', '옷 스타일링'],
    general: ['오늘의 웰니스 팁', '목표 설정하기', '진행 상황 확인'],
  };

  return topicMap[intent] || topicMap.general;
}

function needsDisclaimer(intent: string): boolean {
  return ['skin', 'nutrition', 'fitness', 'body'].includes(intent);
}
```

### 5.2 응답 후처리

```typescript
// lib/ai-coach/response-processor.ts

import { SuggestedAction, UserContext } from '@/types/ai-coach';

// 응답 검증 및 정제
export function validateResponse(response: string): string {
  // 의료 조언 필터링
  const medicalPatterns = [
    /진단/g,
    /처방/g,
    /약을/g,
    /치료/g,
    /병원에/g,
  ];

  let validated = response;

  medicalPatterns.forEach(pattern => {
    if (pattern.test(validated)) {
      validated = validated.replace(pattern, (match) => {
        console.warn(`[AICoach] Filtered medical term: ${match}`);
        return '';
      });
    }
  });

  // 길이 제한
  if (validated.length > 500) {
    validated = validated.slice(0, 497) + '...';
  }

  // 빈 응답 처리
  if (validated.trim().length < 10) {
    return '좋은 질문이에요! 조금 더 구체적으로 알려주시면 맞춤 조언을 드릴게요.';
  }

  return validated.trim();
}

// 액션 추출
export function extractActions(
  response: string,
  intent: string,
  context: UserContext
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // 의도별 기본 액션
  const intentActions: Record<string, SuggestedAction[]> = {
    skin: [
      { type: 'navigate', label: '피부 분석하기', target: '/analysis/skin', priority: 'high' },
      { type: 'log', label: '스킨케어 기록', target: '/log/skincare', priority: 'medium' },
    ],
    nutrition: [
      { type: 'log', label: '식단 기록하기', target: '/log/nutrition', priority: 'high' },
      { type: 'navigate', label: '영양 분석 보기', target: '/analysis/nutrition', priority: 'medium' },
    ],
    fitness: [
      { type: 'log', label: '운동 기록하기', target: '/log/workout', priority: 'high' },
      { type: 'navigate', label: '운동 추천받기', target: '/workout/recommend', priority: 'medium' },
    ],
    style: [
      { type: 'navigate', label: '퍼스널컬러 확인', target: '/analysis/personal-color', priority: 'high' },
      { type: 'learn', label: '스타일 가이드', target: '/guide/style', priority: 'medium' },
    ],
    progress: [
      { type: 'navigate', label: '진행 상황 보기', target: '/progress', priority: 'high' },
    ],
    goal: [
      { type: 'navigate', label: '목표 설정하기', target: '/goals', priority: 'high' },
    ],
  };

  // 기본 액션 추가
  if (intentActions[intent]) {
    actions.push(...intentActions[intent]);
  }

  // 컨텍스트 기반 추가 액션
  if (context.analyses.skin?.recentTrend === 'declining') {
    actions.push({
      type: 'navigate',
      label: '피부 상태 점검',
      target: '/analysis/skin',
      priority: 'high',
    });
  }

  if (context.analyses.fitness?.weeklyWorkouts < 2) {
    actions.push({
      type: 'learn',
      label: '쉬운 홈트레이닝',
      target: '/guide/home-workout',
      priority: 'medium',
    });
  }

  // 중복 제거 및 우선순위 정렬
  return deduplicateActions(actions)
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);
}

function deduplicateActions(actions: SuggestedAction[]): SuggestedAction[] {
  const seen = new Set<string>();
  return actions.filter(action => {
    const key = `${action.type}-${action.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

---

## 6. API 라우트

### 6.1 채팅 API

```typescript
// app/api/ai-coach/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getCoachResponse } from '@/lib/ai-coach/coach-service';
import { CoachMessage } from '@/types/ai-coach';

const requestSchema = z.object({
  message: z.string().min(1).max(500),
  conversationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      );
    }

    const { message, conversationId } = validated.data;
    const supabase = createServiceClient();

    // 대화 히스토리 조회
    let history: CoachMessage[] = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      history = messages?.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      })) || [];
    }

    // AI 응답 생성
    const response = await getCoachResponse(
      supabase,
      userId,
      message,
      history
    );

    // 대화 저장
    const newConversationId = conversationId || crypto.randomUUID();

    await supabase.from('coach_messages').insert([
      {
        conversation_id: newConversationId,
        clerk_user_id: userId,
        role: 'user',
        content: message,
      },
      {
        conversation_id: newConversationId,
        clerk_user_id: userId,
        role: 'assistant',
        content: response.message,
        metadata: {
          suggestedActions: response.suggestedActions,
          relatedTopics: response.relatedTopics,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        conversationId: newConversationId,
        response,
      },
    });
  } catch (error) {
    console.error('[API] /ai-coach/chat error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}
```

### 6.2 대화 기록 API

```typescript
// app/api/ai-coach/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createServiceClient();

    // 최근 대화 목록 조회
    const { data: conversations, error } = await supabase
      .from('coach_messages')
      .select('conversation_id, content, created_at')
      .eq('clerk_user_id', userId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 대화별 그룹화
    const grouped = groupConversations(conversations);

    return NextResponse.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error('[API] /ai-coach/history error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}

function groupConversations(messages: any[]): any[] {
  const groups = new Map<string, any>();

  messages.forEach(m => {
    if (!groups.has(m.conversation_id)) {
      groups.set(m.conversation_id, {
        conversationId: m.conversation_id,
        preview: m.content.slice(0, 50) + (m.content.length > 50 ? '...' : ''),
        lastMessageAt: m.created_at,
      });
    }
  });

  return Array.from(groups.values());
}
```

---

## 7. UI 컴포넌트

### 7.1 채팅 인터페이스

```tsx
// components/ai-coach/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoachMessage, CoachResponse, SuggestedAction } from '@/types/ai-coach';

interface ChatInterfaceProps {
  initialMessages?: CoachMessage[];
  conversationId?: string;
}

export function ChatInterface({
  initialMessages = [],
  conversationId: initialConversationId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<CoachMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: CoachMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.data.response.message,
          timestamp: new Date(),
          metadata: {
            suggestedActions: data.data.response.suggestedActions,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
        setConversationId(data.data.conversationId);
        setSuggestedActions(data.data.response.suggestedActions || []);
      }
    } catch (error) {
      console.error('[Chat] Error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '죄송해요, 잠시 문제가 생겼어요. 다시 시도해 주세요.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg"
      data-testid="chat-interface"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold">이룸 AI 코치</h2>
          <p className="text-sm text-gray-500">당신의 웰니스 파트너</p>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <WelcomeMessage onSuggestionClick={setInput} />
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* 추천 액션 */}
      {suggestedActions.length > 0 && (
        <div className="px-4 py-2 border-t">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestedActions.map((action, i) => (
              <ActionChip key={i} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WelcomeMessage({
  onSuggestionClick
}: {
  onSuggestionClick: (text: string) => void;
}) {
  const suggestions = [
    '오늘 피부 상태가 안 좋은데 어떻게 해야 할까요?',
    '운동을 시작하고 싶은데 뭐부터 하면 좋을까요?',
    '제 퍼스널컬러에 맞는 립스틱 색상은?',
    '최근 변화 추이를 알려주세요',
  ];

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">안녕하세요!</h3>
      <p className="text-gray-500 mb-4">
        피부, 영양, 운동, 스타일에 대해 무엇이든 물어보세요.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-2 text-sm bg-gray-100 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-indigo-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function ActionChip({ action }: { action: SuggestedAction }) {
  const icons: Record<string, string> = {
    navigate: '→',
    log: '✏️',
    reminder: '⏰',
    learn: '📚',
  };

  return (
    <a
      href={action.target}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors whitespace-nowrap"
    >
      <span>{icons[action.type]}</span>
      <span>{action.label}</span>
    </a>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
```

### 7.2 플로팅 코치 버튼

```tsx
// components/ai-coach/FloatingCoachButton.tsx
'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

export function FloatingCoachButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="AI 코치 열기"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* 채팅 패널 */}
      <div
        className={`fixed bottom-6 right-6 w-[380px] z-50 transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg z-10"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
          <ChatInterface />
        </div>
      </div>

      {/* 배경 오버레이 (모바일) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

---

## 8. 데이터베이스 스키마

```sql
-- 코치 대화 저장 테이블
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  clerk_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_coach_messages_conversation
  ON coach_messages(conversation_id, created_at);
CREATE INDEX idx_coach_messages_user
  ON coach_messages(clerk_user_id, created_at DESC);

-- RLS
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_messages" ON coach_messages
  FOR ALL USING (clerk_user_id = auth.get_user_id());

-- 대화 요약 (선택적)
CREATE TABLE coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 9. 구현 체크리스트

### P0 (Critical) - 핵심 기능

- [ ] 사용자 컨텍스트 수집
- [ ] Gemini API 연동
- [ ] 기본 채팅 UI
- [ ] 메시지 저장/조회

### P1 (High) - 주요 기능

- [ ] 의도 분류 (Intent Classification)
- [ ] 추천 액션 추출
- [ ] 대화 히스토리 관리
- [ ] 플로팅 코치 버튼

### P2 (Medium) - 부가 기능

- [ ] 응답 안전성 검증
- [ ] 관련 토픽 추천
- [ ] 면책 조항 자동 추가
- [ ] 음성 입력 지원 (선택)
- [ ] 대화 내보내기

---

## 10. 참고 자료

### 기술 문서
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/intro-to-prompting)
- [OpenAI Chat Completions](https://platform.openai.com/docs/guides/chat)

### 시장 동향
- Fitbit AI Coach with Gemini (2025)
- WHOOP Coach (Personalized AI)
- Apple Health + Siri Integration

### UX 참고
- Conversational UI Best Practices
- Health Chatbot Design Guidelines

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: Cross-Domain Analysis (10/10)
**Dependencies**: COMBO-1~9 (모든 크로스도메인 분석)
