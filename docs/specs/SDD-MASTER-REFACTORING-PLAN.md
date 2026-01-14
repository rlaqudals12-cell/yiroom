# SDD: 이룸 대규모 리팩토링 마스터 플랜

> 오류 예방, UI/UX 통합, 다국어 지원, 모듈 연동을 위한 종합 가이드
> Version: 1.9 | Created: 2026-01-13 | Updated: 2026-01-14 | Author: Claude Code (Opus 4.5)

---

## Executive Summary

이 문서는 이룸 프로젝트의 **대규모 리팩토링 및 신규 기능 구현**을 위한 최종 종합 가이드입니다.

### 핵심 목표

1. **오류 예방**: DB-API 불일치, UI 깨짐 등 반복 오류 근본 해결
2. **UI/UX 통합**: 200+ 컴포넌트의 하드코딩 색상 → 디자인 토큰 마이그레이션
3. **다국어 지원**: next-intl 활성화 + 500+ 하드코딩 텍스트 이관
4. **모듈 연동**: PC-1 ↔ S-1 ↔ C-1 ↔ F-1 크로스 모듈 아키텍처 확립

### 현황 진단 요약

| 영역              | 현재 상태                              | 위험도  | 우선순위 |
| ----------------- | -------------------------------------- | ------- | -------- |
| DB-API 동기화     | 규칙 문서화됨, 부분 해결               | 🔴 높음 | P0       |
| Clerk 인증        | proxy.ts 설정됨, 보호 라우트 정의 필요 | 🔴 높음 | P0       |
| API Rate Limiting | 미구현                                 | 🟡 중간 | P1       |
| Gemini AI         | Mock Fallback 필수, 타임아웃 설정 필요 | 🟡 중간 | P1       |
| UI/UX 컴포넌트    | 200+ 하드코딩 색상 (bg-_, text-_)      | 🔴 높음 | P1       |
| 다국어 지원       | 인프라 있으나 미사용                   | 🟡 중간 | P2       |
| 모듈 연동         | Gap 4개 미구현                         | 🟡 중간 | P1       |
| 스키마 문서       | 40% 불일치                             | 🟡 중간 | P2       |
| 보안 (OWASP)      | Clerk+RLS로 대부분 보호, 점검 필요     | 🟡 중간 | P1       |
| 성능 최적화       | Lighthouse 75점, 90+ 목표              | 🟡 중간 | P2       |
| 접근성            | Lighthouse 92점, 95+ 목표              | 🟡 중간 | P2       |
| 에러 로깅         | 모바일 Sentry 적용, 웹 미적용          | 🟡 중간 | P2       |

---

## Quick Start Guide (5분 가이드)

> 이 문서가 3,400+ 라인으로 방대합니다. **전체를 읽지 마세요.** 아래 가이드를 따르세요.

### 상황별 시작점

```
🚨 "500 에러 발생!" → Part 1.1 (DB-API 불일치)
🔐 "인증 문제!" → Part 1.2 (Clerk proxy.ts)
🎨 "UI 색상 통일하고 싶다" → Part 2.1 + Part 11.1
🌍 "다국어 추가하고 싶다" → Part 3.1
🔗 "모듈간 연동하고 싶다" → Part 4
✅ "테스트 추가하고 싶다" → Part 7
🔒 "보안 점검하고 싶다" → Part 9
⚡ "성능 개선하고 싶다" → Part 10
```

### 빠른 실행 체크리스트 (완전형)

**Phase 1: 기반 안정화 (~5시간)**

```
☐ Part 1.1: DB-API 동기화 규칙 숙지
☐ Part 1.2: proxy.ts 공개 라우트 확인
☐ Part 10.6: 환경변수 검증 스크립트 적용
☐ Part 9.x: OWASP 보안 점검
☐ Part 7.1: 변경 검증 자동화
```

**Phase 2+3: UI/UX + 기능 (~30시간, 병렬 가능)**

```
☐ Part 2.x: 전체 색상 토큰화
☐ Part 11.x: 디자인 시스템 정립
☐ Part 3.x: 전체 i18n
☐ Part 4.x: 모듈 연동 완성
```

**Phase 4: 품질 보증 (~15시간)**

```
☐ Part 7.3-7.4: 테스트 (접근성 + E2E)
☐ Part 12.x: WCAG 2.1 AA 접근성
☐ Part 10.x: 성능 최적화
```

### 참조 방식

| 상황           | 추천 방식                          |
| -------------- | ---------------------------------- |
| 특정 문제 해결 | Ctrl+F로 키워드 검색               |
| 새 기능 개발   | 해당 Part만 읽기                   |
| 전체 계획 검토 | Executive Summary + 부록 빠른 참조 |
| 코드 복붙 필요 | 해당 섹션 코드 블록만 복사         |

---

## 문서 유지보수 전략

### 동기화 자동화

**PR 체크리스트 (`.github/PULL_REQUEST_TEMPLATE.md` 추가)**

```markdown
## 문서 업데이트 체크

- [ ] 새 API 엔드포인트 → Part 1.3 API 목록 업데이트
- [ ] 새 컴포넌트 → Part 11 디자인 시스템 반영 여부
- [ ] 새 테이블/컬럼 → DATABASE-SCHEMA.md 동기화
- [ ] 새 환경변수 → Part 10.6 + .env.example 추가
- [ ] 제외된 대안 → Part 14 문서화
```

**자동 검증 스크립트**

```bash
# scripts/doc-sync-check.js - PR 시 자동 실행
- API 라우트 수 vs 문서 기재 수 비교
- 환경변수 .env.example vs Part 10.6 비교
- 마이그레이션 파일 수 vs Part 13.4 비교
```

### 버전 관리 정책

| 변경 규모      | 버전 증가 | 예시           |
| -------------- | --------- | -------------- |
| 오타/링크 수정 | 없음      | 오타 수정      |
| 섹션 내용 보강 | 0.0.1     | 예시 코드 추가 |
| 새 섹션 추가   | 0.1.0     | Part 15 추가   |
| 구조 변경      | 1.0.0     | Part 재구성    |

### 정기 리뷰 일정

```
매주 금요일 (15분):
☐ 이번 주 변경사항 vs 문서 차이 확인
☐ TODO 주석 → 문서 반영 여부

매월 1일 (1시간):
☐ Part 14 제외 항목 재검토
☐ 버전 히스토리 정리
☐ 사용되지 않는 섹션 아카이브

매분기 (2시간):
☐ 전체 문서 구조 검토
☐ 중복 내용 통합
☐ 외부 링크 유효성 확인
```

---

## 구현 로드맵 (완전형)

> 완전한 앱/웹 구현을 위한 단계별 실행 계획

### Phase 1: 기반 안정화 (최우선)

| Part | 항목               | 예상 시간 | 완료 기준                   |
| ---- | ------------------ | --------- | --------------------------- |
| 1.1  | DB-API 동기화 규칙 | 1시간     | 규칙 숙지 + 체크리스트 적용 |
| 1.2  | Clerk proxy.ts     | 30분      | 모든 라우트 보호 상태 확인  |
| 10.6 | 환경변수 검증      | 30분      | check-env.js 실행 성공      |
| 9.x  | OWASP 보안 점검    | 2시간     | 전체 체크리스트 통과        |
| 7.1  | 변경 검증 자동화   | 1시간     | typecheck + lint + test     |

**Phase 1 예상 시간: 5시간**

### Phase 2: UI/UX 통합

| Part | 항목               | 예상 시간 | 완료 기준                   |
| ---- | ------------------ | --------- | --------------------------- |
| 2.x  | 전체 색상 토큰화   | 8시간     | 200+ 컴포넌트 마이그레이션  |
| 11.x | 디자인 시스템 정립 | 4시간     | 토큰 + 컴포넌트 가이드 완성 |
| 11.5 | 애니메이션 시스템  | 2시간     | 토큰 + 접근성 적용          |
| 10.5 | Sentry 웹 설정     | 1시간     | 에러 수집 시작              |

**Phase 2 예상 시간: 15시간**

### Phase 3: 기능 완성

| Part | 항목            | 예상 시간 | 완료 기준                    |
| ---- | --------------- | --------- | ---------------------------- |
| 3.x  | 전체 i18n       | 6시간     | 500+ 텍스트 다국어 지원      |
| 4.x  | 모듈 연동 완성  | 4시간     | PC-1↔S-1↔C-1↔F-1 크로스 참조 |
| 5.x  | DB 마이그레이션 | 2시간     | 스키마 동기화 완료           |
| 3.5  | packages/shared | 3시간     | 웹/모바일 공유 패키지        |

**Phase 3 예상 시간: 15시간**

### Phase 4: 품질 보증

| Part | 항목               | 예상 시간 | 완료 기준                |
| ---- | ------------------ | --------- | ------------------------ |
| 7.3  | 접근성 테스트      | 2시간     | jest-axe 통과            |
| 7.4  | E2E 테스트 전체    | 6시간     | Playwright 시나리오 완성 |
| 12.x | 접근성 WCAG 2.1 AA | 4시간     | Lighthouse 95+           |
| 10.x | 성능 최적화        | 3시간     | Lighthouse 90+           |

**Phase 4 예상 시간: 15시간**

### 전체 구현 예상 시간: ~50시간

### 실행 순서 권장

```
[즉시] Phase 1 → [병렬] Phase 2 + 3 → [마무리] Phase 4
         ↓              ↓                    ↓
      안정성 확보    기능 구현            품질 검증
```

---

## 단점 완화 전략

### 문제 1: 문서 규모 (3,400+ 라인)

**완화책**:
| 전략 | 구현 |
|------|------|
| 진입점 단순화 | Quick Start Guide 추가 (위 참조) |
| 검색 최적화 | 각 Part에 키워드 태그 추가 |
| 분리 문서화 | 독립적 기능은 별도 SDD로 분리 |

**검색용 키워드 인덱스** (부록에 추가 예정):

```
500에러 → Part 1.1
인증실패 → Part 1.2
색상통일 → Part 2, 11
다국어 → Part 3
모듈연동 → Part 4
테스트 → Part 7
보안 → Part 9
성능 → Part 10
```

### 문제 2: 실행 리소스 부담

**완화책**:
| 전략 | 구현 |
|------|------|
| MVP 티어링 | Tier 1/2/3 분류 (위 참조) |
| 시간 예측 제공 | 각 항목에 예상 시간 명시 |
| 점진적 실행 | 주간 15분 단위로 분할 |

**주간 실행 플랜 예시**:

```
Week 1: Tier 1 완료 (2.5시간)
Week 2: Tier 2 - 7.1, 10.5 (2시간)
Week 3: Tier 2 - 2.1 (2시간)
Week 4: Tier 2 - 4.3 (2시간)
Week 5+: 필요에 따라 Tier 3
```

### 문제 3: 유지보수 부담

**완화책**:
| 전략 | 구현 |
|------|------|
| PR 템플릿 | 문서 업데이트 체크리스트 강제 |
| 자동 검증 | doc-sync-check.js 스크립트 |
| 정기 리뷰 | 주/월/분기 일정 (위 참조) |

### 문제 4: 이론 vs 실제 괴리

**완화책**:
| 전략 | 구현 |
|------|------|
| MVP 범위 명시 | "범위 외" 섹션으로 명확화 |
| 트리거 조건 | "~할 때 검토" 조건 명시 |
| 현실적 목표 | 100% → 핵심 20% 집중 |

### 문제 5: 기술 부채 축적

**완화책**:
| 전략 | 구현 |
|------|------|
| 분기 리뷰 | Part 14 정기 재검토 |
| 트리거 알림 | MAU/팀규모 등 조건 자동 체크 |
| 만료 정책 | 1년 이상 미검토 항목 아카이브 |

**기술 부채 추적 대시보드** (권장):

```typescript
// lib/tech-debt-tracker.ts
interface DeferredItem {
  id: string;
  addedAt: Date;
  lastReviewedAt: Date;
  triggerConditions: string[];
  status: 'active' | 'archived' | 'implemented';
}

// 분기별 자동 리마인드
function checkDeferredItems() {
  const staleItems = items.filter((item) => daysSince(item.lastReviewedAt) > 90);
  if (staleItems.length > 0) {
    notify(`${staleItems.length}개 제외 항목 리뷰 필요`);
  }
}
```

---

## Part 1: 오류 패턴 및 예방 전략

### 1.1 Critical: DB-API 불일치 오류

**발생 패턴**:

```
API 코드 수정 → 새 컬럼 insert 시도 → DB에 컬럼 없음 → 500 에러
```

**실제 사례 (2026-01-13)**:

```typescript
// apps/web/app/api/analyze/personal-color/route.ts:402-405
const { data, error } = await supabase.from('personal_color_assessments').insert({
  left_image_url: leftImageUrl, // ❌ 컬럼 없었음
  right_image_url: rightImageUrl, // ❌ 컬럼 없었음
  images_count: imagesCount, // ❌ 컬럼 없었음
  analysis_reliability: reliability, // ❌ 컬럼 없었음
});
```

**해결 (마이그레이션 생성)**:

```sql
-- supabase/migrations/20260113_pc_multi_angle_columns.sql
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS left_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_image_url TEXT,
  ADD COLUMN IF NOT EXISTS images_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS analysis_reliability TEXT DEFAULT 'medium';
```

**예방 체크리스트** (PR 리뷰 필수):

```
☐ API에서 .insert() 또는 .update() 변경 시:
  ☐ 삽입/수정하는 컬럼 목록 추출
  ☐ supabase/migrations/ 에서 해당 테이블 스키마 확인
  ☐ 컬럼 존재 여부 검증
  ☐ 없으면 마이그레이션 먼저 생성

☐ 새 컬럼 추가 순서:
  1. 마이그레이션 SQL 작성
  2. npx supabase db push
  3. API 코드 수정
  4. 테스트 실행
```

**관련 문서**: [.claude/rules/db-api-sync.md](.claude/rules/db-api-sync.md)

---

### 1.2 Critical: Clerk 인증 문제

#### 1.2.1 proxy.ts (middleware) 설정

**Next.js 16 변경사항**: `middleware.ts` → `proxy.ts` 마이그레이션 필수

```typescript
// apps/web/proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/home',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/announcements',
  '/help(.*)',
  '/api/webhooks(.*)',
  '/terms',
  '/privacy-policy',
]);

export const proxy = clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  { debug: process.env.NODE_ENV === 'development' }
);
```

**주의**: `middleware.ts`와 `proxy.ts` 동시 존재 불가 (충돌 에러)

#### 1.2.2 Clerk-Supabase 연동

**현재 구현**:

```typescript
// lib/supabase/clerk-client.ts - Client Component용
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();
  // Clerk 토큰을 Supabase에 전달
  return createClient(url, key, {
    accessToken: async () => await getToken({ template: 'supabase' }),
  });
}

// lib/supabase/server.ts - Server Component/API용
export function createClerkSupabaseClient() {
  // 서버 측 인증 토큰 처리
}
```

**문제 패턴**:

```typescript
// ❌ 잘못된 사용: Client Component에서 서버 함수 사용
const supabase = createClerkSupabaseClient(); // Server용 함수

// ✅ 올바른 사용
('use client');
const supabase = useClerkSupabaseClient(); // Client용 훅
```

#### 1.2.3 보호 라우트 목록

| 경로              | 보호 수준 | 설명        |
| ----------------- | --------- | ----------- |
| `/home`           | 공개      | 홈 페이지   |
| `/analysis/*`     | 인증 필수 | 분석 페이지 |
| `/profile/*`      | 인증 필수 | 프로필      |
| `/settings/*`     | 인증 필수 | 설정        |
| `/workout/*`      | 인증 필수 | 운동        |
| `/nutrition/*`    | 인증 필수 | 영양        |
| `/api/analyze/*`  | 인증 필수 | 분석 API    |
| `/api/webhooks/*` | 공개      | 외부 웹훅   |

---

### 1.3 High: API 라우트 관리

#### 1.3.1 주요 API 엔드포인트 목록

```
app/api/
├── analyze/
│   ├── personal-color/route.ts   # PC-1 분석
│   ├── face/route.ts             # F-1 분석
│   ├── skin/route.ts             # S-1 분석
│   └── body/route.ts             # C-1 분석
├── products/
│   ├── route.ts                  # 제품 목록
│   ├── [id]/route.ts             # 제품 상세
│   └── reviews/route.ts          # 리뷰
├── workout/
│   ├── logs/route.ts             # 운동 기록
│   └── plans/route.ts            # 운동 계획
├── nutrition/
│   ├── meals/route.ts            # 식단 기록
│   └── water/route.ts            # 물 섭취
├── coach/route.ts                # AI 코치
├── storage/
│   └── upload/route.ts           # 이미지 업로드
└── webhooks/
    ├── clerk/route.ts            # Clerk 웹훅
    └── affiliate/route.ts        # 어필리에이트 웹훅
```

#### 1.3.2 Rate Limiting 설정

**현황**: 기본 Rate Limiting 미구현

**권장 구현**:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 분당 10회
});

// API 라우트에서 사용
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... 실제 로직
}
```

#### 1.3.3 CORS 설정

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ];
  },
};
```

---

### 1.4 High: Gemini AI 분석 모듈

#### 1.4.1 현재 구현 현황

```
lib/
├── gemini.ts                    # 메인 Gemini 클라이언트
├── gemini/
│   └── prompts/
│       ├── personal-color.ts   # PC-1 프롬프트
│       ├── skin.ts             # S-1 프롬프트
│       ├── body.ts             # C-1 프롬프트
│       └── face.ts             # F-1 프롬프트
└── mock/
    ├── personal-color.ts       # PC-1 Mock
    ├── skin-analysis.ts        # S-1 Mock
    ├── body-analysis.ts        # C-1 Mock
    └── face-analysis.ts        # F-1 Mock
```

#### 1.4.2 타임아웃 및 재시도 설정

```typescript
// lib/gemini.ts
const TIMEOUT_MS = 30000; // 30초 타임아웃
const MAX_RETRIES = 2; // 최대 2회 재시도

export async function analyzeWithGemini<T>(
  input: AnalysisInput,
  options: { timeout?: number; retries?: number } = {}
): Promise<T> {
  const { timeout = TIMEOUT_MS, retries = MAX_RETRIES } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await model.generateContent({
        contents: [
          /* ... */
        ],
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return parseResult<T>(result);
    } catch (error) {
      if (attempt === retries) {
        console.error('[Gemini] All retries failed:', error);
        throw error;
      }
      console.warn(`[Gemini] Retry ${attempt + 1}/${retries}`);
    }
  }
}
```

#### 1.4.3 Mock Fallback 패턴 (필수)

```typescript
// 모든 AI 분석 함수에 적용
export async function analyzeSkin(input: SkinInput): Promise<SkinResult> {
  try {
    return await analyzeWithGemini<SkinResult>(input);
  } catch (error) {
    console.error('[S-1] Gemini error, falling back to mock:', error);
    return generateMockSkinResult(input);
  }
}
```

