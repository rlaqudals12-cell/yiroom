# 이룸 기술 결정

> 기술 선택 기준 및 교체 전략
>
> **핵심 원칙**: "벤더 락인 최소화, 교체 가능한 설계"

---

## 1. 기술 선택 원칙

### 1.1 선택 기준

| 순위 | 기준 | 설명 |
|------|------|------|
| 1 | **교체 가능성** | 다른 기술로 교체 가능해야 함 |
| 2 | **검증된 기술** | 프로덕션 검증된 기술 우선 |
| 3 | **커뮤니티** | 활발한 커뮤니티, 문서화 |
| 4 | **비용 효율** | 무료 → 저비용 → 고비용 순 |
| 5 | **한국 지원** | 한국어, 한국 리전, 결제 |

### 1.2 캡슐 접근법

```
"하나의 기술에 의존하지 않는다"
"항상 대안이 있다"
"교체 비용을 최소화한다"
```

---

## 2. 현재 기술 스택

### 2.1 핵심 스택

| 영역 | 선택 | 대안 | 교체 난이도 |
|------|------|------|------------|
| **프레임워크** | Next.js 16 | Remix, Nuxt | 높음 |
| **런타임** | React 19 | - | - |
| **언어** | TypeScript | - | - |
| **인증** | Clerk | NextAuth, Supabase Auth | 중간 |
| **DB** | Supabase (PostgreSQL) | PlanetScale, Neon | 중간 |
| **AI** | Gemini Flash | GPT-4V, Claude | **낮음** |
| **스토리지** | Supabase Storage | S3, Cloudinary | 낮음 |
| **배포** | Vercel | Netlify, Cloudflare | 낮음 |

### 2.2 보조 스택

| 영역 | 선택 | 대안 |
|------|------|------|
| **스타일링** | Tailwind CSS | styled-components |
| **상태관리** | React Context + React Query | Zustand, Jotai |
| **검증** | Zod | Yup, Valibot |
| **테스트** | Vitest + Playwright | Jest + Cypress |
| **Rate Limit** | @upstash/ratelimit | 자체 구현 |

---

## 3. 기술별 교체 전략

### 3.1 AI 모델 교체 (가장 유연)

#### 현재: Gemini Flash

```typescript
// lib/ai/gemini.ts
export async function analyzeWithGemini(
  image: string,
  prompt: string
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  // ...
}
```

#### 교체 전략: AI Adapter 패턴

```typescript
// lib/ai/adapter.ts
interface AIAdapter {
  analyze(image: string, prompt: string): Promise<AnalysisResult>;
}

class GeminiAdapter implements AIAdapter {
  async analyze(image: string, prompt: string) { /* ... */ }
}

class OpenAIAdapter implements AIAdapter {
  async analyze(image: string, prompt: string) { /* ... */ }
}

class ClaudeAdapter implements AIAdapter {
  async analyze(image: string, prompt: string) { /* ... */ }
}

// 환경변수로 선택
const adapter = createAdapter(process.env.AI_PROVIDER);
```

#### 교체 시나리오

| 상황 | 액션 |
|------|------|
| Gemini 장애 | OpenAI로 Fallback |
| 비용 절감 | 저렴한 모델로 교체 |
| 정확도 향상 | 고성능 모델로 업그레이드 |

### 3.2 인증 교체 (중간 난이도)

#### 현재: Clerk

```typescript
// 현재 사용
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
```

#### 교체 전략: Auth Wrapper

```typescript
// lib/auth/index.ts
export interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

// Clerk 구현
export class ClerkAuthProvider implements AuthProvider {
  async getCurrentUser() {
    const { userId } = await auth();
    return userId ? { id: userId } : null;
  }
}

// NextAuth 구현 (대안)
export class NextAuthProvider implements AuthProvider {
  async getCurrentUser() {
    const session = await getServerSession();
    return session?.user ?? null;
  }
}
```

#### 마이그레이션 체크리스트

- [ ] `clerk_user_id` → `user_id` 마이그레이션
- [ ] RLS 정책 업데이트
- [ ] JWT 클레임 형식 변경
- [ ] 웹훅 엔드포인트 변경

### 3.3 DB 교체 (중간 난이도)

#### 현재: Supabase

```typescript
// 현재 사용
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

#### 교체 전략: Repository 패턴

```typescript
// lib/repositories/user.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
}

// Supabase 구현
export class SupabaseUserRepository implements UserRepository {
  async findById(id: string) {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    return data;
  }
}

