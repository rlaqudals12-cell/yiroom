# 이룸(Yiroom) 프로젝트 종합 진단 및 문서화 요청

## 프로젝트 개요
- **플랫폼**: AI 기반 통합 웰니스/뷰티 플랫폼
- **기술 스택**: Next.js 16, React 19, TypeScript, Supabase, Clerk, Gemini 3 Pro, Tailwind CSS
- **타겟**: 한국 여성 10-30대 (향후 글로벌 확장)
- **핵심 기능**: 퍼스널컬러 + 피부 + 체형 + 얼굴형 통합 분석
- **슬로건**: "온전한 나는?" (What is my whole self?)

---

## 📋 요청 사항

전체 프로젝트를 **빠짐없이** 분석하여 아래 모든 항목을 종합 문서로 작성해줘.

---

# PART 1: 오류 진단 (Error Diagnosis)

## 1.1 Supabase 데이터베이스

### 연결 및 설정
- [ ] Supabase Client 초기화 상태 (`lib/supabase.ts` 또는 유사 파일)
- [ ] 환경변수 설정 확인 (`.env.local`)
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (서버 사이드용)
- [ ] 클라이언트/서버 사이드 Supabase 인스턴스 분리 여부
- [ ] 연결 풀링 설정

### 스키마 및 테이블
- [ ] 필요한 테이블 생성 여부
- [ ] 테이블 컬럼 타입 정의 적절성
- [ ] Primary Key / Foreign Key 설정
- [ ] 인덱스 설정 (쿼리 성능)
- [ ] ENUM 타입 정의
- [ ] JSON/JSONB 컬럼 구조
- [ ] 타임스탬프 컬럼 (created_at, updated_at) 자동 업데이트
- [ ] Soft delete 구현 여부 (deleted_at)

### 타입 동기화
- [ ] `types/supabase.ts` 또는 `database.types.ts` 존재 여부
- [ ] Supabase CLI로 타입 생성 (`supabase gen types typescript`)
- [ ] 실제 DB 스키마와 타입 정의 불일치
- [ ] Nullable 필드 처리

### RLS (Row Level Security)
- [ ] RLS 활성화 여부
- [ ] 각 테이블별 RLS 정책 정의
- [ ] SELECT/INSERT/UPDATE/DELETE 각각의 정책
- [ ] 사용자별 데이터 접근 제한 로직
- [ ] 서비스 롤 키 사용 시 RLS 우회 처리

### 관계 및 조인
- [ ] 테이블 간 관계 정의 (1:1, 1:N, N:M)
- [ ] 조인 쿼리 최적화
- [ ] Cascade 삭제 설정

### 마이그레이션
- [ ] 마이그레이션 파일 존재 여부 (`supabase/migrations/`)
- [ ] 마이그레이션 히스토리 관리
- [ ] 롤백 전략

### Storage
- [ ] Supabase Storage 버킷 설정
- [ ] 이미지 업로드 경로 및 정책
- [ ] 파일 크기 제한
- [ ] 허용 파일 타입
- [ ] CDN/캐싱 설정

### Edge Functions
- [ ] Edge Function 사용 여부
- [ ] 함수 배포 상태
- [ ] 환경변수 설정

---

## 1.2 인증 (Clerk)

### 설정
- [ ] Clerk 환경변수 설정
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
  - NEXT_PUBLIC_CLERK_SIGN_IN_URL
  - NEXT_PUBLIC_CLERK_SIGN_UP_URL
  - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
  - NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
- [ ] ClerkProvider 래핑 (`app/layout.tsx`)
- [ ] Clerk 테마/스타일 커스터마이징

### 미들웨어
- [ ] `middleware.ts` 설정 상태
- [ ] 보호된 라우트 목록 정의
- [ ] 공개 라우트 목록 정의
- [ ] API 라우트 보호
- [ ] 미들웨어 매칭 패턴

