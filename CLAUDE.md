# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 핵심 가치 (불변)

- **앱 이름**: 이룸 (Yiroom)
- **슬로건**: "온전한 나는?" / "Know yourself, wholly."
- **핵심 철학**: 사용자의 변화를 돕는 통합 웰니스 AI 플랫폼
- **타겟**: 10대 후반~30대 초반 (성별 무관)

## 3대 개발 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 typecheck + lint + test 통과 필수

## SOLID 원칙 + Repository 패턴

### 현재 적용 상태

| 원칙 | 적용도 | 상태 |
|------|--------|------|
| **TDD** | 95% | ✅ 2,571개 테스트 유지 |
| **SRP** | 95% | ✅ lib/products/ Repository 분리 완료 |
| **OCP** | 60% | ⏳ 제품 타입 추가 시 고려 |
| **LSP** | 90% | ✅ AnyProduct 타입 계층 유지 |
| **ISP** | 85% | ✅ 인터페이스 분리 완료 |
| **DIP** | 85% | ✅ Supabase 추상화 완료 |
| **Repository** | 90% | ✅ products Repository 분리 완료 |

### 완료된 것 (2025-12-09)

```yaml
✅ lib/products.ts 분리 (SRP + Repository):
   - 1,214줄 → 도메인별 100-200줄 파일로 분리 완료
   - lib/products/repositories/ 구조 적용
   - lib/products/services/search.ts 통합 검색 분리
   - 기존 API 유지 (index.ts re-export)
```

### 유지해야 할 것

```yaml
1. Repository 패턴 일관성:
   - 새 모듈 추가 시 lib/api/workout.ts 패턴 따르기
   - 타입 정의 + DB 조회 + 비즈니스 로직 분리

2. 테스트 커버리지 유지:
   - 모든 변경 후 npm run test 통과 필수
   - 새 함수 추가 시 테스트 동반 작성
```

### 나중에 해도 되는 것 (트리거 조건)

```yaml
OCP 전략 패턴:
  트리거: 새 제품 타입 3개 이상 추가 시
  내용: ProductHandler 인터페이스 + 전략 패턴

완전한 DI 컨테이너:
  트리거: 팀 2명 이상 확장 시
  내용: 의존성 주입 프레임워크 도입

추상 Repository 인터페이스:
  트리거: Supabase 외 DB 지원 필요 시
  내용: Repository<T, Filter> 공통 인터페이스
```

### lib/ 구조 가이드

```
lib/
├── supabase/           # ✅ DIP 적용 (컨텍스트별 클라이언트)
├── api/                # ✅ Repository 패턴 (도메인별 API)
│   └── workout.ts      # 참고 템플릿
├── workout/            # ✅ SRP 적용 (기능별 분리)
├── nutrition/          # ✅ SRP 적용
├── stores/             # ✅ 상태 관리 분리
├── mock/               # ✅ 테스트/Fallback 분리
├── products/           # ✅ Repository 패턴 분리 완료
│   ├── index.ts        # 통합 export (기존 API 호환)
│   ├── repositories/   # 도메인별 CRUD
│   │   ├── cosmetic.ts     # 화장품 (~160줄)
│   │   ├── supplement.ts   # 영양제 (~140줄)
│   │   ├── equipment.ts    # 운동기구 (~170줄)
│   │   ├── healthfood.ts   # 건강식품 (~190줄)
│   │   └── price-history.ts # 가격 (~130줄)
│   ├── services/
│   │   ├── search.ts       # 통합 검색 (~240줄)
│   │   ├── reviews.ts      # 리뷰 서비스
│   │   └── interactions.ts # 성분 상호작용
│   ├── affiliate.ts    # 어필리에이트 클릭 트래킹
│   └── matching.ts     # 매칭 로직 (~420줄)
├── products.ts         # re-export (기존 import 호환)
└── ...
```

## 모듈 구성