// Prisma 구현 (대안)
export class PrismaUserRepository implements UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}
```

#### 데이터 마이그레이션

1. 새 DB 스키마 생성
2. 데이터 동기화 스크립트 작성
3. 읽기를 새 DB로 전환 (듀얼 라이트)
4. 쓰기를 새 DB로 전환
5. 기존 DB 제거

### 3.4 배포 교체 (낮은 난이도)

| From | To | 작업 |
|------|-----|------|
| Vercel | Netlify | `netlify.toml` 추가 |
| Vercel | Cloudflare | `wrangler.toml` 추가 |
| Vercel | Self-hosted | Docker 설정 |

---

## 4. 벤더 락인 분석

### 4.1 락인 위험도

| 기술 | 락인 수준 | 탈출 비용 | 대안 |
|------|----------|----------|------|
| **Next.js** | 높음 | 높음 | Remix, Nuxt |
| **Vercel** | 중간 | 낮음 | Netlify, CF |
| **Clerk** | 중간 | 중간 | NextAuth |
| **Supabase** | 중간 | 중간 | 다른 PostgreSQL |
| **Gemini** | 낮음 | 낮음 | 다른 AI 모델 |

### 4.2 락인 최소화 전략

```
1. 인터페이스 추상화
   → 구체적 구현을 인터페이스 뒤에 숨김

2. 표준 기술 사용
   → PostgreSQL (표준 SQL)
   → REST API (표준 프로토콜)

3. 데이터 이식성
   → 표준 형식으로 export 가능
   → 마이그레이션 스크립트 준비
```

---

## 5. 비용 최적화

### 5.1 현재 비용 구조 (예상)

| 서비스 | 무료 티어 | 예상 비용/월 |
|--------|----------|-------------|
| Vercel | 100GB 대역폭 | $0 (초기) |
| Supabase | 500MB DB | $0 (초기) |
| Clerk | 10,000 MAU | $0 (초기) |
| Gemini | 15 req/분 | $0 (초기) |

### 5.2 확장 시 비용

| 사용자 수 | 예상 비용/월 |
|----------|-------------|
| 1,000 MAU | ~$0 |
| 10,000 MAU | ~$50 |
| 100,000 MAU | ~$500 |

### 5.3 비용 절감 전략

| 전략 | 절감 효과 |
|------|----------|
| 이미지 캐싱 | AI 호출 50% 감소 |
| CDN 사용 | 대역폭 30% 절감 |
| 오프피크 배치 | 비용 20% 절감 |

---

## 6. 기술 부채 관리

### 6.1 현재 기술 부채

| 항목 | 심각도 | 해결 계획 |
|------|--------|----------|
| 환경변수 검증 없음 | 높음 | Phase -1에서 해결 |
| RLS 미완성 | 높음 | Phase -1에서 해결 |
| 타입 불일치 | 중간 | Phase 0에서 해결 |

### 6.2 기술 부채 방지

```
1. 코드 리뷰 필수
2. 테스트 커버리지 80%+
3. 린트/타입체크 CI 통과 필수
4. 문서화 동반
```

---

## 7. 기술 로드맵

### 7.1 단기 (3개월)

- [ ] 환경변수 검증 (t3-env)
- [ ] RLS 정책 완성
- [ ] Rate Limiting 적용
- [ ] 에러 모니터링 (Sentry)

### 7.2 중기 (6개월)

- [ ] AI 모델 A/B 테스트
- [ ] 성능 최적화 (Core Web Vitals)
- [ ] E2E 테스트 자동화
- [ ] 접근성 개선 (WCAG 2.1)

### 7.3 장기 (1년)

- [ ] 멀티 리전 배포
- [ ] 오프라인 지원 강화
- [ ] 자체 AI 모델 검토
- [ ] 글로벌 확장 준비

---

## 8. 의사결정 프로세스

### 8.1 기술 선택 체크리스트

```
□ 문제 정의: 무엇을 해결하려는가?
□ 대안 조사: 최소 3개 대안 비교
□ PoC: 프로토타입 테스트
□ 비용 분석: 초기 + 확장 비용
□ 교체 전략: 교체 가능한가?
□ ADR 작성: 결정 문서화
```

### 8.2 ADR 템플릿

```markdown
# ADR-XXX: [제목]

## 상태
[제안됨 | 승인됨 | 폐기됨 | 대체됨]

## 컨텍스트
[문제 상황]

## 결정
[선택한 옵션]

## 대안
[검토한 다른 옵션들]

## 결과
[예상되는 영향]
```

---

## 9. 관련 문서

| 문서 | 설명 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 아키텍처 |
| [USER-FLOWS.md](./USER-FLOWS.md) | 사용자 플로우 |
| `docs/adr/` | 아키텍처 결정 기록 |
| `.claude/rules/` | 코딩 규칙 |

---

**Version**: 1.0 | **Created**: 2026-01-16
