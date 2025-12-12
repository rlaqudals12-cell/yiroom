# E2E 테스트 가이드

## 환경 변수 설정

E2E 테스트를 실행하기 전에 다음 환경 변수를 `.env.local`에 추가해야 합니다:

```bash
# Clerk 테스트 사용자 (E2E 테스트용)
E2E_CLERK_USER_USERNAME=your-test-username
E2E_CLERK_USER_PASSWORD=your-test-password
```

### 테스트 사용자 생성

1. [Clerk Dashboard](https://dashboard.clerk.dev/)에 접속
2. Users → Create User 클릭
3. 테스트용 사용자 생성 (username + password 인증 활성화 필요)
4. 생성한 사용자 정보를 환경 변수에 설정

## 테스트 실행

```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅용)
npm run test:e2e:ui

# 브라우저 표시하며 실행
npm run test:e2e:headed

# 테스트 리포트 확인
npm run test:e2e:report
```

## 테스트 구조

```
e2e/
├── fixtures/           # 공통 유틸리티
│   └── index.ts       # 테스트 헬퍼 및 라우트 상수
├── auth/              # 인증 테스트
│   ├── login.spec.ts  # 로그인 플로우
│   └── logout.spec.ts # 로그아웃 플로우
├── workout/           # 운동 모듈 테스트
├── nutrition/         # 영양 모듈 테스트
├── report/            # 리포트 테스트
├── global-setup.ts    # Clerk 테스팅 토큰 초기화
└── smoke.spec.ts      # 기본 페이지 접근 테스트
```

## Clerk 테스팅 토큰

Playwright 테스트는 Clerk의 Testing Token을 사용하여 봇 감지를 우회합니다.
`global-setup.ts`에서 자동으로 설정됩니다.

## 참고 문서

- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright/overview)
- [Playwright 공식 문서](https://playwright.dev/)