### Clerk-Supabase 연동
- [ ] user_id 동기화 방식
- [ ] Clerk Webhook으로 Supabase users 테이블 동기화
- [ ] JWT 토큰 Supabase에 전달 방식
- [ ] 세션 토큰 관리

### 사용자 메타데이터
- [ ] publicMetadata 활용
- [ ] privateMetadata 활용
- [ ] unsafeMetadata 활용

### 소셜 로그인
- [ ] Google 로그인 설정
- [ ] Kakao 로그인 설정 (한국 타겟)
- [ ] Apple 로그인 설정

### 세션 관리
- [ ] 세션 만료 처리
- [ ] 다중 디바이스 세션
- [ ] 로그아웃 처리

---

## 1.3 API 라우트 (App Router)

### 구조
- [ ] API 라우트 목록 (`app/api/*/route.ts`)
- [ ] RESTful 설계 준수
- [ ] 라우트 네이밍 일관성

### 에러 핸들링
- [ ] try-catch 블록 적용
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] 에러 응답 형식 통일
- [ ] 에러 로깅

### 타입 안전성
- [ ] Request body 타입 검증 (Zod 등)
- [ ] Response 타입 정의
- [ ] 쿼리 파라미터 검증

### 보안
- [ ] 인증 검증 (Clerk `auth()`)
- [ ] 권한 검증 (authorization)
- [ ] Rate limiting 구현
- [ ] CORS 설정
- [ ] 입력값 Sanitization
- [ ] SQL Injection 방지
- [ ] XSS 방지

### 성능
- [ ] 응답 캐싱 (`revalidate`)
- [ ] 스트리밍 응답 (필요시)
- [ ] 대용량 데이터 페이지네이션

---

## 1.4 AI 분석 모듈 (Gemini)

### 설정
- [ ] API 키 환경변수 (GEMINI_API_KEY)
- [ ] API 버전 및 모델 설정
- [ ] SDK 초기화

### 프롬프트 관리
- [ ] 프롬프트 템플릿 파일 분리
- [ ] 프롬프트 버전 관리
- [ ] 시스템 프롬프트 정의
- [ ] Few-shot 예시 포함

### 요청/응답 처리
- [ ] 요청 타임아웃 설정
- [ ] 재시도 로직 (exponential backoff)
- [ ] 응답 파싱 로직
- [ ] JSON 모드 활용
- [ ] 스트리밍 응답 처리

### 에러 핸들링
- [ ] API 에러 처리
- [ ] Rate limit 에러 처리
- [ ] 토큰 한도 초과 처리
- [ ] 네트워크 에러 처리
- [ ] Fallback 로직

### 이미지 분석
- [ ] 이미지 전처리 (리사이즈, 압축)
- [ ] Base64 인코딩
- [ ] 멀티모달 입력 처리
- [ ] 이미지 크기/해상도 제한

### 비용 최적화
- [ ] 토큰 사용량 모니터링
- [ ] 캐싱 전략
- [ ] 배치 처리

---

## 1.5 상태 관리

### 전역 상태
- [ ] 상태 관리 라이브러리 사용 여부 (Zustand, Jotai, Redux 등)
- [ ] Context API 사용 현황
- [ ] 전역 상태 구조 설계

### 서버 상태
- [ ] React Query / SWR 사용 여부
- [ ] 캐싱 전략
- [ ] 낙관적 업데이트 (Optimistic Update)
- [ ] 쿼리 무효화 (Query Invalidation)
- [ ] 에러/로딩 상태 처리

### 폼 상태
- [ ] React Hook Form 사용 여부
- [ ] Zod 스키마 검증
- [ ] 폼 에러 상태 관리
- [ ] 멀티스텝 폼 상태 유지

### 로컬 상태
- [ ] useState 적절한 사용
- [ ] useReducer 복잡한 상태 처리
- [ ] 상태 끌어올리기 vs Context

