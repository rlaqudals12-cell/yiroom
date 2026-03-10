# SDD: 소셜 로그인 (카카오/네이버)

> **ADR**: ADR-004 Auth Strategy
> **상태**: 스펙 확정 | **작성일**: 2026-03-11

---

## 1. 개요

Clerk OAuth 기반 카카오/네이버 소셜 로그인 활성화. 코드 변경 최소화 (Clerk Dashboard 설정 중심).

## 2. 현재 상태

| 항목         | 상태                             |
| ------------ | -------------------------------- |
| Google OAuth | ✅ 활성                          |
| Apple OAuth  | ✅ 활성                          |
| Kakao OAuth  | ⬜ CSP 준비 완료, Clerk 미활성화 |
| Naver OAuth  | ⬜ CSP 준비 완료, Clerk 미활성화 |

## 3. 구현 범위

### 3.1 Clerk Dashboard 설정 (수동)

| 작업               | 입력                                  | 출력                          |
| ------------------ | ------------------------------------- | ----------------------------- |
| Kakao OAuth 활성화 | Kakao Developers REST API 키 + 시크릿 | `<SignIn>`에 카카오 버튼 노출 |
| Naver OAuth 활성화 | Naver Developers Client ID + 시크릿   | `<SignIn>`에 네이버 버튼 노출 |

### 3.2 코드 변경 사항

**변경 없음**. 다음 사항이 이미 구현됨:

- `proxy.ts`: Kakao/Naver CSP 도메인 추가 완료
- `webhooks/clerk/route.ts`: `user.created` 웹훅 → Supabase `users` 동기화
- `<SignIn>` / `<SignUp>`: Clerk Dashboard 설정 기반 자동 렌더링

### 3.3 Redirect URI 설정

| Provider | Redirect URI                                 |
| -------- | -------------------------------------------- |
| Kakao    | `https://clerk.yiroom.app/v1/oauth_callback` |
| Naver    | `https://clerk.yiroom.app/v1/oauth_callback` |

## 4. 테스트 계획

| 테스트        | 시나리오                       | 성공 기준                                          |
| ------------- | ------------------------------ | -------------------------------------------------- |
| 카카오 로그인 | 카카오 계정으로 SignIn         | Supabase `users` 레코드 생성, `clerk_user_id` 정상 |
| 네이버 로그인 | 네이버 계정으로 SignIn         | Supabase `users` 레코드 생성, `clerk_user_id` 정상 |
| 온보딩 플로우 | 소셜 로그인 → 프로필 완성      | 온보딩 단계 정상 진행                              |
| RLS 검증      | 소셜 로그인 사용자 데이터 접근 | 본인 데이터만 접근 가능                            |
| 중복 계정     | 동일 이메일 다른 Provider      | Clerk 계정 병합 또는 에러 처리                     |

## 5. 롤백 계획

Clerk Dashboard에서 해당 OAuth provider 비활성화 → 즉시 로그인 버튼 숨김. 기존 계정은 영향 없음 (이메일/비밀번호 로그인 유지).

## 6. 보안 고려사항

- OAuth state 파라미터: Clerk 자동 처리 (CSRF 방지)
- 토큰 저장: Clerk 세션 관리 (클라이언트 토큰 노출 없음)
- Scope: 최소 권한 (이메일, 프로필 이미지)

---

**Version**: 1.0