---

### 1.5 Medium: 상태 관리

#### 1.5.1 Zustand 스토어 목록

```
lib/stores/
├── sessionStore.ts             # 세션 상태
├── compareStore.ts             # 제품 비교
├── recentlyViewedStore.ts      # 최근 본 항목
├── favoritesStore.ts           # 즐겨찾기
├── productFilterStore.ts       # 제품 필터
└── workoutSessionStore.ts      # 운동 세션
```

#### 1.5.2 Zustand 잠재적 문제 패턴

```typescript
// ❌ 메모리 누수 위험: 구독 해제 누락
useEffect(() => {
  const unsubscribe = useStore.subscribe(handler);
  // return unsubscribe; // 누락!
}, []);

// ✅ 올바른 패턴
useEffect(() => {
  const unsubscribe = useStore.subscribe(handler);
  return () => unsubscribe();
}, []);
```

#### 1.5.3 Zustand 리렌더링 최적화

```typescript
// ❌ 전체 스토어 구독 (불필요한 리렌더링)
const store = useStore();

// ✅ 필요한 필드만 선택
const count = useStore((state) => state.count);
const { increment, decrement } = useStore((state) => ({
  increment: state.increment,
  decrement: state.decrement,
}));
```

#### 1.5.4 폼 상태 관리 (React Hook Form + Zod)

**현재 구현 현황**:

```
다단계 폼:
├── 온보딩 (onboarding/*) - Zustand 사용
├── 분석 폼 (analysis/*) - React Hook Form + Zod
├── 설정 폼 (settings/*) - React Hook Form + Zod
└── 피드백 폼 (feedback) - React Hook Form
```

**Zod 스키마 정의 패턴**:

```typescript
// lib/schemas/analysis.ts
import { z } from 'zod';

export const skinAnalysisInputSchema = z.object({
  skinType: z.enum(['oily', 'dry', 'combination', 'normal']),
  concerns: z.array(z.string()).min(1, '최소 1개 고민을 선택하세요'),
  age: z.number().min(10).max(100),
  image: z.instanceof(File).optional(),
});

export type SkinAnalysisInput = z.infer<typeof skinAnalysisInputSchema>;
```

**React Hook Form 표준 패턴**:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { skinAnalysisInputSchema, type SkinAnalysisInput } from '@/lib/schemas/analysis';

