# 이룸 배포 가이드

> 프로덕션 환경 배포 체크리스트 및 가이드

## 사전 요구 사항

### 필수 서비스 계정

| 서비스           | 용도         | 설정 위치                |
| ---------------- | ------------ | ------------------------ |
| **Vercel**       | 호스팅       | vercel.com               |
| **Supabase**     | 데이터베이스 | supabase.com             |
| **Clerk**        | 인증         | clerk.com                |
| **Google Cloud** | Gemini API   | console.cloud.google.com |

### 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/gender

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=xxx

# Sentry (선택)
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=yiroom
SENTRY_PROJECT=web

# 기타
NODE_ENV=production
```

---

## 배포 전 체크리스트

### 1. 코드 품질

```bash
# 타입 체크
npm run typecheck

# 린트
npm run lint

# 테스트
npm run test

# 빌드 확인
npm run build
```

### 2. 환경 변수 검증

- [ ] 모든 필수 환경 변수 설정 완료
- [ ] `NEXT_PUBLIC_` 접두사에 비밀키 없음
- [ ] 프로덕션 키 사용 (개발 키 아님)

### 3. 데이터베이스

- [ ] Supabase 프로덕션 프로젝트 생성
- [ ] 마이그레이션 적용 완료
- [ ] RLS 정책 활성화 확인
- [ ] 인덱스 생성 완료

### 4. 인증 (Clerk)

- [ ] 프로덕션 인스턴스 생성
- [ ] 도메인 등록 (yiroom.app)
- [ ] 소셜 로그인 설정 (Google, Kakao)
- [ ] 웹훅 URL 설정

### 5. AI 서비스

- [ ] Gemini API 프로덕션 쿼터 확인
- [ ] Rate Limiting 설정

---

## Vercel 배포

### 프로젝트 설정

1. **Repository 연결**
   - GitHub 저장소 연결
   - `apps/web` 루트 디렉토리 설정

2. **환경 변수 설정**
   - Settings > Environment Variables
   - 모든 환경 변수 추가 (Production/Preview/Development)

3. **빌드 설정**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

### 도메인 설정

1. **커스텀 도메인 추가**
   - yiroom.app
   - www.yiroom.app

2. **DNS 설정**

   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL 인증서**
   - Vercel 자동 발급

---

## 배포 후 검증

### 1. 헬스 체크

```bash
# API 헬스 체크
curl https://yiroom.app/api/health

# 응답 예상
# {"status":"ok","timestamp":"2026-02-01T..."}
```

### 2. Lighthouse 측정

```bash
# 주요 페이지 성능 확인
npx lighthouse https://yiroom.app/home --output=json

# 목표
# Performance: 85+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

### 3. 핵심 기능 테스트

| 기능        | 테스트 방법              | 예상 결과              |
| ----------- | ------------------------ | ---------------------- |
| 로그인      | Google/Kakao 로그인 시도 | 성공, /home 리다이렉트 |
| 피부 분석   | 이미지 업로드 및 분석    | 3초 이내 결과 반환     |
| 퍼스널 컬러 | 이미지 업로드 및 분석    | 3초 이내 결과 반환     |
| 제품 추천   | 분석 후 제품 목록 확인   | 매칭된 제품 표시       |
| AI 코치     | 채팅 메시지 전송         | 스트리밍 응답          |

---

## 모니터링

### Vercel Analytics

- Settings > Analytics 활성화
- Web Vitals 자동 수집

### Sentry (선택)

```bash
# 소스맵 업로드
npx sentry-cli releases new <version>
npx sentry-cli releases files <version> upload-sourcemaps .next
npx sentry-cli releases finalize <version>
```

### 로그 확인

```bash
# Vercel 로그 스트리밍
vercel logs yiroom.app --follow
```

---

## 롤백 절차

배포 후 문제 발생 시 빠른 복구를 위한 롤백 방법을 설명합니다.

### 롤백 방법 비교

| 방법                         | 소요 시간 | 사용 시점                  |
| ---------------------------- | --------- | -------------------------- |
| **GitHub Actions 자동 롤백** | ~1분      | 에러율 급증 시 자동 트리거 |
| **GitHub Actions 수동 롤백** | ~1분      | 수동으로 빠른 롤백 필요 시 |
| **Vercel 대시보드**          | ~2분      | 간단한 수동 롤백           |
| **Vercel CLI**               | ~1분      | 터미널에서 빠른 롤백       |

