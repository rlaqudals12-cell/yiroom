# BUNDLE-01: Next.js 기술 스택 통합

> Next.js 16 기반 프로젝트의 핵심 기술 스택 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-01 |
| **우선순위** | P0 (최우선) |
| **예상 시간** | 3시간 |
| **도메인** | 기술/인프라 |
| **포함 항목** | SEO-NEXTJS-2026, RATE-LIMIT-REDIS, PERFORMANCE-2026, DATA-FETCHING-2026 |

---

## 입력

### 참조 문서
- `docs/specs/SDD-*.md` - 기존 스펙 문서
- `apps/web/next.config.ts` - 현재 Next.js 설정
- `.claude/rules/nextjs-conventions.md` - Next.js 규칙
- `.claude/rules/performance-guidelines.md` - 성능 가이드라인

### 선행 리서치
- 없음 (독립적)

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/SEO-NEXTJS-2026-R1.md` | Next.js 16 SEO 최적화 전략 |
| `docs/research/claude-ai-research/RATE-LIMIT-REDIS-R1.md` | Upstash Redis 기반 Rate Limiting |
| `docs/research/claude-ai-research/PERFORMANCE-2026-R1.md` | Core Web Vitals 최적화 |
| `docs/research/claude-ai-research/DATA-FETCHING-2026-R1.md` | Server Components 데이터 패칭 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### SEO-NEXTJS-2026

```
Next.js 16 (2026년) 기반 한국어 웹앱의 SEO 최적화 전략을 조사해주세요.

조사 범위:
1. Next.js 16의 SEO 관련 새 기능 (Metadata API v2, generateMetadata 패턴)
2. 한국 검색엔진(Naver, Daum) 최적화 전략
3. Google 검색 최적화 (Core Web Vitals, 구조화된 데이터)
4. 동적 OG 이미지 생성 (next/og, Satori)
5. 다국어 SEO (i18n, hreflang)
6. sitemap.xml, robots.txt 자동 생성 전략

기대 결과:
- 이룸 프로젝트 적용 가능한 SEO 체크리스트
- Next.js 16 Metadata API 활용 코드 패턴
- 한국 검색엔진 특화 최적화 방법
```

### RATE-LIMIT-REDIS

```
Upstash Redis와 Next.js 16을 활용한 Rate Limiting 구현 전략을 조사해주세요.

조사 범위:
1. Upstash Ratelimit 라이브러리 최신 사용법
2. 슬라이딩 윈도우 vs 토큰 버킷 알고리즘 비교
3. 사용자별/IP별/엔드포인트별 제한 전략
4. Edge Runtime에서의 Rate Limiting
5. 429 응답 처리 및 Retry-After 헤더
6. 모니터링 및 알림 설정

기대 결과:
- AI 분석 API (50req/24h) 제한 구현 코드
- Rate Limit 우회 방지 전략
- 모니터링 대시보드 설정 방법

참고: 현재 lib/security/rate-limit.ts에 기본 구현 있음
```

### PERFORMANCE-2026

```
2026년 기준 웹 성능 최적화 전략을 조사해주세요.

조사 범위:
1. Core Web Vitals 2026 업데이트 (INP 포함)
2. Next.js 16 성능 최적화 기능
3. 이미지 최적화 (next/image, AVIF, WebP)
4. 번들 크기 최적화 (Tree Shaking, Dynamic Import)
5. 서버 컴포넌트 성능 이점
6. Edge Runtime 활용

기대 결과:
- Lighthouse 90+ 달성 체크리스트
- 번들 크기 목표 및 측정 방법
- 성능 모니터링 도구 추천

참고: .claude/rules/performance-guidelines.md 목표 확인
```

### DATA-FETCHING-2026

```
Next.js 16 Server Components 환경에서의 데이터 패칭 전략을 조사해주세요.

조사 범위:
1. Server Components에서 직접 fetch vs API 라우트
2. Supabase와 Server Components 통합 패턴
3. 캐싱 전략 (unstable_cache, revalidate)
4. Streaming과 Suspense 활용
5. 병렬 데이터 로딩 패턴
6. 에러 바운더리 및 폴백 UI

기대 결과:
- Supabase + Server Components 표준 패턴
- 캐싱 전략 의사결정 트리
- 에러 처리 표준 패턴
```

---

## 의존성

```
선행: 없음
후행: BUNDLE-04 (UX), BUNDLE-07 (Ops), BUNDLE-09 (Personalization)
병렬: BUNDLE-02 (Biz), BUNDLE-05 (Platform), BUNDLE-11 (Legal)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 각 파일 RESEARCH-OUTPUT-FORMAT.md 준수
- [ ] 코드 예시 포함
- [ ] 이룸 프로젝트 적용 방안 명시

---

**Version**: 1.0 | **Created**: 2026-01-18
