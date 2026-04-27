# ADR-103: 통합 분석 API의 크로스 오리진 접근 허용 — 모바일 클라이언트 지원

## 상태

`accepted`

## 날짜

2026-04-24

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"통합 분석 API는 웹 + 모바일 양쪽에서 호출 가능"

- /api/analyze/integrated는 CORS 제약 없이 호출 가능 (Origin 무관)
- Authorization 헤더(Bearer JWT)로 사용자 식별
- 다른 /api 엔드포인트는 기본 Same-Origin 유지 (민감도 보존)
- CORS 허용은 "통합 분석 1개 경로"로 국한 (블라스트 반경 최소)
```

### 물리적 한계

| 항목                             | 한계                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| 네이티브 앱 vs 브라우저          | React Native fetch는 CORS 미적용, 브라우저는 적용                          |
| Preflight OPTIONS                | 일부 CDN/프록시는 명시 허용 없으면 차단                                    |
| `Access-Control-Allow-Origin: *` | credentials(쿠키) 동시 사용 불가 — 본 API는 Authorization 헤더라 OK        |
| Next.js App Router               | route 파일의 OPTIONS 핸들러로만 메소드별 허용 가능                         |
| 보안                             | CORS 완전 개방은 악의적 사이트의 API 호출 허용 — Authorization 필수로 상쇄 |

### 100점 기준

- POST `/api/analyze/integrated` 모바일 앱에서 성공 응답
- OPTIONS preflight 204 응답 + 필수 헤더
- 다른 경로 (`/api/user/*` 등)는 CORS 기본 Same-Origin 유지
- Authorization Bearer 토큰 헤더가 모든 Origin에서 작동

### 현재 목표: 80%

- `/api/analyze/integrated/route.ts`에 OPTIONS 핸들러 + POST 응답 CORS 헤더
- proxy.ts는 변경 없음 (라우트 단 허용이 최소 범위)
- 다른 엔드포인트는 영향 없음

### 의도적 제외

| 제외 항목                                       | 이유                                         | 재검토 시점               |
| ----------------------------------------------- | -------------------------------------------- | ------------------------- |
| 전체 `/api/*` CORS 허용                         | 공격 표면 확대                               | 필요 시 엔드포인트별 추가 |
| `Access-Control-Allow-Origin` 동적 화이트리스트 | Expo는 Origin 헤더 없거나 `null` — 의미 없음 | Expo 동작 변화 시         |
| Credentials 쿠키 기반 인증                      | 통합 API는 Bearer 토큰만                     | 다른 API 확장 시          |
| `/api/analyze/*-v2` 개별 라우트도 CORS 개방     | 통합 플로우가 진입점이므로 개별 불필요       | 모바일 개별 분석 포팅 시  |

## 1. 맥락 (Context)

ADR-102에서 모바일이 웹 `/api/analyze/integrated`를 호출하도록 설계. 실측 차단 여부:

- React Native fetch는 브라우저 CORS 제약 미적용 — **실제로는 동작할 가능성 높음**
- 그러나 프로덕션 환경(Cloudflare/Vercel)에서 Preflight OPTIONS 자동 발생 가능성, 또는 개발 중 브라우저 기반 테스트 등 상황에서 안전장치 필요
- 웹 브라우저에서 동일 도메인이 아닌 곳에서 API 테스트할 경우에도 필요

### 1.1 현재 상태

- Next.js 기본: 모든 `/api/*` 경로는 Same-Origin 전제
- proxy.ts는 보안 헤더 설정 중이지만 CORS 없음
- `/api/analyze/integrated/route.ts`는 GET/OPTIONS 미정의 → 405 응답

### 1.2 위험 분석

- **"CORS 열면 공격 받나?"** — Authorization 필수라 토큰 없으면 401. Origin `*` 허용이 곧 익명 접근 허용은 아님.
- **CSRF?** — Cookie 기반 세션이 아니므로 CSRF 공격 표면 없음. JWT를 탈취당해야 공격 가능 (CORS와 무관).
- **Rate Limit 우회?** — 이미 userId 기반 Rate Limit, Origin 우회 불가.

### 1.3 선택지

| 옵션                                                  | 장점           | 단점                           |
| ----------------------------------------------------- | -------------- | ------------------------------ |
| A. 아무것도 안 함                                     | 변경 0         | 실기기에서 차단 시 디버깅 부담 |
| B. proxy.ts에서 `/api/analyze/integrated`에 CORS 헤더 | 중앙 관리      | proxy.ts 복잡도 증가           |
| C. 해당 route.ts에 OPTIONS + CORS 헤더                | 로컬성, 명시적 | route 파일에 코드 추가         |
| D. next.config.ts headers()로 전역                    | 일관성         | 전체 API에 영향 (부적합)       |

## 2. 결정 (Decision)

### 2.1 옵션 C 채택 — route.ts 단위 CORS 허용

이유:

- 허용 범위가 1개 엔드포인트로 한정 → 보안 영향 최소
- 해당 라우트 코드를 읽을 때 CORS 설정이 명시적으로 보임 → 유지보수성
- proxy.ts 복잡도 증가 회피

### 2.2 허용 헤더 구성

```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24h preflight 캐싱
};
```

- `Origin: *` — 모바일 Origin이 `null`/미정이라 화이트리스트 의미 없음. 인증은 Bearer 토큰이 담당.
- Methods `POST, OPTIONS`만 — GET/DELETE 등 불필요.
- Headers `Content-Type, Authorization` — 필요 최소.
- Max-Age `86400` — preflight 반복 호출 감소.

### 2.3 OPTIONS 핸들러 추가

```typescript
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
```

### 2.4 POST 응답에 CORS 헤더 추가

```typescript
return NextResponse.json({ success: true, result }, { status: 200, headers: CORS_HEADERS });
```

모든 에러 응답에도 동일 헤더 유지 (401/429/400/500).

### 2.5 다른 경로는 변경 없음

- `/api/analyze/personal-color-v2`, `skin-v2`, `body-v2`, `hair-v2` 등 **v2 개별 분석 라우트는 CORS 미허용 유지**
- 통합 플로우가 모바일 진입점이므로 개별 경로는 브라우저용으로 충분
- **2026-04-24 보강**: v2 route는 사실상 orphan 상태로 `@deprecated` 마커 적용. 모바일에서도 실제 호출하지 않으므로 CORS 정책 확장 계획 없음

## 3. 대안 (Alternatives Considered)

이미 §1.3에 정리. 핵심 제외 사유:

- 옵션 A: 실기기 디버깅 리스크 — 사전 예방 선호
- 옵션 B: proxy.ts 복잡도 불필요
- 옵션 D: 전체 API 범위 확대는 보안 리스크

## 4. 결과 (Consequences)

### 긍정적 결과

- **모바일 앱 + 웹 브라우저 외부 도메인 테스트** 모두 작동
- **보안 영향 최소** — 1개 엔드포인트만 허용, 인증 강제
- **Preflight 캐싱 24h** — 네트워크 오버헤드 감소
- **다른 엔드포인트 보호 유지** — 민감 API(`/api/user/*` 등)는 여전히 Same-Origin

### 부정적 결과

- route 파일에 CORS 코드 중복 (응답 경로마다 헤더 적용)
- 추후 엔드포인트 CORS 확장 시 패턴 재사용 필요 (헬퍼 추출 가능)

### 리스크

- **Token 탈취 공격** — Authorization이 전부 책임. Clerk JWT 만료/재발급 정책이 방어막.
  - 완화: Clerk 기본 15분~1시간 만료 + 자동 재발급
- **DDoS 증가** — Origin 무관하면 악성 클라이언트 호출 쉬움
  - 완화: Rate Limit (userId 기반), 인증 실패 시 즉시 401
- **모바일 Origin 정책 변경** — Expo 버전업 시 Origin 헤더 변화
  - 완화: `*` 허용이라 영향 없음

## 5. 구현 가이드

### 5.1 파일 수정

```
apps/web/app/api/analyze/integrated/route.ts
  - import 상단에 CORS_HEADERS 상수 정의
  - OPTIONS 핸들러 신규 추가
  - POST 성공/에러 응답 모두 headers: CORS_HEADERS 추가
```

### 5.2 재사용 가능한 헬퍼 (선택)

향후 다른 API도 CORS 허용 시를 대비:

```typescript
// apps/web/lib/api/cors.ts (선택, 이번 ADR에서는 미도입)
export const PUBLIC_API_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

이번 ADR에서는 route.ts 내부 상수로 시작 (YAGNI).

### 5.3 검증 방법

```bash
# Preflight
curl -X OPTIONS https://yiroom.app/api/analyze/integrated -I
# 응답: 204, Access-Control-Allow-* 헤더 포함 확인

# POST (토큰 필요)
curl -X POST https://yiroom.app/api/analyze/integrated \
  -H "Authorization: Bearer <CLERK_JWT>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 5.4 롤백 계획

- CORS 상수 및 OPTIONS 핸들러 제거 → 기본 Same-Origin 복원
- POST 응답 headers 필드 제거
- 영향: 모바일만, 웹은 무관

## 6. 관련 문서

- [ADR-102](./ADR-102-mobile-integrated-porting.md) — 모바일 포팅 (본 ADR의 트리거)
- [ADR-099](./ADR-099-integrated-analysis-flow.md) — 통합 API (대상 엔드포인트)
- [ADR-004](./ADR-004-auth-strategy.md) — Clerk 인증 전략

---

**Author**: Claude Code
**Reviewed by**: -
