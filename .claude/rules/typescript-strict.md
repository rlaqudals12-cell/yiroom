# TypeScript Strict 모드 규칙

> 이룸 프로젝트 TypeScript 타입 안전성 가이드
> **제1원칙**: [FIRST-PRINCIPLES.md](../../docs/FIRST-PRINCIPLES.md) 최우선 참조

---

## 1. Strict 모드 설정

### 1.1 현재 tsconfig.json 설정

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true
  }
}
```

### 1.2 strict 플래그 상세

| 플래그                         | 설명                      | 이룸 적용 |
| ------------------------------ | ------------------------- | --------- |
| `noImplicitAny`                | 암시적 any 금지           | ✅ 필수   |
| `strictNullChecks`             | null/undefined 엄격 검사  | ✅ 필수   |
| `strictFunctionTypes`          | 함수 타입 공변성 검사     | ✅ 필수   |
| `strictBindCallApply`          | bind/call/apply 타입 검사 | ✅ 필수   |
| `strictPropertyInitialization` | 클래스 속성 초기화 필수   | ✅ 필수   |
| `noImplicitThis`               | 암시적 this 금지          | ✅ 필수   |
| `useUnknownInCatchVariables`   | catch 변수 unknown 타입   | ✅ 필수   |

---

## 2. any 타입 금지 패턴

### 2.1 any 대신 사용할 타입

| 상황            | 금지                     | 허용                         |
| --------------- | ------------------------ | ---------------------------- |
| 알 수 없는 타입 | `any`                    | `unknown`                    |
| 빈 객체         | `{}`                     | `Record<string, unknown>`    |
| 배열            | `any[]`                  | `unknown[]` 또는 구체적 타입 |
| 함수 인자       | `...args: any[]`         | `...args: unknown[]`         |
| JSON 파싱       | `JSON.parse(str) as any` | 스키마 검증 (Zod)            |

### 2.2 unknown 사용 패턴

```typescript
// ❌ 금지: any 사용
function processData(data: any) {
  return data.name; // 타입 안전하지 않음
}

// ✅ 허용: unknown + 타입 가드
function processData(data: unknown): string {
  if (isUserData(data)) {
    return data.name; // 타입 안전
  }
  throw new Error('Invalid data format');
}

// 타입 가드 정의
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof (data as UserData).name === 'string'
  );
}
```

### 2.3 Zod 스키마 검증 (권장)

```typescript
import { z } from 'zod';

// 스키마 정의
const UserDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

type UserData = z.infer<typeof UserDataSchema>;

