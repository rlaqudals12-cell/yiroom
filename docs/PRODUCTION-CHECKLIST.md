# 이룸 프로덕션 배포 체크리스트

> **목표 런칭일**: 2025년 1월 20일
> **작성일**: 2025-12-25

---

## 1. 환경 변수 설정

### 필수 환경 변수

| 변수명 | 설명 | 설정 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 공개 키 (pk_live_...) | Vercel/호스팅 |
| `CLERK_SECRET_KEY` | Clerk 비밀 키 (sk_live_...) | Vercel/호스팅 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Vercel/호스팅 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | Vercel/호스팅 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | Vercel/호스팅 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API 키 | Vercel/호스팅 |
| `NEXT_PUBLIC_SITE_URL` | 프로덕션 사이트 URL | Vercel/호스팅 |

### 어필리에이트 환경 변수 (수익화)

| 변수명 | 설명 | 설정 위치 |
|--------|------|-----------|
| `COUPANG_ACCESS_KEY` | 쿠팡 파트너스 Access Key | Vercel/호스팅 |
| `COUPANG_SECRET_KEY` | 쿠팡 파트너스 Secret Key | Vercel/호스팅 |

### 선택 환경 변수

| 변수명 | 설명 | 권장 |
|--------|------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry 에러 모니터링 | 강력 권장 |
| `SENTRY_AUTH_TOKEN` | Sentry 소스맵 업로드용 | 권장 |
| `CRON_SECRET` | Cron 작업 인증 | Vercel 자동 |

---

## 2. Clerk 설정

