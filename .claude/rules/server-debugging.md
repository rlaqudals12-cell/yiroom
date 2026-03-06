# 서버 디버깅 규칙

> Next.js 16 개발 서버 문제 해결 가이드

## 🚀 빠른 해결 (Quick Fix)

서버 접속 문제 발생 시 **가장 먼저** 실행:

```bash
cd apps/web
npm run dev:reset
```

이 명령은 자동으로:

1. 포트 3000 사용 중인 프로세스 종료
2. `.next` 캐시 폴더 삭제
3. 개발 서버 새로 시작

**또는** 사전 검사만 실행:

```bash
npm run preflight
```

---

## 일반적인 서버 접속 문제

### 1. 포트 충돌 (Port Conflict)

**증상**: `Port 3000 is in use by process XXXX`

**해결 순서**:

```bash
# 1. 프로세스 확인
netstat -ano | findstr ":3000"

# 2. 프로세스 종료 (Windows)
taskkill /F /PID <PID>

# 3. 전체 Node 프로세스 종료 (최후 수단)
taskkill /F /IM node.exe
```

### 2. Lock 파일 문제

**증상**: `Unable to acquire lock at .next/dev/lock`

**해결**:

```bash
rm -rf apps/web/.next
```

### 3. 무한 로딩 (Infinite Loading)

**원인 확인 순서**:

1. curl로 HTTP 응답 코드 확인: `curl -sI http://localhost:3000/home`
2. 404 → Clerk/proxy.ts 설정 확인
3. 307 → 인증 필요 (공개 라우트에 추가 필요)
4. 200인데 빈 화면 → 클라이언트 렌더링 문제

**Clerk 관련 헤더 확인**:

```
x-clerk-auth-reason: protect-rewrite, dev-browser-missing
x-clerk-auth-status: signed-out
```

→ `proxy.ts`의 `isPublicRoute`에 해당 경로 추가

### 4. proxy.ts 공개 라우트 설정

```typescript
// apps/web/proxy.ts
const isPublicRoute = createRouteMatcher([
  '/',
  '/home', // 홈 페이지
  '/sign-in(.*)', // 로그인
  '/sign-up(.*)', // 회원가입
  '/announcements', // 공지사항
  '/help(.*)', // 도움말
  '/api/webhooks(.*)', // 외부 웹훅
]);
```

## Next.js 16 특이사항

### middleware.ts → proxy.ts 마이그레이션

Next.js 16에서 middleware가 proxy로 변경됨:

- 파일명: `middleware.ts` → `proxy.ts`
- 함수명: `middleware()` → `proxy()`
- 두 파일 동시 존재 불가 (충돌 에러 발생)

**주의**: middleware.ts 파일이 존재하면 삭제 필요

### Turbopack 캐시 문제

문제 발생 시 캐시 완전 삭제:

```bash
rm -rf apps/web/.next
```

### Turbopack 캐시 손상 (Corrupted Database)

**증상**: 서버 로그에 다음 에러 반복:

```
thread 'tokio-runtime-worker' panicked:
Failed to restore task data (corrupted database or bug)
Unable to open static sorted file XXXXX.sst
Persisting failed: Another write batch or compaction is already active
```

**원인**: `.next` 내부 SST 파일 손상. 강제 종료, 동시 서버 실행, 디스크 오류 등으로 발생.

**해결**:

```bash
taskkill /F /IM node.exe
rm -rf apps/web/.next
cd apps/web && npx next dev --turbopack
```

### PWA Service Worker와 개발 환경 충돌

**증상**: 브라우저에서 페이지 레이아웃이 깨지거나 오래된 콘텐츠 표시. `Ctrl+Shift+R`로도 해결 안 됨.

**원인**: 이전 프로덕션 빌드에서 등록된 Service Worker가 `StaleWhileRevalidate`로 페이지/CSS를 캐싱.

**확인 방법**:

1. Chrome DevTools (F12) → Application → Service Workers
2. 등록된 SW가 있으면 문제 가능성 높음

**해결**:

1. Chrome DevTools → Application → Service Workers → **Unregister**
2. Application → Storage → **Clear site data** 클릭
3. 또는 시크릿 모드에서 테스트 (SW 우회)