### 최적화
- [ ] 불필요한 리렌더링 방지
- [ ] useMemo / useCallback 적절한 사용
- [ ] React.memo 사용
- [ ] 상태 분리 (state colocation)

---

## 1.6 파일/폴더 구조

### 현재 구조 분석
- [ ] `app/` 디렉토리 구조
- [ ] `components/` 구조
- [ ] `lib/` 또는 `utils/` 구조
- [ ] `hooks/` 구조
- [ ] `types/` 구조
- [ ] `styles/` 구조
- [ ] `public/` 구조

### 권장 구조 제안
```
app/
├── (auth)/              # 인증 관련 라우트 그룹
├── (main)/              # 메인 앱 라우트 그룹
├── api/                 # API 라우트
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── ui/                  # 기본 UI 컴포넌트 (Button, Input 등)
├── features/            # 기능별 컴포넌트
│   ├── personal-color/
│   ├── skin-analysis/
│   ├── body-type/
│   └── face-shape/
├── layout/              # 레이아웃 컴포넌트 (Header, Footer 등)
└── shared/              # 공유 컴포넌트

lib/
├── supabase/
├── clerk/
├── gemini/
├── utils/
└── constants/

hooks/
├── use-auth.ts
├── use-analysis.ts
└── ...

types/
├── supabase.ts
├── analysis.ts
└── ...
```

### 네이밍 컨벤션
- [ ] 파일명 컨벤션 (kebab-case, PascalCase 등)
- [ ] 컴포넌트명 컨벤션
- [ ] 함수명 컨벤션
- [ ] 변수명 컨벤션
- [ ] 타입명 컨벤션

---

## 1.7 TypeScript 설정

### tsconfig.json
- [ ] strict 모드 활성화
- [ ] strictNullChecks
- [ ] noImplicitAny
- [ ] 경로 별칭 (paths) 설정

### 타입 정의
- [ ] 모든 함수 파라미터/반환 타입 정의
- [ ] 컴포넌트 Props 타입 정의
- [ ] API 응답 타입 정의
- [ ] any 타입 사용 제거
- [ ] unknown vs any 적절한 사용
- [ ] 제네릭 활용

### 타입 에러
- [ ] 현재 TypeScript 컴파일 에러 목록
- [ ] 타입 단언(as) 과다 사용
- [ ] @ts-ignore / @ts-expect-error 사용

---

## 1.8 환경 설정

### 환경변수
- [ ] `.env.local` 파일 구조
- [ ] `.env.example` 파일 존재 (샘플)
- [ ] 환경별 설정 (development, staging, production)
- [ ] 민감한 키 노출 여부 (NEXT_PUBLIC_ 주의)

### Next.js 설정
- [ ] `next.config.js` 설정
- [ ] 이미지 도메인 허용
- [ ] 리다이렉트/리라이트 규칙
- [ ] 헤더 설정

### 패키지 설정
- [ ] `package.json` scripts
- [ ] 의존성 버전 관리
- [ ] peer dependency 충돌
- [ ] 보안 취약점 (`npm audit`)

---

## 1.9 빌드 및 배포

### 빌드 에러
- [ ] `npm run build` 에러 목록
- [ ] 미사용 import/변수 경고
- [ ] 순환 참조 (circular dependency)
- [ ] 동적 import 이슈

### 번들 최적화
- [ ] 번들 사이즈 분석 (`@next/bundle-analyzer`)
- [ ] Tree shaking 확인
- [ ] 코드 스플리팅
- [ ] Dynamic imports 활용

### Vercel 배포 (예상)
- [ ] 환경변수 설정
- [ ] 빌드 명령어
- [ ] 출력 디렉토리
- [ ] 서버리스 함수 설정
- [ ] Edge 런타임 사용 여부

---

## 1.10 성능 최적화

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint)
- [ ] FID (First Input Delay)
- [ ] CLS (Cumulative Layout Shift)
- [ ] TTFB (Time to First Byte)