| Phase | 모듈 | 설명 | 상태 |
|-------|------|------|------|
| Phase 1 | PC-1 | 퍼스널컬러 진단 | ✅ 완료 |
| Phase 1 | S-1 | 피부 분석 | ✅ 완료 |
| Phase 1 | C-1 | 체형 분석 | ✅ 완료 |
| Phase 2 | W-1 | 운동/피트니스 | ✅ 완료 |
| Phase 2 | N-1 | 영양/식단 | ✅ 완료 |
| Phase 2 | R-1 | 주간/월간 리포트 | ✅ 완료 |
| Phase 3 | 앱 고도화 | E2E 테스트, 크로스 모듈 | ✅ 완료 |
| Phase A | PWA + Product DB | Lite PWA, 제품 DB | ✅ 완료 |
| Phase B | React Native | 모노레포, Expo 앱 | 🔄 진행 중 |

## 개발 명령어 (Turborepo 모노레포)

```bash
# 전체 워크스페이스
npm run dev          # 모든 앱 개발 서버
npm run build        # 모든 앱 빌드
npm run typecheck    # 타입 체크
npm run test         # 테스트

# 웹 앱 전용 (apps/web)
npm run dev:web      # 웹 개발 서버
npm run build:web    # 웹 빌드

# 개별 워크스페이스에서 직접 실행
cd apps/web && npm run dev
cd apps/mobile && npm start

npx supabase start   # 로컬 Supabase
```

## 기술 스택

- **Framework**: Next.js 16+ (App Router, Turbopack) + React 19 + TypeScript
- **Auth**: Clerk (clerk_user_id 기반, Supabase 네이티브 통합 - JWT 템플릿 불필요)
- **Database**: Supabase (PostgreSQL 15+, RLS 필수)
- **AI**: Google Gemini 3 Pro (이미지 분석)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + React Testing Library (jsdom)

## 아키텍처

### Supabase 클라이언트 패턴 (lib/supabase/)

| 파일 | 함수 | 용도 |
|------|------|------|
| `clerk-client.ts` | `useClerkSupabaseClient()` | Client Component (React Hook) |
| `server.ts` | `createClerkSupabaseClient()` | Server Component/API Route |
| `service-role.ts` | `createServiceRoleClient()` | 관리자 권한 (RLS 우회) |
| `client.ts` | - | 공개 데이터 (인증 불필요) |

```tsx
// Client Component 예시
'use client';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();
  // ...
}

// Server Component 예시
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();
  const { data } = await supabase.from('users').select('*');
  // ...
}
```

### 디렉토리 구조 (Turborepo 모노레포)
```
yiroom/
├── apps/
│   ├── web/              # Next.js 웹 앱 (Lite PWA)
│   │   ├── app/          # App Router 페이지
│   │   ├── components/   # 웹 전용 컴포넌트
│   │   ├── lib/          # 웹 전용 유틸리티
│   │   ├── hooks/        # Custom Hooks
│   │   └── public/       # 정적 파일
│   └── mobile/           # Expo React Native 앱
│       ├── app/          # Expo Router 페이지
│       └── components/   # 모바일 전용 컴포넌트
├── packages/
│   └── shared/           # 공통 타입/유틸리티
│       └── src/
│           ├── types/    # 공유 타입 정의
│           └── utils/    # 공유 유틸리티
├── docs/                 # 설계 문서
├── turbo.json            # Turborepo 설정
└── package.json          # 루트 워크스페이스
```

### Route Groups (app/(main)/)

메인 기능들은 `app/(main)/` 그룹 내에 위치:
```
app/(main)/
├── analysis/           # Phase 1 분석 모듈
│   ├── personal-color/ # PC-1 퍼스널컬러
│   ├── skin/           # S-1 피부
│   └── body/           # C-1 체형
├── workout/            # W-1 운동 모듈
│   ├── onboarding/     # 7단계 온보딩 (step1~step7)
│   ├── result/         # 분석 결과
│   └── exercise/[id]/  # 운동 상세
└── dashboard/          # 대시보드
```

