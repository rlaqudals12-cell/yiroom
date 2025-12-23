# 이룸 프로젝트 구조

> 디렉토리 및 파일 배치 규칙

## 모노레포 구조

```
yiroom/
├── apps/
│   ├── web/              # Next.js 웹 앱
│   └── mobile/           # Expo React Native 앱
├── packages/
│   └── shared/           # 공통 타입/유틸리티
├── docs/                 # 설계 문서
└── turbo.json            # Turborepo 설정
```

## apps/web/ 구조

### app/ (App Router)
```
app/
├── (main)/               # 메인 레이아웃 그룹
│   ├── analysis/         # Phase 1 분석
│   │   ├── personal-color/
│   │   ├── skin/
│   │   └── body/
│   ├── workout/          # W-1 운동
│   ├── nutrition/        # N-1 영양
│   ├── products/         # 제품 추천
│   ├── dashboard/        # 대시보드
│   └── settings/         # 설정
├── api/                  # API 라우트
└── layout.tsx            # 루트 레이아웃
```

### components/
```
components/
├── ui/                   # shadcn/ui 기본 컴포넌트
├── common/               # 공통 컴포넌트
├── workout/              # 운동 모듈 전용
│   ├── common/           # 공통 (ProgressIndicator, SelectionCard)
│   ├── result/           # 결과 화면
│   ├── detail/           # 상세 화면
│   └── onboarding/       # 온보딩
├── nutrition/            # 영양 모듈 전용
├── products/             # 제품 추천
│   ├── detail/           # 상세 페이지
│   ├── reviews/          # 리뷰
│   └── interactions/     # 성분 상호작용
├── reports/              # 리포트
├── analysis/             # 분석 결과
└── checkin/              # 일일 체크인
```

### lib/ (비즈니스 로직)
```
lib/
├── supabase/             # DB 클라이언트 (DIP 적용)
├── api/                  # API 래퍼 (Repository 패턴)
├── stores/               # Zustand 스토어
├── mock/                 # Mock 데이터/Fallback
├── products/             # 제품 Repository
│   ├── repositories/     # 도메인별 CRUD
│   ├── services/         # 비즈니스 서비스
│   └── index.ts          # 통합 export
├── workout/              # 운동 유틸리티
├── nutrition/            # 영양 유틸리티
├── reports/              # 리포트 집계
├── rag/                  # RAG 시스템
└── gemini.ts             # AI 분석
```

### 기타
```
data/                     # JSON 데이터 (운동, 연예인)
hooks/                    # Custom React Hooks
types/                    # 타입 정의
tests/                    # 테스트 파일
public/                   # 정적 파일
supabase/migrations/      # DB 마이그레이션
```

## 파일 생성 규칙

### 새 컴포넌트 추가 시
1. 해당 모듈 폴더에 생성
2. 테스트 파일 동반 생성 (`tests/components/`)
3. 모듈 `index.ts`에 export 추가

```tsx
// components/workout/result/NewCard.tsx
export function NewCard() { ... }

// components/workout/result/index.ts
export * from './NewCard';

// tests/components/workout/result/NewCard.test.tsx
describe('NewCard', () => { ... });
```

### 새 API 라우트 추가 시
1. `app/api/` 폴더에 생성
2. 테스트 파일 동반 생성 (`tests/api/`)
3. 타입은 `types/` 또는 라우트 파일 내 정의

### 새 lib 유틸리티 추가 시
1. 관련 모듈 폴더에 생성
2. 테스트 파일 동반 생성 (`tests/lib/`)
3. 필요시 `index.ts`로 re-export

## 모듈별 색상 변수

```css
/* Tailwind CSS */
--module-workout   /* 운동 모듈 */
--module-nutrition /* 영양 모듈 */
--module-skin      /* 피부 분석 */
--module-body      /* 체형 분석 */
```