### 이미지 최적화
- [ ] next/image 사용
- [ ] 이미지 포맷 (WebP, AVIF)
- [ ] 적절한 sizes 속성
- [ ] lazy loading
- [ ] placeholder blur

### 폰트 최적화
- [ ] next/font 사용
- [ ] 폰트 서브셋
- [ ] font-display 설정
- [ ] 프리로드

### JavaScript 최적화
- [ ] 코드 스플리팅
- [ ] Dynamic imports
- [ ] 서드파티 스크립트 지연 로딩
- [ ] 불필요한 polyfill 제거

### 캐싱
- [ ] API 응답 캐싱
- [ ] 정적 페이지 캐싱 (ISR)
- [ ] 브라우저 캐싱 헤더
- [ ] CDN 캐싱

### 메모리 관리
- [ ] 메모리 누수 가능성
- [ ] 이벤트 리스너 정리
- [ ] 구독 해제
- [ ] 큰 객체 참조 정리

---

## 1.11 보안

### 인증/인가
- [ ] 인증 토큰 보안 저장
- [ ] CSRF 방지
- [ ] 세션 하이재킹 방지

### 입력 검증
- [ ] 모든 사용자 입력 검증
- [ ] XSS 방지 (dangerouslySetInnerHTML 주의)
- [ ] SQL Injection 방지
- [ ] 파일 업로드 검증

### API 보안
- [ ] Rate limiting
- [ ] API 키 노출 방지
- [ ] HTTPS 강제
- [ ] 민감한 데이터 암호화

### 의존성 보안
- [ ] npm audit 결과
- [ ] 알려진 취약점
- [ ] 정기 업데이트 계획

---

## 1.12 에러 처리 및 로깅

### 전역 에러 처리
- [ ] Error Boundary 구현 (`error.tsx`)
- [ ] 전역 에러 페이지 (`global-error.tsx`)
- [ ] Not Found 페이지 (`not-found.tsx`)
- [ ] Loading 상태 (`loading.tsx`)

### 에러 로깅
- [ ] 에러 트래킹 서비스 (Sentry 등)
- [ ] 서버 사이드 로깅
- [ ] 클라이언트 사이드 로깅
- [ ] 에러 리포트 형식

### 사용자 친화적 에러
- [ ] 에러 메시지 한글화
- [ ] 복구 가능한 액션 제공
- [ ] 에러 상태 UI

---

# PART 2: UI/UX 진단 (UI/UX Diagnosis)

## 2.1 레이아웃 분석

### 반응형 디자인
- [ ] 브레이크포인트 정의 (sm, md, lg, xl, 2xl)
- [ ] Mobile-first 접근
- [ ] 각 브레이크포인트별 레이아웃 확인
- [ ] 테블릿 대응

### 레이아웃 깨짐
- [ ] Flexbox 오류
- [ ] Grid 오류
- [ ] 오버플로우 처리 (overflow-hidden, overflow-auto)
- [ ] 텍스트 오버플로우 (truncate, line-clamp)
- [ ] 이미지 비율 유지 (aspect-ratio, object-fit)

### z-index 관리
- [ ] z-index 충돌
- [ ] 모달/드롭다운 레이어
- [ ] 고정 요소 (fixed, sticky)

---

## 2.2 디자인 토큰

### 색상 시스템
```
Primary: 메인 브랜드 컬러
Secondary: 보조 컬러
Accent: 강조 컬러
Neutral: 회색 계열 (50~900)
Semantic:
  - Success (green)
  - Warning (yellow)
  - Error (red)
  - Info (blue)
```
- [ ] 색상 변수 정의 (`tailwind.config.js` 또는 CSS 변수)
- [ ] 다크모드 색상 대응
- [ ] 색상 대비 (접근성)

### 타이포그래피
```
Font Family: 
  - Pretendard (한글)
  - Inter (영문)
  
Font Size Scale:
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 30px
  - 4xl: 36px

Font Weight:
  - normal: 400
  - medium: 500
  - semibold: 600
  - bold: 700
```
- [ ] 폰트 일관성
- [ ] 행간 (line-height)
- [ ] 자간 (letter-spacing)

