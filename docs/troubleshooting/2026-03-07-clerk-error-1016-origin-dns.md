# Clerk Error 1016 — Origin DNS Error (개발 인스턴스)

> **날짜**: 2026-03-07
> **영향 범위**: 로컬 개발 서버 인증 (Clerk 개발 인스턴스)
> **심각도**: 높음 (개발 차단)
> **상태**: 대기 중 (Clerk 인프라 측 문제)

---

## 1. 증상

- 브라우저에서 `localhost:3001` 접속 시 Cloudflare **Error 1016 (Origin DNS error)** 표시
- 에러 페이지 도메인: `inviting-lamprey-83.clerk.accounts.dev`
- 로컬 서버 자체는 정상 작동 (HTTP 200 응답)
- 인증이 필요 없는 공개 라우트도 Clerk handshake 실패로 에러 페이지 표시

## 2. 진단 과정

### 2.1 로컬 DNS 확인

```bash
nslookup inviting-lamprey-83.clerk.accounts.dev 8.8.8.8
```

결과: `worker.clerkprod-cloudflare.net` (104.18.34.146, 172.64.153.110) — **정상 해석**

### 2.2 SK Broadband DNS 차단 확인

초기에 SK 브로드밴드 기본 DNS(`210.220.163.82`)가 `.dev` 도메인을 차단/리다이렉트하는 문제 발견.

```bash
# Google DNS로 변경
netsh interface ip set dns name="이더넷" static 8.8.8.8
netsh interface ip add dns name="이더넷" 8.8.4.4 index=2
```

DNS 변경 후에도 동일 에러 지속 — DNS가 원인이 아님을 확인.

### 2.3 Clerk 엔드포인트 직접 테스트

```bash
# IPv4 강제로 Clerk handshake 엔드포인트 테스트
curl -4 -sI "https://inviting-lamprey-83.clerk.accounts.dev/v1/client/handshake"
# 결과: HTTP/1.1 530 (Cloudflare Origin DNS Error)

# 응답 본문
curl -4 -s "https://inviting-lamprey-83.clerk.accounts.dev/v1/client/handshake"
# 결과: error code: 1016

# 다른 Clerk 엔드포인트도 동일
curl -4 -sI "https://inviting-lamprey-83.clerk.accounts.dev/.well-known/openid-configuration"
# 결과: HTTP/1.1 530
```

### 2.4 Clerk 프로덕션 API 비교

```bash
curl -4 -sI "https://api.clerk.com/health"
# 결과: HTTP/1.1 404 (연결은 정상)
```

프로덕션 API(`api.clerk.com`)는 정상 — **개발 인스턴스(`*.clerk.accounts.dev`)만 장애**.

### 2.5 로컬 서버 확인

```bash
curl -sI http://localhost:3001/home
# 결과: HTTP/1.1 200 OK
# x-clerk-auth-reason: dev-browser-missing
# x-clerk-auth-status: signed-out
```

로컬 Next.js 서버 자체는 정상 작동. Clerk handshake만 실패.

### 2.6 Clerk 상태 페이지 확인

```bash
curl -s "https://status.clerk.com/api/v2/status.json"
# {"status":{"description":"All Systems Operational","indicator":"none"}}
```

공식 상태 페이지는 "정상" 표시 — 한국 리전 또는 Cloudflare Worker 특정 노드 문제 가능성.

## 3. 근본 원인

**Cloudflare Error 1016** = Cloudflare 에지 서버가 origin 서버의 DNS를 해석하지 못하는 상태.

```
브라우저 -> Cloudflare Edge (ICN) -> Clerk Cloudflare Worker -> Origin 서버
                                     ↑ 여기서 실패 (530)
```

- Clerk 개발 인스턴스는 `worker.clerkprod-cloudflare.net` Cloudflare Worker로 라우팅
- 해당 Worker가 Clerk origin 서버에 연결 실패
- IPv4 강제, DNS 변경, 캐시 클리어 등 로컬 조치로 해결 불가
- **Clerk 인프라 측 문제** (Cloudflare Worker -> origin 연결)

## 4. 해결/우회 방법

### 4.1 복구 대기 (채택)

Clerk 인프라 측 복구를 기다린다. 복구 확인 방법:

```bash
# 터미널에서
curl -sI "https://inviting-lamprey-83.clerk.accounts.dev/" | head -1
# HTTP/1.1 530 -> 장애 중
# HTTP/1.1 200 또는 301 -> 복구됨

# 브라우저에서
# https://inviting-lamprey-83.clerk.accounts.dev/ 접속하여 Error 1016 유무 확인
```

### 4.2 개발 지속 방법

Clerk 장애 중에도 가능한 작업:

- 인증 불필요한 코드 작업 (컴포넌트, 유틸리티, 테스트)
- `npm run typecheck`, `npm run lint`, `npm run test` 실행
- Git 커밋/문서 작업

### 4.3 장기 미복구 시 대안

- Clerk Dashboard에서 개발 인스턴스 재생성
- `.env.local`의 Clerk 키 교체
- proxy.ts의 Clerk 설정 확인

## 5. 영향 파일

- 직접 수정 없음 (인프라 이슈)
- DNS 변경: Windows 네트워크 설정 (이더넷 -> Google DNS 8.8.8.8)

## 6. 교훈

| 교훈                       | 상세                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| **ISP DNS 차단**           | SK Broadband 기본 DNS는 `.dev` 도메인을 차단할 수 있음. 개발 환경에서는 Google DNS(8.8.8.8) 사용 권장 |
| **530 vs DNS 에러 구분**   | 로컬 DNS 해석이 정상이어도 Cloudflare Worker 레벨에서 530 반환 가능. `curl -4`로 직접 테스트 필수     |
| **Clerk 상태 페이지 한계** | 공식 상태 페이지가 "정상"이어도 특정 리전/인스턴스에서 장애 가능                                      |
| **개발 인스턴스 의존성**   | 로컬 개발이 외부 SaaS(Clerk) 가용성에 의존. 오프라인 개발 모드 검토 가치 있음                         |

## 7. 관련 문서

- [server-debugging.md](../../.claude/rules/server-debugging.md) — Next.js 서버 디버깅 가이드
- [2026-02-09 레이아웃 깨짐](./2026-02-09-layout-collapse-investigation.md) — Service Worker 캐시 이슈 (유사 증상)

---

**Version**: 1.0 | **Created**: 2026-03-07