**중요**: `Ctrl+Shift+R` (Hard Refresh)은 Service Worker를 우회하지 않음.

### 레이아웃 깨짐 진단 (서버 정상인 경우)

서버 HTML/CSS가 정상인데 브라우저에서 레이아웃이 깨질 때:

```bash
# 1. 서버 HTML 확인 (공개 라우트)
curl -s http://localhost:3000/home | grep -o '<main[^>]*>'

# 2. CSS 확인
curl -s http://localhost:3000/home | grep -o 'href="[^"]*\.css[^"]*"'
# CSS 파일 다운로드 후 클래스 존재 확인
```

서버가 정상이면 브라우저측 문제:

1. **시크릿 모드 테스트** (SW/캐시 우회)
2. **DevTools → Application → Service Workers** 확인
3. **진단 스크립트** 실행 (상세: `docs/troubleshooting/2026-02-09-layout-collapse-investigation.md`)

## 디버깅 체크리스트

서버 접속 문제 발생 시 순서대로 확인:

- [ ] 1. 포트 사용 중인 프로세스 확인 및 종료
- [ ] 2. `.next` 폴더 삭제
- [ ] 3. `middleware.ts` 파일 존재 여부 확인 (있으면 삭제)
- [ ] 4. curl로 HTTP 응답 확인
- [ ] 5. 응답 헤더에서 Clerk 관련 정보 확인
- [ ] 6. `proxy.ts`의 공개 라우트 목록 확인
- [ ] 7. 브라우저 Service Worker 등록 확인 (DevTools → Application)
- [ ] 8. 시크릿 모드에서 동일 증상 재현 확인
- [ ] 9. Error 1016 시: Clerk 엔드포인트 `curl -4` 직접 테스트 (530이면 Clerk 측 장애)

## 유용한 디버깅 명령어

```bash
# 서버 상태 확인
curl -sI http://localhost:3000/home | head -10

# 여러 라우트 테스트
for route in / /home /beauty /sign-in; do
  echo -n "$route: "
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$route
  echo ""
done

# 서버 로그 실시간 확인
tail -f /path/to/server/output

# TypeScript 오류 확인
cd apps/web && npx tsc --noEmit
```

### Clerk Error 1016 (Origin DNS Error)

**증상**: 브라우저에서 Cloudflare Error 1016 페이지 표시. 도메인: `*.clerk.accounts.dev`

**원인 분류**:

| curl 결과           | 원인                         | 해결                       |
| ------------------- | ---------------------------- | -------------------------- |
| DNS 해석 실패       | ISP DNS 차단 (.dev 도메인)   | Google DNS(8.8.8.8)로 변경 |
| DNS 정상 + HTTP 530 | Clerk Cloudflare Worker 장애 | Clerk 복구 대기            |
| DNS 정상 + HTTP 200 | 브라우저 캐시/SW             | 시크릿 모드 테스트         |

**진단 명령어**:

```bash
# 1. DNS 해석 확인
nslookup inviting-lamprey-83.clerk.accounts.dev 8.8.8.8

# 2. Clerk 엔드포인트 직접 테스트 (IPv4 강제)
curl -4 -sI "https://inviting-lamprey-83.clerk.accounts.dev/" | head -3

# 3. 로컬 서버 정상 확인
curl -sI http://localhost:3000/home | head -3
```

**DNS 변경 (SK Broadband 등 ISP 차단 시)**:

```bash
netsh interface ip set dns name="이더넷" static 8.8.8.8
netsh interface ip add dns name="이더넷" 8.8.4.4 index=2
ipconfig /flushdns
```

> 상세: `docs/troubleshooting/2026-03-07-clerk-error-1016-origin-dns.md`

## Clerk 디버깅

`clerkMiddleware`에 디버그 모드 활성화:

```typescript
export const proxy = clerkMiddleware(
  async (auth, req) => {
    /* ... */
  },
  { debug: true } // 터미널에 상세 로그 출력
);
```

## 참고 자료

- [Next.js 16 Proxy 문서](https://nextjs.org/docs/app/getting-started/proxy)
- [Clerk Middleware 문서](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Next.js 16 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16)

---

**Version**: 1.2 | **Updated**: 2026-03-07 | Clerk Error 1016 진단 가이드 추가