### 간격 시스템
```
Spacing Scale (4px 기준):
  0: 0px
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
```
- [ ] 간격 일관성
- [ ] 컴포넌트 내부 패딩
- [ ] 컴포넌트 간 마진

### 기타 토큰
- [ ] Border radius (rounded 값)
- [ ] Shadow (그림자)
- [ ] Transition (애니메이션 시간)

---

## 2.3 컴포넌트 일관성

### 공통 컴포넌트 목록
- [ ] Button (variants: primary, secondary, outline, ghost, destructive)
- [ ] Input (text, email, password, number)
- [ ] Textarea
- [ ] Select / Dropdown
- [ ] Checkbox / Radio
- [ ] Switch / Toggle
- [ ] Card
- [ ] Modal / Dialog
- [ ] Toast / Alert
- [ ] Badge / Tag
- [ ] Avatar
- [ ] Skeleton / Loading
- [ ] Tabs
- [ ] Accordion
- [ ] Progress Bar
- [ ] Tooltip

### 컴포넌트 상태
각 컴포넌트별:
- [ ] Default 상태
- [ ] Hover 상태
- [ ] Focus 상태
- [ ] Active 상태
- [ ] Disabled 상태
- [ ] Loading 상태
- [ ] Error 상태

### 아이콘 시스템
- [ ] 아이콘 라이브러리 (Lucide, Heroicons 등)
- [ ] 아이콘 크기 일관성
- [ ] 아이콘 색상 통일

---

## 2.4 페이지별 UI 상태

### 온보딩 플로우
- [ ] 스플래시/웰컴 페이지
- [ ] 회원가입 페이지
- [ ] 로그인 페이지
- [ ] 초기 설정 (프로필, 선호도)
- [ ] 온보딩 완료

### 메인 대시보드
- [ ] 헤더/네비게이션
- [ ] 사이드바 (있다면)
- [ ] 메인 콘텐츠 영역
- [ ] 분석 결과 요약 카드
- [ ] 빠른 액션 버튼

### 분석 페이지들
- [ ] 퍼스널컬러 분석 페이지
- [ ] 피부 분석 페이지
- [ ] 체형 분석 페이지
- [ ] 얼굴형 분석 페이지 (추가 예정)

### 분석 결과 페이지들
- [ ] 개별 결과 페이지
- [ ] 통합 결과 페이지
- [ ] 추천 페이지

### 설정 페이지
- [ ] 프로필 설정
- [ ] 알림 설정
- [ ] 언어 설정
- [ ] 테마 설정
- [ ] 계정 관리
- [ ] 구독 관리

### 기타 페이지
- [ ] 404 페이지
- [ ] 500 에러 페이지
- [ ] 로딩 페이지
- [ ] 유지보수 페이지

---

## 2.5 사용성 (Usability)

### 피드백
- [ ] 로딩 상태 표시 (스피너, 스켈레톤, 프로그레스)
- [ ] 성공 피드백 (토스트, 모달)
- [ ] 에러 피드백 (인라인 에러, 토스트)
- [ ] 빈 상태 (Empty State) UI
- [ ] 확인 다이얼로그 (삭제 등 위험 액션)

### 네비게이션
- [ ] 뒤로가기 처리
- [ ] 브레드크럼
- [ ] 현재 위치 표시
- [ ] 딥링크 지원

### 폼 UX
- [ ] 실시간 유효성 검사
- [ ] 에러 메시지 위치
- [ ] 필수/선택 필드 표시
- [ ] 자동완성 지원
- [ ] 입력 마스크 (전화번호 등)

### 인터랙션
- [ ] 클릭 가능 영역 충분한 크기 (44px 이상)
- [ ] 호버 효과
- [ ] 포커스 인디케이터
- [ ] 키보드 네비게이션
- [ ] 터치 친화적