### Gemini AI 통합 패턴 (lib/gemini.ts)

```typescript
// AI 분석 요청 (3초 타임아웃 + 2회 재시도)
import { analyzeWorkout, recommendExercises } from '@/lib/gemini';

const result = await analyzeWorkout(input);
// 또는
const exercises = await recommendExercises(input);

// AI 실패 시 Mock Fallback (lib/mock/*.ts)
import { generateMockWorkoutAnalysis } from '@/lib/mock/workout-analysis';
const fallbackResult = generateMockWorkoutAnalysis(input);
```

### State Management (Zustand)

온보딩 등 다단계 입력에 Zustand 사용:
```typescript
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';

// 컴포넌트에서 사용
const { goals, setGoals } = useWorkoutInputStore();
```

### Dynamic Import 패턴

무거운 컴포넌트(차트, 모달, 인사이트 카드 등)는 `next/dynamic`으로 지연 로딩:

| 파일 | 컴포넌트 | 용도 |
|------|----------|------|
| `components/reports/dynamic.tsx` | CalorieTrendChartDynamic, WeeklyComparisonChartDynamic | recharts 차트 |
| `components/nutrition/dynamic.tsx` | ManualFoodInputSheetDynamic, WaterInputSheetDynamic, FastingTimerDynamic, *InsightCardDynamic | Sheet/인사이트 |
| `components/products/dynamic.tsx` | ProductFiltersDynamic | 필터 시트 |
| `components/products/detail/dynamic.tsx` | PriceHistoryChartDynamic | recharts 차트 |

```typescript
// default export 컴포넌트
export const ManualFoodInputSheetDynamic = dynamic(
  () => import('./ManualFoodInputSheet'),
  { ssr: false, loading: () => null }
);

// named export 컴포넌트
export const ProductFiltersDynamic = dynamic(
  () => import('./ProductFilters').then(mod => ({ default: mod.ProductFilters })),
  { ssr: false, loading: () => null }
);
```

### 데이터베이스 스키마 (clerk_user_id 연결)

**Phase 1 테이블:**
- `users` → Clerk 사용자 정보
- `personal_color_assessments` → PC-1 진단 결과 (온보딩 필수)
- `skin_analyses` → S-1 피부 분석 (PC 연동)
- `body_analyses` → C-1 체형 분석 (PC 연동)
- `ingredients` → 화장품 성분 DB

**Phase 2 테이블 (W-1):**
- `workout_analyses` → 운동 타입 분석 결과
- `workout_plans` → 주간 운동 플랜
- `workout_logs` → 운동 기록
- `workout_streaks` → 연속 운동 기록

**Phase 2 테이블 (N-1):**
- `nutrition_settings` → 영양 설정
- `foods` → 음식 DB (500종)
- `meal_records` → 식단 기록
- `water_records` → 수분 섭취 기록
- `daily_nutrition_summary` → 일일 영양 요약
- `favorite_foods` → 즐겨찾기 음식
- `fasting_records` → 간헐적 단식 기록
- `nutrition_streaks` → 식단 연속 기록

**Phase A 테이블 (Product DB v1):**
- `cosmetic_products` → 화장품 제품 DB (500개)
- `supplement_products` → 영양제 제품 DB (200개)

**Phase A 테이블 (Product DB v2):**
- `workout_equipment` → 운동 기구 DB (50개)
- `health_foods` → 건강식품 DB (100개)
- `product_price_history` → 가격 변동 히스토리
- `product_reviews` → 제품 리뷰 (clerk_user_id 기반)
- `review_helpful` → 리뷰 도움됨 표시
- `ingredient_interactions` → 성분 상호작용 경고 (24개 시드)
- `affiliate_clicks` → 어필리에이트 클릭 트래킹

## 코드 스타일

