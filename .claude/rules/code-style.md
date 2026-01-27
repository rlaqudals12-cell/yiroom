# 코드 스타일 규칙

> 모든 파일에 적용되는 범용 규칙
> **제1원칙**: [FIRST-PRINCIPLES.md](../../docs/FIRST-PRINCIPLES.md) 최우선 참조

---

## 3대 개발 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지 → `docs/` 확인
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 `typecheck + lint + test` 통과 필수

---

## TypeScript

- ES Modules 전용 (CommonJS 금지)
- `any` 타입 사용 최소화 → `unknown` 또는 구체적 타입
- 함수는 반드시 명시적 반환 타입 선언

## 네이밍

### 기본 규칙

| 대상            | 규칙              | 예시                       |
| --------------- | ----------------- | -------------------------- |
| 컴포넌트        | PascalCase        | `UserProfile.tsx`          |
| 함수/변수       | camelCase         | `getUserById`              |
| 상수            | UPPER_SNAKE_CASE  | `MAX_RETRY_COUNT`          |
| 타입/인터페이스 | PascalCase        | `UserData`, `IUserService` |
| 열거형          | PascalCase (값도) | `Season.Spring`            |
| 훅              | use 접두사        | `useUserProfile`           |
| 컨텍스트        | Context 접미사    | `AuthContext`              |
| 유틸리티        | 동사+명사         | `formatDate`, `parseJson`  |

### 파일 명명 규칙

| 파일 유형      | 규칙            | 예시                            |
| -------------- | --------------- | ------------------------------- |
| React 컴포넌트 | PascalCase.tsx  | `WorkoutCard.tsx`               |
| 훅             | use\*.ts        | `useWorkoutPlan.ts`             |
| 유틸리티       | kebab-case.ts   | `date-utils.ts`                 |
| 타입 정의      | \*.types.ts     | `workout.types.ts`              |
| 상수           | \*.constants.ts | `api.constants.ts`              |
| API 라우트     | route.ts        | `app/api/analyze/route.ts`      |
| 페이지         | page.tsx        | `app/(main)/dashboard/page.tsx` |
| 레이아웃       | layout.tsx      | `app/(main)/layout.tsx`         |
| 테스트         | \*.test.ts(x)   | `WorkoutCard.test.tsx`          |
| 스토리         | \*.stories.tsx  | `WorkoutCard.stories.tsx`       |

### 디렉토리 명명 규칙

| 디렉토리      | 규칙         | 예시                         |
| ------------- | ------------ | ---------------------------- |
| 컴포넌트 폴더 | kebab-case   | `components/workout-card/`   |
| 라우트 그룹   | (group-name) | `app/(main)/`, `app/(auth)/` |
| 동적 라우트   | [param]      | `app/analysis/[id]/`         |
| Catch-all     | [...slug]    | `app/docs/[...slug]/`        |
| Private 폴더  | \_folder     | `app/_components/`           |

## 파일/폴더 구조

### 표준 디렉토리 구조

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (main)/             # 메인 레이아웃 그룹
│   ├── (auth)/             # 인증 레이아웃 그룹
│   ├── api/                # API 라우트
│   └── globals.css
├── components/             # 재사용 컴포넌트
│   ├── analysis/           # 분석 관련
│   ├── common/             # 공통 UI
│   ├── ui/                 # shadcn/ui 기본
│   └── providers/          # 컨텍스트 프로바이더
├── hooks/                  # 커스텀 훅
├── lib/                    # 비즈니스 로직
│   ├── analysis/           # 분석 모듈
│   ├── supabase/           # DB 클라이언트
│   ├── gemini/             # AI 클라이언트
│   └── utils/              # 유틸리티
├── types/                  # 타입 정의
└── tests/                  # 테스트
    ├── components/
    ├── lib/
    └── api/
```

### 파일당 책임 원칙

- 파일당 하나의 `export default`
- 관련 타입은 같은 파일 또는 `types/`
- 테스트는 `tests/` 디렉토리, `*.test.ts(x)`
- 컴포넌트당 최대 300줄 (초과 시 분리)

## Import 순서 규칙

```typescript
// 1. React/Next.js 핵심
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. 외부 라이브러리 (알파벳 순)
import { clsx } from 'clsx';
import { z } from 'zod';