// 안전한 파싱
function parseUserData(input: unknown): UserData {
  const result = UserDataSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid data: ${result.error.message}`);
  }
  return result.data;
}
```

### 2.4 허용되는 any 예외

```typescript
// 예외 1: 타입 정의 파일 (.d.ts)에서 외부 라이브러리 타입 확장
declare module 'external-lib' {
  interface Config {
    customOption: any; // 외부 라이브러리 한정
  }
}

// 예외 2: 테스트 코드에서 mock 객체 (최소한으로)
const mockFn = vi.fn() as any; // 테스트 한정, 주석 필수
```

---

## 3. null/undefined 안전 처리

### 3.1 Nullish 처리 패턴

```typescript
// ❌ 금지: 암시적 falsy 체크 (0, '' 등과 혼동)
if (value) {
  // value가 0 또는 '' 일 때 실행 안 됨
}

// ✅ 허용: 명시적 null/undefined 체크
if (value !== null && value !== undefined) {
  // value가 0 또는 '' 일 때도 실행됨
}

// ✅ 더 좋음: Nullish coalescing
const result = value ?? defaultValue;

// ✅ Optional chaining
const name = user?.profile?.name ?? 'Unknown';
```

### 3.2 Non-null Assertion 제한

```typescript
// ❌ 금지: 무분별한 non-null assertion
const element = document.getElementById('app')!;

// ✅ 허용: 타입 가드 후 사용
const element = document.getElementById('app');
if (!element) {
  throw new Error('App element not found');
}
// 이후 element는 HTMLElement 타입

// ✅ 허용: 확실한 초기화 컨텍스트 (React ref 등)
const inputRef = useRef<HTMLInputElement>(null);
// 이벤트 핸들러 내에서 (이미 렌더링됨)
const handleSubmit = () => {
  const value = inputRef.current!.value; // 허용 (주석 필수)
};
```

### 3.3 Optional 프로퍼티 vs undefined 유니온

```typescript
// 프로퍼티 자체가 없을 수 있음
interface UserOptional {
  name: string;
  email?: string; // 프로퍼티 없음 허용
}

// 프로퍼티는 있지만 값이 undefined일 수 있음
interface UserUndefined {
  name: string;
  email: string | undefined; // 프로퍼티 필수, 값은 undefined 가능
}

// 이룸 규칙: API 응답은 optional, 내부 상태는 undefined 유니온
```

---

## 4. 타입 추론 vs 명시적 타입

### 4.1 타입 추론 허용 케이스

```typescript
// ✅ 변수 초기화 시 추론
const count = 0; // number
const items = ['a', 'b']; // string[]
const user = { name: 'Kim', age: 30 }; // { name: string; age: number }

// ✅ 화살표 함수 인라인 콜백
items.map((item) => item.toUpperCase()); // 추론 가능
```

### 4.2 명시적 타입 필수 케이스

```typescript
// ✅ 함수 반환 타입 (필수)
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ 빈 배열/객체 초기화
const users: User[] = [];
const cache: Map<string, CacheEntry> = new Map();

// ✅ 복잡한 타입 추론이 어려운 경우
const result: AnalysisResult = await analyzeImage(imageData);

// ✅ 공개 API/인터페이스
export interface SkinAnalysisInput {
  imageBase64: string;
  options?: AnalysisOptions;
}
```

### 4.3 const assertion

```typescript
// 리터럴 타입 보존
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
type Season = (typeof SEASONS)[number]; // 'spring' | 'summer' | 'autumn' | 'winter'

// 객체 리터럴
const CONFIG = {
  timeout: 3000,
  maxRetries: 2,
} as const;
// typeof CONFIG = { readonly timeout: 3000; readonly maxRetries: 2 }
```

---

## 5. 제네릭 사용 가이드

### 5.1 제네릭 네이밍 규칙

| 관례              | 용도        | 예시                              |
| ----------------- | ----------- | --------------------------------- |
| `T`               | 일반 타입   | `function identity<T>(arg: T): T` |
| `K`               | 키 타입     | `K extends keyof T`               |
| `V`               | 값 타입     | `Map<K, V>`                       |
| `E`               | 요소 타입   | `Array<E>`                        |
| `R`               | 반환 타입   | `Promise<R>`                      |
| `TData`, `TError` | 의미 명확화 | `useQuery<TData, TError>()`       |

### 5.2 제네릭 제약 (Constraints)

```typescript
// ❌ 너무 광범위
function getProperty<T>(obj: T, key: string) {
  return obj[key]; // 에러: T[string] 불가
}

// ✅ 적절한 제약
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ 인터페이스 제약
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}
```

### 5.3 조건부 타입 (Conditional Types)

```typescript
// 기본 패턴
type IsArray<T> = T extends any[] ? true : false;

// 분산 조건부 타입
type NonNullable<T> = T extends null | undefined ? never : T;

// infer 키워드
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// 이룸 예시: API 응답 타입 추출
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type ExtractData<T> = T extends ApiResponse<infer D> ? D : never;
```

---

## 6. 유틸리티 타입 활용

### 6.1 내장 유틸리티 타입

```typescript
// Partial: 모든 프로퍼티 optional
type PartialUser = Partial<User>;

// Required: 모든 프로퍼티 required
type RequiredConfig = Required<Config>;

// Pick: 특정 프로퍼티만 선택
type UserBasic = Pick<User, 'id' | 'name'>;

// Omit: 특정 프로퍼티 제외
type UserWithoutPassword = Omit<User, 'password'>;

// Record: 키-값 매핑
type SeasonColors = Record<Season, string>;

// Exclude/Extract: 유니온 타입 조작
type NonNullString = Exclude<string | null | undefined, null | undefined>;
```

### 6.2 커스텀 유틸리티 타입 (이룸)

```typescript
// DeepPartial: 중첩 객체도 optional
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Nullable: null 허용
type Nullable<T> = T | null;

// AsyncReturnType: 비동기 함수 반환 타입 추출
type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;

// StrictOmit: 존재하는 키만 Omit 가능
type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

---

## 7. 타입 가드 패턴

### 7.1 typeof 가드

```typescript
function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}
```

### 7.2 in 연산자 가드

```typescript
interface Dog {
  bark(): void;
}

interface Cat {
  meow(): void;
}

function makeSound(animal: Dog | Cat) {
  if ('bark' in animal) {
    animal.bark(); // Dog
  } else {
    animal.meow(); // Cat
  }
}
```

### 7.3 커스텀 타입 가드

```typescript
// is 키워드 사용
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// 복잡한 객체 타입 가드
interface SkinAnalysisResult {
  skinType: string;
  scores: Record<string, number>;
  recommendations: string[];
}

