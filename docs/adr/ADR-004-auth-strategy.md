# ADR-004: 인증 전략 (Clerk + Supabase RLS)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 데이터 접근이 clerk_user_id 기반 RLS로 자동 격리되는 시스템"

- 인증: Clerk 소셜 로그인 5+ 플랫폼 지원
- 권한: RLS 정책 100% 테이블 적용
- 보안: OWASP Top 10 완전 준수
- 감사: 모든 접근 로그 기록
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| Clerk 의존성 | SaaS 서비스 가용성 |
| JWT 크기 | 클레임 제한 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| RLS 커버리지 | 모든 테이블 100% |
| 인증 방식 | 소셜 5+ (Google, Apple, Kakao 등) |
| 감사 로그 | 민감 작업 100% 기록 |
| 권한 테스트 | 수평적 권한 상승 0건 |

### 현재 달성률

**70%** - RLS 주요 테이블 적용, 감사 로그 부분 구현

### 의도적 제외

| 제외 항목 | 이유 |
|----------|------|
| MFA 강제 | UX 우선 (선택적 제공) |
| 역할 기반 접근제어(RBAC) | 현재 단일 역할로 충분 |

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸은 사용자별 민감한 데이터(얼굴 이미지, 신체 정보, 건강 기록)를 다룹니다. 강력한 인증과 데이터 격리가 필수입니다:

1. **인증**: 회원가입, 로그인, 세션 관리
2. **권한**: 본인 데이터만 접근
3. **보안**: OWASP Top 10 준수

## 결정 (Decision)

**Clerk 인증 + Supabase RLS(Row Level Security)** 조합을 채택합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    인증 아키텍처                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  사용자 → Clerk (인증)                                       │
│             ↓                                                │
│         clerk_user_id (JWT sub claim)                        │
│             ↓                                                │
│  Supabase RLS → clerk_user_id 기반 데이터 격리               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Supabase 클라이언트 패턴 (DIP)

| 컨텍스트 | 함수 | 파일 |
|----------|------|------|
| Client Component | `useClerkSupabaseClient()` | `lib/supabase/clerk-client.ts` |
| Server Component/API | `createClerkSupabaseClient()` | `lib/supabase/server.ts` |
| 관리자 (RLS 우회) | `createServiceRoleClient()` | `lib/supabase/service-role.ts` |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| NextAuth.js | 무료, 유연성 | 직접 구현 필요 | `HIGH_COMPLEXITY` - 세션 관리 복잡 |
| Supabase Auth 단독 | 통합 간편 | 소셜 로그인 제한 | `ALT_SUFFICIENT` - Clerk이 더 풍부한 기능 |
| Firebase Auth | Google 생태계 | Supabase와 이중 관리 | `LOW_ROI` - 불필요한 복잡도 |

## 결과 (Consequences)

### 긍정적 결과

- **보안 강화**: RLS로 DB 레벨에서 데이터 격리
- **개발 편의**: Clerk의 풍부한 UI 컴포넌트
- **소셜 로그인**: Google, Apple, Kakao 등 지원
- **확장성**: 팀 기능, 조직 기능 추가 용이

### 부정적 결과

- **비용**: Clerk 유료 플랜 (MAU 10K 이상)
- **두 서비스 의존**: Clerk + Supabase 둘 다 필요

### 리스크

- Clerk 장애 시 로그인 불가 → **세션 캐싱으로 일시적 대응**
- RLS 정책 누락 시 데이터 노출 → **P0-7에서 전체 테이블 감사**

## 구현 가이드

### RLS 정책 표준

```sql
-- 모든 테이블에 적용
CREATE POLICY "user_own_data_select" ON [테이블]
  FOR SELECT USING (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "user_own_data_insert" ON [테이블]
  FOR INSERT WITH CHECK (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );
```

### proxy.ts 공개 라우트

```typescript
// apps/web/proxy.ts
const isPublicRoute = createRouteMatcher([
  '/',
  '/home',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/announcements',
  '/help(.*)',
  '/api/webhooks(.*)',
  '/terms',              // 법적 필수
  '/privacy-policy',     // 법적 필수
  '/age-verification',   // N-1
]);
```

### 클라이언트 사용 예시

```typescript
// Client Component
'use client';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export function MyComponent() {
  const supabase = useClerkSupabaseClient();
  // RLS가 자동 적용된 쿼리
  const { data } = await supabase.from('my_table').select('*');
}
```

## 리서치 티켓

```
[ADR-004-R1] 인증 및 RLS 보안 강화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Clerk + Supabase RLS 조합에서 JWT 클레임 검증 모범 사례
2. RLS 정책 자동 테스트 도구 및 방법론 (정책 누락 방지)
3. 세션 하이재킹 방지를 위한 토큰 바인딩 기법

→ 결과를 Claude Code에서 lib/supabase/ 및 RLS 정책에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 보안 패턴](../principles/security-patterns.md) - RLS, JWT, 다층 방어
- [원리: 법적 준수](../principles/legal-compliance.md) - 개인정보보호법, 민감정보

### 관련 ADR/스펙
- [ADR-022: 연령 인증](./ADR-022-age-verification.md)
- [ADR-025: 감사 로깅](./ADR-025-audit-logging.md)
- [Supabase DB Rules](../../.claude/rules/supabase-db.md)

---

**Author**: Claude Code
**Reviewed by**: -