### 프로덕션 키 발급
- [ ] [Clerk 대시보드](https://dashboard.clerk.com) 접속
- [ ] 프로덕션 인스턴스 생성 또는 기존 인스턴스 선택
- [ ] API Keys 메뉴에서 Production 키 복사
  - `pk_live_...` (Publishable key)
  - `sk_live_...` (Secret key)

### 도메인 설정
- [ ] Clerk 대시보드 > Domains에서 프로덕션 도메인 추가
- [ ] HTTPS 인증서 확인

### 법적 문서 URL 설정 (필수)
- [ ] Clerk 대시보드 > Settings > Legal
  - Terms of Service URL: `https://yiroom.app/terms`
  - Privacy Policy URL: `https://yiroom.app/privacy`
- [ ] 회원가입 시 동의 체크박스 표시 확인

### 소셜 로그인 설정 (선택)
- [ ] Google OAuth 클라이언트 ID 설정
- [ ] Apple Sign In 설정 (iOS 앱용)

---

## 3. Supabase 설정

### 프로덕션 프로젝트
- [ ] [Supabase 대시보드](https://supabase.com/dashboard) 접속
- [ ] 프로덕션 프로젝트 생성 또는 기존 프로젝트 사용
- [ ] Project Settings > API에서 키 복사
  - `Project URL`
  - `anon public` 키
  - `service_role` 키 (비밀 유지!)

### 데이터베이스 마이그레이션
- [ ] 모든 마이그레이션 적용 확인
  ```bash
  npx supabase db push
  ```
- [ ] RLS 정책 활성화 확인
- [ ] 인덱스 생성 확인

### 연결 풀링
- [ ] Connection Pooling 활성화 (선택)
- [ ] Pooler URL 사용 권장 (높은 동시 접속 시)

---

## 4. Google AI (Gemini) 설정

- [ ] [Google AI Studio](https://aistudio.google.com/apikey) 접속
- [ ] 프로덕션용 API 키 생성
- [ ] API 키 제한 설정 (권장)
  - HTTP 리퍼러 제한
  - API 제한 (Generative Language API만)
- [ ] 사용량 알림 설정

---

## 5. 쿠팡 파트너스 설정 (수익화)

### 가입 및 API 발급
- [ ] [쿠팡 파트너스](https://partners.coupang.com/) 가입
- [ ] 사업자 정보 또는 개인 정보 등록
- [ ] API 키 발급
  - `Access Key`
  - `Secret Key`

### 환경 변수
```
COUPANG_ACCESS_KEY=your-coupang-access-key
COUPANG_SECRET_KEY=your-coupang-secret-key
```

### 기능 확인
- [ ] 제품 상세 페이지에서 "구매하기" 버튼 클릭 시 쿠팡 링크로 이동
- [ ] 클릭 트래킹 정상 동작 (`affiliate_clicks` 테이블)
- [ ] 관리자 대시보드에서 통계 확인

---

## 6. Sentry 설정 (강력 권장)

### 프로젝트 생성
- [ ] [Sentry](https://sentry.io) 계정 생성
- [ ] Next.js 프로젝트 생성
- [ ] DSN 복사

### 환경 변수
```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=yiroom
SENTRY_AUTH_TOKEN=sntrys_...
```

### 소스맵 업로드
- [ ] Vercel Integration 또는 수동 설정
- [ ] 빌드 시 소스맵 업로드 확인

---

## 7. Vercel 배포 설정

### 프로젝트 연결
- [ ] GitHub 레포지토리 연결
- [ ] 빌드 명령어 확인: `npm run build`
- [ ] 출력 디렉토리: `.next`

### 환경 변수 추가
- [ ] 모든 필수 환경 변수 추가
- [ ] Production/Preview/Development 구분 설정

### 도메인 설정
- [ ] 커스텀 도메인 연결 (yiroom.app)
- [ ] SSL 인증서 자동 발급 확인
- [ ] www 리다이렉트 설정

### 빌드 최적화
- [ ] Edge Functions 활성화 (필요시)
- [ ] ISR/SSG 캐싱 확인

---

## 8. 성능 검증

### 적용된 최적화 (2025-12-30)
- [x] 이미지 최적화: AVIF, WebP 포맷 지원
- [x] PWA 캐싱: 정적 자산, API, 페이지 캐싱
- [x] 트리 쉐이킹: lucide-react, date-fns, recharts
- [x] Dynamic Import: 13개 무거운 컴포넌트 지연 로딩
- [x] Preconnect hints: fonts.googleapis.com, clerk.com, supabase.co
- [x] 폰트 최적화: display: swap, preload
- [x] 프로덕션 console.log 제거

### Lighthouse 점수 (프로덕션 배포 후 측정)
- [ ] Performance: 90+ 목표
- [ ] Accessibility: 90+ 목표
- [ ] Best Practices: 90+ 목표
- [ ] SEO: 90+ 목표

> **참고**: 로컬 테스트 시 Clerk 인증 리다이렉트로 인해 정확한 측정 불가. 프로덕션 배포 후 PageSpeed Insights로 측정 필요.

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

---

## 9. 보안 검증

### 필수 확인
- [ ] 환경 변수에 민감 정보 노출 없음
- [ ] RLS 정책 모든 테이블 적용
- [ ] HTTPS 강제 리다이렉트
- [ ] CORS 설정 확인

### 선택 확인
- [ ] CSP (Content Security Policy) 설정
- [ ] Rate Limiting 적용
- [ ] SQL Injection 방지 확인

---

## 10. 법적 문서

### 완료
- [x] 개인정보처리방침 업데이트 (2025-01-20)
- [x] 이용약관 업데이트 (2025-01-20)
- [x] 오픈소스 라이선스 페이지 생성 (2025-12-30)
- [x] 홈페이지 푸터 법적 링크 추가 (2025-12-30)

### 확인
- [x] 푸터에 링크 표시 확인
- [ ] 회원가입 시 동의 절차 확인 (Clerk 대시보드 설정 필요)

---

## 11. 테스트 검증

### 자동화 테스트
- [x] E2E 테스트 통과 (62/62 passed)
- [x] 빌드 성공
- [x] TypeScript 타입체크 통과
- [x] ESLint 통과

### 수동 테스트
- [ ] 모든 주요 기능 수동 테스트
- [ ] 모바일 반응형 확인
- [x] 다크모드 확인 (2025-12-30 UI/UX 개선 완료)
- [ ] 다양한 브라우저 테스트 (Chrome, Safari, Firefox)

### UI/UX 개선 (2025-12-30)
- [x] 접근성: 설정 Toggle에 aria-checked, role="switch" 추가
- [x] 다크모드: 홈페이지 히어로 오버레이 대응
- [x] 다크모드: 영양 에러 상태 4개 페이지 수정
- [x] 브랜드 일관성: 운동 그라디언트 Orange 색상 통일
- [x] 반응형: 홈페이지 모듈 태그 모바일 가로 스크롤
- [x] 테스트: 대시보드 페이지 data-testid 추가

---

## 12. 모니터링 설정

### 에러 모니터링
- [ ] Sentry 알림 설정
- [ ] 슬랙/이메일 연동

### 성능 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Speed Insights 활성화

### 로그 모니터링
- [ ] Vercel Logs 확인 방법 숙지
- [ ] 주요 에러 패턴 파악

---

## 13. 런칭 후 체크리스트

### 첫 주
- [ ] 에러 모니터링 집중
- [ ] 사용자 피드백 수집
- [ ] 성능 메트릭 추적

### 핫픽스 준비
- [ ] 롤백 절차 숙지
- [ ] 긴급 배포 프로세스 확립

---

## 빠른 참조

### Vercel 배포 명령어
```bash
# 프로덕션 배포
vercel --prod

# 프리뷰 배포
vercel
```

### 환경 변수 템플릿
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Coupang Partners (어필리에이트)
COUPANG_ACCESS_KEY=your-access-key
COUPANG_SECRET_KEY=your-secret-key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# Site
NEXT_PUBLIC_SITE_URL=https://yiroom.app
```

---

**Version**: 1.0 | **Created**: 2025-12-25
