# Claude Code 기술 리서치 번들 (52개 항목)

> Claude Code (CLI/VSCode)에서 실행할 기술 리서치 + 구현 가이드
> **생성일**: 2026-01-19
> **용도**: 기술 Critical, RAG 심화, 크로스도메인, AI/보안

---

## 사용 방법

1. Claude Code에서 각 프롬프트 실행
2. WebSearch로 최신 정보 조사
3. 기존 코드 참조하며 리서치
4. 결과물을 파일로 직접 저장
5. 필요시 즉시 코드 구현

---

## 섹션 1: P0 기술 Critical (11개)

### 1-1. Next.js SEO 최적화 2026 (SEO-NEXTJS-2026)

```
## 리서치 요청

Next.js 16 App Router 기반 SEO 최적화 전략을 조사해주세요.

### 조사 항목
1. **메타데이터 API** (2026 최신)
   - generateMetadata 함수 패턴
   - 동적 OG 이미지 생성 (next/og)
   - JSON-LD 구조화 데이터

2. **Core Web Vitals 최적화**
   - LCP 최적화 (이미지, 폰트)
   - CLS 방지 패턴
   - INP 대응 (React 19)

3. **국제화 SEO**
   - 한국어 + 다국어 URL 구조
   - hreflang 태그
   - 지역별 검색 최적화

4. **기술적 SEO**
   - 사이트맵 자동 생성
   - robots.txt 설정
   - 캐노니컬 URL

### 현재 프로젝트 참조
- apps/web/app/layout.tsx
- apps/web/next.config.ts

### 출력
1. docs/research/claude-ai-research/SEO-1-R1-NextjsSEO2026.md
2. 구현 코드 예시 포함
```

### 1-2. Redis Rate Limiting (RATE-LIMIT-REDIS)

```
## 리서치 요청

Upstash Redis 기반 Rate Limiting 고도화 전략을 조사해주세요.

### 현재 구현 확인
apps/web/lib/security/rate-limit.ts 읽고 분석

### 조사 항목
1. **알고리즘 비교**
   - Fixed Window vs Sliding Window
   - Token Bucket vs Leaky Bucket
   - 현재 구현 vs 최적 알고리즘

2. **Upstash Ratelimit SDK**
   - 최신 버전 기능
   - 분산 환경 지원
   - 비용 최적화

3. **다층 Rate Limiting**
   - IP 기반 (익명 사용자)
   - User ID 기반 (인증 사용자)
   - API Key 기반 (향후 B2B)

4. **에러 처리 UX**
   - 429 응답 형식
   - Retry-After 헤더
   - 클라이언트 대응

### 출력
1. docs/research/claude-ai-research/RATE-1-R1-Redis고도화.md
2. 코드 개선안 포함
```

### 1-3. 이미지 처리 파이프라인 (CIE-PIPELINE)

```
## 리서치 요청

웹 기반 이미지 전처리 파이프라인 최적화를 조사해주세요.

### 현재 구현 확인
- apps/web/lib/image/ 디렉토리 탐색
- 이미지 품질 검증 로직 확인

### 조사 항목
1. **클라이언트 전처리**
   - Canvas API vs WebGL 성능
   - WASM 기반 처리 (Sharp 대안)
   - 웹 워커 활용

2. **품질 검증 알고리즘**
   - Laplacian variance (sharpness)
   - 밝기/대비 자동 감지
   - 얼굴 감지 (face-api.js vs MediaPipe)

3. **압축 최적화**
   - AVIF vs WebP vs JPEG 2026
   - 품질-크기 트레이드오프
   - 점진적 로딩

4. **서버리스 이미지 처리**
   - Vercel Image Optimization
   - Cloudflare Images
   - 비용 비교

### 출력
1. docs/research/claude-ai-research/CIE-5-R1-이미지파이프라인.md
2. 벤치마크 데이터 포함
```

### 1-4 ~ 1-11. 추가 P0 항목