---

## 2.6 접근성 (Accessibility)

### 시맨틱 HTML
- [ ] 적절한 heading 구조 (h1~h6)
- [ ] landmark 요소 (header, main, nav, footer)
- [ ] 리스트 마크업 (ul, ol)
- [ ] 버튼 vs 링크 적절한 사용

### ARIA
- [ ] aria-label 적용
- [ ] aria-labelledby 적용
- [ ] aria-describedby 적용
- [ ] aria-hidden 적용
- [ ] role 속성

### 키보드 접근성
- [ ] Tab 순서
- [ ] Focus trap (모달)
- [ ] Skip link
- [ ] 키보드 단축키

### 색상 대비
- [ ] 텍스트 대비 (WCAG AA: 4.5:1)
- [ ] 큰 텍스트 대비 (WCAG AA: 3:1)
- [ ] 색상만으로 정보 전달 안함

### 이미지
- [ ] alt 텍스트
- [ ] 장식용 이미지 처리

---

## 2.7 애니메이션 및 트랜지션

### 일관된 애니메이션
- [ ] 페이지 전환
- [ ] 컴포넌트 등장/퇴장
- [ ] 호버/포커스 효과
- [ ] 로딩 애니메이션

### 성능 고려
- [ ] will-change 사용
- [ ] transform/opacity 사용 (layout thrashing 방지)
- [ ] 애니메이션 duration 일관성 (150ms, 300ms 등)

### 모션 감소
- [ ] prefers-reduced-motion 대응

---

## 2.8 다크모드

### 구현 상태
- [ ] 다크모드 토글 기능
- [ ] 시스템 설정 따르기 옵션
- [ ] 모든 컴포넌트 다크모드 스타일
- [ ] 이미지/아이콘 다크모드 대응
- [ ] 색상 대비 유지

---

# PART 3: 모듈별 연동 구조 (Module Integration)

## 3.1 전체 아키텍처

### 현재 데이터 흐름
```
[사용자 입력/이미지]
        ↓
[Clerk 인증 확인]
        ↓
[분석 API 호출]
        ↓
[Gemini AI 분석]
        ↓
[결과 Supabase 저장]
        ↓
[결과 페이지 렌더링]
```

### 모듈 구조
```
┌─────────────────────────────────────────────────┐
│                   이룸 플랫폼                     │
├─────────────────────────────────────────────────┤
│  [인증 모듈]     [분석 모듈]      [결과 모듈]     │
│  - Clerk        - 퍼스널컬러      - 개별 결과     │
│  - 세션관리     - 피부 분석       - 통합 결과     │
│                 - 체형 분석       - 추천          │
│                 - 얼굴형 분석     - 히스토리      │
├─────────────────────────────────────────────────┤
│  [공통 모듈]                                      │
│  - UI 컴포넌트  - API 클라이언트  - 유틸리티     │
│  - 훅          - 타입 정의       - 상수          │
├─────────────────────────────────────────────────┤
│  [데이터 계층]                                    │
│  - Supabase DB  - 이미지 Storage  - 캐시        │
└─────────────────────────────────────────────────┘
```

---

## 3.2 모듈간 데이터 공유

### 사용자 프로필 데이터
```typescript
interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  
  // 분석 결과 참조
  personal_color_id?: string;
  skin_analysis_id?: string;
  body_type_id?: string;
  face_shape_id?: string;
}
```

### 분석 결과 통합
```typescript
interface IntegratedAnalysis {
  user_id: string;
  
  // 개별 분석 결과
  personal_color: PersonalColorResult;
  skin_analysis: SkinAnalysisResult;
  body_type: BodyTypeResult;
  face_shape: FaceShapeResult;  // 추가 예정
  
  // 통합 추천
  integrated_recommendations: {
    style_keywords: string[];
    color_palette: string[];
    fashion_tips: string[];
    makeup_tips: string[];
    hair_tips: string[];
  };
  
  created_at: Date;
}
```