// 3. 내부 모듈 - 절대 경로 (@/)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils/date';

// 4. 내부 모듈 - 상대 경로 (같은 기능 그룹)
import { WorkoutCard } from './WorkoutCard';
import type { WorkoutProps } from './types';

// 5. 스타일/에셋
import './styles.css';
```

### Import 규칙

```typescript
// ✅ 허용: named import
import { Button, Input } from '@/components/ui';

// ✅ 허용: type import (타입만 import 시)
import type { User, Session } from '@/types';

// ✅ 허용: default + named 혼합
import React, { useState, useEffect } from 'react';

// ❌ 금지: namespace import (트리쉐이킹 방해)
import * as Utils from '@/lib/utils';

// ❌ 금지: 순환 import
// A.ts에서 B.ts import, B.ts에서 A.ts import
```

## 주석

- 한국어 필수 (복잡한 로직 위에 "왜" 설명)
- JSDoc은 공개 API에만

```typescript
// 좋은 예: "왜"를 설명
// 3회 실패 시 fallback - 네트워크 불안정 대응
const MAX_RETRY = 3;
```

## 금지 사항

### 보안

- `.env` 파일 커밋 금지
- 하드코딩된 API 키 금지
- `--no-verify` 플래그 금지

### 코드 품질

- `console.log` 프로덕션 코드 금지
- 미사용 import/변수 금지

### UI

- 사용자 요청 없이 이모지 추가 금지
- README/문서 무단 생성 금지

---

## AI 코드 리뷰 체크리스트

### 보안 (OWASP Top 10)

- [ ] SQL Injection: 직접 문자열 연결 없음
- [ ] XSS: `dangerouslySetInnerHTML` 미사용
- [ ] 인증: `auth.protect()` 확인
- [ ] 민감 데이터: `NEXT_PUBLIC_` 아닌지 확인
- [ ] Rate Limiting: 외부 API 제한 있는지

### 아키텍처 일관성

- [ ] Repository 패턴 (lib/api/, lib/products/)
- [ ] Supabase 클라이언트 올바른 함수
- [ ] 컴포넌트 위치 기존 구조 일치
- [ ] 타입 정의 위치 올바름

### 테스트

- AI 생성 코드는 **반드시** 테스트 동반
- 모든 새 함수에 최소 1개 테스트
- 테스트 구조:
  ```
  tests/
  ├── components/     # 컴포넌트 테스트
  ├── lib/            # 유틸리티 테스트
  ├── api/            # API 라우트 테스트
  └── integration/    # 통합 테스트
  ```

### 에러 핸들링

```typescript
// 좋은 예
const { data, error } = await supabase.from('users').select('*');
if (error) {
  console.error('[Module] Error:', error);
  throw new Error('사용자 정보를 불러올 수 없습니다.');
}
```

---

## 코드 포맷팅 규칙

### Prettier 설정

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### 공백 규칙

```typescript
// ✅ 좋은 예: 연산자 주변 공백
const total = price + tax;
const isValid = count > 0 && count < 100;

// ✅ 좋은 예: 콤마 뒤 공백
const items = [a, b, c];
function fn(a: string, b: number): void {}

// ✅ 좋은 예: 중괄호 주변 공백
import { useState } from 'react';
const obj = { name: 'Kim', age: 30 };

// ❌ 나쁜 예: 불필요한 공백
const total = price + tax;
const items = [a, b, c];
```

### 줄바꿈 규칙

```typescript
// ✅ 함수 인자가 3개 이상이면 줄바꿈
function createUser(name: string, email: string, age: number, address: string): User {
  // ...
}

// ✅ 체이닝이 길면 줄바꿈
const result = items
  .filter((item) => item.active)
  .map((item) => item.name)
  .sort();
```

---

**Version**: 2.0 | **Updated**: 2026-01-20 | 파일 명명 규칙, Import 순서, 포맷팅 규칙 추가
**관련 규칙**: [typescript-strict.md](./typescript-strict.md)