```
## P0 통합 리서치 리스트

다음 항목들을 순차적으로 조사하고 각각 파일 생성:

### 1-4. Gemini 3 Flash 최적화 (AI-GEMINI-OPT)
- 프롬프트 최적화 기법
- 토큰 사용량 절감
- 응답 품질 vs 속도 트레이드오프
- 현재 구현: apps/web/lib/gemini.ts

### 1-5. Supabase RLS 심화 (DB-RLS-ADVANCED)
- 복잡한 정책 패턴
- 성능 영향 측정
- 테스트 전략
- 현재 구현: supabase/migrations/

### 1-6. Clerk 인증 고도화 (AUTH-CLERK-ADVANCED)
- MFA 설정
- 소셜 로그인 확장
- 세션 관리 최적화
- 현재 구현: apps/web/middleware.ts

### 1-7. 에러 모니터링 (OBS-ERROR-MONITORING)
- Sentry 설정 최적화
- 에러 그룹핑
- 알림 설정
- PII 필터링

### 1-8. 성능 모니터링 (OBS-PERFORMANCE)
- Vercel Analytics
- Core Web Vitals 추적
- 커스텀 메트릭

### 1-9. CI/CD 파이프라인 (INFRA-CICD)
- GitHub Actions 최적화
- 테스트 병렬화
- 캐싱 전략
- 현재 구현: .github/workflows/

### 1-10. 번들 최적화 (PERF-BUNDLE)
- Tree Shaking 검증
- Dynamic Import 패턴
- 청크 분석 (webpack-bundle-analyzer)

### 1-11. 접근성 (A11Y-WCAG)
- WCAG 2.2 AA 준수
- 스크린 리더 지원
- 키보드 네비게이션
- 색상 대비

각 항목: 2000-4000자, 코드 예시 포함
```

---

## 섹션 2: RAG 심화 (12개)

> 참조: docs/research/bundles/BUNDLE-RAG-RESEARCH.md

### 2-1. HyDE 구현 (RAG-OPT-1-HYDE)

```
## 리서치 + 구현 요청

HyDE (Hypothetical Document Embeddings) 기법을 조사하고 구현해주세요.

### 배경
현재 RAG 시스템: apps/web/lib/rag/product-qa.ts
문제: 짧은 질문 → 긴 문서 매칭 어려움

### 조사 항목
1. HyDE 원리 및 논문 (Gao et al., 2022)
2. 구현 아키텍처
3. 한국어 특화 고려사항
4. 성능/비용 트레이드오프

### 구현 요청
1. lib/rag/hyde.ts 파일 생성
2. 기존 product-qa.ts 통합
3. A/B 테스트 가능한 구조

### 출력
1. docs/research/claude-ai-research/RAG-OPT-1-R1-HyDE.md
2. apps/web/lib/rag/hyde.ts (구현 코드)
```

### 2-2. Re-ranking 구현 (RAG-OPT-2-RERANK)

```
## 리서치 + 구현 요청

Cross-Encoder 기반 Re-ranking을 조사하고 구현해주세요.

### 조사 항목
1. Bi-Encoder vs Cross-Encoder 비교
2. 사용 가능한 모델
   - Cohere Rerank
   - OpenAI 기반
   - 오픈소스 (ms-marco)
3. 한국어 Re-ranking 모델 현황
4. 비용-효과 분석

### 구현 요청
1. lib/rag/reranker.ts 파일 생성
2. Top-K 후보 → Re-rank → Top-N 반환

### 출력
1. docs/research/claude-ai-research/RAG-OPT-2-R1-Reranking.md
2. apps/web/lib/rag/reranker.ts
```

### 2-3 ~ 2-12. 나머지 RAG 항목

```
## RAG 심화 리서치 리스트

### 검색 품질 (RAG-OPT)
2-3. Query Expansion - 질문 확장 기법
2-4. Hybrid Search - BM25 + Vector 조합

### 임베딩 모델 (EMB)
2-5. OpenAI ada-002 vs text-embedding-3 비교
2-6. Gemini Embedding API 평가
2-7. 한국어 임베딩 모델 (KoBERT 파생)
2-8. 멀티모달 임베딩 (이미지+텍스트)

### 벡터 DB (VDB)
2-9. pgvector 성능 최적화
2-10. pgvector vs Pinecone 비교
2-11. 인덱스 전략 (IVFFlat vs HNSW)
2-12. 샤딩 및 파티셔닝

각 항목: 리서치 문서 + 가능하면 구현 코드
```