### 크로스 모듈 로직
- [ ] 퍼스널컬러 → 메이크업 추천 연계
- [ ] 체형 → 패션 추천 연계
- [ ] 얼굴형 → 헤어/안경 추천 연계
- [ ] 통합 분석 → 종합 스타일링 가이드

---

## 3.3 신규 모듈 추가 계획

### 얼굴형 분석 모듈
- [ ] 이미지 업로드 컴포넌트
- [ ] MediaPipe 연동 (또는 Gemini Vision)
- [ ] 6가지 얼굴형 분류
- [ ] 이목구비 분석
- [ ] 결과 저장 테이블
- [ ] 결과 표시 페이지
- [ ] 스타일링 추천 연계

### 다국어 모듈
- [ ] i18n 라이브러리 설정
- [ ] 번역 파일 구조
- [ ] 언어 전환 컴포넌트
- [ ] URL 기반 언어 라우팅
- [ ] 날짜/숫자 포맷팅

---

## 3.4 API 설계

### 엔드포인트 구조
```
/api/auth/
  - webhook (Clerk 웹훅)

/api/analysis/
  - personal-color (POST: 분석, GET: 결과)
  - skin (POST: 분석, GET: 결과)
  - body-type (POST: 분석, GET: 결과)
  - face-shape (POST: 분석, GET: 결과)
  - integrated (GET: 통합 결과)

/api/user/
  - profile (GET, PUT)
  - settings (GET, PUT)
  - history (GET)

/api/recommendations/
  - style (GET)
  - products (GET)
```

---

# PART 4: 다국어 (i18n) 구현 계획

## 4.1 현재 하드코딩 텍스트 추출

- [ ] 모든 한글 텍스트 목록화
- [ ] 파일별/컴포넌트별 분류
- [ ] 동적 텍스트 vs 정적 텍스트 구분

## 4.2 i18n 구조 제안

### 라이브러리 선택
- [ ] next-intl (권장 - App Router 최적화)
- [ ] react-i18next
- [ ] 직접 구현

### 폴더 구조
```
messages/
├── ko/
│   ├── common.json
│   ├── auth.json
│   ├── analysis.json
│   ├── results.json
│   └── settings.json
├── en/
│   └── ...
└── ja/
    └── ...
```

### 번역 키 컨벤션
```json
{
  "common": {
    "buttons": {
      "submit": "제출",
      "cancel": "취소",
      "save": "저장"
    },
    "labels": {
      "email": "이메일",
      "password": "비밀번호"
    }
  },
  "analysis": {
    "personalColor": {
      "title": "퍼스널컬러 진단",
      "description": "당신에게 어울리는 컬러를 찾아보세요"
    }
  }
}
```

## 4.3 지원 언어
- [ ] 한국어 (ko) - 기본
- [ ] 영어 (en)
- [ ] 일본어 (ja) - Phase 2

## 4.4 구현 체크리스트
- [ ] 라이브러리 설치 및 설정
- [ ] 미들웨어 설정 (언어 감지)
- [ ] 언어 전환 UI
- [ ] 모든 텍스트 번역 키로 교체
- [ ] 날짜/시간 포맷팅
- [ ] 숫자 포맷팅
- [ ] 복수형 처리
- [ ] RTL 대응 (향후 아랍어 등)

---

# PART 5: 디자인 시스템 정의

## 5.1 Tailwind 설정 최적화

### tailwind.config.js
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
        secondary: { /* ... */ },
        // ...
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'sans-serif'],
      },
      spacing: { /* 커스텀 간격 */ },
      borderRadius: { /* 커스텀 반경 */ },
      boxShadow: { /* 커스텀 그림자 */ },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## 5.2 컴포넌트 라이브러리

### 사용 여부 결정
- [ ] shadcn/ui (권장)
- [ ] Radix UI
- [ ] Headless UI
- [ ] 직접 구현