- ES Modules 전용 (CommonJS 금지)
- 한국어 주석 필수 (복잡한 로직 위에 "왜" 설명)
- 네이밍: 컴포넌트 PascalCase, 함수/변수 camelCase, 상수 UPPER_SNAKE_CASE
- 파일당 하나의 export default
- UI 텍스트: 자연스럽고 정중한 한국어 (신조어/슬랭 금지)

## SDD 워크플로우 (Spec-Driven Development)

**핵심 원칙: 스펙이 곧 코드다**

1. Plan Mode 진입 → 전체 설계 검토
2. `@docs/` 및 `@specs/` 문서 참조
3. Feature → Task → Development 문서 작성
4. 구현 후 typecheck + lint + test 실행

## 슬래시 명령어

- `/qplan` - 계획 분석 및 검토
- `/qcode` - 구현 + 테스트 + 포맷팅
- `/qcheck` - 코드 품질 검사
- `/test` - 테스트 실행
- `/review` - 코드 리뷰

## 핵심 규칙

- 스펙 없이 코딩 금지 → `specs/templates/` 참조
- Plan Mode 없이 구조 변경 금지
- RLS 정책 필수 (모든 테이블에 clerk_user_id 기반 정책)
- Server Actions 우선 사용
- 의심스러우면 `docs/` 확인 후 질문
- 테스트: `tests/` 디렉토리, `*.test.ts(x)` 패턴

## 상세 문서

| 문서 | 내용 |
|------|------|
| `docs/DATABASE-SCHEMA.md` | 테이블 구조, RLS, JSONB 필드 |
| `docs/SDD-WORKFLOW.md` | Spec-Driven Development 가이드 |
| `docs/TECH-STACK.md` | 기술 스택 상세 |
| `docs/HOOK-MODEL.md` | 사용자 리텐션 모델 |
| `docs/PROGRESS-PHASE2.md` | Phase 2 개발 진행 상황 |
| `.claude/agents/*.md` | 전문 Agent 설정 |

**Phase 2 스펙 문서:**
| 문서 | 내용 |
|------|------|
| `docs/phase2/docs/W-1-feature-spec-*.md` | W-1 기능 스펙 |
| `docs/phase2/docs/W-1-sprint-backlog-*.md` | W-1 스프린트 백로그 |
| `docs/phase2/docs/N-1-feature-spec-*.md` | N-1 기능 스펙 |
| `docs/phase2/docs/Database-스키마-*.md` | Phase 2 DB 스키마 |

## 운동 모듈 (W-1)

**운동 DB (JSON 파일):**
- `data/exercises/upper-body.json` - 상체 운동 50개
- `data/exercises/lower-core-cardio.json` - 하체/코어/유산소 50개

**연예인 DB:**
- `data/celebrities/celebrities.json` - 연예인 20명 루틴 데이터
- `lib/celebrities.ts` - 연예인 조회/필터 유틸리티
- `lib/celebrityMatching.ts` - 체형+PC 기반 매칭 로직

**운동 타입 5가지:** `toner`, `builder`, `burner`, `mover`, `flexer`

**컴포넌트 구조:**
```
components/workout/
├── common/           # 공통 (ProgressIndicator, SelectionCard, ExerciseCard)
├── result/           # 결과 화면 (WorkoutTypeCard, WorkoutInsightCard, BodyTypeInsight)
├── detail/           # 상세 화면 (PostureGuide, YouTubeEmbed)
└── onboarding/       # 온보딩 단계별 컴포넌트
```

**AI 인사이트 타입:** `balance`, `progress`, `streak`, `comparison`, `tip`

## 컴포넌트 컨벤션

- 최상위 컨테이너에 `data-testid` 속성 필수 (예: `data-testid="workout-type-card"`)
- 각 모듈별 `index.ts`에서 named export로 통합
- Lucide React 아이콘 사용

---
**Version**: 7.3 (테스트 2,571개 + 타겟 중립화) | **Updated**: 2025-12-17