---

## 섹션 3: 크로스도메인 분석 (10개)

### 3-1. 피부×영양 조합 (COMBO-SKIN-NUTRITION)

```
## 리서치 요청

피부 상태와 영양 분석의 교차 인사이트를 조사해주세요.

### 현재 구현 확인
- apps/web/app/api/analyze/skin/route.ts
- apps/web/app/api/analyze/ingredients/route.ts

### 조사 항목
1. **과학적 근거**
   - 영양소별 피부 영향 (비타민A, C, E, 오메가3 등)
   - 식습관과 피부 트러블 연관성
   - 수분 섭취와 피부 수분도

2. **조합 분석 로직**
   - 피부 타입별 영양 권장
   - 피부 고민별 보충제 매칭
   - 계절/환경 요인 반영

3. **UI/UX 설계**
   - 조합 결과 표시 방법
   - 상호 참조 네비게이션

### 출력
1. docs/research/claude-ai-research/COMBO-1-R1-피부영양.md
2. 알고리즘 설계 포함
```

### 3-2. 체형×운동 조합 (COMBO-BODY-EXERCISE)

```
## 리서치 요청

체형 분석과 운동 추천의 교차 인사이트를 조사해주세요.

### 조사 항목
1. **체형별 운동 권장**
   - 직사각형: 전체 균형 운동
   - 역삼각형: 하체 강화
   - 삼각형: 상체 강화
   - 모래시계: 유지 운동

2. **자세 교정 연계**
   - 거북목 → 목/어깨 운동
   - 골반 틀어짐 → 코어 운동
   - 척추 측만 → 밸런스 운동

3. **개인화 루틴 생성**
   - 체형 + 목표 + 가용 시간
   - 점진적 난이도 조절

### 출력
1. docs/research/claude-ai-research/COMBO-2-R1-체형운동.md
```

### 3-3 ~ 3-10. 추가 크로스도메인

```
## 크로스도메인 리서치 리스트

3-3. 퍼스널컬러×메이크업 (COMBO-PC-MAKEUP)
3-4. 퍼스널컬러×패션 (COMBO-PC-FASHION)
3-5. 피부×제품추천 (COMBO-SKIN-PRODUCT)
3-6. 영양×운동 (COMBO-NUTRITION-EXERCISE)
3-7. 체형×패션 (COMBO-BODY-FASHION)
3-8. 전체 통합 대시보드 (COMBO-DASHBOARD)
3-9. 시계열 변화 추적 (COMBO-TIMELINE)
3-10. AI 코치 통합 응답 (COMBO-AI-COACH)

각 항목: 과학적 근거 + 알고리즘 + UI/UX 고려
```

---

## 섹션 4: AI/ML 심화 (8개)

### 4-1. 프롬프트 엔지니어링 고도화 (AI-PROMPT-ADV)

```
## 리서치 요청

VLM(Vision-Language Model) 프롬프트 최적화를 조사해주세요.

### 현재 구현 확인
- apps/web/lib/gemini.ts
- 각 분석 API의 프롬프트

### 조사 항목
1. **프롬프트 구조화**
   - System/User/Assistant 역할 분리
   - Few-shot vs Zero-shot
   - Chain-of-Thought for Vision

2. **이미지 분석 프롬프트**
   - 이미지 설명 vs 분석 지시
   - 영역 지정 (bounding box 언급)
   - 출력 형식 강제

3. **한국어 최적화**
   - 한국어 vs 영어 프롬프트 성능
   - 뷰티 도메인 용어
   - 톤앤매너 조정

4. **프롬프트 버전 관리**
   - 프롬프트 템플릿 시스템
   - A/B 테스트 구조
   - 성능 메트릭

### 출력
1. docs/research/claude-ai-research/AI-1-R1-프롬프트고도화.md
2. 프롬프트 템플릿 시스템 설계
```

