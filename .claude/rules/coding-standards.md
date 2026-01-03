# 이룸 코딩 표준

> Claude Code가 코드 작성 시 참조하는 규칙

## 핵심 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 `typecheck + lint + test` 통과 필수

## 코드 스타일

### 모듈 시스템

- ES Modules 전용 (CommonJS 금지)
- `import/export` 사용

### 네이밍 규칙

| 대상            | 규칙             | 예시                      |
| --------------- | ---------------- | ------------------------- |
| 컴포넌트        | PascalCase       | `UserProfile.tsx`         |
| 함수/변수       | camelCase        | `getUserById`             |
| 상수            | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`         |
| 타입/인터페이스 | PascalCase       | `UserData`, `ApiResponse` |

### 파일 구조

- 파일당 하나의 `export default`
- 관련 타입은 같은 파일 또는 `types/` 디렉토리
- 테스트는 `tests/` 디렉토리, `*.test.ts(x)` 패턴

### 주석

- 한국어 주석 필수 (복잡한 로직 위에 "왜" 설명)
- JSDoc은 공개 API에만 사용

```typescript
// 좋은 예: "왜"를 설명
// 3회 실패 시 fallback - 네트워크 불안정 대응
const MAX_RETRY = 3;

// 나쁜 예: "무엇"만 설명
// 최대 재시도 횟수
const MAX_RETRY = 3;
```

## React/Next.js 규칙

### 컴포넌트

- 함수형 컴포넌트 + Hooks 사용
- `'use client'` 지시어는 필요한 경우에만
- 최상위 컨테이너에 `data-testid` 속성 필수

```tsx
// 좋은 예
export default function UserCard({ user }: UserCardProps) {
  return <div data-testid="user-card">{/* ... */}</div>;
}
```

### 상태 관리

- 로컬 상태: `useState`, `useReducer`
- 다단계 폼: Zustand (`lib/stores/`)
- 서버 상태: React Query 또는 직접 fetch

### 커스텀 훅 사용 (hooks/)

새 기능 구현 시 기존 훅 우선 활용:

| 훅                  | 용도                         | 사용 예시          |
| ------------------- | ---------------------------- | ------------------ |
| `useUserMatching`   | 사용자 프로필 기반 제품 매칭 | 뷰티/스타일 페이지 |
| `useBeautyProducts` | 화장품 목록 조회 + 매칭률    | 카테고리 페이지    |
| `useDebounce`       | 입력 디바운싱 (300ms)        | 검색 페이지        |
| `useInfiniteScroll` | 무한 스크롤                  | 제품 목록 페이지   |

```typescript
// 좋은 예: 기존 훅 활용
const { hasAnalysis, calculateProductMatch } = useUserMatching();
const matchRate = hasAnalysis ? calculateProductMatch(product) : 75;

// 나쁜 예: 직접 분석 데이터 조회 (중복 코드)
const { data } = await supabase.from('skin_analyses').select('*')...
```

**훅 적용 기준**:

- 제품 매칭률 필요 → `useUserMatching`
- 검색/필터 입력 → `useDebounce`
- 20개 이상 목록 → `useInfiniteScroll`

### Dynamic Import

무거운 컴포넌트는 `next/dynamic`으로 지연 로딩:

```typescript
// default export
export const ChartDynamic = dynamic(() => import('./Chart'), { ssr: false, loading: () => null });

// named export
export const FiltersDynamic = dynamic(
  () => import('./Filters').then((mod) => ({ default: mod.Filters })),
  { ssr: false, loading: () => null }
);
```

## Supabase 규칙

### 클라이언트 선택

| 컨텍스트             | 함수                          | 파일              |
| -------------------- | ----------------------------- | ----------------- |
| Client Component     | `useClerkSupabaseClient()`    | `clerk-client.ts` |
| Server Component/API | `createClerkSupabaseClient()` | `server.ts`       |
| 관리자 (RLS 우회)    | `createServiceRoleClient()`   | `service-role.ts` |

### RLS 정책

- 모든 테이블에 `clerk_user_id` 기반 RLS 필수
- `auth.jwt() ->> 'sub'`로 사용자 확인

## 테스트 규칙

### 필수 사항

- 모든 변경 후 `npm run test` 통과
- 새 함수 추가 시 테스트 동반 작성
- 커버리지 유지 (현재 2,686개 테스트)

### 테스트 구조

```
tests/
├── components/     # 컴포넌트 테스트
├── lib/            # 유틸리티 테스트
├── api/            # API 라우트 테스트
├── pages/          # 페이지 테스트
└── integration/    # 통합 테스트
```

## Git 커밋 규칙

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### 타입

| 타입     | 설명             |
| -------- | ---------------- |
| feat     | 새 기능          |
| fix      | 버그 수정        |
| docs     | 문서 변경        |
| chore    | 빌드/설정 변경   |
| refactor | 리팩토링         |
| test     | 테스트 추가/수정 |

### 스코프 예시

- `workout`, `nutrition`, `products`, `dashboard`
- `db`, `auth`, `ui`, `a11y`

## 금지 사항

1. **보안**
   - `.env` 파일 커밋 금지
   - 하드코딩된 API 키 금지
   - `--no-verify` 플래그 사용 금지

2. **코드 품질**
   - `any` 타입 사용 최소화
   - `console.log` 프로덕션 코드에 남기기 금지
   - 미사용 import/변수 금지

3. **UI**
   - 사용자 요청 없이 이모지 추가 금지
   - README/문서 무단 생성 금지
   - 과도한 주석 금지

## 접근성 (a11y)

- Dialog에 `DialogDescription` 필수 (VisuallyHidden 사용 가능)
- 이미지에 `alt` 속성 필수
- 버튼/링크에 명확한 라벨

```tsx
// 좋은 예
<DialogHeader>
  <DialogTitle>제목</DialogTitle>
  <VisuallyHidden asChild>
    <DialogDescription>설명</DialogDescription>
  </VisuallyHidden>
</DialogHeader>
```