### 1. GitHub Actions 자동 롤백 (권장)

#### 사전 설정

GitHub Secrets에 다음 값 추가:

| Secret              | 설명               | 필수 |
| ------------------- | ------------------ | ---- |
| `VERCEL_TOKEN`      | Vercel API 토큰    | 필수 |
| `VERCEL_ORG_ID`     | Vercel 조직 ID     | 필수 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | 필수 |
| `SLACK_WEBHOOK_URL` | Slack 알림 (선택)  | 선택 |

#### 수동 트리거

1. GitHub Actions 탭 이동
2. "Auto Rollback" 워크플로우 선택
3. "Run workflow" 클릭
4. 롤백 사유 입력 후 실행

```
Actions > Auto Rollback > Run workflow
  - reason: "배포 후 에러율 급증"
  - notify_slack: true (선택)
```

#### 자동 트리거 조건

헬스체크 워크플로우에서 자동으로 롤백이 트리거되는 조건:

- 모든 헬스체크 엔드포인트 실패 (status: unhealthy)
- `auto_rollback` 옵션이 활성화된 경우

### 2. 헬스체크 모니터링

#### 자동 헬스체크

`.github/workflows/health-check.yml`에서 15분마다 자동 실행:

```yaml
# 모니터링 대상 엔드포인트
- /api/health
- /home
- /sign-in
```

#### 수동 헬스체크

```bash
# GitHub Actions에서 수동 실행
Actions > Post-Deploy Health Check > Run workflow
  - deployment_url: https://yiroom.app
  - auto_rollback: true (실패 시 자동 롤백)
```

### 3. Vercel 대시보드 (수동)

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택 > Deployments 탭
3. 이전 안정 배포의 ... 메뉴 클릭
4. "Promote to Production" 선택

### 4. Vercel CLI (수동)

```bash
# 최근 배포 목록 확인
vercel ls --prod

# 이전 배포로 롤백 (자동으로 이전 배포 선택)
vercel rollback

# 특정 배포로 롤백
vercel rollback <deployment-url-or-id>

# 배포 ID 확인
vercel inspect <deployment-url>
```

### 롤백 체크리스트

롤백 실행 후 확인사항:

- [ ] 프로덕션 URL 접속 가능 여부
- [ ] API 헬스체크 응답 확인 (`curl https://yiroom.app/api/health`)
- [ ] 주요 기능 동작 확인 (로그인, 분석)
- [ ] 에러 로그 감소 확인 (Vercel 로그)
- [ ] 팀에 롤백 완료 공지

### 롤백 후 대응

1. **원인 분석**: 배포 실패 원인 파악
2. **핫픽스 준비**: 수정 사항 개발 및 테스트
3. **재배포**: 수정 완료 후 신규 배포
4. **모니터링 강화**: 재배포 후 15분간 집중 모니터링

---

## 모바일 앱 배포 (Expo EAS)

### EAS 개요

| 항목            | 값                                        |
| --------------- | ----------------------------------------- |
| **서비스**      | Expo Application Services (클라우드 빌드) |
| **프로젝트 ID** | `0e876253-c0e1-4cbe-a9e1-33207bae230a`    |
| **패키지명**    | `com.yiroom.app`                          |
| **EAS CLI**     | `>= 16.0.0`                               |
| **빌드 Node**   | `20.18.0`                                 |

### 요금 플랜

| 플랜       | 가격    | Android 빌드 | 권장          |
| ---------- | ------- | ------------ | ------------- |
| Free       | $0      | 30회/월      | 테스트        |
| Production | $1/빌드 | 종량제       | **현재 권장** |
| On-demand  | $99/월  | 무제한       | 팀 규모 시    |

> **주의**: Free 플랜은 월 30회 제한. 소진 시 다음 달 1일 리셋.

### 빌드 프로필 (eas.json)

| 프로필        | 용도        | Android 출력     | 배포 방식   |
| ------------- | ----------- | ---------------- | ----------- |
| `development` | 개발/디버깅 | APK              | 내부 배포   |
| `preview`     | QA/테스트   | APK              | 내부 배포   |
| `production`  | 스토어 제출 | AAB (app-bundle) | Google Play |