### 컴포넌트 문서화
- [ ] Storybook 도입 여부
- [ ] 컴포넌트 사용 가이드

---

# PART 6: 테스트 전략

## 6.1 테스트 종류

### 유닛 테스트
- [ ] 유틸 함수 테스트
- [ ] 커스텀 훅 테스트
- [ ] 컴포넌트 로직 테스트

### 통합 테스트
- [ ] API 라우트 테스트
- [ ] 페이지 렌더링 테스트
- [ ] 폼 제출 테스트

### E2E 테스트
- [ ] 사용자 플로우 테스트
- [ ] 크로스 브라우저 테스트

## 6.2 테스트 도구
- [ ] Jest
- [ ] React Testing Library
- [ ] Playwright / Cypress
- [ ] MSW (API 모킹)

---

# PART 7: 문서 출력 요청

## 생성해야 할 문서 목록

1. **PROJECT_DIAGNOSIS.md**
   - 전체 오류 목록
   - 각 오류별 원인 분석
   - 해결 코드/방법
   - 우선순위 (Critical/High/Medium/Low)
   - 예상 작업 시간

2. **UI_UX_AUDIT.md**
   - 페이지별 UI 문제점
   - 컴포넌트 일관성 이슈
   - 반응형 깨짐 목록
   - 수정 방안 및 코드

3. **MODULE_INTEGRATION.md**
   - 현재 아키텍처 다이어그램
   - 데이터 흐름도
   - 모듈간 인터페이스 정의
   - 신규 모듈 추가 가이드

4. **I18N_IMPLEMENTATION.md**
   - 하드코딩 텍스트 목록
   - 번역 파일 구조
   - 구현 단계별 가이드
   - 체크리스트

5. **DESIGN_SYSTEM.md**
   - 디자인 토큰 정의
   - 컴포넌트 스타일 가이드
   - Tailwind 설정
   - 사용 예시

6. **SUPABASE_SCHEMA.sql**
   - 전체 테이블 DDL
   - RLS 정책
   - 인덱스
   - 시드 데이터

7. **REFACTORING_ROADMAP.md**
   - 단계별 리팩토링 계획
   - 우선순위 매트릭스
   - 일정 제안
   - 체크리스트

8. **API_DOCUMENTATION.md**
   - 엔드포인트 목록
   - 요청/응답 형식
   - 에러 코드
   - 사용 예시

9. **TESTING_GUIDE.md**
   - 테스트 전략
   - 테스트 케이스 목록
   - 실행 방법

10. **SECURITY_CHECKLIST.md**
    - 보안 점검 항목
    - 현재 상태
    - 개선 필요 사항

---

# PART 8: 추가 요청사항

## 분석 시 주의사항
- [ ] 모든 파일을 빠짐없이 확인해줘
- [ ] 잠재적 오류 가능성도 포함해줘
- [ ] 각 문제에 대한 구체적 해결 코드를 작성해줘
- [ ] 파일 경로와 라인 번호를 명시해줘
- [ ] 우선순위를 명확히 표시해줘
- [ ] 예상 작업 시간을 함께 표시해줘
- [ ] 한국어로 모든 문서를 작성해줘

## 코드 작성 시 요청
- [ ] TypeScript strict 모드 기준
- [ ] ESLint/Prettier 규칙 준수
- [ ] 주석 포함 (한글)
- [ ] 에러 핸들링 포함
- [ ] 타입 정의 포함

## 문서 형식
- [ ] Markdown 형식
- [ ] 목차 포함
- [ ] 코드 블록에 언어 명시
- [ ] 체크리스트 형식 활용
- [ ] 표 형식 활용 (비교 시)

---

# 시작해줘!

위 모든 항목을 분석하고, 요청된 문서들을 생성해줘.
가장 먼저 전체 프로젝트 구조를 파악하고, 
Critical 수준의 오류부터 보고해줘.
