# .claude/rules/ 구조 가이드

> 12개+ 규칙 파일을 4-6개로 최적화하는 방법

---

## 권장 폴더 구조

```
.claude/
└── rules/
    ├── _index.md              # (선택) 규칙 개요 문서
    ├── code-style.md          # 범용 - 항상 로딩
    ├── git-workflow.md        # 범용 - 항상 로딩
    ├── react-patterns.md      # .tsx 파일에서만 로딩
    ├── nextjs-conventions.md  # apps/web/ 에서만 로딩
    ├── expo-mobile.md         # apps/mobile/ 에서만 로딩
    └── supabase-db.md         # DB 관련 파일에서만 로딩
```

---

## 템플릿 파일들

### 1. code-style.md (범용 - paths 없음)

```markdown
# Code Style Rules

이 규칙은 모든 파일에 적용됩니다.

## TypeScript
- `any` 대신 `unknown` 또는 구체적 타입 사용
- 함수는 반드시 명시적 반환 타입 선언
- interface보다 type 선호 (union 유연성)

## 네이밍
- 변수/함수: camelCase
- 컴포넌트/클래스: PascalCase
- 상수: SCREAMING_SNAKE_CASE
- 파일: 컴포넌트는 PascalCase, 나머지는 camelCase

## 포매팅
- 들여쓰기: 2 spaces
- 세미콜론: 생략 (Prettier 설정)
- 따옴표: 작은따옴표 (')
- 줄 길이: 100자 이하

## 주석
- 복잡한 로직에만 주석 작성
- TODO는 이슈 번호와 함께: `// TODO(#123): 설명`
- JSDoc은 공개 API에만 사용
```

---

### 2. git-workflow.md (범용 - paths 없음)

```markdown
# Git Workflow Rules

## 브랜치 전략
- main: 프로덕션 배포 브랜치
- develop: 개발 통합 브랜치 (선택)
- feature/*: 기능 개발
- fix/*: 버그 수정
- refactor/*: 리팩토링

## 커밋 메시지
Conventional Commits 형식 사용:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- feat: 새 기능
- fix: 버그 수정
- docs: 문서 변경
- style: 포매팅 (코드 변경 없음)
- refactor: 리팩토링
- test: 테스트 추가/수정
- chore: 빌드, 설정 변경

### Examples
```
feat(auth): Clerk OAuth 로그인 추가
fix(api): 429 에러 재시도 로직 수정
docs(claude): Supabase 규칙 rules/로 분리
```

## PR 체크리스트
- [ ] lint, typecheck 통과
- [ ] 관련 테스트 추가/수정
- [ ] CLAUDE.md 업데이트 (필요시)
```

---

### 3. react-patterns.md (조건부 로딩)

```markdown
---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/components/**"
---
# React 19 Patterns

## 컴포넌트 구조
```tsx
// 1. imports
// 2. types
// 3. constants
// 4. component
// 5. sub-components (필요시)
```

## 서버 vs 클라이언트 컴포넌트
- 기본값: 서버 컴포넌트
- `'use client'`는 필요한 경우에만 (이벤트, 훅 사용 시)
- 클라이언트 경계는 최대한 작게 유지

## 훅 규칙
- 커스텀 훅은 `use` 접두사 필수
- 훅은 컴포넌트 최상위에서만 호출
- 조건부 훅 호출 금지

## Props 패턴
```tsx
// ✅ Good: 명시적 타입
type ButtonProps = {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
};

// ❌ Bad: any 또는 암시적 타입
const Button = (props: any) => ...
```

## 상태 관리
- 로컬 상태: useState
- 복잡한 로컬 상태: useReducer
- 서버 상태: TanStack Query
- 전역 상태: Zustand (최소화)
```

---

### 4. nextjs-conventions.md (조건부 로딩)

```markdown
---
paths:
  - "apps/web/**"
  - "**/app/**"
---
# Next.js 16 Conventions

## App Router 구조
```
app/
├── (auth)/           # 그룹 라우트 (URL에 미반영)
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx    # 공유 레이아웃
│   └── page.tsx
├── api/              # API Routes (웹훅용)
├── layout.tsx        # 루트 레이아웃
└── page.tsx          # 홈페이지
```

## 파일 컨벤션
- `page.tsx`: 라우트 페이지
- `layout.tsx`: 공유 레이아웃
- `loading.tsx`: 로딩 UI
- `error.tsx`: 에러 바운더리
- `not-found.tsx`: 404 페이지

## 데이터 페칭
```tsx
// 서버 컴포넌트에서 직접 페칭
async function Page() {
  const data = await fetchData(); // 캐시됨
  return <Component data={data} />;
}

// 동적 데이터
export const dynamic = 'force-dynamic';
// 또는
export const revalidate = 60; // 60초마다 재검증
```

## Server Actions
```tsx
'use server';

export async function createPost(formData: FormData) {
  // Zod 검증 필수
  const validated = schema.parse(Object.fromEntries(formData));
  // DB 작업
  await db.insert(posts).values(validated);
  // 캐시 무효화
  revalidatePath('/posts');
}
```

## 메타데이터
```tsx
export const metadata: Metadata = {
  title: '페이지 제목',
  description: '페이지 설명',
};

// 또는 동적 메타데이터
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.id);
  return { title: post.title };
}
```
```

---

### 5. expo-mobile.md (조건부 로딩)

```markdown
---
paths:
  - "apps/mobile/**"
  - "**/native/**"
---
# Expo SDK 54 + React Native Rules

## 프로젝트 구조
```
apps/mobile/
├── app/              # Expo Router 페이지
│   ├── (tabs)/       # 탭 네비게이션
│   ├── _layout.tsx   # 루트 레이아웃
│   └── index.tsx     # 홈
├── components/       # RN 컴포넌트
├── hooks/            # 커스텀 훅
├── constants/        # 색상, 사이즈 등
└── assets/           # 이미지, 폰트
```

## 스타일링
- StyleSheet.create() 사용 (인라인 스타일 지양)
- 테마 상수는 constants/Colors.ts에 정의
- 반응형: useWindowDimensions() 훅 사용

## 네비게이션 (Expo Router)
```tsx
// 타입 안전한 네비게이션
import { Link, router } from 'expo-router';

// 선언적
<Link href="/profile/123">프로필</Link>

// 명령적
router.push('/profile/123');
router.replace('/home');
router.back();
```

## 플랫폼별 코드
```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    // 또는
    ...Platform.select({
      ios: { shadowColor: '#000' },
      android: { elevation: 5 },
    }),
  },
});
```

## 성능 최적화
- FlatList 사용 (ScrollView 대신 긴 목록에)
- 이미지: expo-image 사용 (캐싱 지원)
- 애니메이션: react-native-reanimated 사용
- memo() 적절히 사용
```

---

### 6. supabase-db.md (조건부 로딩)

```markdown
---
paths:
  - "**/supabase/**"
  - "**/database/**"
  - "**/db/**"
  - "**/*supabase*.ts"
  - "**/lib/db*"