```bash
cd apps/mobile

# 개발용 APK (디바이스 테스트)
eas build --profile development --platform android

# QA/테스트용 APK
eas build --profile preview --platform android

# Google Play 제출용 AAB
eas build --profile production --platform android
```

### 모노레포 필수 설정

#### .easignore (모노레포 루트)

`.easignore`는 **반드시 모노레포 루트** (`c:\dev\yiroom\.easignore`)에 위치해야 함.
`apps/mobile/` 하위에 놓으면 적용되지 않음.

```
# 핵심 설정 요약
node_modules/              # 기본 제외
!apps/mobile/node_modules/ # 모바일 의존성은 포함
!packages/shared/node_modules/
docs/                      # 한글 파일명 → Linux tar 추출 실패 방지
apps/web/                  # 웹 앱 불필요
```

> **주의**: `.easignore`는 `.gitignore`의 기본 동작을 **완전히 대체**함.
> `node_modules/` 제외를 명시하지 않으면 전체 node_modules가 업로드됨 (2GB+).

#### metro.config.js

모노레포에서 React 중복 방지 필수:

```javascript
// watchFolders: 기본값 유지하며 루트 추가
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// React 중복 방지 (루트 vs 모바일 버전 충돌 방지)
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};
```

### 알려진 이슈 및 해결

| 이슈                        | 원인                                       | 해결                         |
| --------------------------- | ------------------------------------------ | ---------------------------- |
| tar 추출 실패 (Cannot open) | `docs/` 한글 UTF-8 파일명이 Linux에서 깨짐 | `.easignore`에 `docs/` 추가  |
| 업로드 2GB+                 | `.easignore`가 기본 무시 패턴 대체         | `node_modules/` 명시적 제외  |
| `eas build --local` 실패    | **Windows 미지원** (macOS/Linux만)         | EAS 클라우드 빌드 사용       |
| React 중복 경고             | 루트(19.2.x) vs 모바일(19.1.x) 충돌        | `extraNodeModules`로 핀 고정 |

### 스토어 제출

```bash
# Google Play 제출 (AAB 빌드 완료 후)
eas submit --platform android --profile production

# App Store 제출
eas submit --platform ios --profile production
```

### OTA 업데이트

```bash
# 경미한 변경은 OTA로 배포 (네이티브 변경 없을 때만)
eas update --branch production --message "버그 수정"
```

### Gemini AI 모델 설정

모바일/웹 공통으로 Gemini 모델명 업데이트 필요:

| 항목     | 이전 (deprecated)      | 현재                                                     |
| -------- | ---------------------- | -------------------------------------------------------- |
| 모델명   | `gemini-2.0-flash-exp` | `gemini-3-flash-preview`                                 |
| 환경변수 | `GEMINI_MODEL`         | `process.env.GEMINI_MODEL \|\| 'gemini-3-flash-preview'` |

> `gemini-2.0-flash-exp`는 2026년 2월 기준 404 반환 (deprecated).

---

## 데이터베이스 마이그레이션

### 마이그레이션 적용

```bash
# 로컬 테스트
supabase start
supabase db push

# 프로덕션 적용
supabase link --project-ref <project-ref>
supabase db push --linked
```

### 마이그레이션 상태 확인

```bash
supabase migration list --linked
```

### 롤백

```bash
# 롤백 스크립트 실행
psql $DATABASE_URL -f supabase/migrations/rollback/<파일명>.sql
```

---

## 트러블슈팅

### 빌드 실패

```bash
# 로컬에서 프로덕션 빌드 테스트
NODE_ENV=production npm run build

# 타입 에러 확인
npm run typecheck
```

### 환경 변수 누락

```
Error: Missing required environment variable: XXX
```

- Vercel 대시보드에서 환경 변수 확인
- Preview/Production 환경 설정 확인

### 데이터베이스 연결 실패

```
Error: Could not connect to Supabase
```

- `NEXT_PUBLIC_SUPABASE_URL` 확인
- Supabase 대시보드에서 상태 확인
- 네트워크 방화벽 규칙 확인

---

## 연락처

| 역할      | 담당 |
| --------- | ---- |
| 기술 리드 | -    |
| 인프라    | -    |
| 보안      | -    |

---

**Version**: 1.1 | **Updated**: 2026-02-02 | 자동 롤백 시스템 추가