export function SkinAnalysisForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<SkinAnalysisInput>({
    resolver: zodResolver(skinAnalysisInputSchema),
    defaultValues: {
      skinType: 'combination',
      concerns: [],
      age: 25,
    },
  });

  const onSubmit = async (data: SkinAnalysisInput) => {
    try {
      await analyzeSkin(data);
      reset();
    } catch (error) {
      console.error('[Form] Submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="skinType">피부 타입</Label>
        <Select {...register('skinType')}>
          <option value="oily">지성</option>
          <option value="dry">건성</option>
          <option value="combination">복합성</option>
          <option value="normal">중성</option>
        </Select>
        {errors.skinType && (
          <p role="alert" className="text-destructive">
            {errors.skinType.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '분석 중...' : '분석하기'}
      </Button>
    </form>
  );
}
```

**폼 검증 에러 처리**:

```typescript
// ✅ 사용자 친화적 에러 메시지
const errorMessages = {
  skinType: {
    invalid_enum_value: '유효한 피부 타입을 선택하세요',
  },
  concerns: {
    too_small: '최소 1개 고민을 선택하세요',
  },
  age: {
    too_small: '나이는 10세 이상이어야 해요',
    too_big: '나이는 100세 이하여야 해요',
  },
};

// Zod에서 커스텀 메시지 적용
const schema = z.object({
  age: z
    .number({
      invalid_type_error: '숫자를 입력하세요',
    })
    .min(10, { message: '나이는 10세 이상이어야 해요' })
    .max(100, { message: '나이는 100세 이하여야 해요' }),
});
```

**다단계 폼 (Wizard)**:

```typescript
// Zustand로 다단계 폼 상태 관리
// lib/stores/onboardingStore.ts
interface OnboardingStore {
  step: number;
  data: Partial<OnboardingData>;
  setStep: (step: number) => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 1,
  data: {},
  setStep: (step) => set({ step }),
  updateData: (partial) => set((state) => ({ data: { ...state.data, ...partial } })),
  reset: () => set({ step: 1, data: {} }),
}));
```

**폼 상태 관리 선택 기준**:
| 상황 | 권장 도구 | 이유 |
|------|----------|------|
| 단일 폼 (1페이지) | React Hook Form + Zod | 검증 + 타입 안전성 |
| 다단계 폼 (Wizard) | Zustand + RHF | 페이지 간 상태 유지 |
| 간단한 입력 (1-2 필드) | useState | 오버헤드 최소화 |
| 서버 상태 동기화 | React Query + RHF | 캐싱 + 낙관적 업데이트 |

---

### 1.6 Medium: 빌드/배포 진단

#### 1.6.1 TypeScript 빌드 에러 패턴

**흔한 에러**:

```
Type error: Cannot find module '@/components/...' or its corresponding type declarations.
```

**해결**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 1.6.2 순환 참조 감지

```bash
# 순환 참조 감지 명령
npx madge --circular --extensions ts,tsx apps/web/

# 결과 예시
Circular dependency found:
  lib/stores/sessionStore.ts → lib/api/user.ts → lib/stores/sessionStore.ts
```

**해결 전략**:

1. 의존성 방향 분석
2. 공통 타입을 별도 파일로 분리
3. 동적 import 사용

#### 1.6.3 빌드 성공 체크리스트

```
☐ npm run typecheck     # 타입 에러 없음
☐ npm run lint          # 린트 경고 해결
☐ npm run build         # 빌드 성공
☐ npm run test          # 테스트 통과
```

---

### 1.7 High: UI/UX 깨짐 패턴

#### 1.2.1 하드코딩 색상 문제

**발견된 위치 (40+ 컴포넌트)**:

```typescript
// ❌ 위험: 하드코딩 색상
// components/workout/result/WorkoutInsightCard.tsx
const INSIGHT_TYPE_STYLES = {
  balance: { bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  progress: { bgColor: 'bg-green-50', iconColor: 'text-green-500' },
  strength: { bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
};

// ✅ 수정: 모듈 색상 사용
const INSIGHT_TYPE_STYLES = {
  balance: { bgColor: 'bg-module-body-light', iconColor: 'text-module-body' },
  progress: { bgColor: 'bg-module-nutrition-light', iconColor: 'text-module-nutrition' },
  strength: { bgColor: 'bg-module-workout-light', iconColor: 'text-module-workout' },
};
```

**영향받는 컴포넌트 목록**:
| 카테고리 | 파일 | 문제 |
|---------|------|------|
| 운동 | WorkoutInsightCard.tsx | bg-blue-50, bg-green-50 |
| 영양 | SkinInsightCard.tsx | 일부 하드코딩 |
| 제품 | ProductCard.tsx | hover 색상 |
| 분석 | ScoreChangeBadge.tsx | 점수 색상 |
| 공통 | LevelBadge.tsx | 레벨 색상 |

#### 1.2.2 다크모드 대비 부족

**문제 패턴**:

```css
/* ❌ 다크모드에서 텍스트 안 보임 */
.glass-card {
  background: oklch(0.98 0.005 270 / 20%); /* 20% 투명도 */
}

/* ✅ 다크모드 대비 개선 */
.glass-card {
  background: oklch(0.98 0.005 270 / 40%);
}
.dark .glass-card {
  background: oklch(0.15 0.02 270 / 50%);
}
```

**검증 필요 컴포넌트**:

- GlassCard (components/ui/glass-card.tsx)
- 모든 Insight 카드
- 분석 결과 오버레이

#### 1.2.3 동적 클래스명 문제

**문제**:

```typescript
// ❌ Tailwind가 이 클래스를 빌드에서 제거할 수 있음
const bgClass = `bg-${colorName}-50`;

// ✅ 안전: 전체 클래스명 사용
const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
};
const bgClass = COLOR_MAP[colorName];
```

---

### 1.3 Medium: 스키마 문서 불일치

**현황**: DATABASE-SCHEMA.md가 실제 마이그레이션과 **40% 불일치**

**미문서화 테이블 (20개)**:

```
workout_analyses, workout_plans, workout_logs, workout_streaks,
user_preferences, user_agreements, user_challenges, image_consents,
push_subscriptions, affiliate_products, skin_diary_entries,
nutrition_streaks, smart_notifications, makeup_analyses,
user_size_history, user_shopping_preferences, price_watches,
hair_analyses, mental_health_logs, product_shelf
```

**해결 방안**:

```bash
# 자동 스키마 추출 스크립트 생성
npx supabase db dump --schema public > schema_dump.sql

# 또는 마이그레이션 파일에서 추출
grep -h "CREATE TABLE" supabase/migrations/*.sql | sort -u
```

---

### 1.4 Low: 미구현 UI Gap 목록

| Gap ID | 기능                           | 현재 상태              | 영향                  |
| ------ | ------------------------------ | ---------------------- | --------------------- |
| Gap-1  | DrapingSimulationTab PC-1 연결 | 컴포넌트 있음, 미연결  | 사용자 기능 미노출    |
| Gap-2  | ingredientWarnings 표시        | 데이터 있음, UI 비활성 | 성분 경고 미표시      |
| Gap-3  | PhotoOverlayMap, TrendChart    | import됨, 미렌더링     | 시각화 미제공         |
| Gap-4  | S-1, C-1 드레이핑 연동         | 미구현                 | 크로스 모듈 기능 없음 |

---

## Part 2: UI/UX 통합 전략

### 2.1 색상 마이그레이션 계획

#### Phase 1: 디자인 토큰 확립 (완료)

```css
/* globals.css - 이미 구현됨 */
:root {
  /* 모듈별 색상 */
  --module-workout: oklch(0.85 0.15 45);
  --module-nutrition: oklch(0.75 0.15 150);
  --module-skin: oklch(0.80 0.12 350);
  --module-body: oklch(0.75 0.15 250);
  --module-personal-color: oklch(0.70 0.18 300);
  --module-face: oklch(0.75 0.16 30);

  /* 전문성 색상 */
  --professional-primary: oklch(0.45 0.12 220);
  --professional-accent: oklch(0.60 0.10 180);

  /* Monk Scale 스킨톤 */
  --skin-tone-1 ~ --skin-tone-10
}
```

#### Phase 2: 컴포넌트 마이그레이션 (진행 필요)

**우선순위 1 (P0) - 영향도 높음**:

```
컴포넌트                           변경 내용
─────────────────────────────────────────────────
WorkoutInsightCard.tsx            bg-blue-50 → bg-module-body-light
                                  bg-green-50 → bg-module-nutrition-light
                                  bg-orange-50 → bg-module-workout-light

ProductCard.tsx                   hover 색상 → module 변수
ScoreChangeBadge.tsx              점수 색상 → status 변수
LevelBadge.tsx                    레벨 색상 → module 변수
```

**우선순위 2 (P1) - 영향도 중간**:

```
컴포넌트                           변경 내용
─────────────────────────────────────────────────
PartnerRevenueChart.tsx           동적 색상 → 상수 매핑
CalorieProgressRing.tsx           색상 merge → useMemo 최적화
glass-card.tsx                    투명도 조정 (다크모드)
```

#### Phase 3: 다크모드 완성 (진행 필요)

**체크리스트**:

```
☐ 모든 bg-* 클래스에 dark: variant 추가
☐ glass-card 투명도 40%로 증가
☐ 텍스트 대비 4.5:1 이상 검증
☐ 스켈레톤 로딩 색상 모듈화
```

### 2.2 레이아웃 깨짐 상세

#### 2.2.1 z-index 관리

**현재 문제**: z-index 값이 컴포넌트별로 산발적으로 정의됨

**z-index 스케일 표준화**:

```css
/* globals.css - z-index 시스템 */
:root {
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-overlay: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
  --z-toast: 600;
}
```

**문제 컴포넌트**:
| 컴포넌트 | 현재 z-index | 권장 z-index | 문제 |
|---------|-------------|-------------|------|
| BottomNav | 50 | 100 (sticky) | 드롭다운과 겹침 |
| Modal | 9999 | 300 | 과도한 값 |
| Toast | 1000 | 600 | 모달 위에 표시 안 됨 |

#### 2.2.2 반응형 브레이크포인트

**현재 정의** (Tailwind 기본):

```
sm: 640px   # 모바일 가로
md: 768px   # 태블릿
lg: 1024px  # 데스크탑
xl: 1280px  # 와이드 데스크탑
```

**깨짐 패턴**:

```tsx
// ❌ 브레이크포인트 누락으로 중간 크기에서 깨짐
<div className="grid grid-cols-1 lg:grid-cols-3">

// ✅ 중간 단계 추가
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**점검 대상 페이지**:

- `/analysis/*` - 결과 카드 그리드
- `/products/*` - 제품 목록 그리드
- `/dashboard` - 위젯 레이아웃
- `/profile` - 정보 카드 배치

#### 2.2.3 스크롤 및 오버플로우 문제

```tsx
// ❌ 모바일에서 가로 스크롤 발생
<div className="flex gap-4">
  {items.map(item => <Card className="w-[300px]" />)}
</div>

// ✅ 오버플로우 제어
<div className="flex gap-4 overflow-x-auto scrollbar-hide">
  {items.map(item => <Card className="w-[300px] flex-shrink-0" />)}
</div>
```

---

### 2.3 페이지별 UI 상태 현황

#### 2.3.1 분석 페이지 (analysis/)

| 페이지                   | 상태    | 이슈                           |
| ------------------------ | ------- | ------------------------------ |
| /analysis                | ✅ 완료 | 디자인 토큰 적용 완료          |
| /analysis/personal-color | ⚠️ 부분 | 결과 페이지 드레이핑 탭 미연결 |
| /analysis/skin           | ⚠️ 부분 | PhotoOverlayMap 미렌더링       |
| /analysis/body           | ⚠️ 부분 | TrendChart 미렌더링            |
| /analysis/face           | 🔴 신규 | F-1 구현 필요                  |

#### 2.3.2 운동 페이지 (workout/)

| 페이지           | 상태    | 이슈               |
| ---------------- | ------- | ------------------ |
| /workout         | ✅ 완료 | -                  |
| /workout/session | ✅ 완료 | -                  |
| /workout/history | ⚠️ 부분 | 차트 색상 하드코딩 |
| /workout/plan    | ✅ 완료 | -                  |

#### 2.3.3 영양 페이지 (nutrition/)

| 페이지                  | 상태    | 이슈                    |
| ----------------------- | ------- | ----------------------- |
| /nutrition              | ✅ 완료 | -                       |
| /nutrition/dashboard    | ⚠️ 부분 | 칼로리 링 색상 하드코딩 |
| /nutrition/food-capture | ✅ 완료 | -                       |

#### 2.3.4 제품 페이지 (products/)

| 페이지         | 상태    | 이슈                      |
| -------------- | ------- | ------------------------- |
| /products      | ⚠️ 부분 | 필터 색상 하드코딩        |
| /products/[id] | ⚠️ 부분 | ingredientWarnings 미표시 |
| /beauty/\*     | ⚠️ 부분 | 카테고리 색상 하드코딩    |

---

### 2.4 컴포넌트 통합 계획

#### 2.2.1 공통 컴포넌트 추출

**현재 중복**:

```
운동 모듈: WorkoutInsightCard
영양 모듈: SkinInsightCard, WorkoutInsightCard (중복!)
제품 모듈: ProductInsightCard
```

**통합 설계**:

```typescript
// components/common/ModuleInsightCard.tsx (신규)
interface ModuleInsightCardProps {
  module: 'workout' | 'nutrition' | 'skin' | 'body' | 'personal-color' | 'face';
  insightType: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ModuleInsightCard({ module, ...props }: ModuleInsightCardProps) {
  return (
    <div className={cn(
      'rounded-xl p-4',
      `bg-module-${module}-light`,
      `border border-module-${module}/20`,
      `dark:bg-module-${module}/20`
    )}>
      {/* ... */}
    </div>
  );
}
```

#### 2.2.2 분석 결과 컴포넌트 표준화

**현재 구조**:

```
analysis/
├── skin/AnalysisResult.tsx      # 피부 전용
├── body/AnalysisResult.tsx      # 체형 전용 (다른 구조)
├── personal-color/              # 퍼스널컬러 (또 다른 구조)
└── face/                        # 신규 (구조 미정)
```

**통합 설계**:

```typescript
// components/analysis/common/AnalysisResultLayout.tsx (신규)
interface AnalysisResultLayoutProps {
  module: AnalysisModule;
  header: React.ReactNode;
  mainContent: React.ReactNode;
  recommendations: React.ReactNode;
  actions: React.ReactNode;
}

export function AnalysisResultLayout(props: AnalysisResultLayoutProps) {
  return (
    <div className="space-y-6">
      <AnalysisHeader module={props.module} />
      <AnalysisMainContent>{props.mainContent}</AnalysisMainContent>
      <AnalysisRecommendations>{props.recommendations}</AnalysisRecommendations>
      <AnalysisActions>{props.actions}</AnalysisActions>
    </div>
  );
}
```

---

## Part 3: 다국어(i18n) 지원 전략

### 3.1 현황 분석

| 플랫폼    | 라이브러리      | 상태           |
| --------- | --------------- | -------------- |
| 웹 앱     | next-intl 4.6.1 | 설치됨, 미사용 |
| 모바일 앱 | 커스텀 i18n     | 구현됨, 운영중 |

**문제점**:

- 웹: useTranslations() Hook 미사용
- 500+ UI 텍스트가 한국어로 하드코딩
- ja.json, zh.json 번역 불완전

### 3.2 하드코딩 텍스트 현황

**심각도 높음 (즉시 수정 필요)**:

```typescript
// app/(main)/home/page.tsx
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요'; // ❌
  if (hour >= 12 && hour < 18) return '좋은 오후예요'; // ❌
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요'; // ❌
  return '좋은 밤이에요'; // ❌
}

const userName = user?.firstName || user?.username || '회원'; // ❌
```

**심각도 중간 (Phase 2에서 수정)**:

```typescript
// app/layout.tsx - 메타데이터
export const metadata: Metadata = {
  title: { default: '이룸 - 온전한 나는?', template: '%s | 이룸' }, // ❌
  description: 'AI 퍼스널 컬러, 피부, 체형 분석...', // ❌
};
```

### 3.3 마이그레이션 계획

#### Phase 1: 인프라 활성화 (1주)

```typescript
// 1. messages/ko.json 확장
{
  "home": {
    "greeting": {
      "morning": "좋은 아침이에요",
      "afternoon": "좋은 오후예요",
      "evening": "좋은 저녁이에요",
      "night": "좋은 밤이에요"
    },
    "defaultUserName": "회원"
  },
  "analysis": {
    "personalColor": {
      "title": "퍼스널 컬러",
      "description": "나에게 어울리는 컬러를 찾아보세요"
    },
    "face": {
      "title": "얼굴형 분석",
      "description": "얼굴형과 이목구비를 정밀 분석해요"
    }
  }
}

// 2. 컴포넌트에서 사용
'use client';
import { useTranslations } from 'next-intl';

export function HomePage() {
  const t = useTranslations('home');

  function getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting.morning');
    if (hour >= 12 && hour < 18) return t('greeting.afternoon');
    if (hour >= 18 && hour < 22) return t('greeting.evening');
    return t('greeting.night');
  }

  return <h1>{getTimeGreeting()}, {userName || t('defaultUserName')}님</h1>;
}
```

#### Phase 2: 핵심 페이지 이관 (2주)

```
우선순위:
1. 홈 페이지 (home/page.tsx)
2. 분석 허브 (analysis/page.tsx)
3. 프로필 페이지 (profile/page.tsx)
4. 설정 페이지 (settings/*)
5. 분석 결과 페이지들
```

#### Phase 3: 전체 이관 + 신규 언어 (4주)

```
1. 모든 컴포넌트 텍스트 이관
2. 영어(en) 번역 완성
3. 일본어(ja), 중국어(zh) 완성 또는 제거 결정
4. 언어 선택 UI 구현 (설정 페이지)
```

### 3.4 웹-모바일 동기화 전략

**옵션 A: 별도 관리 (현재)**

```
웹: messages/*.json (next-intl)
모바일: lib/i18n/locales/*.ts (커스텀)
장점: 플랫폼별 최적화
단점: 번역 중복, 동기화 어려움
```

**옵션 B: 공유 패키지 (권장)**

```
packages/shared/
└── i18n/
    ├── ko.json
    ├── en.json
    └── index.ts (타입 + 유틸리티)

웹: packages/shared/i18n 참조
모바일: packages/shared/i18n 참조 + 어댑터
장점: 단일 소스 관리
단점: 초기 설정 복잡
```

### 3.5 packages/shared 상세 스펙

**목적**: 웹/모바일 앱 간 코드 재사용을 위한 공유 패키지

#### 3.5.1 디렉토리 구조

```
packages/shared/
├── package.json           # 패키지 설정
├── tsconfig.json          # TypeScript 설정
├── src/
│   ├── index.ts           # 메인 export
│   │
│   ├── types/             # 공유 타입 정의
│   │   ├── index.ts
│   │   ├── user.ts        # User, UserProfile
│   │   ├── analysis.ts    # AnalysisResult, SeasonType, SkinType
│   │   ├── workout.ts     # WorkoutPlan, WorkoutLog
│   │   ├── nutrition.ts   # MealRecord, NutritionSummary
│   │   └── products.ts    # Product, Review
│   │
│   ├── constants/         # 공유 상수
│   │   ├── index.ts
│   │   ├── analysis.ts    # SEASON_TYPES, SKIN_TYPES
│   │   ├── colors.ts      # BEST_COLORS, WORST_COLORS
│   │   └── workout.ts     # EXERCISE_CATEGORIES
│   │
│   ├── utils/             # 공유 유틸리티
│   │   ├── index.ts
│   │   ├── date.ts        # formatDate, getRelativeTime
│   │   ├── number.ts      # formatNumber, calculatePercentage
│   │   ├── validation.ts  # isValidEmail, isValidPhone
│   │   └── scoring.ts     # calculateWellnessScore
│   │
│   ├── i18n/              # 다국어 리소스
│   │   ├── index.ts       # createTranslator
│   │   ├── ko.json        # 한국어
│   │   └── en.json        # 영어
│   │
│   └── schemas/           # Zod 스키마 (폼 검증)
│       ├── index.ts
│       ├── user.ts        # userProfileSchema
│       └── analysis.ts    # analysisInputSchema
│
└── __tests__/             # 단위 테스트
    ├── utils.test.ts
    └── schemas.test.ts
```

#### 3.5.2 package.json 설정

```json
{
  "name": "@yiroom/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./constants": "./src/constants/index.ts",
    "./utils": "./src/utils/index.ts",
    "./i18n": "./src/i18n/index.ts",
    "./schemas": "./src/schemas/index.ts"
  },
  "peerDependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

#### 3.5.3 주요 타입 정의

```typescript
// packages/shared/src/types/analysis.ts

/** 퍼스널 컬러 시즌 타입 */
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type SubSeasonType =
  | 'spring_warm'
  | 'spring_light'
  | 'spring_bright'
  | 'summer_light'
  | 'summer_muted'
  | 'summer_cool'
  | 'autumn_muted'
  | 'autumn_warm'
  | 'autumn_deep'
  | 'winter_cool'
  | 'winter_deep'
  | 'winter_bright';

/** 피부 타입 */
export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

/** 체형 타입 */
export type BodyType = 'inverted_triangle' | 'triangle' | 'rectangle' | 'hourglass' | 'oval';

/** 분석 결과 공통 인터페이스 */
export interface BaseAnalysisResult {
  id: string;
  clerkUserId: string;
  confidence: number; // 0-100
  analysisReliability: 'high' | 'medium' | 'low';
  createdAt: Date;
}

/** 퍼스널 컬러 분석 결과 */
export interface PersonalColorResult extends BaseAnalysisResult {
  type: 'personal_color';
  seasonType: SeasonType;
  subSeasonType?: SubSeasonType;
  undertone: 'warm' | 'cool' | 'neutral';
}

/** 피부 분석 결과 */
export interface SkinAnalysisResult extends BaseAnalysisResult {
  type: 'skin';
  skinType: SkinType;
  overallScore: number;
  metrics: {
    hydration: number;
    oiliness: number;
    pores: number;
    wrinkles: number;
    spots: number;
  };
}
```

#### 3.5.4 공유 유틸리티 예시

```typescript
// packages/shared/src/utils/date.ts

/**
 * 날짜를 상대적 시간으로 포맷 (방금, 1시간 전, 어제 등)
 */
export function getRelativeTime(date: Date, locale: 'ko' | 'en' = 'ko'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const messages = {
    ko: {
      justNow: '방금',
      minutesAgo: (n: number) => `${n}분 전`,
      hoursAgo: (n: number) => `${n}시간 전`,
      yesterday: '어제',
      daysAgo: (n: number) => `${n}일 전`,
    },
    en: {
      justNow: 'Just now',
      minutesAgo: (n: number) => `${n} minutes ago`,
      hoursAgo: (n: number) => `${n} hours ago`,
      yesterday: 'Yesterday',
      daysAgo: (n: number) => `${n} days ago`,
    },
  };

  const msg = messages[locale];

  if (diffSec < 60) return msg.justNow;
  if (diffMin < 60) return msg.minutesAgo(diffMin);
  if (diffHour < 24) return msg.hoursAgo(diffHour);
  if (diffDay === 1) return msg.yesterday;
  return msg.daysAgo(diffDay);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

#### 3.5.5 앱에서 사용 예시

```typescript
// apps/web/components/SomeComponent.tsx
import type { PersonalColorResult, SeasonType } from '@yiroom/shared/types';
import { getRelativeTime, formatDate } from '@yiroom/shared/utils';
import { SEASON_TYPES } from '@yiroom/shared/constants';

// apps/mobile/components/SomeComponent.tsx
import type { SkinAnalysisResult } from '@yiroom/shared/types';
import { calculateWellnessScore } from '@yiroom/shared/utils';
```

#### 3.5.6 마이그레이션 계획

```
Phase 1: 패키지 초기화 (1일)
☐ packages/shared/ 디렉토리 생성
☐ package.json, tsconfig.json 설정
☐ 빌드 테스트

Phase 2: 타입 이관 (2일)
☐ apps/web/types/*.ts → packages/shared/src/types/
☐ apps/mobile/types/*.ts 통합
☐ 중복 타입 정리

Phase 3: 유틸리티 이관 (2일)
☐ 공통 유틸리티 함수 추출
☐ 플랫폼 독립적 함수만 이관
☐ 테스트 작성

Phase 4: 앱 참조 변경 (1일)
☐ apps/web import 경로 변경
☐ apps/mobile import 경로 변경
☐ 빌드 검증
```

---

## Part 4: 모듈간 연동 아키텍처

### 4.1 현재 모듈 의존성 그래프

```
┌─────────────────────────────────────────────────────────────┐
│                     분석 모듈 의존성                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                                │
│  │  PC-1   │ ───────────────────────────────────────┐      │
│  │퍼스널컬러│                                         │      │
│  └────┬────┘                                         │      │
│       │                                              │      │
│       │ face_image_url                               │      │
│       │ season, undertone                            │      │
│       ▼                                              ▼      │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐   ┌─────────┐ │
│  │  F-1    │     │  S-1    │     │  C-1    │   │ Makeup  │ │
│  │ 얼굴형  │     │  피부   │     │  체형   │   │ 메이크업│ │
│  └─────────┘     └────┬────┘     └────┬────┘   └─────────┘ │
│       │               │               │                    │
│       │               │               │                    │
│       └───────────────┴───────────────┘                    │
│                       │                                     │
│                       ▼                                     │
│               ┌─────────────┐                              │
│               │  IC-1 통합   │                              │
│               │  대시보드    │                              │
│               └─────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 이미지 재사용 흐름

```typescript
// PC-1 분석 완료 시 이미지 저장
interface PersonalColorAssessment {
  id: string;
  face_image_url: string; // 정면 이미지 (필수)
  left_image_url?: string; // 좌측 이미지 (선택)
  right_image_url?: string; // 우측 이미지 (선택)
  wrist_image_url?: string; // 손목 이미지 (선택) ← 추가 필요
}

// F-1, S-1에서 PC-1 이미지 재사용
interface FaceAnalysisRequest {
  imageUrl?: string; // 새 이미지
  reuseFromPcId?: string; // PC-1 이미지 재사용
}
```

### 4.3 크로스 모듈 데이터 조회

```typescript
// lib/analysis/cross-module.ts (신규)

/**
 * 사용자의 최신 PC-1 결과 조회 (S-1, C-1, F-1에서 사용)
 */
export async function getLatestPersonalColorResult(
  supabase: SupabaseClient,
  userId: string
): Promise<PersonalColorAssessment | null> {
  const { data } = await supabase
    .from('personal_color_assessments')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

/**
 * 통합 분석 진행률 계산
 */
export async function getAnalysisProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisProgress> {
  const [pc, face, skin, body] = await Promise.all([
    supabase.from('personal_color_assessments').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('face_analyses').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('skin_analyses').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('body_analyses').select('id').eq('clerk_user_id', userId).limit(1),
  ]);

  return {
    personalColor: !!pc.data?.length,
    face: !!face.data?.length,
    skin: !!skin.data?.length,
    body: !!body.data?.length,
    completedCount: [pc, face, skin, body].filter((r) => r.data?.length).length,
    totalCount: 4,
    percentage: ([pc, face, skin, body].filter((r) => r.data?.length).length / 4) * 100,
  };
}
```

### 4.4 드레이핑 연동 구현

```typescript
// S-1, C-1 결과 페이지에서 드레이핑 탭 추가

// app/(main)/analysis/skin/result/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { DrapingSimulationTab } from '@/components/analysis/visual';
import { getLatestPersonalColorResult } from '@/lib/analysis/cross-module';

export default function SkinResultPage() {
  const [pcResult, setPcResult] = useState<PersonalColorAssessment | null>(null);

  useEffect(() => {
    async function loadPcResult() {
      const result = await getLatestPersonalColorResult(supabase, userId);
      setPcResult(result);
    }
    loadPcResult();
  }, [userId]);

  return (
    <Tabs defaultValue="result">
      <TabsList>
        <TabsTrigger value="result">분석 결과</TabsTrigger>
        <TabsTrigger value="recommendations">추천</TabsTrigger>
        {pcResult && <TabsTrigger value="draping">드레이핑</TabsTrigger>}
      </TabsList>

      {/* ... 기존 탭 콘텐츠 ... */}

      {pcResult && (
        <TabsContent value="draping">
          <DrapingSimulationTab
            seasonType={pcResult.season}
            userImageUrl={pcResult.face_image_url}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
```

---

## Part 5: 데이터베이스 마이그레이션 전략

### 5.1 마이그레이션 순서

```
현재 마이그레이션 (26개):
supabase/migrations/
├── 2025-12-* (기본 테이블들)
├── 20260108_analysis_tables.sql
├── 20260109_users_pc_columns.sql
├── 20260113_pc_multi_angle_columns.sql  ← PC-1 다각도
├── 20260113_skin_diary.sql
├── 20260113_photo_reuse_system.sql
├── 20260114_face_analyses_global.sql    ← F-1 (신규)
└── 20260114_user_ui_preferences.sql     ← 접근성 (신규)

추가 필요:
├── 20260115_wrist_image_column.sql      ← 손목 이미지 저장
├── 20260116_ingredients.sql             ← 성분 DB
└── 20260117_analysis_cross_links.sql    ← 모듈간 연결 테이블
```

### 5.2 손목 이미지 컬럼 추가 (누락분)

```sql
-- supabase/migrations/20260115_wrist_image_column.sql

-- Migration: PC-1 손목 이미지 URL 추가
-- Purpose: API에서 손목 이미지 분석하지만 저장하지 않는 문제 해결
-- Date: 2026-01-15

ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS wrist_image_url TEXT;

COMMENT ON COLUMN personal_color_assessments.wrist_image_url
  IS '손목 이미지 URL (혈관 색상 분석용, 다각도 분석 시 사용)';
```

### 5.3 모듈간 연결 테이블

```sql
-- supabase/migrations/20260117_analysis_cross_links.sql

-- Migration: 분석 모듈간 연결 테이블
-- Purpose: PC-1 ↔ S-1 ↔ C-1 ↔ F-1 크로스 참조
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS analysis_cross_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 소스 분석
  source_type TEXT NOT NULL CHECK (source_type IN
    ('personal_color', 'face', 'skin', 'body')),
  source_id UUID NOT NULL,

  -- 타겟 분석 (이미지 재사용 대상)
  target_type TEXT NOT NULL CHECK (target_type IN
    ('personal_color', 'face', 'skin', 'body')),
  target_id UUID NOT NULL,

  -- 연결 유형
  link_type TEXT NOT NULL CHECK (link_type IN
    ('image_reuse',     -- 이미지 재사용
     'draping_source',  -- 드레이핑 소스
     'recommendation'   -- 추천 기반
    )),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT analysis_cross_links_user_fkey
    FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
);

-- 인덱스
CREATE INDEX idx_cross_links_user ON analysis_cross_links(clerk_user_id);
CREATE INDEX idx_cross_links_source ON analysis_cross_links(source_type, source_id);
CREATE INDEX idx_cross_links_target ON analysis_cross_links(target_type, target_id);

-- RLS
ALTER TABLE analysis_cross_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cross links"
  ON analysis_cross_links FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

---

## Part 6: 구현 체크리스트 (Phase별)

### Phase 0: 긴급 수정 (1-2일)

```
☐ P0-1: wrist_image_url 마이그레이션 생성 및 적용
  파일: supabase/migrations/20260115_wrist_image_column.sql
  명령: npx supabase db push

☐ P0-2: API에서 손목 이미지 저장 로직 추가
  파일: app/api/analyze/personal-color/route.ts
  변경: wrist_image_url 필드 insert에 추가

☐ P0-3: Gap-1 수정 (DrapingSimulationTab 연결)
  파일: app/(main)/analysis/personal-color/result/[id]/page.tsx
  변경: 탭에 DrapingSimulationTab 추가

☐ P0-4: .env.example 파일 생성
  파일: apps/web/.env.example
  내용: 필수/서버전용/선택 환경변수 분류 포함

☐ P0-5: 환경변수 검증 스크립트 추가
  파일: apps/web/scripts/check-env.js
  연동: package.json preflight 스크립트에 통합
```

### Phase 1: UI/UX 통합 (1주)

```
☐ P1-1: 하드코딩 색상 마이그레이션
  대상: WorkoutInsightCard, ProductCard, ScoreChangeBadge 등
  변경: bg-blue-50 → bg-module-body-light

☐ P1-2: 다크모드 대비 개선
  대상: glass-card.tsx, insight 카드들
  변경: 투명도 조정, dark: variant 추가

☐ P1-3: Gap-2, Gap-3, Gap-4 수정
  대상: S-1, C-1 결과 페이지
  변경: PhotoOverlayMap, TrendChart, 드레이핑 탭 연결
```

### Phase 2: 다국어 기초 (2주)

```
☐ P2-1: messages/*.json 확장
  대상: ko.json, en.json
  추가: home, analysis, profile, settings 키

☐ P2-2: 핵심 페이지 useTranslations 적용
  대상: home/page.tsx, analysis/page.tsx
  변경: 하드코딩 텍스트 → t() 함수

☐ P2-3: 메타데이터 다국어 지원
  대상: app/layout.tsx
  변경: generateMetadata 함수 사용
```

### Phase 3: 모듈 연동 (2주)

```
☐ P3-1: cross-module 유틸리티 생성
  파일: lib/analysis/cross-module.ts
  기능: getLatestPersonalColorResult, getAnalysisProgress

☐ P3-2: F-1 얼굴형 분석 페이지 구현
  파일: app/(main)/analysis/face/*
  포함: 촬영, 결과, 히스토리 페이지

☐ P3-3: IC-1 통합 대시보드 설계
  파일: app/(main)/analysis/integrated/*
  기능: 모든 분석 결과 종합 뷰
```

### Phase 4: 고도화 (3주+)

```
☐ P4-1: 성분 DB 구축 (500+ 성분)
  파일: supabase/migrations/20260116_ingredients.sql
  시딩: supabase/seed/ingredients.sql

☐ P4-2: 전체 텍스트 다국어 이관
  대상: 모든 컴포넌트
  목표: 하드코딩 텍스트 0

☐ P4-3: 공유 i18n 패키지 (선택)
  위치: packages/shared/i18n
  목표: 웹-모바일 번역 통합

☐ P4-4: DATABASE-SCHEMA.md 동기화
  목표: 실제 마이그레이션과 100% 일치
```

---

## Part 7: 테스트 전략

### 7.1 변경 검증 체크리스트

```
모든 변경 후 필수 실행:

☐ npm run typecheck
☐ npm run lint
☐ npm run test
☐ npm run build (프로덕션 빌드 성공 확인)

UI 변경 시 추가:
☐ 다크모드 시각적 확인
☐ 모바일 반응형 확인
☐ Lighthouse 접근성 점수 확인 (90+ 유지)
```

### 7.2 회귀 테스트 대상

```
색상 마이그레이션 후:
☐ 모든 Insight 카드 렌더링 확인
☐ 다크모드 전환 테스트
☐ 호버/포커스 상태 확인

다국어 적용 후:
☐ 한국어 표시 정상
☐ 영어 전환 테스트
☐ 누락된 번역 키 없음 확인

모듈 연동 후:
☐ PC-1 → F-1 이미지 재사용 테스트
☐ 드레이핑 탭 표시 조건 확인
☐ 크로스 모듈 데이터 조회 성능
```

### 7.3 접근성 테스트 (신규)

#### 7.3.1 자동화 테스트 설정

```bash
# 접근성 테스트 라이브러리 설치
npm install jest-axe @axe-core/react --save-dev
```

```typescript
// tests/setup/a11y.ts
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

#### 7.3.2 컴포넌트 접근성 테스트 패턴

```typescript
// tests/a11y/components.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('접근성 테스트', () => {
  test('분석 결과 페이지', async () => {
    const { container } = render(<AnalysisResultPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('제품 카드', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('폼 컴포넌트', async () => {
    const { container } = render(<SkinAnalysisForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### 7.3.3 접근성 테스트 체크리스트

```
신규 컴포넌트 생성 시:
☐ jest-axe 테스트 추가
☐ 키보드 네비게이션 테스트
☐ 스크린 리더 테스트 (수동)

PR 리뷰 시:
☐ aria-* 속성 올바른 사용
☐ 시맨틱 HTML 사용
☐ 색상 대비 4.5:1 이상
```

#### 7.3.4 Lighthouse CI 설정

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

```json
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.92 }],
        "categories:performance": ["warn", { "minScore": 0.75 }]
      }
    }
  }
}
```

### 7.4 E2E 테스트 시나리오 (Playwright)

#### 7.4.1 테스트 환경 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 7.4.2 Critical Path 시나리오

**시나리오 1: 퍼스널 컬러 분석 플로우 (PC-1)**

```typescript
// tests/e2e/personal-color-analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('퍼스널 컬러 분석', () => {
  test.beforeEach(async ({ page }) => {
    // Clerk 테스트 사용자로 로그인
    await page.goto('/sign-in');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test('이미지 업로드 → 분석 → 결과 확인', async ({ page }) => {
    // Step 1: 분석 페이지 진입
    await page.goto('/analysis/personal-color');
    await expect(page.getByTestId('personal-color-page')).toBeVisible();

    // Step 2: 조명 가이드 확인
    await expect(page.getByText('자연광 아래에서')).toBeVisible();
    await page.click('button:has-text("다음")');

    // Step 3: 이미지 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-face.jpg');
    await expect(page.getByTestId('image-preview')).toBeVisible();

    // Step 4: 분석 실행
    await page.click('button:has-text("분석하기")');

    // Step 5: 로딩 상태 확인
    await expect(page.getByTestId('loading-indicator')).toBeVisible();

    // Step 6: 결과 페이지 확인 (최대 30초 대기)
    await page.waitForURL(/\/analysis\/personal-color\/result\/.+/, { timeout: 30000 });
    await expect(page.getByTestId('season-result')).toBeVisible();
    await expect(page.getByTestId('best-colors')).toBeVisible();
  });

  test('PC-1 완료 후 이미지 재사용 옵션 표시', async ({ page }) => {
    // PC-1 완료된 사용자로
    await page.goto('/analysis/skin');

    // 이미지 재사용 옵션 확인
    await expect(page.getByText('이전 분석 이미지 사용')).toBeVisible();
  });
});
```

**시나리오 2: 피부 분석 플로우 (S-1)**

```typescript
// tests/e2e/skin-analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('피부 분석', () => {
  test('다각도 이미지 업로드 플로우', async ({ page }) => {
    await page.goto('/analysis/skin');

    // 정면 이미지 업로드
    await page
      .locator('[data-testid="front-upload"]')
      .setInputFiles('./tests/fixtures/face-front.jpg');

    // 좌측 이미지 업로드 (선택)
    await page
      .locator('[data-testid="left-upload"]')
      .setInputFiles('./tests/fixtures/face-left.jpg');

    // 분석 실행
    await page.click('button:has-text("분석하기")');

    // 결과 확인
    await page.waitForURL(/\/analysis\/skin\/result\/.+/, { timeout: 30000 });
    await expect(page.getByTestId('skin-score')).toBeVisible();
    await expect(page.getByTestId('skin-metrics')).toBeVisible();
  });

  test('피부 다이어리 연동', async ({ page }) => {
    // 결과 페이지에서 다이어리 저장
    await page.goto('/analysis/skin/result/test-id');
    await page.click('button:has-text("다이어리에 저장")');

    // 다이어리 페이지로 이동 확인
    await page.waitForURL('/analysis/skin-diary');
    await expect(page.getByTestId('diary-entry')).toBeVisible();
  });
});
```

**시나리오 3: 운동 세션 플로우 (W-1)**

```typescript
// tests/e2e/workout-session.spec.ts
import { test, expect } from '@playwright/test';

test.describe('운동 세션', () => {
  test('운동 계획 선택 → 세션 시작 → 완료', async ({ page }) => {
    await page.goto('/workout');

    // 오늘의 운동 계획 선택
    await page.click('[data-testid="workout-plan-card"]:first-child');

    // 세션 시작
    await page.click('button:has-text("시작하기")');
    await expect(page.getByTestId('workout-timer')).toBeVisible();

    // 운동 완료 체크
    const exercises = page.locator('[data-testid="exercise-item"]');
    const count = await exercises.count();
    for (let i = 0; i < count; i++) {
      await exercises.nth(i).locator('button:has-text("완료")').click();
    }

    // 세션 완료
    await page.click('button:has-text("세션 완료")');

    // 결과 페이지 확인
    await expect(page.getByTestId('session-summary')).toBeVisible();
    await expect(page.getByTestId('calories-burned')).toBeVisible();
  });

  test('스트릭 업데이트 확인', async ({ page }) => {
    // 운동 완료 후 스트릭 증가 확인
    await page.goto('/workout');
    const streakBefore = await page.getByTestId('workout-streak').textContent();

    // 세션 완료 후
    await page.goto('/workout');
    const streakAfter = await page.getByTestId('workout-streak').textContent();

    // 스트릭이 유지되거나 증가
    expect(parseInt(streakAfter || '0')).toBeGreaterThanOrEqual(parseInt(streakBefore || '0'));
  });
});
```

**시나리오 4: 영양 기록 플로우 (N-1)**

```typescript
// tests/e2e/nutrition.spec.ts
import { test, expect } from '@playwright/test';

test.describe('영양 관리', () => {
  test('물 섭취 기록', async ({ page }) => {
    await page.goto('/nutrition');

    // 현재 물 섭취량 확인
    const initialWater = await page.getByTestId('water-intake').textContent();

    // 물 추가 (+250ml)
    await page.click('[data-testid="add-water-btn"]');
    await expect(page.getByTestId('water-intake')).not.toHaveText(initialWater!);
  });

  test('음식 촬영 → AI 인식 → 영양 기록', async ({ page }) => {
    await page.goto('/nutrition/food-capture');

    // 음식 이미지 업로드
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/food-sample.jpg');

    // AI 인식 대기
    await expect(page.getByTestId('food-recognition-result')).toBeVisible({ timeout: 15000 });

    // 영양 정보 확인 및 저장
    await expect(page.getByTestId('calories')).toBeVisible();
    await page.click('button:has-text("기록하기")');

    // 영양 대시보드 반영 확인
    await page.goto('/nutrition');
    await expect(page.getByTestId('today-calories')).not.toHaveText('0');
  });
});
```

#### 7.4.3 크로스 모듈 시나리오

```typescript
// tests/e2e/cross-module.spec.ts
import { test, expect } from '@playwright/test';

test.describe('크로스 모듈 연동', () => {
  test('PC-1 시즌 → 제품 추천 필터링', async ({ page }) => {
    // PC-1 결과가 있는 사용자
    await page.goto('/products/recommended');

    // 시즌별 필터 자동 적용 확인
    await expect(page.getByTestId('season-filter')).toHaveValue(/spring|summer|autumn|winter/);

    // 추천 제품에 시즌 태그 표시
    await expect(page.locator('[data-testid="product-card"]').first()).toContainText(
      /봄|여름|가을|겨울/
    );
  });

  test('통합 대시보드 분석 진행률', async ({ page }) => {
    await page.goto('/dashboard');

    // 분석 진행률 위젯 확인
    const progressWidget = page.getByTestId('analysis-progress');
    await expect(progressWidget).toBeVisible();

    // 완료/미완료 모듈 표시
    await expect(progressWidget).toContainText(/퍼스널 컬러|피부|체형|얼굴형/);
  });
});
```

#### 7.4.4 에러 핸들링 시나리오

```typescript
// tests/e2e/error-handling.spec.ts
import { test, expect } from '@playwright/test';

test.describe('에러 핸들링', () => {
  test('AI 분석 실패 시 Mock Fallback', async ({ page }) => {
    // AI API 실패 시뮬레이션 (환경변수로 제어)
    await page.goto('/analysis/skin?force_mock=true');

    // 이미지 업로드 및 분석
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face.jpg');
    await page.click('button:has-text("분석하기")');

    // Mock 결과로 정상 표시 확인
    await page.waitForURL(/\/result\/.+/, { timeout: 10000 });
    await expect(page.getByTestId('skin-score')).toBeVisible();

    // Mock 사용 알림 표시 (선택적)
    // await expect(page.getByText('샘플 데이터')).toBeVisible();
  });

  test('네트워크 오류 시 재시도 UI', async ({ page }) => {
    // 오프라인 시뮬레이션
    await page.context().setOffline(true);

    await page.goto('/analysis/personal-color');
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face.jpg');
    await page.click('button:has-text("분석하기")');

    // 재시도 버튼 표시
    await expect(page.getByText('다시 시도')).toBeVisible({ timeout: 10000 });

    // 온라인 복구
    await page.context().setOffline(false);
    await page.click('button:has-text("다시 시도")');

    // 정상 진행 확인
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
  });

  test('인증 만료 시 로그인 리다이렉트', async ({ page }) => {
    // 비로그인 상태로 보호 라우트 접근
    await page.context().clearCookies();
    await page.goto('/analysis/skin');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/sign-in/);
  });
});
```

#### 7.4.5 성능 테스트 시나리오

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('성능 테스트', () => {
  test('홈 페이지 LCP < 2.5초', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const lcp = Date.now() - startTime;
    expect(lcp).toBeLessThan(2500);
  });

  test('분석 결과 페이지 로딩 < 3초', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/analysis/skin/result/test-id');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('무한 스크롤 성능 (제품 목록)', async ({ page }) => {
    await page.goto('/products');

    // 5번 스크롤 후에도 60fps 유지
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(500);
    }

    // 스크롤 후에도 상호작용 가능
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });
});
```

#### 7.4.6 E2E 테스트 실행

```bash
# 전체 E2E 테스트
npm run test:e2e

# 특정 시나리오만
npm run test:e2e -- tests/e2e/personal-color-analysis.spec.ts

# UI 모드 (디버깅)
npm run test:e2e:ui

# CI 환경
npm run test:e2e -- --project=chromium --reporter=github
```

---

## Part 8: 리스크 및 롤백 전략

### 8.1 식별된 리스크

| 리스크                       | 영향도 | 발생 확률 | 대응                   |
| ---------------------------- | ------ | --------- | ---------------------- |
| 색상 마이그레이션 중 UI 깨짐 | 높음   | 중간      | 컴포넌트별 점진적 적용 |
| 다국어 적용 중 누락 텍스트   | 중간   | 높음      | fallback 메시지 설정   |
| 마이그레이션 실패            | 높음   | 낮음      | 로컬 테스트 후 적용    |
| 모듈 연동 시 성능 저하       | 중간   | 중간      | 쿼리 최적화, 캐싱      |

### 8.2 롤백 절차

```bash
# Level 1: 컴포넌트 롤백
git revert [commit] -- components/specific.tsx

# Level 2: 마이그레이션 롤백
npx supabase db reset --linked  # 주의: 데이터 손실

# Level 3: 전체 롤백
git revert [commit-range]
npm run test  # 테스트 통과 확인
npm run build  # 빌드 성공 확인
```

---

## Part 9: 보안 취약점 점검 (OWASP)

### 9.1 OWASP Top 10 체크리스트

#### 9.1.1 A01: 인증 실패 (Broken Access Control)

**현재 상태**: ✅ Clerk + RLS로 대부분 보호됨

**점검 항목**:

```
☐ 모든 보호 라우트에 auth.protect() 적용 확인
☐ API 라우트에서 clerk_user_id 검증
☐ RLS 정책이 모든 테이블에 적용됨
☐ 수평적 권한 상승 불가 (다른 사용자 데이터 접근)
```

**취약점 예시 및 해결**:

```typescript
// ❌ 취약: 사용자 ID 검증 없음
const { data } = await supabase.from('skin_analyses').select('*').eq('id', params.id); // 누구나 접근 가능

// ✅ 안전: clerk_user_id 검증
const { data } = await supabase
  .from('skin_analyses')
  .select('*')
  .eq('id', params.id)
  .eq('clerk_user_id', userId); // 본인 데이터만 접근
```

#### 9.1.2 A03: 인젝션 (Injection)

**현재 상태**: ✅ Supabase 파라미터화 쿼리로 SQL Injection 방지

**점검 항목**:

```
☐ 모든 DB 쿼리가 Supabase 클라이언트 사용
☐ 동적 테이블/컬럼명 사용 금지
☐ XSS 방지를 위한 입력 검증
```

**금지 패턴**:

```typescript
// ❌ 절대 금지: 문자열 연결
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ❌ 금지: dangerouslySetInnerHTML 무분별 사용
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 안전: Supabase 사용
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('name', name);
```

#### 9.1.3 A05: 보안 설정 오류 (Security Misconfiguration)

**점검 항목**:

```
☐ .env 파일이 .gitignore에 포함됨
☐ NEXT_PUBLIC_ 접두사는 공개 가능한 값만 사용
☐ 프로덕션에서 debug 모드 비활성화
☐ 에러 메시지에 스택 트레이스 미노출
```

**환경변수 분류**:

```bash
# 공개 가능 (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# 비공개 (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=xxx     # 절대 공개 금지
CLERK_SECRET_KEY=xxx              # 절대 공개 금지
GOOGLE_GENERATIVE_AI_API_KEY=xxx  # 절대 공개 금지
```

#### 9.1.4 A07: 인증 실패 (Identification and Authentication Failures)

**현재 상태**: ✅ Clerk이 인증 전담

**추가 고려사항**:

```
☐ 비밀번호 정책 (Clerk 설정에서 관리)
☐ 세션 타임아웃 설정
☐ 로그인 시도 제한 (Rate Limiting)
```

### 9.2 민감 데이터 보호

#### 9.2.1 개인정보 분류

| 데이터 유형    | 민감도 | 저장 위치        | 암호화      |
| -------------- | ------ | ---------------- | ----------- |
| 이메일         | 높음   | Clerk            | O           |
| 분석 이미지    | 높음   | Supabase Storage | O (전송 중) |
| 신체 측정값    | 높음   | body_analyses    | O (저장 시) |
| 피부 분석 결과 | 중간   | skin_analyses    | X           |
| 운동 기록      | 낮음   | workout_logs     | X           |

#### 9.2.2 이미지 저장 보안

```typescript
// Supabase Storage 버킷 정책
{
  "public": false,  // 비공개 버킷
  "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
  "max_file_size": 5242880  // 5MB 제한
}

// 서명된 URL로만 접근 가능
const { data } = await supabase.storage
  .from('analysis-images')
  .createSignedUrl('path/to/image.jpg', 3600); // 1시간 유효
```

---

## Part 10: 성능 최적화

### 10.1 현재 성능 지표

#### 10.1.1 Lighthouse 점수 목표

| 지표           | 현재 | 목표 | 상태         |
| -------------- | ---- | ---- | ------------ |
| Performance    | 75   | 90+  | ⚠️ 개선 필요 |
| Accessibility  | 92   | 95+  | ⚠️ 개선 필요 |
| Best Practices | 88   | 95+  | ⚠️ 개선 필요 |
| SEO            | 95   | 95+  | ✅ 충족      |

#### 10.1.2 Core Web Vitals 목표

| 지표 | 현재 | 목표    | 설명               |
| ---- | ---- | ------- | ------------------ |
| LCP  | 2.8s | < 2.5s  | 최대 콘텐츠 페인트 |
| FID  | 50ms | < 100ms | 첫 입력 지연       |
| CLS  | 0.05 | < 0.1   | 누적 레이아웃 이동 |

### 10.2 이미지 최적화

#### 10.2.1 Next.js Image 컴포넌트 사용

```tsx
// ❌ 최적화 안 됨
<img src="/hero.jpg" alt="Hero" />;

// ✅ 최적화됨
import Image from 'next/image';
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority // LCP 이미지에만 사용
/>;
```

#### 10.2.2 이미지 포맷 및 압축

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

### 10.3 번들 최적화

#### 10.3.1 코드 스플리팅

```typescript
// 무거운 컴포넌트 동적 import
import dynamic from 'next/dynamic';

// 차트 컴포넌트 (recharts)
export const ChartDynamic = dynamic(
  () => import('./Chart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// 모달 컴포넌트
export const ModalDynamic = dynamic(
  () => import('./Modal').then(mod => ({ default: mod.Modal })),
  { ssr: false }
);
```

#### 10.3.2 트리 쉐이킹 확인

```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer

# 큰 패키지 확인
# - recharts: 차트 컴포넌트만 import
# - lucide-react: 사용 아이콘만 import
# - date-fns: 사용 함수만 import
```

#### 10.3.3 패키지 최적화

```typescript
// ❌ 전체 import (번들 크기 증가)
import { format, parse, addDays, ... } from 'date-fns';
import * as Icons from 'lucide-react';

// ✅ 개별 import (트리 쉐이킹 가능)
import { format, parse } from 'date-fns';
import { Home, Settings, User } from 'lucide-react';
```

### 10.4 데이터 페칭 최적화

#### 10.4.1 React Query 캐싱

```typescript
// 제품 목록 캐싱 (5분)
const { data } = useQuery({
  queryKey: ['products', category],
  queryFn: () => fetchProducts(category),
  staleTime: 5 * 60 * 1000, // 5분간 fresh
  cacheTime: 30 * 60 * 1000, // 30분간 캐시 유지
});
```

#### 10.4.2 Supabase 쿼리 최적화

```typescript
// ❌ N+1 문제: 연관 데이터 개별 조회
const products = await supabase.from('products').select('*');
for (const p of products) {
  const reviews = await supabase.from('reviews').select('*').eq('product_id', p.id);
}

// ✅ JOIN으로 한 번에 조회
const { data } = await supabase
  .from('products')
  .select(
    `
    *,
    reviews (
      id,
      rating,
      content
    )
  `
  )
  .eq('category', category)
  .limit(20);
```

### 10.5 에러 로깅 및 모니터링

#### 10.5.1 Sentry 설정 (권장)

**현재 상태**: 모바일 앱에 Sentry 적용됨, 웹 앱은 미적용

```typescript
// lib/sentry.ts (신규 생성 필요)
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracingOrigins: ['localhost', 'yiroom.com'],
      }),
    ],
  });
}
```

#### 10.5.2 에러 경계 (Error Boundary)

```tsx
// components/ErrorBoundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

#### 10.5.3 API 에러 로깅 패턴

```typescript
// lib/api/error-handler.ts
export async function apiErrorHandler(
  error: unknown,
  context: { module: string; action: string; userId?: string }
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // 로컬 로깅 (항상)
  console.error(`[${context.module}] ${context.action} failed:`, errorMessage);

  // Sentry 로깅 (프로덕션)
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { module: context.module, action: context.action },
      user: context.userId ? { id: context.userId } : undefined,
    });
  }

  // 사용자 친화적 에러 반환
  return {
    error: true,
    message: '처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    code: error instanceof ApiError ? error.code : 'UNKNOWN',
  };
}
```

---

### 10.6 환경변수 관리

#### 10.6.1 환경변수 분류

**.env.example** (저장소에 포함):

```bash
# === 필수 (애플리케이션 실행에 필수) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# === 서버 전용 (절대 NEXT_PUBLIC_ 사용 금지) ===
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
CLERK_SECRET_KEY=sk_test_...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# === 선택 (없어도 동작, 기능 제한) ===
SENTRY_DSN=https://xxx@sentry.io/xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

#### 10.6.2 환경변수 검증

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // 필수 공개 변수
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),

  // 필수 서버 변수
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().startsWith('AIza'),

  // 선택 변수
  SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

#### 10.6.3 환경변수 검사 스크립트

```bash
# apps/web/scripts/check-env.js
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

---

### 10.7 렌더링 최적화

#### 10.7.1 불필요한 리렌더링 방지

```typescript
// ❌ 매 렌더링마다 새 객체 생성
<Component style={{ color: 'red' }} />
<Component data={data.filter(x => x.active)} />

// ✅ useMemo로 메모이제이션
const filteredData = useMemo(() =>
  data.filter(x => x.active),
  [data]
);
const style = useMemo(() => ({ color: 'red' }), []);
```

#### 10.7.2 가상화 (긴 리스트)

```typescript
// 20개 이상 아이템 리스트에 가상화 적용
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  width="100%"
  itemCount={items.length}
  itemSize={80}
>
  {({ index, style }) => (
    <ProductCard product={items[index]} style={style} />
  )}
</FixedSizeList>
```

---

## Part 11: 디자인 시스템 정의

### 11.1 색상 팔레트

#### 11.1.1 모듈 색상 (OKLCH)

```css
:root {
  /* 운동 모듈 - 오렌지 계열 */
  --module-workout: oklch(0.85 0.15 45);
  --module-workout-light: oklch(0.95 0.08 45);
  --module-workout-dark: oklch(0.65 0.18 45);

  /* 영양 모듈 - 그린 계열 */
  --module-nutrition: oklch(0.75 0.15 150);
  --module-nutrition-light: oklch(0.92 0.08 150);
  --module-nutrition-dark: oklch(0.55 0.18 150);

  /* 피부 모듈 - 핑크 계열 */
  --module-skin: oklch(0.8 0.12 350);
  --module-skin-light: oklch(0.95 0.06 350);
  --module-skin-dark: oklch(0.6 0.15 350);

  /* 체형 모듈 - 블루 계열 */
  --module-body: oklch(0.75 0.15 250);
  --module-body-light: oklch(0.92 0.08 250);
  --module-body-dark: oklch(0.55 0.18 250);

  /* 퍼스널컬러 모듈 - 퍼플 계열 */
  --module-personal-color: oklch(0.7 0.18 300);
  --module-personal-color-light: oklch(0.9 0.09 300);
  --module-personal-color-dark: oklch(0.5 0.21 300);

  /* 얼굴형 모듈 - 코랄 계열 */
  --module-face: oklch(0.75 0.16 30);
  --module-face-light: oklch(0.92 0.08 30);
  --module-face-dark: oklch(0.55 0.19 30);

  /* 헤어 모듈 - 베이지 계열 */
  --module-hair: oklch(0.78 0.14 55);
  --module-hair-light: oklch(0.93 0.07 55);
  --module-hair-dark: oklch(0.58 0.17 55);
}
```

#### 11.1.2 시맨틱 색상

```css
:root {
  /* 상태 색상 */
  --status-success: oklch(0.75 0.18 145);
  --status-warning: oklch(0.85 0.18 85);
  --status-error: oklch(0.65 0.25 25);
  --status-info: oklch(0.7 0.15 230);

  /* 점수 색상 (0-100) */
  --score-excellent: oklch(0.75 0.18 145); /* 81-100 */
  --score-good: oklch(0.8 0.15 180); /* 61-80 */
  --score-average: oklch(0.85 0.15 90); /* 41-60 */
  --score-poor: oklch(0.7 0.2 30); /* 21-40 */
  --score-critical: oklch(0.6 0.25 25); /* 0-20 */
}
```

### 11.2 타이포그래피

#### 11.2.1 폰트 스케일

```css
:root {
  --font-xs: 0.75rem; /* 12px */
  --font-sm: 0.875rem; /* 14px */
  --font-base: 1rem; /* 16px */
  --font-lg: 1.125rem; /* 18px */
  --font-xl: 1.25rem; /* 20px */
  --font-2xl: 1.5rem; /* 24px */
  --font-3xl: 1.875rem; /* 30px */
  --font-4xl: 2.25rem; /* 36px */
}
```

#### 11.2.2 용도별 텍스트 스타일

| 용도        | 크기    | 굵기     | 행간 |
| ----------- | ------- | -------- | ---- |
| 페이지 제목 | 2xl-3xl | bold     | 1.2  |
| 섹션 제목   | xl-2xl  | semibold | 1.3  |
| 카드 제목   | lg-xl   | semibold | 1.4  |
| 본문        | base    | normal   | 1.6  |
| 캡션        | sm      | normal   | 1.5  |
| 라벨        | xs-sm   | medium   | 1.4  |

### 11.3 스페이싱 시스템

```css
:root {
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-5: 1.25rem; /* 20px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-10: 2.5rem; /* 40px */
  --spacing-12: 3rem; /* 48px */
  --spacing-16: 4rem; /* 64px */
}
```

### 11.4 컴포넌트 토큰

#### 11.4.1 카드

```css
:root {
  --card-radius: 1rem; /* 16px */
  --card-radius-sm: 0.5rem; /* 8px */
  --card-radius-lg: 1.5rem; /* 24px */
  --card-shadow: 0 1px 3px oklch(0 0 0 / 10%);
  --card-shadow-hover: 0 4px 12px oklch(0 0 0 / 15%);
  --card-padding: var(--spacing-4);
  --card-gap: var(--spacing-3);
}
```

#### 11.4.2 버튼

```css
:root {
  --button-height-sm: 2rem; /* 32px */
  --button-height-md: 2.5rem; /* 40px */
  --button-height-lg: 3rem; /* 48px */
  --button-radius: 0.5rem; /* 8px */
  --button-radius-full: 9999px;
}
```

### 11.5 애니메이션 및 마이크로인터랙션

#### 11.5.1 애니메이션 원칙

**기본 원칙**:

- 의미 있는 움직임만 사용 (장식용 애니메이션 최소화)
- `prefers-reduced-motion` 미디어 쿼리 존중
- 300ms 이하의 빠른 트랜지션 권장
- 사용자 액션에 대한 즉각적 피드백

#### 11.5.2 애니메이션 토큰

```css
/* globals.css - 애니메이션 시스템 */
:root {
  /* 트랜지션 지속 시간 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* 이징 함수 */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 접근성: 모션 감소 선호 시 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 11.5.3 컴포넌트별 애니메이션 가이드

**버튼 인터랙션**:

```tsx
// ✅ 권장: 호버/포커스 피드백
<Button className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
  분석하기
</Button>

// ❌ 지양: 과도한 애니메이션
<Button className="animate-bounce hover:animate-pulse">
  분석하기
</Button>
```

**카드 호버**:

```tsx
<Card className="transition-shadow duration-200 hover:shadow-lg">{/* 컨텐츠 */}</Card>
```

**로딩 상태**:

```tsx
// 스켈레톤
<div className="animate-pulse bg-muted rounded-lg h-32" />

// 스피너
<Loader2 className="animate-spin h-6 w-6" />
```

#### 11.5.4 마이크로인터랙션 패턴

| 상황          | 애니메이션       | 지속 시간 | 이징        |
| ------------- | ---------------- | --------- | ----------- |
| 버튼 호버     | scale(1.02)      | 150ms     | ease-out    |
| 버튼 클릭     | scale(0.98)      | 100ms     | ease-in     |
| 카드 호버     | shadow 증가      | 200ms     | ease-in-out |
| 모달 열림     | fade + scale     | 200ms     | ease-out    |
| 모달 닫힘     | fade + scale     | 150ms     | ease-in     |
| 토스트 등장   | slide-in         | 300ms     | ease-bounce |
| 탭 전환       | fade             | 150ms     | ease-in-out |
| 드롭다운 열림 | slide-down       | 200ms     | ease-out    |
| 점수 카운트업 | number increment | 500ms     | ease-out    |

#### 11.5.5 분석 결과 애니메이션

```tsx
// 점수 카운트업 애니메이션
function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}
```

#### 11.5.6 접근성 고려사항

```tsx
// 모션 감소 선호 감지
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// Tailwind 클래스로 처리
<div className="hover:scale-102 motion-reduce:hover:scale-100 transition-transform">
  {children}
</div>;
```

---

## Part 12: 접근성 (Accessibility) 가이드

### 12.1 WCAG 2.1 AA 준수 목표

#### 12.1.1 현재 상태 및 목표

| 지표                     | 현재 | 목표 | 상태         |
| ------------------------ | ---- | ---- | ------------ |
| Lighthouse Accessibility | 92   | 95+  | ⚠️ 개선 필요 |
| 키보드 네비게이션        | 70%  | 100% | ⚠️ 개선 필요 |
| 스크린 리더 지원         | 60%  | 90%+ | ⚠️ 개선 필요 |
| 색상 대비                | 85%  | 100% | ⚠️ 개선 필요 |

#### 12.1.2 핵심 원칙 (POUR)

```
P - Perceivable (인지 가능)
  ☐ 모든 이미지에 alt 텍스트
  ☐ 비디오/오디오에 자막 또는 대체 텍스트
  ☐ 색상만으로 정보 전달하지 않기

O - Operable (조작 가능)
  ☐ 모든 기능 키보드로 접근 가능
  ☐ 포커스 순서 논리적
  ☐ 충분한 클릭 영역 (44x44px 최소)

U - Understandable (이해 가능)
  ☐ 명확한 레이블과 지시사항
  ☐ 에러 메시지 구체적
  ☐ 일관된 네비게이션 패턴

R - Robust (견고함)
  ☐ 시맨틱 HTML 사용
  ☐ ARIA 속성 올바르게 사용
  ☐ 다양한 보조 기술과 호환
```

### 12.2 컴포넌트별 접근성 요구사항

#### 12.2.1 Dialog/Modal

```tsx
// ✅ 올바른 패턴
<Dialog>
  <DialogHeader>
    <DialogTitle>제목</DialogTitle>
    <VisuallyHidden asChild>
      <DialogDescription>모달 설명</DialogDescription>
    </VisuallyHidden>
  </DialogHeader>
  <DialogContent>
    {/* 컨텐츠 */}
  </DialogContent>
</Dialog>

// ❌ DialogDescription 누락
<Dialog>
  <DialogHeader>
    <DialogTitle>제목</DialogTitle>
  </DialogHeader>
</Dialog>
```

**체크리스트**:

```
☐ DialogDescription 필수 (VisuallyHidden 사용 가능)
☐ 포커스 트랩 활성화
☐ ESC 키로 닫기
☐ 열릴 때 첫 포커스 가능 요소로 이동
```

#### 12.2.2 Form 요소

```tsx
// ✅ 올바른 패턴
<div>
  <Label htmlFor="email">이메일</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p id="email-error" role="alert">
      {errors.email.message}
    </p>
  )}
</div>

// ❌ 레이블 연결 누락
<div>
  <span>이메일</span>
  <Input type="email" />
</div>
```

**체크리스트**:

```
☐ 모든 입력에 <Label> 연결 (htmlFor/id)
☐ 필수 필드에 aria-required="true"
☐ 에러 시 aria-invalid="true" + aria-describedby
☐ 실시간 검증 메시지에 role="alert"
```

#### 12.2.3 버튼 및 링크

```tsx
// ✅ 올바른 패턴 - 아이콘만 있는 버튼
<Button aria-label="설정 열기">
  <Settings className="w-5 h-5" />
</Button>

// ✅ 올바른 패턴 - 새 탭 링크
<a href="/external" target="_blank" rel="noopener">
  외부 사이트
  <span className="sr-only">(새 탭에서 열림)</span>
</a>

// ❌ 레이블 없는 아이콘 버튼
<Button>
  <Settings />
</Button>
```

#### 12.2.4 이미지 및 아이콘

```tsx
// ✅ 정보 전달 이미지
<Image
  src="/analysis-result.jpg"
  alt="피부 분석 결과: 수분도 75점, 유분도 60점"
  width={400}
  height={300}
/>

// ✅ 장식용 이미지
<Image
  src="/decoration.svg"
  alt=""  // 빈 alt로 스크린 리더 무시
  aria-hidden="true"
  width={100}
  height={100}
/>

// ✅ 아이콘 (정보 전달용)
<CheckCircle aria-label="완료됨" className="text-green-500" />

// ✅ 아이콘 (장식용)
<Sparkles aria-hidden="true" />
```

### 12.3 색상 대비 요구사항

#### 12.3.1 텍스트 대비 (WCAG AA)

| 텍스트 크기             | 최소 대비 | 현재 상태    |
| ----------------------- | --------- | ------------ |
| 일반 텍스트 (< 18px)    | 4.5:1     | ✅           |
| 큰 텍스트 (≥ 18px bold) | 3:1       | ✅           |
| UI 컴포넌트             | 3:1       | ⚠️ 점검 필요 |

#### 12.3.2 문제 색상 조합 (수정 필요)

```css
/* ❌ 대비 부족 */
.warning-text {
  color: oklch(0.85 0.18 85); /* 노란색 - 배경과 대비 부족 */
}

/* ✅ 대비 개선 */
.warning-text {
  color: oklch(0.65 0.18 85); /* 더 진한 노란색/갈색 */
}
```

### 12.4 키보드 네비게이션

#### 12.4.1 탭 순서 관리

```tsx
// ✅ 논리적 탭 순서
<div>
  <h1>페이지 제목</h1>
  <nav>{/* 네비게이션 먼저 */}</nav>
  <main>{/* 메인 콘텐츠 */}</main>
  <aside>{/* 사이드바 */}</aside>
  <footer>{/* 푸터 */}</footer>
</div>

// 포커스 건너뛰기 링크
<a href="#main-content" className="sr-only focus:not-sr-only">
  본문으로 건너뛰기
</a>
```

#### 12.4.2 포커스 스타일

```css
/* globals.css - 포커스 표시 필수 */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* 포커스 표시 제거 금지 */
/* ❌ *:focus { outline: none; } */
```

### 12.5 스크린 리더 지원

#### 12.5.1 aria-live 영역

```tsx
// 동적 콘텐츠 업데이트 알림
<div aria-live="polite" aria-atomic="true">
  {loading && '분석 중...'}
  {result && `분석 완료: ${result.score}점`}
</div>

// 중요한 에러 알림
<div role="alert" aria-live="assertive">
  {error && `오류: ${error.message}`}
</div>
```

#### 12.5.2 시맨틱 HTML 우선

```tsx
// ✅ 시맨틱 HTML
<nav aria-label="메인 네비게이션">...</nav>
<main id="main-content">...</main>
<article>...</article>
<aside aria-label="관련 제품">...</aside>

// ❌ div 남용
<div class="nav">...</div>
<div class="main">...</div>
```

### 12.6 테스트 도구

#### 12.6.1 자동화 테스트

```bash
# axe-core 접근성 검사
npm install @axe-core/react --save-dev

# Lighthouse CI (CI 파이프라인)
npm install @lhci/cli --save-dev
```

```typescript
// tests/a11y/accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('분석 결과 페이지 접근성', async () => {
  const { container } = render(<AnalysisResultPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 12.6.2 수동 테스트 체크리스트

```
☐ 키보드만으로 모든 기능 사용 가능
☐ 스크린 리더로 페이지 콘텐츠 이해 가능
☐ 200% 확대에서 레이아웃 깨지지 않음
☐ 고대비 모드에서 UI 식별 가능
☐ 애니메이션 비활성화 시 정상 작동
```

### 12.7 접근성 체크리스트 (컴포넌트 생성 시)

```
새 컴포넌트 생성 시 필수 확인:

☐ data-testid 속성 추가
☐ 시맨틱 HTML 요소 사용
☐ 키보드 접근 가능
☐ 포커스 표시 명확
☐ 색상 대비 4.5:1 이상
☐ 필요시 aria-* 속성 추가
☐ 이미지에 alt 텍스트
☐ 에러 메시지에 role="alert"
```

---

## Part 13: 산출물 문서 목록

### 13.1 문서 분류

#### 13.1.1 설계 문서 (Spec Documents)

| 문서                                       | 상태    | 용도                           |
| ------------------------------------------ | ------- | ------------------------------ |
| SDD-MASTER-REFACTORING-PLAN.md             | ✅ 완료 | 전체 리팩토링 가이드 (본 문서) |
| SDD-GLOBAL-DESIGN-SPECIFICATION.md         | ✅ 완료 | 다민족 지원 + 디자인 시스템    |
| SDD-PROFESSIONAL-ENHANCEMENT.md            | ✅ 완료 | F-1 얼굴형 분석 스펙           |
| SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md | ✅ 완료 | UI/UX 가이드 + 구현 상세       |
| SDD-GAP-FIXES.md                           | ✅ 완료 | UI Gap 수정 사항               |
| SDD-MY-INFO-SECTION.md                     | ✅ 완료 | 내 정보 섹션 스펙              |
| SDD-S1-PROFESSIONAL-ANALYSIS.md            | ✅ 완료 | S-1 전문가 분석 스펙           |

#### 13.1.2 운영 문서 (Operational Documents)

| 문서               | 상태         | 용도                        |
| ------------------ | ------------ | --------------------------- |
| CLAUDE.md          | ✅ 완료      | Claude Code 프로젝트 가이드 |
| DATABASE-SCHEMA.md | ⚠️ 갱신 필요 | DB 스키마 문서 (40% 불일치) |
| TROUBLESHOOTING.md | ✅ 완료      | 오류 해결 가이드            |
| GLOSSARY.md        | ✅ 완료      | 용어 설명집                 |

#### 13.1.3 규칙 문서 (Rule Documents)

| 문서                                 | 상태    | 용도                 |
| ------------------------------------ | ------- | -------------------- |
| .claude/rules/db-api-sync.md         | ✅ 완료 | DB-API 동기화 규칙   |
| .claude/rules/coding-standards.md    | ✅ 완료 | 코딩 표준            |
| .claude/rules/ai-integration.md      | ✅ 완료 | AI 통합 규칙         |
| .claude/rules/hybrid-data-pattern.md | ✅ 완료 | Hybrid 데이터 패턴   |
| .claude/rules/prompt-engineering.md  | ✅ 완료 | 프롬프트 작성 가이드 |
| .claude/rules/server-debugging.md    | ✅ 완료 | 서버 디버깅 가이드   |
| .claude/rules/ai-code-review.md      | ✅ 완료 | AI 코드 리뷰 규칙    |
| .claude/rules/sisyphus-trigger.md    | ✅ 완료 | 시지푸스 트리거 규칙 |

### 13.2 생성 예정 문서

#### 13.2.1 Phase 1-2 완료 시

| 문서                   | 용도                   | 생성 시점       |
| ---------------------- | ---------------------- | --------------- |
| UI-MIGRATION-REPORT.md | 색상 마이그레이션 결과 | Phase 1 완료 후 |
| I18N-IMPLEMENTATION.md | 다국어 구현 가이드     | Phase 2 완료 후 |

#### 13.2.2 Phase 3-4 완료 시

| 문서                         | 용도                   | 생성 시점       |
| ---------------------------- | ---------------------- | --------------- |
| CROSS-MODULE-ARCHITECTURE.md | 모듈간 연동 아키텍처   | Phase 3 완료 후 |
| INGREDIENT-DATABASE.md       | 성분 DB 구조 및 사용법 | Phase 4 완료 후 |

### 13.3 문서 관리 규칙

#### 13.3.1 파일명 규칙

```
설계 문서: SDD-[기능명].md (예: SDD-F1-FACE-ANALYSIS.md)
운영 문서: [이름].md (예: TROUBLESHOOTING.md)
규칙 문서: .claude/rules/[규칙명].md
```

#### 13.3.2 버전 관리

```markdown
## 변경 이력

| 버전 | 날짜       | 변경 내용                                                                                                            |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| 1.0  | 2026-01-13 | 초기 버전 - 오류 예방, UI/UX, i18n, 모듈 연동 기반                                                                   |
| 1.1  | 2026-01-13 | Phase 0 실행 계획 추가, 보안 섹션 보강                                                                               |
| 1.2  | 2026-01-14 | F-1 얼굴형 분석 스펙, 성분 DB, 다민족 지원 추가                                                                      |
| 1.3  | 2026-01-14 | Part 12 접근성, Part 13 산출물, 폼 상태관리, 에러 로깅 추가                                                          |
| 1.4  | 2026-01-14 | 접근성 우선순위 상향, 환경변수 관리, Lighthouse CI 추가                                                              |
| 1.5  | 2026-01-14 | Part 3.5 packages/shared 상세 스펙, Part 7.4 E2E 테스트 시나리오, Part 11.5 애니메이션/마이크로인터랙션 가이드 추가  |
| 1.6  | 2026-01-14 | Part 14 제외된 항목 문서화 추가, 섹션 번호 중복 수정 (10.5→10.7)                                                     |
| 1.7  | 2026-01-14 | Quick Start Guide, 문서 유지보수 전략, MVP 스코프 정의, 단점 완화 전략 추가                                          |
| 1.8  | 2026-01-14 | MVP 스코프 → 완전형 구현 로드맵으로 변경, Phase 1-4 재구성                                                           |
| 1.9  | 2026-01-14 | Part 15-20 추가: W-1/N-1 고도화, Products UI/UX 개편, Reports 콘텐츠, Fashion/Closet 모듈, 2026 UX 트렌드 체크리스트 |

---

**Document Version**: 1.9
**Created**: 2026-01-13
**Updated**: 2026-01-14
**Author**: Claude Code (Opus 4.5)
```

### 13.4 마이그레이션 파일 목록

#### 13.4.1 현재 마이그레이션 (26개)

```
supabase/migrations/
├── 2025-12-* (기본 테이블 10개)
├── 20251202_product_tables.sql
├── 20251203_workout_tables.sql
├── 20251204_user_features_tables.sql
├── 20251205_nutrition_tables.sql
├── 20251206_social_tables.sql
├── 20251207_additional_tables.sql
├── 20260108_analysis_images.sql
├── 20260108_image_consents.sql
├── 20260110100000_mental_health_logs.sql
├── 20260111_product_shelf.sql
├── 20260113_pc_multi_angle_columns.sql
├── 20260113_skin_diary.sql
├── 20260113_photo_reuse_system.sql
├── 20260113_skin_problem_areas.sql
└── 20260117_analysis_cross_links.sql
```

#### 13.4.2 추가 예정 마이그레이션

```
☐ 20260118_wrist_image_column.sql      # PC-1 손목 이미지
☐ 20260119_ingredients.sql             # 성분 DB
☐ 20260120_user_accessibility.sql      # 접근성 설정
```

---

## Part 14: 제외된 항목 및 향후 검토 목록

> 이 섹션은 리팩토링 계획 수립 시 논의되었으나 현재 범위에서 제외된 항목들을 기록합니다.
> 향후 "왜 이 방식을 선택하지 않았나?"에 대한 의사결정 추적성(Decision Traceability)을 제공합니다.

### 14.1 제외 결정 기준

| 기준                 | 설명                         | 예시                                   |
| -------------------- | ---------------------------- | -------------------------------------- |
| **현재 필요성 낮음** | MVP/현재 로드맵에 불필요     | 결제 시스템 미도입 시 security-auditor |
| **ROI 불충분**       | 구현 비용 대비 효과 미미     | 소규모 팀에서 Adversarial 에이전트     |
| **선행 조건 미충족** | 의존 작업 완료 후 검토 가능  | MAU 1만 미만 시 성능 최적화 에이전트   |
| **대안으로 충분**    | 기존 도구/방식으로 해결 가능 | Husky로 충분 시 PostToolUse 훅         |
| **복잡도 대비 효과** | 설정/유지보수 비용 > 이점    | 소규모 프로젝트에서 GraphQL            |

### 14.2 제외된 전문 에이전트

| 에이전트                  | 역할                                 | 제외 사유                                               | 재검토 트리거                                                 |
| ------------------------- | ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| **security-auditor**      | 보안 취약점 검사, OWASP Top 10 점검  | 결제/민감 건강데이터 미도입, Clerk+RLS로 기본 보안 확보 | 결제 시스템 도입 시, 의료 정보 저장 시, 외부 API 3개+ 연동 시 |
| **performance-optimizer** | 성능 병목 분석, 최적화 제안          | MAU 1만 미만, Lighthouse 75점으로 양호                  | MAU 1만+ 도달, AI 분석 응답 3초+ 초과, Lighthouse 70 미만     |
| **db-migration-reviewer** | 스키마 변경 검토, 데이터 무결성 검증 | 대규모 스키마 변경 미예정, 26개 마이그레이션으로 안정화 | 5개+ 테이블 동시 변경, 기존 데이터 대량 변환 필요 시          |

**현재 운영 중인 에이전트 (7개)**:

- yiroom-spec-reviewer, yiroom-ui-validator
- yiroom-code-quality, yiroom-test-writer
- korean-ux-writer, korean-beauty-validator
- sisyphus-adaptive (오케스트레이터)

### 14.3 제외된 워크플로우/자동화

| 워크플로우                 | 용도                           | 제외 사유                                   | 재검토 트리거                                |
| -------------------------- | ------------------------------ | ------------------------------------------- | -------------------------------------------- |
| **PostToolUse 포매팅 훅**  | 도구 실행 후 자동 코드 포매팅  | Husky + lint-staged로 커밋 시점 포매팅 충분 | 팀 5명+ 도달, CI 포매팅 실패 월 10건+        |
| **/commit-push-pr 명령어** | git commit → push → PR 원스톱  | 수동 git 명령으로 충분, PR 컨벤션 미확립    | 일일 PR 생성 5건+, 팀 PR 템플릿 강제 필요 시 |
| **Adversarial 에이전트**   | 코드 리뷰 결과에 반론 제기     | 현재 7개 에이전트 파이프라인으로 충분       | 팀 10명+ 도달, 프로덕션 버그 월 5건+         |
| **팀 공유 설정**           | .claude/settings.json git 추적 | 1인 개발 환경, 민감 경로 노출 우려          | 팀 협업 시작 시, 새 팀원 온보딩 빈번 시      |

### 14.4 제외된 기술 스택/라이브러리

| 기술                        | 용도                   | 제외 사유                                  | 현재 대안                                  |
| --------------------------- | ---------------------- | ------------------------------------------ | ------------------------------------------ |
| **Redis**                   | 세션/캐시 저장소       | 현재 트래픽으로 불필요, 인프라 복잡도 증가 | Supabase 내장 캐싱, React Query            |
| **GraphQL**                 | API 쿼리 언어          | REST API로 충분, 학습 곡선                 | Next.js API Routes + Supabase              |
| **Storybook**               | 컴포넌트 문서화/테스트 | 컴포넌트 200개 미만, 유지보수 부담         | 직접 개발 서버 확인, Part 11 디자인 시스템 |
| **Prisma**                  | ORM                    | Supabase 클라이언트로 충분, 이중 추상화    | @supabase/supabase-js                      |
| **tRPC**                    | 타입 안전 API          | Next.js API Routes + Zod로 충분            | API Routes + Zod 스키마                    |
| **Monorepo 빌드 캐시 (Nx)** | 빌드 최적화            | Turborepo로 충분, 2개 앱 규모              | Turborepo                                  |

### 14.5 제외된 테스트/품질 도구

| 도구                          | 용도                 | 제외 사유                             | 현재 대안                            |
| ----------------------------- | -------------------- | ------------------------------------- | ------------------------------------ |
| **Cypress**                   | E2E 테스트           | Playwright로 통일, 중복 도구          | Playwright (Part 7.4)                |
| **SonarQube**                 | 정적 코드 분석       | ESLint + TypeScript로 충분, 설정 복잡 | ESLint, yiroom-code-quality 에이전트 |
| **Visual Regression Testing** | 스크린샷 비교 테스트 | 빈번한 UI 변경으로 유지보수 부담      | Playwright 스크린샷 (실패 시)        |
| **Contract Testing (Pact)**   | API 계약 테스트      | 내부 API만 사용, 외부 소비자 없음     | API Route 단위 테스트                |

### 14.6 제외된 기능/모듈

| 기능                  | 설명                  | 제외 사유                            | 재검토 트리거                        |
| --------------------- | --------------------- | ------------------------------------ | ------------------------------------ |
| **실시간 협업**       | 다중 사용자 동시 편집 | 개인 사용 앱 특성, 복잡도 높음       | 팀/가족 공유 기능 요청 시            |
| **오프라인 모드**     | PWA 오프라인 지원     | 분석 기능이 서버 의존적              | 모바일 앱 오프라인 요청 증가 시      |
| **AI 모델 로컬 실행** | 온디바이스 AI         | Gemini API 성능 충분, 모델 크기 문제 | 프라이버시 요구 증가, WebGPU 성숙 시 |
| **멀티 테넌트**       | B2B SaaS 구조         | B2C 서비스 우선, 아키텍처 복잡       | 기업 고객 요청 시                    |
| **A/B 테스트 인프라** | 실험 플랫폼           | 사용자 수 부족, ROI 낮음             | MAU 5만+ 도달 시                     |

### 14.7 재검토 일정

```
분기별 검토 (매 분기 첫 주):
☐ 에이전트 필요성 재평가
☐ 기술 스택 변경 검토
☐ 성능 지표 기반 최적화 도구 검토

트리거 기반 검토:
☐ MAU 1만 도달 → performance-optimizer, A/B 테스트
☐ 팀 5명+ → PostToolUse 훅, 팀 공유 설정
☐ 결제 도입 → security-auditor
☐ 외부 API 3개+ → security-auditor, Contract Testing
```

### 14.8 참고 문서

| 문서                                                                   | 내용                      |
| ---------------------------------------------------------------------- | ------------------------- |
| [.claude/rules/agent-roadmap.md](.claude/rules/agent-roadmap.md)       | 에이전트 로드맵 상세      |
| [.claude/rules/workflow-roadmap.md](.claude/rules/workflow-roadmap.md) | 워크플로우 향후 검토 상세 |
| [.claude/rules/sisyphus-trigger.md](.claude/rules/sisyphus-trigger.md) | 시지푸스 자동 트리거 규칙 |

---

## Part 15: 웰니스 모듈 고도화 (W-1, N-1)

> 운동/영양 모듈을 완성형으로 고도화하기 위한 상세 가이드

### 15.1 W-1 운동 모듈 Enhancement

#### 15.1.1 현재 상태 분석

**구현 완료 (✅)**:

- 온보딩 플로우 (step1-3)
- 메인 대시보드 + 스트릭 카드
- 세션/히스토리 기본 구조
- 운동 타입 분석 결과 (5가지 타입)
- 빠른 액션 (세션 시작, 기록, 분석, 플랜)

**고도화 필요 (⬜)**:

```
1. 운동 세션 UX 개선
2. 운동 라이브러리 UI
3. 진행률 시각화
4. 주간 플랜 고도화
```

#### 15.1.2 운동 세션 UX 개선

**목표**: 몰입감 있는 운동 경험 제공

```tsx
// components/workout/session/ActiveWorkoutTimer.tsx
interface ActiveWorkoutTimerProps {
  currentExercise: Exercise;
  setNumber: number;
  totalSets: number;
  restTime: number; // 초
  onComplete: () => void;
}

// 구현 요소:
// 1. 원형 프로그레스 타이머 (세트 간 휴식)
// 2. 세트/반복 카운터 애니메이션
// 3. 운동 완료 시 햅틱 피드백 (모바일)
// 4. 음성 안내 옵션 (TTS)
```

**UI 레이아웃**:

```
┌─────────────────────────────┐
│    [현재 운동명]              │
│                              │
│    ┌───────────────┐         │
│    │   ⏱️ 45초      │ ← 휴식 타이머 (원형)
│    │   남은 휴식     │
│    └───────────────┘         │
│                              │
│    세트 2/4  |  반복 12회     │
│                              │
│  [이전]  [✓ 완료]  [다음]     │
└─────────────────────────────┘
```

#### 15.1.3 운동 라이브러리 UI

**목표**: 운동 동작 탐색 및 학습 지원

**컴포넌트 구조**:

```
components/workout/library/
├── ExerciseCard.tsx          # 운동 카드 (이미지, 난이도, 부위)
├── ExerciseFilter.tsx        # 필터 (부위, 기구, 난이도)
├── ExerciseDetailSheet.tsx   # 상세 바텀시트 (설명, 동영상)
├── ExerciseSearch.tsx        # 검색
└── FavoriteExerciseList.tsx  # 즐겨찾기 운동
```

**카드 디자인**:

```
┌─────────────────────────────┐
│ [운동 이미지/GIF]            │
│                              │
│ 스쿼트                       │
│ 하체 · 중급 · 기구 없음       │
│                              │
│ ⭐ 즐겨찾기    ℹ️ 상세보기   │
└─────────────────────────────┘
```

#### 15.1.4 진행률 시각화

**목표**: 운동 성과를 직관적으로 확인

```tsx
// components/workout/stats/WorkoutProgressChart.tsx
// - 주간 운동 시간 막대 차트
// - 월간 칼로리 소모 라인 차트
// - 스트릭 히트맵 달력

// components/workout/stats/GoalProgressGauge.tsx
// - 주간 목표 대비 진행률 원형 게이지
// - 목표 달성 시 축하 애니메이션
```

**시각화 예시**:

```
주간 운동 현황
───────────────
월 ████████ 45분
화 ████ 20분
수 ██████ 30분
목 (오늘)
금 -
토 -
일 -

목표: 150분 / 달성: 95분 (63%)
```

#### 15.1.5 주간 플랜 고도화

**목표**: 개인화된 플랜 편집 기능

```tsx
// components/workout/plan/WeeklyPlanEditor.tsx
// 기능:
// 1. 드래그앤드롭으로 요일 간 운동 이동
// 2. 운동 추가/제거/대체
// 3. 휴식일 설정
// 4. 완료율 시각화

// lib/workout/planGenerator.ts
// - 체형 분석 기반 자동 플랜 생성
// - 목표 (근력/유산소/유연성) 기반 비율 조정
```

### 15.2 N-1 영양 모듈 Enhancement

#### 15.2.1 현재 상태 분석

**구현 완료 (✅)** - 완성도 높음 (924줄):

- 칼로리 원형 차트
- 식사별 기록 (아침/점심/저녁/간식)
- 수분 섭취 트래킹
- 간헐적 단식 타이머
- 크로스 모듈 연동 (S-1, W-1, C-1, H-1, M-1)
- AI 식단 추천
- 온보딩 플로우

**고도화 필요 (⬜)**:

```
1. UI 시각적 개선
2. 인터랙션 최적화
3. 통계 강화
```

#### 15.2.2 UI 시각적 개선

**목표**: 시각적 일관성 및 가독성 향상

```css
/* 영양소별 프로그레스 바 개선 */
.macro-progress {
  /* 단계별 색상 그라디언트 */
  --macro-protein: oklch(0.75 0.15 145); /* 녹색 */
  --macro-carbs: oklch(0.8 0.15 85); /* 노란색 */
  --macro-fat: oklch(0.7 0.18 25); /* 빨간색 */

  /* 목표 초과 시 시각적 경고 */
  --macro-over: oklch(0.6 0.25 25);
}
```

**개선 포인트**:

```
1. 식사 카드 레이아웃
   - 기록된 음식 썸네일 표시
   - 영양소 비율 미니 차트

2. 다크모드 색상 조화
   - 그래프 색상 대비 개선
   - 카드 배경 구분 명확화

3. 칼로리 원형 차트
   - 목표 대비 시각적 피드백 (녹색/노란색/빨간색)
   - 남은 칼로리 텍스트 강조
```

#### 15.2.3 인터랙션 최적화

**목표**: 빠르고 편리한 기록 경험

```tsx
// 스와이프 제스처 지원
// components/nutrition/MealRecordCard.tsx
// - 왼쪽 스와이프: 삭제
// - 오른쪽 스와이프: 편집

// 빠른 입력 개선
// components/nutrition/QuickFoodInput.tsx
// - 최근 기록 음식 상위 5개 표시
// - 음식 검색 자동완성 (debounce 300ms)
// - 음성 입력 버튼 (Web Speech API)
```

#### 15.2.4 통계 강화

**목표**: 장기적 영양 패턴 분석

```tsx
// components/nutrition/stats/WeeklyNutrientChart.tsx
// - 주간 영양소 분포 스택 바 차트
// - 일평균 vs 권장량 비교

// components/nutrition/stats/TrendAnalysis.tsx
// - 목표 달성률 트렌드 (최근 4주)
// - 자주 먹는 음식 Top 5
// - 영양 균형 레이더 차트
```

### 15.3 예상 작업량

| 모듈     | 항목               | 예상 시간  |
| -------- | ------------------ | ---------- |
| W-1      | 세션 UX 개선       | 4시간      |
| W-1      | 운동 라이브러리 UI | 3시간      |
| W-1      | 진행률 시각화      | 3시간      |
| W-1      | 주간 플랜 고도화   | 2시간      |
| N-1      | UI 시각적 개선     | 3시간      |
| N-1      | 인터랙션 최적화    | 2시간      |
| N-1      | 통계 강화          | 3시간      |
| **합계** |                    | **20시간** |

---

## Part 16: Products UI/UX 전면 개편

> 제품 모듈의 수익화 및 사용자 경험 최적화를 위한 전면 개편 가이드

### 16.1 현재 상태 및 문제점

#### 16.1.1 현재 구현 상태 (335줄)

**구현 완료 (✅)**:

- 카테고리 탭 (all, skincare, makeup, supplements, equipment, healthfoods)
- 제품 그리드 기본 레이아웃
- 검색 + 정렬 (평점, 가격, 최신순)
- 분석 결과 기반 필터링 (skinType, season URL 파라미터)
- 최근 본 제품

**심각한 Gap (🔴)**:

```
1. 전환율 저하 예상
   - 구매 CTA가 눈에 띄지 않음
   - 매칭 정보가 카드에 없음

2. 정보 접근성 부족
   - 가격 비교 어려움
   - 성분 정보 상세 페이지 진입 필요

3. 어필리에이트 UX 미흡
   - 외부 링크 이동 안내 부재
   - 파트너별 혜택 표시 없음
```

### 16.2 제품 카드 재디자인

#### 16.2.1 현재 vs 목표

**현재 카드**:

```
┌─────────────────────┐
│ [이미지]             │
│ 브랜드               │
│ 제품명               │
│ ₩24,000             │
│ ⭐4.8               │
└─────────────────────┘
```

**목표 카드 (2026 트렌드)**:

```
┌─────────────────────────────┐
│ [이미지]                     │
│           ♥️                 │ ← 위시리스트 버튼
│                              │
│ 💜 92% 매칭  ⭐4.8 (234)     │ ← 매칭률 + 리뷰
├─────────────────────────────┤
│ 브랜드명                     │
│ 제품명 (최대 2줄)            │
│                              │
│ 💰 ₩24,000  ▼15%            │ ← 가격 + 할인율
│ [쿠팡] [iHerb] [무신사]      │ ← 구매처 탭
│                              │
│ [🔗 구매하기]                │ ← CTA 강조
└─────────────────────────────┘
```

#### 16.2.2 구현 컴포넌트

```tsx
// components/products/ProductCard.tsx 개편
interface ProductCardProps {
  product: AnyProduct;
  matchRate?: number; // PC-1/S-1 기반 매칭률
  affiliateLinks: AffiliateLink[];
  onWishlistToggle: () => void;
  onAffiliateClick: (partner: string) => void;
}

// 매칭률 배지
// components/products/MatchRateBadge.tsx
function MatchRateBadge({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-gray-500';
  return <span className={`${color} font-semibold`}>💜 {rate}% 매칭</span>;
}

// 가격 비교 탭
// components/products/PriceCompareTabs.tsx
// - 파트너별 가격 표시
// - 최저가 강조
// - 배송비 포함 총액 표시
```

### 16.3 제품 상세 페이지 고도화

#### 16.3.1 현재 vs 목표 구조

**현재 상세 페이지**:

```
1. 제품 이미지
2. 기본 정보 (이름, 브랜드, 가격)
3. 성분 목록
4. 리뷰
```

**목표 상세 페이지**:

```
1. 이미지 캐러셀 + 고정 가격 바
2. 매칭 분석 섹션 ⬅️ 신규
   - "당신의 피부에 92% 적합해요"
   - 분석 기반 이유 설명
3. 성분 안전도 섹션 ⬅️ 개선
   - EWG 등급 시각화 (원형 게이지)
   - 위험 성분 경고 배너
   - 성분별 상세 (토글)
4. 가격 비교 탭 ⬅️ 신규
   - 파트너별 가격 표
   - 배송비 포함 총액
   - 프로모션/쿠폰 정보
5. 리뷰 섹션 ⬅️ 개선
   - AI 리뷰 요약 (긍정/부정)
   - 사진 리뷰 우선 표시
   - 도움돼요 투표
6. 유사 제품 추천 ⬅️ 신규
   - 가격대/성분 유사 제품
   - 매칭률 순 정렬
7. 고정 구매 바 ⬅️ 신규
   - 스크롤해도 하단 고정
   - 최저가 파트너 자동 선택
```

#### 16.3.2 매칭 분석 섹션

```tsx
// components/products/detail/MatchAnalysisSection.tsx
interface MatchAnalysisSectionProps {
  product: CosmeticProduct;
  userAnalysis: {
    skinType?: string;
    personalColor?: string;
    skinConcerns?: string[];
  };
}

// 표시 예시:
// ┌─────────────────────────────────┐
// │ 💜 나와의 매칭 분석               │
// ├─────────────────────────────────┤
// │ 종합 매칭률: 92%                 │
// │                                  │
// │ ✅ 복합성 피부에 적합            │
// │ ✅ 여름 쿨톤 컬러 포함           │
// │ ⚠️ 모공 고민에는 보통 효과        │
// │                                  │
// │ [분석 다시 받기]                  │
// └─────────────────────────────────┘
```

#### 16.3.3 가격 비교 탭

```tsx
// components/products/detail/PriceCompareSection.tsx
interface PriceCompareSectionProps {
  affiliateLinks: AffiliateLink[];
  onPartnerClick: (partner: string, url: string) => void;
}

// 표시 예시:
// ┌───────────────────────────────────────┐
// │ 💰 가격 비교                           │
// ├───────────────────────────────────────┤
// │ 쿠팡      ₩24,000  배송비 무료  [최저가] │
// │ iHerb     ₩25,500  해외배송 ₩5,000     │
// │ 무신사     ₩26,000  배송비 ₩3,000      │
// ├───────────────────────────────────────┤
// │ 💡 쿠팡에서 구매하면 3,500원 저렴해요   │
// └───────────────────────────────────────┘
```

### 16.4 제품 비교 기능 구현

#### 16.4.1 비교 UI

```tsx
// components/products/compare/ProductCompare.tsx
// - 최대 3개 제품 비교
// - 성분/가격/리뷰 비교표
// - AI 최적 선택 추천

// 비교 표 예시:
// ┌──────────┬──────────┬──────────┬──────────┐
// │          │ 제품 A    │ 제품 B    │ 제품 C    │
// ├──────────┼──────────┼──────────┼──────────┤
// │ 가격      │ ₩24,000  │ ₩28,000  │ ₩22,000  │
// │ 용량      │ 50ml     │ 100ml    │ 30ml     │
// │ ml당 가격 │ ₩480     │ ₩280 ⭐  │ ₩733     │
// │ 평점      │ 4.8      │ 4.5      │ 4.9 ⭐   │
// │ 리뷰 수   │ 234      │ 567 ⭐   │ 89       │
// │ 매칭률    │ 92% ⭐   │ 78%      │ 85%      │
// ├──────────┼──────────┼──────────┼──────────┤
// │ AI 추천   │ ✅ 최적  │          │          │
// └──────────┴──────────┴──────────┴──────────┘
```

#### 16.4.2 비교 스토어

```tsx
// lib/stores/compareStore.ts
interface CompareState {
  products: AnyProduct[];
  maxProducts: 3;
  addProduct: (product: AnyProduct) => void;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
}
```

### 16.5 어필리에이트 UX 최적화

#### 16.5.1 외부 링크 이동 안내

```tsx
// components/products/AffiliateRedirectModal.tsx
// 외부 사이트 이동 전 안내 모달

// 표시 예시:
// ┌─────────────────────────────────┐
// │ 🔗 쿠팡으로 이동합니다            │
// ├─────────────────────────────────┤
// │ 제품: [제품명]                   │
// │ 가격: ₩24,000                   │
// │                                  │
// │ ⚠️ 외부 사이트의 가격/재고는      │
// │    변동될 수 있습니다.            │
// │                                  │
// │ [취소]        [쿠팡에서 구매하기] │
// └─────────────────────────────────┘
```

#### 16.5.2 클릭 추적 개선

```tsx
// lib/affiliate/clickTracking.ts
// - 클릭 이벤트 상세 기록
// - 전환율 분석용 세션 ID
// - 파트너별 성과 대시보드 (관리자)

interface AffiliateClickEvent {
  productId: string;
  partner: 'coupang' | 'iherb' | 'musinsa';
  userId: string;
  sessionId: string;
  sourceModule: 'products' | 'analysis' | 'recommendation';
  matchRate?: number;
  clickedPrice: number;
}
```

### 16.6 예상 작업량

| 항목     | 세부 내용          | 예상 시간  |
| -------- | ------------------ | ---------- |
| 16.2     | 제품 카드 재디자인 | 4시간      |
| 16.3     | 상세 페이지 고도화 | 6시간      |
| 16.4     | 제품 비교 기능     | 4시간      |
| 16.5     | 어필리에이트 UX    | 3시간      |
| 테스트   | 단위/통합 테스트   | 3시간      |
| **합계** |                    | **20시간** |

---

## Part 17: Reports 콘텐츠 구현

> 주간/월간 리포트의 실제 콘텐츠 및 시각화 구현 가이드

### 17.1 현재 상태 및 문제점

#### 17.1.1 현재 구현 상태 (242줄)

**구현 완료 (✅)**:

- 주간/월간 리포트 목록 네비게이션
- 빠른 액세스 (이번 주, 이번 달)
- 최근 리포트 3개 표시

**심각한 Gap (🔴)**:

```
리포트 콘텐츠 자체가 미구현!
- 주간 리포트 상세 페이지: 기본 구조만
- 월간 리포트 상세 페이지: 기본 구조만
- 시각화 차트: 없음
- AI 인사이트: 없음
```

### 17.2 주간 리포트 콘텐츠

#### 17.2.1 리포트 구조

```
주간 리포트: 1월 13일 - 19일
───────────────────────────────

📊 이번 주 요약
━━━━━━━━━━━━━━
총 운동 시간: 3시간 45분 (+15%)
소모 칼로리: 1,250kcal
평균 섭취 칼로리: 1,850kcal/일
수분 섭취: 평균 1.8L/일
영양 목표 달성률: 72%

🏋️ 운동 분석
━━━━━━━━━━━━━
[주간 운동 막대 차트]
월: ████ 45분
화: ████ 40분
...

운동 타입 분포:
- 근력 운동: 60%
- 유산소: 30%
- 스트레칭: 10%

🥗 영양 분석
━━━━━━━━━━━━━
[영양소 균형 레이더 차트]
단백질: 85% 달성
탄수화물: 110% (초과)
지방: 95% 달성
식이섬유: 60% (부족)

💧 수분 섭취
━━━━━━━━━━━━━
[일별 수분 막대 차트]
목표 달성일: 5/7일

🎯 이번 주 잘한 점
━━━━━━━━━━━━━━━━
✅ 연속 5일 운동 완료!
✅ 단백질 섭취 목표 달성
✅ 수분 섭취 개선 (전주 대비 +20%)

⚠️ 개선이 필요해요
━━━━━━━━━━━━━━━━━
- 탄수화물 섭취 조절 필요
- 식이섬유 섭취 늘리기
- 주말 운동 추가 권장

💡 AI 코칭 메시지
━━━━━━━━━━━━━━━━
"이번 주 운동 꾸준히 하셨네요! 👏
다음 주에는 주말에도 가벼운 운동을
추가해보시면 더 좋을 것 같아요."
```

#### 17.2.2 컴포넌트 구조

```
components/reports/weekly/
├── WeeklyReportPage.tsx        # 메인 페이지
├── WeeklySummaryCard.tsx       # 요약 카드
├── WeeklyWorkoutChart.tsx      # 운동 막대 차트
├── WeeklyNutrientRadar.tsx     # 영양소 레이더 차트
├── WeeklyWaterChart.tsx        # 수분 일별 차트
├── WeeklyAchievements.tsx      # 잘한 점 목록
├── WeeklyImprovements.tsx      # 개선점 목록
├── WeeklyAICoaching.tsx        # AI 코칭 메시지
└── WeeklyShareButton.tsx       # 공유 버튼
```

#### 17.2.3 데이터 집계

```tsx
// lib/reports/weeklyAggregator.ts
interface WeeklyReportData {
  period: { start: Date; end: Date };
  workout: {
    totalMinutes: number;
    totalCalories: number;
    dailyBreakdown: DailyWorkout[];
    typeDistribution: Record<string, number>;
    comparisonToPrevious: number; // %
  };
  nutrition: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    goalAchievementRate: number;
    dailyBreakdown: DailyNutrition[];
  };
  water: {
    avgMl: number;
    goalDays: number;
    totalDays: number;
    dailyBreakdown: DailyWater[];
  };
  achievements: string[];
  improvements: string[];
  aiCoaching: string;
}

async function generateWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReportData>;
```

### 17.3 월간 리포트 콘텐츠

#### 17.3.1 리포트 구조

```
월간 리포트: 2026년 1월
───────────────────────────────

📈 전월 대비 비교
━━━━━━━━━━━━━━━━
[전월 vs 이번 달 비교 차트]

운동:   12월 180분 → 1월 225분 (+25%)
칼로리: 12월 1,750 → 1월 1,820 (+4%)
수분:   12월 1.5L → 1월 1.8L (+20%)

🏆 이달의 성과
━━━━━━━━━━━━━━
- 최장 연속 운동: 7일 (신기록!)
- 베스트 주간: 1월 2주차 (목표 92% 달성)
- 총 운동 세션: 18회

📊 주간별 추이
━━━━━━━━━━━━━
[4주간 라인 차트]
1주: ████████ 72%
2주: ██████████ 92%
3주: ███████ 65%
4주: █████████ 85%

🧠 습관 형성 분석
━━━━━━━━━━━━━━━━
형성된 습관:
✅ 아침 운동 루틴 (주 5회 이상)
✅ 점심 후 물 마시기

개선 필요 습관:
⚠️ 저녁 간식 조절
⚠️ 주말 활동량 증가

🎯 다음 달 목표 제안
━━━━━━━━━━━━━━━━━
1. 주 4회 → 주 5회 운동
2. 일일 수분 2L 목표
3. 저녁 탄수화물 -20%

💡 AI 월간 총평
━━━━━━━━━━━━━━
"1월 한 달 동안 많이 성장하셨어요! 🌟
특히 운동 습관이 잘 자리잡았습니다.
2월에는 영양 균형에 조금 더 신경 쓰시면
목표 달성이 더 쉬워질 거예요."
```

#### 17.3.2 컴포넌트 구조

```
components/reports/monthly/
├── MonthlyReportPage.tsx        # 메인 페이지
├── MonthlyComparisonChart.tsx   # 전월 대비 차트
├── MonthlyAchievements.tsx      # 이달의 성과
├── WeeklyTrendChart.tsx         # 주간 추이 차트
├── HabitFormationCard.tsx       # 습관 형성 분석
├── MonthlyGoalSuggestion.tsx    # 다음 달 목표
├── MonthlyAISummary.tsx         # AI 총평
└── MonthlyShareCard.tsx         # 공유용 카드 이미지
```

### 17.4 시각화 차트 시스템

#### 17.4.1 차트 라이브러리 선택

**권장: Recharts (React 친화적)**

```bash
npm install recharts
```

**이유**:

- React 컴포넌트 기반
- 반응형 지원
- 접근성 고려
- 번들 크기 작음

#### 17.4.2 공통 차트 컴포넌트

```tsx
// components/charts/index.ts
export { BarChartResponsive } from './BarChartResponsive';
export { LineChartResponsive } from './LineChartResponsive';
export { RadarChartResponsive } from './RadarChartResponsive';
export { PieChartResponsive } from './PieChartResponsive';
export { HeatmapCalendar } from './HeatmapCalendar';

// 모듈 색상 적용
// 운동 차트: --module-workout
// 영양 차트: --module-nutrition
// 수분 차트: oklch(0.70 0.15 230)
```

#### 17.4.3 접근성 고려

```tsx
// 차트 접근성 요구사항
// 1. aria-label로 차트 설명
// 2. 데이터 테이블 대체 제공 (sr-only)
// 3. 키보드 네비게이션 지원
// 4. 고대비 색상 사용

<div role="img" aria-label="이번 주 운동 시간 차트. 월요일 45분, 화요일 40분...">
  <BarChart data={data} />
  <table className="sr-only">{/* 스크린 리더용 데이터 테이블 */}</table>
</div>
```

### 17.5 공유 기능

#### 17.5.1 SNS 공유 이미지 생성

```tsx
// lib/reports/shareImageGenerator.ts
// html2canvas를 사용한 공유용 이미지 생성

async function generateShareImage(reportData: WeeklyReportData): Promise<Blob> {
  // 1. 공유용 카드 컴포넌트 렌더링
  // 2. html2canvas로 이미지 변환
  // 3. Blob 반환
}

// components/reports/ShareCard.tsx
// SNS 공유에 최적화된 카드 디자인 (1080x1080)
```

#### 17.5.2 공유 옵션

```tsx
// components/reports/ShareButtons.tsx
interface ShareButtonsProps {
  reportType: 'weekly' | 'monthly';
  reportData: WeeklyReportData | MonthlyReportData;
}

// 공유 옵션:
// 1. 이미지 저장 (갤러리)
// 2. 인스타그램 스토리
// 3. 카카오톡 공유
// 4. 링크 복사
```

### 17.6 예상 작업량

| 항목     | 세부 내용          | 예상 시간  |
| -------- | ------------------ | ---------- |
| 17.2     | 주간 리포트 콘텐츠 | 5시간      |
| 17.3     | 월간 리포트 콘텐츠 | 5시간      |
| 17.4     | 시각화 차트 시스템 | 4시간      |
| 17.5     | 공유 기능          | 2시간      |
| 테스트   | 단위/통합 테스트   | 2시간      |
| **합계** |                    | **18시간** |

---

## Part 18: 고도화 로드맵 통합

> Part 15-17을 기존 구현 로드맵에 통합

### 18.1 전체 구현 로드맵 (갱신)

| Phase       | 기존 항목   | 추가 항목              | 총 예상 시간 |
| ----------- | ----------- | ---------------------- | ------------ |
| Phase 1     | 기반 안정화 | -                      | 5시간        |
| Phase 2     | UI/UX 통합  | -                      | 15시간       |
| Phase 3     | 기능 완성   | -                      | 15시간       |
| Phase 4     | 품질 보증   | -                      | 15시간       |
| **Phase 5** | -           | **W-1/N-1 고도화**     | **20시간**   |
| **Phase 6** | -           | **Products 전면 개편** | **20시간**   |
| **Phase 7** | -           | **Reports 콘텐츠**     | **18시간**   |

**총 예상 시간: ~108시간** (기존 50시간 + 신규 58시간)

### 18.2 우선순위 권장

```
[즉시] Phase 1 → [병렬] Phase 2+3 → [마무리] Phase 4
                        ↓
[수익화] Phase 6 (Products) → [리텐션] Phase 7 (Reports)
                        ↓
[완성도] Phase 5 (W-1/N-1)
```

**권장 순서**:

1. Phase 6 (Products) - 수익화 직결, UX 결함 심각
2. Phase 7 (Reports) - 사용자 리텐션, 콘텐츠 부재
3. Phase 5 (W-1/N-1) - 기능 완성도 향상

### 18.3 마이그레이션 추가 예정

```
☐ 20260118_workout_library.sql       # 운동 라이브러리 테이블
☐ 20260119_product_compare.sql       # 제품 비교 저장
☐ 20260120_report_cache.sql          # 리포트 캐시 테이블
☐ 20260121_outfit_recommendations.sql # 코디 추천 캐시
```

---

## Part 19: Fashion/Closet 모듈 고도화

> 패션/옷장 모듈의 완성형 구현 가이드
>
> 참조: [Baymard Institute Product Page UX 2025](https://baymard.com/blog/current-state-ecommerce-product-page-ux), [Fitness App UI Design](https://stormotion.io/blog/fitness-app-ux/)

### 19.1 현재 상태 분석

#### 19.1.1 구현 완료 (15개 페이지)

**Closet 모듈 (10개 페이지)**:

- ✅ 옷장 메인 (`closet/page.tsx`) - 그리드, 검색, 필터
- ✅ 옷 추가 (`closet/add/page.tsx`)
- ✅ 옷 상세/편집 (`closet/[id]/`, `closet/[id]/edit/`)
- ✅ 코디 목록 (`closet/outfits/`)
- ✅ 코디 상세/편집/생성 (`closet/outfits/[id]/`, `new/`)
- ✅ 코디 추천 (`closet/recommend/`)

**Style 모듈 (5개 페이지)**:

- ✅ 스타일 메인 (`style/page.tsx`)
- ✅ 날씨 기반 스타일 (`style/weather/`)
- ✅ 카테고리별 스타일 (`style/category/[slug]/`)
- ✅ 코디 상세 (`style/outfit/[id]/`)

#### 19.1.2 고도화 필요 Gap

```
1. PC-1/C-1 연동 강화
   - 퍼스널 컬러 기반 색상 추천 미흡
   - 체형 기반 실루엣 추천 미흡

2. AI 기반 코디 생성
   - 현재: 규칙 기반 추천
   - 목표: Gemini AI 기반 창의적 코디

3. 시각적 코디네이션
   - 옷 조합 시뮬레이션 부재
   - 색상 조화 시각화 부재

4. 외부 연동
   - 날씨 API 실시간 연동
   - 일정/캘린더 연동 (TPO)
```

### 19.2 PC-1 ↔ Closet 크로스 모듈 연동

#### 19.2.1 퍼스널 컬러 기반 옷 분류

```tsx
// lib/closet/colorAnalysis.ts
interface ClothingColorAnalysis {
  dominantColor: string; // 주요 색상 (hex)
  colorHarmony: 'excellent' | 'good' | 'neutral' | 'poor';
  seasonMatch: SeasonType[]; // 어울리는 시즌
  recommendedCombinations: string[]; // 추천 조합 색상
}

// 옷 추가 시 자동 색상 분석
async function analyzeClothingColor(imageUrl: string): Promise<ClothingColorAnalysis>;

// 사용자 시즌과 매칭
function getColorMatchScore(clothingColor: string, userSeason: SeasonType): number; // 0-100
```

#### 19.2.2 옷장 UI 개선

```
옷장 메인 페이지 개선:
┌─────────────────────────────────┐
│ 내 옷장          [+추가] [필터]  │
├─────────────────────────────────┤
│ 💜 여름 쿨톤 기반 추천           │
│ "오늘 이 조합 어때요?"          │
│ [추천 코디 카드 3개]             │
├─────────────────────────────────┤
│ 카테고리: [전체] [상의] [하의]... │
│                                  │
│ [옷 카드]  [옷 카드]  [옷 카드]   │
│  💜92%     ⭐즐겨찾기   🔴30%    │ ← 시즌 매칭률
│                                  │
└─────────────────────────────────┘
```

### 19.3 C-1 ↔ Style 크로스 모듈 연동

#### 19.3.1 체형 기반 실루엣 추천

```tsx
// lib/style/bodyTypeRecommendation.ts
interface StyleRecommendation {
  silhouette: 'fitted' | 'loose' | 'a-line' | 'straight';
  emphasizeAreas: string[]; // 강조할 부위
  avoidPatterns: string[]; // 피할 패턴
  recommendedLengths: Record<string, string>; // 부위별 적정 기장
}

// 체형별 스타일 가이드
const BODY_TYPE_STYLE_GUIDE: Record<BodyType, StyleRecommendation>;
```

#### 19.3.2 스타일 추천 UI

```
스타일 메인 페이지:
┌─────────────────────────────────┐
│ 오늘의 스타일 추천               │
├─────────────────────────────────┤
│ 🌤️ 서울 12°C / 맑음             │
│ 📅 화요일 오전 출근              │
├─────────────────────────────────┤
│ 당신의 체형(역삼각형)에 맞는 추천 │
│                                  │
│ [코디 이미지]                    │
│ "하체 볼륨감을 더해주는 코디"    │
│                                  │
│ 💜 컬러 매칭 95%                 │
│ 👔 체형 적합도 88%               │
│                                  │
│ [이 코디로 입기]  [다른 코디 보기]│
└─────────────────────────────────┘
```

### 19.4 AI 코디 생성 (Gemini 연동)

#### 19.4.1 코디 생성 프롬프트

```typescript
// lib/gemini/outfitPrompt.ts
const OUTFIT_GENERATION_PROMPT = `
당신은 퍼스널 스타일리스트입니다.

📊 사용자 정보:
- 퍼스널 컬러: ${userSeason}
- 체형: ${bodyType}
- 오늘 날씨: ${weather}
- TPO: ${occasion}

👕 사용자 옷장:
${closetItems.map((item) => `- ${item.name} (${item.color}, ${item.category})`).join('\n')}

다음 JSON 형식으로 코디 3가지를 추천해주세요:
{
  "outfits": [
    {
      "items": ["item_id_1", "item_id_2", "item_id_3"],
      "reason": "추천 이유",
      "colorHarmony": "색상 조화 설명",
      "stylePoint": "스타일 포인트"
    }
  ]
}
`;
```

#### 19.4.2 코디 시뮬레이션 UI

```
코디 생성 페이지:
┌─────────────────────────────────┐
│ AI 코디 생성                     │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │      [상의 영역]             │ │
│ │         ↓                   │ │
│ │      [하의 영역]             │ │
│ │         ↓                   │ │
│ │      [신발 영역]             │ │
│ └─────────────────────────────┘ │
│                                  │
│ 💜 전체 컬러 조화: 92%           │
│ 👔 체형 적합도: 85%              │
│                                  │
│ [다시 생성]  [이 코디 저장]       │
└─────────────────────────────────┘
```

### 19.5 2026 UX 트렌드 적용

> 참조: [Mobile App Design Trends 2026](https://uxpilot.ai/blogs/mobile-app-design-trends), [E-commerce UX Trends 2026](https://www.optimonk.com/ecommerce-ux-trends/)

#### 19.5.1 Bento Grid 레이아웃

```tsx
// 옷장 메인을 Bento Grid로 재구성
// 기존: 균일한 2열 그리드
// 개선: 비대칭 Bento 레이아웃

<div className="grid grid-cols-4 gap-3">
  {/* 큰 추천 카드 (2x2) */}
  <div className="col-span-2 row-span-2">
    <TodayRecommendation />
  </div>

  {/* 즐겨찾기 (1x1) */}
  <div className="col-span-1">
    <FavoriteItem />
  </div>

  {/* 최근 착용 (1x1) */}
  <div className="col-span-1">
    <RecentWear />
  </div>

  {/* 일반 옷 카드들 */}
  {items.map((item) => (
    <div className="col-span-1">
      <ClothingCard item={item} />
    </div>
  ))}
</div>
```

#### 19.5.2 AR 가상 피팅 (향후 검토)

```
제외 사유: HIGH_COMPLEXITY
재검토 트리거:
- AR 라이브러리 성숙도 향상 시
- 사용자 요청 증가 시
- 경쟁 앱 도입 시

현재 대안:
- 2D 레이어 시뮬레이션
- 색상 조화 시각화
```

### 19.6 예상 작업량

| 항목     | 세부 내용        | 예상 시간  |
| -------- | ---------------- | ---------- |
| 19.2     | PC-1 연동 강화   | 4시간      |
| 19.3     | C-1 연동 강화    | 4시간      |
| 19.4     | AI 코디 생성     | 5시간      |
| 19.5     | UI 트렌드 적용   | 3시간      |
| 테스트   | 단위/통합 테스트 | 2시간      |
| **합계** |                  | **18시간** |

---

## Part 20: 2026 UX 트렌드 반영 체크리스트

> 웹 서치 결과 기반 UX 트렌드 적용 가이드
>
> 참조: [Baymard Institute](https://baymard.com/blog/current-state-ecommerce-product-page-ux), [DesignRush Health Apps](https://www.designrush.com/best-designs/apps/health-wellness), [OptiMonk E-commerce Trends](https://www.optimonk.com/ecommerce-ux-trends/)

### 20.1 E-commerce/Products 트렌드 (Part 16 보완)

| 트렌드                  | 현재 상태      | 적용 방안                    | 우선순위 |
| ----------------------- | -------------- | ---------------------------- | -------- |
| **AR 가상 시착**        | ❌ 미구현      | 메이크업 가상 시착 우선 검토 | P3       |
| **Bento Grid 레이아웃** | ❌ 기존 그리드 | 제품 카드 비대칭 배치        | P2       |
| **실시간 가격 비교**    | ⚠️ 정적 표시   | 크롤러 연동 실시간화         | P1       |
| **AI 개인화 추천**      | ✅ 매칭률 표시 | 추천 이유 상세화             | P2       |
| **접근성 WCAG 2.1 AA**  | ⚠️ 92점        | 95+ 목표 개선                | P1       |
| **Bold Typography**     | ⚠️ 보통        | 가격/CTA 강조                | P2       |

### 20.2 Dashboard/Wellness 트렌드 (Part 15 보완)

| 트렌드                 | 현재 상태   | 적용 방안                    | 우선순위 |
| ---------------------- | ----------- | ---------------------------- | -------- |
| **Adaptive Interface** | ❌ 미구현   | 시간대별 UI 변화 (아침/저녁) | P2       |
| **Wearable 연동**      | ⚠️ 모바일만 | Apple Health/Google Fit 연동 | P2       |
| **Micro-interactions** | ⚠️ 기본     | 목표 달성 시 축하 애니메이션 | P2       |
| **실시간 생체 데이터** | ❌ 미구현   | 심박수/수면 데이터 표시      | P3       |
| **소셜 챌린지**        | ✅ 구현됨   | 리더보드 강화                | P3       |
| **AI 코치 실시간**     | ⚠️ 정적     | 운동 중 실시간 피드백        | P2       |

### 20.3 Reports 트렌드 (Part 17 보완)

| 트렌드                 | 현재 상태 | 적용 방안                | 우선순위 |
| ---------------------- | --------- | ------------------------ | -------- |
| **Glassmorphism**      | ❌ 미적용 | 리포트 카드 배경 블러    | P3       |
| **Bold Numbers**       | ⚠️ 보통   | 핵심 지표 4xl 강조       | P1       |
| **Agentic UX**         | ❌ 미구현 | AI 자동 인사이트 생성    | P1       |
| **SNS 공유 최적화**    | ❌ 기본   | 1080x1080 카드 이미지    | P2       |
| **Progress Animation** | ⚠️ 기본   | 점수 카운트업 애니메이션 | P2       |
| **Bottom Navigation**  | ✅ 구현됨 | -                        | -        |

### 20.4 전체 로드맵 갱신

| Phase       | 항목                      | 예상 시간  |
| ----------- | ------------------------- | ---------- |
| Phase 1     | 기반 안정화               | 5시간      |
| Phase 2     | UI/UX 통합                | 15시간     |
| Phase 3     | 기능 완성                 | 15시간     |
| Phase 4     | 품질 보증                 | 15시간     |
| Phase 5     | W-1/N-1 고도화            | 20시간     |
| Phase 6     | Products 전면 개편        | 20시간     |
| Phase 7     | Reports 콘텐츠            | 18시간     |
| **Phase 8** | **Fashion/Closet 고도화** | **18시간** |

**총 예상 시간: ~126시간** (기존 108시간 + Phase 8 18시간)

---

## 부록: 빠른 참조

### A. 모듈 색상 매핑

| 모듈           | 라이트                           | 기본                         | 다크                            | 그라디언트                   |
| -------------- | -------------------------------- | ---------------------------- | ------------------------------- | ---------------------------- |
| workout        | `bg-module-workout-light`        | `text-module-workout`        | `bg-module-workout-dark`        | `bg-gradient-workout`        |
| nutrition      | `bg-module-nutrition-light`      | `text-module-nutrition`      | `bg-module-nutrition-dark`      | `bg-gradient-nutrition`      |
| skin           | `bg-module-skin-light`           | `text-module-skin`           | `bg-module-skin-dark`           | `bg-gradient-skin`           |
| body           | `bg-module-body-light`           | `text-module-body`           | `bg-module-body-dark`           | `bg-gradient-body`           |
| personal-color | `bg-module-personal-color-light` | `text-module-personal-color` | `bg-module-personal-color-dark` | `bg-gradient-personal-color` |
| face           | `bg-module-face-light`           | `text-module-face`           | `bg-module-face-dark`           | `bg-gradient-face`           |

### B. i18n 키 구조

```json
{
  "common": { "loading", "error", "retry", "cancel", "confirm", "save" },
  "nav": { "home", "workout", "nutrition", "analysis", "profile" },
  "home": { "greeting.morning", "greeting.afternoon", "greeting.evening" },
  "analysis": {
    "personalColor": { "title", "description" },
    "face": { "title", "description" },
    "skin": { "title", "description" },
    "body": { "title", "description" }
  }
}
```

### C. 명령어 빠른 참조

```bash
# 타입 체크
npm run typecheck

# 테스트
npm run test
npm run test -- path/to/file.test.ts

# 마이그레이션
npx supabase db push
npx supabase migration list

# 빌드
npm run build:web
```

---

## 관련 문서

| 문서                                                                                       | 용도                              |
| ------------------------------------------------------------------------------------------ | --------------------------------- |
| [SDD-GLOBAL-DESIGN-SPECIFICATION.md](./SDD-GLOBAL-DESIGN-SPECIFICATION.md)                 | 다민족 지원 + 디자인 시스템       |
| [SDD-PROFESSIONAL-ENHANCEMENT.md](./SDD-PROFESSIONAL-ENHANCEMENT.md)                       | F-1 얼굴형 분석 스펙              |
| [SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md](./SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md) | UI/UX 가이드 + 구현 상세          |
| [SDD-GAP-FIXES.md](./SDD-GAP-FIXES.md)                                                     | UI Gap 수정 사항                  |
| [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)                                                | 오류 사전 (증상별 해결 가이드)    |
| [GLOSSARY.md](../GLOSSARY.md)                                                              | 용어 설명집 (전문 용어 쉬운 설명) |
| [.claude/rules/db-api-sync.md](../../.claude/rules/db-api-sync.md)                         | DB-API 동기화 규칙                |
| [.claude/rules/hybrid-data-pattern.md](../../.claude/rules/hybrid-data-pattern.md)         | Hybrid 데이터 패턴                |

---

## 용어 참조

이 문서에서 사용하는 전문 용어에 대한 설명은 [GLOSSARY.md](../GLOSSARY.md)를 참조하세요.

**자주 사용되는 용어**:

- **RLS (Row Level Security)**: 데이터베이스 행 단위 보안 → 자기 데이터만 접근 가능
- **마이그레이션**: 데이터베이스 구조 변경 명령 파일
- **하드코딩**: 코드에 값을 직접 작성 (변경하려면 코드 수정 필요)
- **디자인 토큰**: 색상, 크기 등을 변수로 정의 (한 곳에서 관리)
- **Fallback**: 원래 방법 실패 시 대안 방법
- **i18n**: 다국어 지원 (Internationalization 약자)

오류 발생 시 [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)에서 증상별 해결 방법을 찾을 수 있습니다.

---

**Document Version**: 1.4
**Created**: 2026-01-13
**Updated**: 2026-01-14
**Author**: Claude Code (Opus 4.5)
**Status**: Active - 구현 진행 중

### 변경 이력

| 버전 | 날짜       | 변경 내용                                                                                                                                    |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4  | 2026-01-14 | 현황 진단 테이블 업데이트 (접근성 P2, 에러 로깅 추가), Part 7.3 접근성 테스트 섹션 추가, Phase 0에 환경변수 검증 항목 추가                   |
| 1.3  | 2026-01-14 | Part 12 (접근성 가이드), Part 13 (산출물 문서 목록) 추가, 폼 상태 관리(RHF+Zod) 섹션, 에러 로깅/모니터링, 환경변수 관리 섹션 추가            |
| 1.2  | 2026-01-13 | Part 9-11 추가 (보안, 성능, 디자인 시스템), Clerk 인증, API 관리, Gemini AI, 상태 관리, 빌드/배포, 레이아웃 상세, 페이지별 UI 상태 섹션 추가 |
| 1.1  | 2026-01-13 | TROUBLESHOOTING.md, GLOSSARY.md 링크 추가, 용어 참조 섹션, 하드코딩 색상 수치 200+ 수정                                                      |
| 1.0  | 2026-01-13 | 초기 버전                                                                                                                                    |