### 4-2 ~ 4-8. 추가 AI/ML 항목

```
## AI/ML 심화 리서치 리스트

4-2. 신뢰도 계산 (AI-CONFIDENCE)
- 분석 결과 신뢰도 산출 방법
- 불확실성 표현
- 사용자 커뮤니케이션

4-3. Fallback 전략 (AI-FALLBACK)
- API 실패 시 대응
- Mock 데이터 품질
- 부분 실패 처리

4-4. 비용 최적화 (AI-COST)
- 토큰 사용량 모니터링
- 캐싱 전략
- 모델 선택 기준

4-5. 응답 파싱 (AI-PARSING)
- JSON 파싱 안정성
- 스키마 검증
- 부분 응답 처리

4-6. 다국어 지원 (AI-MULTILANG)
- 한국어 중심 + 영어/일본어
- 프롬프트 번역 vs 응답 번역

4-7. 설명 가능성 (AI-EXPLAINABILITY)
- 분석 근거 설명
- 시각화 방법
- 사용자 교육

4-8. 편향 감지 (AI-BIAS)
- 피부색/인종 편향
- 성별 편향
- 테스트 방법론
```

---

## 섹션 5: 보안 심화 (8개)

### 5-1 ~ 5-8. 보안 심화 리서치

```
## 보안 심화 리서치 리스트

### 인증/인가
5-1. JWT 토큰 보안 (SEC-JWT)
- Clerk JWT 검증 강화
- 토큰 갱신 전략
- 세션 무효화

5-2. API 보안 (SEC-API)
- API 키 관리
- 요청 서명
- CORS 정책

### 데이터 보호
5-3. 이미지 암호화 (SEC-IMAGE)
- 전송 중 암호화
- 저장 시 암호화
- 접근 로깅

5-4. PII 관리 (SEC-PII)
- 개인정보 식별
- 마스킹/익명화
- 보존 기간 관리

### 인프라 보안
5-5. 환경변수 보안 (SEC-ENV)
- 시크릿 관리
- 키 로테이션
- 유출 감지

5-6. 의존성 보안 (SEC-DEPS)
- npm audit 자동화
- SBOM 관리
- 취약점 대응

### 규정 준수
5-7. GDPR 대응 (SEC-GDPR)
- 데이터 포터빌리티
- 삭제권 구현
- 동의 관리

5-8. KISA 보안 가이드 (SEC-KISA)
- 개인정보 안전성 확보 조치
- 정보보호 관리체계
- 인증 준비
```

---

## 실행 계획

### 우선순위별 실행

| 주차 | 섹션 | 항목 수 | 예상 시간 |
|------|------|---------|----------|
| 1주 | 섹션 1 (P0 Critical) | 11개 | 16시간 |
| 2주 | 섹션 2 (RAG 심화) | 12개 | 16시간 |
| 3주 | 섹션 3 (크로스도메인) | 10개 | 12시간 |
| 4주 | 섹션 4-5 (AI/보안) | 16개 | 20시간 |

### 결과물 저장 위치

```
docs/research/claude-ai-research/
├── SEO-1-R1-NextjsSEO2026.md
├── RATE-1-R1-Redis고도화.md
├── RAG-OPT-1-R1-HyDE.md
├── COMBO-1-R1-피부영양.md
├── AI-1-R1-프롬프트고도화.md
├── SEC-1-R1-JWT보안.md
└── ...

apps/web/lib/
├── rag/
│   ├── hyde.ts          # 새로 생성
│   ├── reranker.ts      # 새로 생성
│   └── hybrid-search.ts # 새로 생성
└── ...
```

### 품질 검증

각 리서치 후 반드시 실행:
```bash
npm run typecheck
npm run lint
npm run test
```

---

**총 항목**: 52개
**예상 총 시간**: 64시간 (4주)
**특징**: 리서치 + 구현 통합
**Version**: 1.0