---
# Supabase Database Rules

## 클라이언트 사용
```tsx
// 서버 컴포넌트/Server Actions
import { createClient } from '@/lib/supabase/server';

// 클라이언트 컴포넌트 (최소화)
import { createClient } from '@/lib/supabase/client';
```

## 쿼리 패턴
```tsx
// ✅ Good: 필요한 컬럼만 선택
const { data } = await supabase
  .from('posts')
  .select('id, title, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

// ❌ Bad: 전체 선택
const { data } = await supabase.from('posts').select('*');
```

## RLS (Row Level Security)
- 모든 테이블에 RLS 정책 필수
- 새 테이블 생성 시 즉시 RLS 활성화
- 정책 테스트 후 배포

```sql
-- 예시: 사용자 본인 데이터만 접근
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING (auth.uid() = user_id);
```

## 에러 핸들링
```tsx
const { data, error } = await supabase.from('posts').select();

if (error) {
  console.error('Supabase error:', error.message);
  throw new Error('데이터를 불러올 수 없습니다');
}
```

## 마이그레이션
- 스키마 변경은 반드시 마이그레이션 파일로
- `supabase migration new <name>`
- 프로덕션 배포 전 로컬 테스트 필수

## 타입 생성
```bash
# Supabase 타입 자동 생성
pnpm supabase gen types typescript --local > packages/database/types.ts
```
```

---

## 마이그레이션 체크리스트

기존 12개+ 파일에서 6개로 통합 시:

- [ ] 범용 규칙 → `code-style.md`, `git-workflow.md` (paths 없음)
- [ ] React/컴포넌트 규칙 → `react-patterns.md` (paths: `**/*.tsx`)
- [ ] Next.js 규칙 → `nextjs-conventions.md` (paths: `apps/web/**`)
- [ ] React Native 규칙 → `expo-mobile.md` (paths: `apps/mobile/**`)
- [ ] DB 규칙 → `supabase-db.md` (paths: `**/db/**`)
- [ ] 중복 규칙 제거 (린터로 강제 가능한 것)
- [ ] 복잡한 패턴은 `.claude/skills/`로 이동

---

## paths 문법 참고

```yaml
paths:
  - "src/**/*.ts"           # src 하위 모든 .ts 파일
  - "apps/web/**"           # apps/web 하위 모든 파일
  - "**/components/**"      # 어디서든 components 폴더
  - "**/*test*.ts"          # 파일명에 test 포함
  - "!**/node_modules/**"   # 제외 (지원 여부 확인 필요)
```
