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

## 디버깅 체크리스트

서버 접속 문제 발생 시 순서대로 확인:

- [ ] 1. 포트 사용 중인 프로세스 확인 및 종료
- [ ] 2. `.next` 폴더 삭제
- [ ] 3. `middleware.ts` 파일 존재 여부 확인 (있으면 삭제)
- [ ] 4. curl로 HTTP 응답 확인
- [ ] 5. 응답 헤더에서 Clerk 관련 정보 확인
- [ ] 6. `proxy.ts`의 공개 라우트 목록 확인

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

**Version**: 1.1 | **Updated**: 2026-01-13 | `npm run dev:reset` 명령 추가
