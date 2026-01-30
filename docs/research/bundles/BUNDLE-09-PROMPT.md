# BUNDLE-09: 개인화 및 추천

> 개인화 전략, A/B 테스트, 분석 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-09 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | ML/개인화 |
| **포함 항목** | APP-PERSONALIZATION, USER-PERSONALIZATION-FEEL, APP-AB-TESTING, BIZ-ANALYTICS |

---

## 입력

### 참조 문서
- `docs/research/claude-ai-research/AI-*-R1.md` - AI 관련 리서치
- `docs/research/claude-ai-research/USER-*-R1.md` - 사용자 관련 리서치
- `.claude/rules/ai-integration.md` - AI 통합 규칙

### 선행 리서치
- BUNDLE-01: Next.js 기술 스택
- BUNDLE-08: 사용자 심리

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/APP-PERSONALIZATION-R1.md` | 개인화 전략 |
| `docs/research/claude-ai-research/USER-PERSONALIZATION-FEEL-R1.md` | 개인화 체감 |
| `docs/research/claude-ai-research/APP-AB-TESTING-R1.md` | A/B 테스트 전략 |
| `docs/research/claude-ai-research/BIZ-ANALYTICS-R1.md` | 비즈니스 분석 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### APP-PERSONALIZATION

```
AI 기반 뷰티 앱의 개인화 전략을 조사해주세요.

조사 범위:
1. 사용자 프로필 기반 개인화
2. 행동 기반 개인화 (클릭, 조회, 구매)
3. 컨텍스트 기반 개인화 (시간, 날씨, 계절)
4. 협업 필터링 vs 콘텐츠 기반 필터링
5. 개인화 수준 조절 (프라이버시 균형)
6. Cold Start 문제 해결

기대 결과:
- 개인화 아키텍처 설계
- 데이터 수집 전략
- 개인화 알고리즘 선택 가이드
- 프라이버시 보호 개인화 방법
```

### USER-PERSONALIZATION-FEEL

```
사용자가 "개인화되었다"고 느끼게 하는 요소를 조사해주세요.

조사 범위:
1. 개인화 체감 요소 (이름, 사진, 맞춤 메시지)
2. "나만을 위한" 느낌 설계
3. 개인화 과도함 경계 (Creepy Factor)
4. 개인화 설명/표시 방법
5. 개인화 제어권 제공
6. 개인화 품질 지표

기대 결과:
- 개인화 체감 UI 가이드
- "왜 이 추천?" 설명 패턴
- 개인화 만족도 측정 방법
- 과도한 개인화 방지 가이드라인
```

### APP-AB-TESTING

```
뷰티 앱의 A/B 테스트 전략을 조사해주세요.

조사 범위:
1. A/B 테스트 플랫폼 비교 (Vercel, Statsig, GrowthBook)
2. 통계적 유의성 계산
3. 뷰티 앱 핵심 테스트 영역
4. 다변량 테스트 (MVT)
5. 테스트 기간 및 샘플 크기 결정
6. 테스트 결과 분석 및 적용

기대 결과:
- A/B 테스트 인프라 설정 가이드
- 핵심 테스트 가설 목록
- 테스트 우선순위 프레임워크
- 결과 해석 가이드
```

### BIZ-ANALYTICS

```
이룸 서비스의 비즈니스 분석 전략을 조사해주세요.

조사 범위:
1. 핵심 지표 (KPI) 정의
2. 분석 도구 선택 (Vercel Analytics, PostHog, Mixpanel)
3. 사용자 행동 분석 (퍼널, 코호트)
4. 수익 분석 (LTV, ARPU, Churn)
5. 실시간 대시보드 구축
6. 데이터 기반 의사결정 문화

기대 결과:
- 이룸 핵심 KPI 대시보드 설계
- 분석 도구 스택 추천
- 퍼널 분석 설정 가이드
- 코호트 분석 템플릿
```

---

## 의존성

```
선행: BUNDLE-01 (Tech), BUNDLE-08 (Psychology)
후행: 없음
병렬: BUNDLE-07 (Ops)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 구체적인 도구/플랫폼 추천
- [ ] 통계적 방법론 포함
- [ ] 실행 가능한 KPI 정의

---

**Version**: 1.0 | **Created**: 2026-01-18
