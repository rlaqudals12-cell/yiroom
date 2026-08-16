# 보안 체크리스트

> OWASP Top 10 및 이룸 프로젝트 특화 보안 규칙 (v2.0: 코드 예시를 한 줄 규칙으로 압축 — 규칙 자체는 전부 보존)

## OWASP Top 10 체크리스트

### 1. Injection (A01:2021)

| 항목              | 점검                           | 이룸 적용                 |
| ----------------- | ------------------------------ | ------------------------- |
| SQL Injection     | Supabase RLS + 파라미터화 쿼리 | `lib/supabase/*.ts`       |
| NoSQL Injection   | JSONB 필드 검증                | `types/` 스키마 검증      |
| Command Injection | 사용자 입력 sanitize           | `lib/utils/redact-pii.ts` |

- 쿼리는 항상 `.eq()` 등 파라미터화 — 문자열 연결 쿼리 금지.

### 2. Broken Authentication (A07:2021)

| 항목          | 점검              | 이룸 적용  |
| ------------- | ----------------- | ---------- |
| 세션 관리     | Clerk 위임        | `proxy.ts` |
| 비밀번호 정책 | Clerk 기본값 사용 | -          |
| MFA           | Clerk 선택적      | 향후 도입  |

- 모든 보호 라우트: `const { userId } = await auth()` → 없으면 401/redirect.

### 3. Sensitive Data Exposure (A02:2021)

| 항목        | 점검            | 이룸 적용                 |
| ----------- | --------------- | ------------------------- |
| 전송 암호화 | HTTPS only      | Vercel 강제               |
| 저장 암호화 | Supabase 암호화 | 기본 활성화               |
| 로깅 마스킹 | PII 필터링      | `lib/utils/redact-pii.ts` |

- 민감 정보 원문 로깅 금지 — `sanitizeForLogging()` 마스킹 후에만.

### 4. Broken Access Control (A01:2021)

| 항목             | 점검               | 이룸 적용              |
| ---------------- | ------------------ | ---------------------- |
| RLS 정책         | 모든 테이블 필수   | `supabase/migrations/` |
| API 인가         | clerk_user_id 검증 | `auth.protect()`       |
| 수평적 권한 상승 | 본인 데이터만 접근 | RLS `USING` 절         |

### 5. Security Misconfiguration (A05:2021)

- 필수 환경변수 검증: `scripts/check-env.js` (GOOGLE_GENERATIVE_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLERK_SECRET_KEY)
- **금지**: `.env` 커밋 · `NEXT_PUBLIC_` 접두사에 비밀키 · 하드코딩된 API 키

### 6. XSS (A03:2021)

| 항목                    | 점검        | 이룸 적용   |
| ----------------------- | ----------- | ----------- |
| React 자동 이스케이프   | 기본 활성화 | JSX 사용    |
| dangerouslySetInnerHTML | 사용 금지   | ESLint 규칙 |
| URL 파라미터            | 검증 필수   | Zod 스키마  |

### 7. Insecure Deserialization (A08:2021)

- 외부 입력 JSON은 반드시 Zod `safeParse` 후 사용 — bare `JSON.parse` 결과 직접 사용 금지.

### 8. Components with Vulnerabilities (A06:2021)

- 매주 `npm audit` / 심각 취약점은 `npm audit --audit-level=critical`로 즉시 확인.

### 9. Insufficient Logging (A09:2021)

- 감사 로그 필수 항목: 로그인/로그아웃 · 데이터 생성/수정/삭제 · 권한 변경 · 실패한 인증 시도 — `logAudit(supabase, event, meta)` 사용.

### 10. SSRF (A10:2021)

- 외부 URL 호출 전 화이트리스트 검증 (`storage.googleapis.com`, `supabase.co` 등 허용 도메인만).

## 이룸 특화 보안 규칙

### 이미지 데이터 보호

| 항목 | 규칙                           |
| ---- | ------------------------------ |
| 저장 | Supabase Storage (비공개 버킷) |
| 접근 | 서명된 URL (1시간 만료)        |
| 삭제 | 30일 미접속 시 자동 익명화     |
| 로깅 | URL 마스킹 필수                |

### AI API 호출

| 항목     | 규칙                                                                        |
| -------- | --------------------------------------------------------------------------- |
| 타임아웃 | 축별 차등·시도별 적용 (정본 = lib/utils/timeout.ts AI_TIMEOUT, 대부분 30초) |
| 재시도   | 추가 최대 2회 (총 3회 시도)                                                 |
| Fallback | Mock 데이터 반환                                                            |
| 로깅     | 이미지 데이터 제외                                                          |

### Rate Limiting

| 엔드포인트       | 제한            |
| ---------------- | --------------- |
| `/api/analyze/*` | 50 req/24h/user |
| `/api/auth/*`    | 20 req/1m/IP    |
| `/api/upload/*`  | 5 req/1m/user   |

## 보안 검토 체크리스트

### PR 머지 전 확인

- [ ] 새 API에 `auth.protect()` 적용됨
- [ ] 새 테이블에 RLS 정책 추가됨
- [ ] 민감 데이터 로깅 없음
- [ ] 환경변수에 비밀키 노출 없음
- [ ] `npm audit` 심각한 취약점 없음

### 배포 전 확인

- [ ] HTTPS 강제 적용
- [ ] CORS 설정 검토
- [ ] Rate Limiting 활성화
- [ ] 에러 메시지에 스택 트레이스 없음

---

**Version**: 2.0 | **Updated**: 2026-07-12 | 코드 예시 → 한 줄 규칙 압축 (규칙·표·체크리스트 전부 보존)