function isSkinAnalysisResult(data: unknown): data is SkinAnalysisResult {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.skinType === 'string' &&
    typeof obj.scores === 'object' &&
    obj.scores !== null &&
    Array.isArray(obj.recommendations) &&
    obj.recommendations.every((r) => typeof r === 'string')
  );
}
```

### 7.4 Assertion 함수

```typescript
// asserts 키워드
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

// 사용
function processInput(input: unknown) {
  assertIsString(input);
  // 이후 input은 string 타입
  return input.toUpperCase();
}
```

---

## 8. 이룸 프로젝트 특화 패턴

### 8.1 API 응답 타입

```typescript
// 표준 API 응답 타입
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 타입 가드
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}
```

### 8.2 분석 결과 타입

```typescript
// 기본 분석 결과 인터페이스
export interface BaseAnalysisResult {
  id: string;
  createdAt: string;
  confidence: number;
  usedFallback: boolean;
}

// 모듈별 확장
export interface SkinAnalysisResult extends BaseAnalysisResult {
  type: 'skin';
  skinType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  scores: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
    wrinkles: number;
  };
}

export interface PersonalColorResult extends BaseAnalysisResult {
  type: 'personal-color';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  subType: 'light' | 'true' | 'dark' | 'bright' | 'muted';
  colorPalette: string[];
}

// 유니온 타입
export type AnalysisResult = SkinAnalysisResult | PersonalColorResult;

// 판별 유니온 (Discriminated Union) 가드
export function isSkinAnalysis(result: AnalysisResult): result is SkinAnalysisResult {
  return result.type === 'skin';
}
```

### 8.3 Supabase 타입 통합

```typescript
// Database 타입 자동 생성 (supabase gen types)
import { Database } from '@/types/database.types';

// 테이블 타입 추출
type Tables = Database['public']['Tables'];
type UserRow = Tables['users']['Row'];
type UserInsert = Tables['users']['Insert'];
type UserUpdate = Tables['users']['Update'];

// 관계 타입 포함
type SkinAssessmentWithUser = Tables['skin_assessments']['Row'] & {
  user: UserRow;
};
```

### 8.4 React 컴포넌트 Props 타입

```typescript
// 기본 Props 패턴
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// children 명시
interface CardProps {
  title: string;
  children: React.ReactNode;
}

// 제네릭 컴포넌트
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}
```

---

## 9. 금지 패턴 모음

### 9.1 절대 금지

```typescript
// ❌ any 남용
const data: any = fetchData();

// ❌ 타입 단언 남용
const user = data as User; // 검증 없이

// ❌ non-null assertion 남용
const value = obj.prop!.nested!.value!;

// ❌ @ts-ignore / @ts-expect-error 남용
// @ts-ignore
brokenCode();

// ❌ 빈 인터페이스
interface Empty {} // 대신 Record<string, never> 또는 object

// ❌ Function 타입
const fn: Function = () => {}; // 대신 구체적 시그니처
```

### 9.2 조건부 허용 (주석 필수)

```typescript
// ⚠️ 외부 라이브러리 타입 누락 시
// @ts-expect-error - 타입 정의 없음 (이슈: #123)
import { unstableFn } from 'untyped-lib';

// ⚠️ 테스트 mock
// 테스트 전용: 타입 안전성보다 테스트 용이성 우선
const mockFn = vi.fn() as unknown as typeof originalFn;
```

---

## 10. ESLint 규칙 연동

### 10.1 typescript-eslint 권장 규칙

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  },
];
```

### 10.2 규칙 예외 처리

```typescript
// 파일 단위 예외 (최상단)
/* eslint-disable @typescript-eslint/no-explicit-any */

// 라인 단위 예외 (이유 명시 필수)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 외부 API 타입 미정의
const externalData: any = response.data;
```

---

## 11. PR 머지 체크리스트

### 11.1 타입 안전성 검증

```markdown
## TypeScript 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] any 타입 사용 없음 (또는 정당한 사유 주석)
- [ ] 함수 반환 타입 명시
- [ ] null/undefined 안전 처리
- [ ] 타입 가드 적절히 사용
- [ ] @ts-ignore 없음 (또는 이슈 링크)
```

### 11.2 자동화 명령어

```bash
# 타입 체크
npm run typecheck

# strict 모드 검증 (tsconfig.json strict: true 확인)
grep -q '"strict": true' tsconfig.json && echo "Strict mode enabled"

# any 사용 검색
grep -r "any" --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".d.ts"
```

---

## 12. 참고 자료

- [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [typescript-eslint Rules](https://typescript-eslint.io/rules/)
- [Zod Documentation](https://zod.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**Version**: 1.0 | **Updated**: 2026-01-20
**관련 규칙**: [code-style.md](./code-style.md), [react-patterns.md](./react-patterns.md)
**관련 원칙**: P4 (단순화) - 타입으로 런타임 에러 방지
