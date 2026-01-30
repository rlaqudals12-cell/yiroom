# 이룸 리서치 프롬프트 통합 문서 v2.0

> **128개 리서치 항목의 통합 프롬프트**
>
> 작성일: 2026-01-18
> 중복 제거: 15개 → 통합 완료
> N×M 조합: 4개 추가

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [번들 구성](#2-번들-구성)
3. [의존성 그래프](#3-의존성-그래프)
4. [프롬프트 템플릿](#4-프롬프트-템플릿)
5. [전체 프롬프트 목록](#5-전체-프롬프트-목록)

---

## 1. 문서 개요

### 1.1 통계

| 항목 | 수량 |
|------|------|
| **총 리서치 항목** | 128개 |
| **완료됨** | 46개 |
| **미완료** | 82개 |
| **번들 수** | 15개 |
| **중복 제거** | 15개 |
| **N×M 신규** | 4개 |

### 1.2 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-01-17 | 초기 102개 프롬프트 |
| v2.0 | 2026-01-18 | 통합 및 구조화 (128개) |

### 1.3 관련 문서

- [DEEP-RESEARCH-REQUESTS.md](./DEEP-RESEARCH-REQUESTS.md) - 마스터 요청 목록 (v3.4)
- [RESEARCH-MASTER-INDEX.json](./RESEARCH-MASTER-INDEX.json) - 메타데이터 인덱스
- [bundles/](./bundles/) - 번들별 상세 프롬프트

---

## 2. 번들 구성

### 2.1 번들 개요

| Bundle | 이름 | 우선순위 | 항목 수 | 시간 |
|--------|------|----------|---------|------|
| BUNDLE-01 | Next.js 기술 스택 | P0 | 4 | 3h |
| BUNDLE-02 | 수익화/비즈니스 | P0 | 4 | 2h |
| BUNDLE-03 | 사용자 획득/성장 | P1 | 4 | 2h |
| BUNDLE-04 | UX/접근성 | P1 | 4 | 2h |
| BUNDLE-05 | 플랫폼 전략 | P0 | 4 | 2h |
| BUNDLE-06 | 크로스 도메인 | P1 | 6 | 3h |
| BUNDLE-07 | 운영/인프라 | P1 | 5 | 2h |
| BUNDLE-08 | 사용자 심리 | P1 | 5 | 2h |
| BUNDLE-09 | 개인화/추천 | P1 | 4 | 2h |
| BUNDLE-10 | 스타트업 재무 | P1 | 4 | 2h |
| BUNDLE-11 | 법률/규정 | P2 | 4 | 2h |
| BUNDLE-12 | 팀/조직 | P2 | 4 | 2h |
| BUNDLE-13 | 경쟁/시장 | P1 | 4 | 2h |
| BUNDLE-14 | 도메인 원리 | P1 | 4 | 3h |
| BUNDLE-15 | 위기/보안 | P2 | 4 | 2h |

**총: 64개 주요 항목 (번들 포함)**

### 2.2 번들 프롬프트 파일

```
docs/research/bundles/
├── BUNDLE-01-PROMPT.md  # Next.js 기술 스택
├── BUNDLE-02-PROMPT.md  # 수익화/비즈니스
├── BUNDLE-03-PROMPT.md  # 사용자 획득
├── BUNDLE-04-PROMPT.md  # UX/접근성
├── BUNDLE-05-PROMPT.md  # 플랫폼 전략
├── BUNDLE-06-PROMPT.md  # 크로스 도메인
├── BUNDLE-07-PROMPT.md  # 운영/인프라
├── BUNDLE-08-PROMPT.md  # 사용자 심리
├── BUNDLE-09-PROMPT.md  # 개인화/추천
├── BUNDLE-10-PROMPT.md  # 스타트업 재무
├── BUNDLE-11-PROMPT.md  # 법률/규정
├── BUNDLE-12-PROMPT.md  # 팀/조직
├── BUNDLE-13-PROMPT.md  # 경쟁/시장
├── BUNDLE-14-PROMPT.md  # 도메인 원리
└── BUNDLE-15-PROMPT.md  # 위기/보안
```

---

## 3. 의존성 그래프

### 3.1 실행 단계

```
┌─────────────────────────────────────────────────────────────────┐
│                         Phase A (병렬 시작)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BUNDLE-01 ────┬──> BUNDLE-04 (UX)                              │
│  (Tech)        ├──> BUNDLE-07 (Ops)                              │
│                └──> BUNDLE-09 (Personalization)                  │
│                                                                 │
│  BUNDLE-02 ────┬──> BUNDLE-03 (Acquisition)                      │
│  (Biz)         ├──> BUNDLE-10 (Finance)                          │
│                └──> BUNDLE-13 (Competition)                      │
│                                                                 │
│  BUNDLE-05 ─────────> (독립)                                     │
│  (Platform)                                                      │
│                                                                 │
│  BUNDLE-11 ─────────> BUNDLE-15 (Crisis)                         │
│  (Legal)                                                         │
│                                                                 │
│  BUNDLE-14 ─────────> (독립, 우선 완료 권장)                      │
│  (Principles)                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Phase B (A 완료 후)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BUNDLE-06 ─────────> BUNDLE-08 (Psychology)                     │
│  (Cross-Domain)                                                  │
│                                                                 │
│  BUNDLE-12 ─────────> (독립)                                     │
│  (Team)                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 시간 추정

| 실행 방식 | 총 시간 |
|-----------|---------|
| 순차 실행 | 33시간 |
| 병렬 최적화 | **17시간** |

---

## 4. 프롬프트 템플릿

### 4.1 표준 템플릿

```markdown
# [ID]: [제목]

## 입력
- 참조: docs/research/[관련파일].md, docs/principles/[원리].md
- 선행 리서치: [의존 ID 목록]

## 출력
- 파일: docs/research/claude-ai-research/[ID]-R1-[주제영문].md
- 형식: RESEARCH-OUTPUT-FORMAT.md 준수

## 프롬프트
[상세 내용 - 구체적 질문, 조사 범위, 기대 결과]

## 의존성
- 선행: [선행 ID] 또는 "없음"
- 후행: [이 리서치에 의존하는 ID]
- 병렬: [동시 실행 가능한 ID]

## 메타데이터
- 우선순위: P0/P1/P2/P3
- 예상 시간: Xh
- 도메인: [도메인명]
```

### 4.2 출력 파일명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| 리서치 결과 | `[ID]-R1.md` | `SEO-NEXTJS-2026-R1.md` |
| 크로스 도메인 | `COMBO-[D1]-[D2]-R1.md` | `COMBO-BODY-EXERCISE-R1.md` |
| 원리 문서 | `[domain].md` | `nutrition-science.md` |

---

## 5. 전체 프롬프트 목록

### 5.1 카테고리 A: 도메인 지식 (34개)

#### SK-1: 스킨케어 (12개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| SK-1-INJECTION | 주사 시술 가이드 | `SK-1-INJECTION-BUNDLE-R1.md` | ✅ |
| SK-1-LASER | 레이저 시술 | `SK-1-LASER-BUNDLE-R1.md` | ✅ |
| SK-1-RF-HIFU | RF/HIFU 시술 | `SK-1-RF-HIFU-BUNDLE-R1.md` | ✅ |
| SK-1-SKINCARE | 스킨케어 루틴 | `SK-1-SKINCARE-BUNDLE-R1.md` | ✅ |
| SK-1-INGREDIENTS | 성분 가이드 | `SK-1-INGREDIENTS-R1.md` | ⏳ |
| SK-1-SKIN-TYPES | 피부 유형 분류 | `SK-1-SKIN-TYPES-R1.md` | ⏳ |
| SK-1-CONCERNS | 피부 고민별 솔루션 | `SK-1-CONCERNS-R1.md` | ⏳ |
| SK-1-ROUTINES | 루틴 설계 | `SK-1-ROUTINES-R1.md` | ⏳ |
| SK-1-SEASONS | 계절별 케어 | `SK-1-SEASONS-R1.md` | ⏳ |
| SK-1-DEVICES | 홈케어 디바이스 | `SK-1-DEVICES-R1.md` | ⏳ |
| SK-1-TRENDS | 트렌드 분석 | `SK-1-TRENDS-R1.md` | ⏳ |
| SK-1-KOREA-SPECIFIC | 한국 특화 | `SK-1-KOREA-SPECIFIC-R1.md` | ⏳ |

#### OH-1: 구강 건강 (8개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| OH-1-BASICS | 구강 기초 | `OH-1-BASICS-R1.md` | ⏳ |
| OH-1-WHITENING | 치아 미백 | `OH-1-WHITENING-R1.md` | ⏳ |
| OH-1-ALIGNMENT | 치열 교정 | `OH-1-ALIGNMENT-R1.md` | ⏳ |
| OH-1-GUM-HEALTH | 잇몸 건강 | `OH-1-GUM-HEALTH-R1.md` | ⏳ |
| OH-1-PRODUCTS | 구강 제품 | `OH-1-PRODUCTS-R1.md` | ⏳ |
| OH-1-PROCEDURES | 치과 시술 | `OH-1-PROCEDURES-R1.md` | ⏳ |
| OH-1-HABITS | 구강 습관 | `OH-1-HABITS-R1.md` | ⏳ |
| OH-1-SMILE-DESIGN | 스마일 디자인 | `OH-1-SMILE-DESIGN-R1.md` | ⏳ |

#### W-2: 운동/자세 (14개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| W-2-POSTURE | 자세 분석 | `W-2-POSTURE-R1.md` | ⏳ |
| W-2-BODY-TYPES | 체형 분류 | `W-2-BODY-TYPES-R1.md` | ⏳ |
| W-2-EXERCISES | 운동 가이드 | `W-2-EXERCISES-R1.md` | ⏳ |
| W-2-REHAB-BUNDLE | 재활 운동 번들 | `W-2-REHAB-BUNDLE-R1.md` | ⏳ |
| W-2-POSTURE-PROTOCOL | 자세 교정 프로토콜 | `W-2-POSTURE-PROTOCOL-R1.md` | ⏳ |
| W-2-STRETCHING | 스트레칭 | `W-2-STRETCHING-R1.md` | ⏳ |
| W-2-STRENGTH | 근력 운동 | `W-2-STRENGTH-R1.md` | ⏳ |
| W-2-CARDIO | 유산소 | `W-2-CARDIO-R1.md` | ⏳ |
| W-2-YOGA-PILATES | 요가/필라테스 | `W-2-YOGA-PILATES-R1.md` | ⏳ |
| W-2-HOME-WORKOUT | 홈트레이닝 | `W-2-HOME-WORKOUT-R1.md` | ⏳ |
| W-2-PROGRESS | 진행 추적 | `W-2-PROGRESS-R1.md` | ⏳ |
| W-2-INJURY-PREVENTION | 부상 예방 | `W-2-INJURY-PREVENTION-R1.md` | ⏳ |
| W-2-EQUIPMENT | 운동 장비 | `W-2-EQUIPMENT-R1.md` | ⏳ |
| W-2-NUTRITION-SYNC | 영양 연계 | `W-2-NUTRITION-SYNC-R1.md` | ⏳ |

### 5.2 카테고리 B: 기술 (12개)

| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| SEO-NEXTJS-2026 | Next.js 16 SEO | `SEO-NEXTJS-2026-R1.md` | ⏳ |
| RATE-LIMIT-REDIS | Redis Rate Limiting | `RATE-LIMIT-REDIS-R1.md` | ⏳ |
| PERFORMANCE-2026 | Core Web Vitals | `PERFORMANCE-2026-R1.md` | ⏳ |
| DATA-FETCHING-2026 | Server Components | `DATA-FETCHING-2026-R1.md` | ⏳ |
| A11Y-WCAG22 | WCAG 2.2 준수 | `A11Y-WCAG22-R1.md` | ⏳ |
| APP-PROGRESSIVE-DISCLOSURE | 점진적 공개 | `APP-PROGRESSIVE-DISCLOSURE-R1.md` | ⏳ |
| APP-PERSONALIZATION | 개인화 전략 | `APP-PERSONALIZATION-R1.md` | ⏳ |
| APP-AB-TESTING | A/B 테스트 | `APP-AB-TESTING-R1.md` | ⏳ |
| PLATFORM-WEB-VS-APP | 웹 vs 앱 | `PLATFORM-WEB-VS-APP-R1.md` | ⏳ |
| PLATFORM-PWA | PWA 전략 | `PLATFORM-PWA-R1.md` | ⏳ |
| PLATFORM-NATIVE | 네이티브 앱 | `PLATFORM-NATIVE-R1.md` | ⏳ |
| PLATFORM-CROSS | 크로스 플랫폼 | `PLATFORM-CROSS-R1.md` | ⏳ |

### 5.3 카테고리 C: 비즈니스 (12개)

| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| BIZ-MONETIZATION | 수익화 모델 | `BIZ-MONETIZATION-R1.md` | ⏳ |
| BIZ-PRICING | 가격 전략 | `BIZ-PRICING-R1.md` | ⏳ |
| BIZ-PAYMENT | 결제 시스템 | `BIZ-PAYMENT-R1.md` | ⏳ |
| BIZ-ACQUISITION-ORGANIC | 오가닉 획득 | `BIZ-ACQUISITION-ORGANIC-R1.md` | ⏳ |
| BIZ-VIRAL-GROWTH | 바이럴 성장 | `BIZ-VIRAL-GROWTH-R1.md` | ⏳ |
| BIZ-ASO-STRATEGY | ASO 전략 | `BIZ-ASO-STRATEGY-R1.md` | ⏳ |
| BIZ-ANALYTICS | 비즈니스 분석 | `BIZ-ANALYTICS-R1.md` | ⏳ |
| BIZ-LEGAL-COMPLIANCE | 법률 준수 | `BIZ-LEGAL-COMPLIANCE-R1.md` | ⏳ |
| PROD-COMPETITOR | 경쟁사 분석 | `PROD-COMPETITOR-R1.md` | ⏳ |
| COMPANY-MARKET-POSITION | 시장 포지셔닝 | `COMPANY-MARKET-POSITION-R1.md` | ⏳ |
| COMPANY-COMPETITIVE-MOAT | 경쟁 해자 | `COMPANY-COMPETITIVE-MOAT-R1.md` | ⏳ |
| COMPANY-GROWTH-LEVER | 성장 레버 | `COMPANY-GROWTH-LEVER-R1.md` | ⏳ |

### 5.4 카테고리 D: 운영 (14개)

| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| OPS-COST-MODEL | 비용 모델 | `OPS-COST-MODEL-R1.md` | ⏳ |
| OPS-SCALING-STRATEGY | 스케일링 | `OPS-SCALING-STRATEGY-R1.md` | ⏳ |
| OPS-CANARY-DEPLOY | 카나리 배포 | `OPS-CANARY-DEPLOY-R1.md` | ⏳ |
| OPS-SLO-SLI | SLO/SLI | `OPS-SLO-SLI-R1.md` | ⏳ |
| OPS-COMPLIANCE-AUTO | 규정 준수 자동화 | `OPS-COMPLIANCE-AUTO-R1.md` | ⏳ |
| OPS-DR | 재해 복구 | `OPS-DR-R1.md` | ⏳ |
| OPS-INCIDENT | 인시던트 관리 | `OPS-INCIDENT-R1.md` | ⏳ |
| QUALITY-SCALABILITY | 확장성 | `QUALITY-SCALABILITY-R1.md` | ⏳ |
| QUALITY-RELIABILITY | 신뢰성 | `QUALITY-RELIABILITY-R1.md` | ⏳ |
| FIN-FUNDRAISING | 펀드레이징 | `FIN-FUNDRAISING-R1.md` | ⏳ |
| FIN-MODELING | 재무 모델링 | `FIN-MODELING-R1.md` | ⏳ |
| FIN-CASHFLOW | 캐시플로우 | `FIN-CASHFLOW-R1.md` | ⏳ |
| COMPANY-EXIT-STRATEGY | 엑싯 전략 | `COMPANY-EXIT-STRATEGY-R1.md` | ⏳ |
| CRISIS-PR | 위기 PR | `CRISIS-PR-R1.md` | ⏳ |

### 5.5 카테고리 E: 사용자 (11개)

| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| USER-HABIT-FORMATION | 습관 형성 | `USER-HABIT-FORMATION-R1.md` | ⏳ |
| USER-PAIN-POINTS | 페인 포인트 | `USER-PAIN-POINTS-R1.md` | ⏳ |
| USER-MENTAL-MODEL | 멘탈 모델 | `USER-MENTAL-MODEL-R1.md` | ⏳ |
| USER-EMOTIONAL-JOURNEY | 감정 여정 | `USER-EMOTIONAL-JOURNEY-R1.md` | ⏳ |
| USER-TRUST-BUILDING | 신뢰 구축 | `USER-TRUST-BUILDING-R1.md` | ⏳ |
| USER-VALUE-PERCEPTION | 가치 인식 | `USER-VALUE-PERCEPTION-R1.md` | ⏳ |
| USER-PERSONALIZATION-FEEL | 개인화 체감 | `USER-PERSONALIZATION-FEEL-R1.md` | ⏳ |
| USER-ACCESSIBILITY-REAL | 실제 접근성 | `USER-ACCESSIBILITY-REAL-R1.md` | ⏳ |
| USER-PRIVACY-CONCERN | 프라이버시 우려 | `USER-PRIVACY-CONCERN-R1.md` | ⏳ |
| APP-ACCESSIBILITY-DEPTH | 접근성 심화 | `APP-ACCESSIBILITY-DEPTH-R1.md` | ⏳ |
| CRISIS-DATA-BREACH | 데이터 유출 대응 | `CRISIS-DATA-BREACH-R1.md` | ⏳ |

### 5.6 카테고리 F: 팀/조직 (8개)

| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| TEAM-SKILL-GAP | 스킬 갭 | `TEAM-SKILL-GAP-R1.md` | ⏳ |
| TEAM-VELOCITY | 팀 속도 | `TEAM-VELOCITY-R1.md` | ⏳ |
| ORG-HIRING | 채용 전략 | `ORG-HIRING-R1.md` | ⏳ |
| ORG-CULTURE | 조직 문화 | `ORG-CULTURE-R1.md` | ⏳ |
| CORP-IP | 지식재산권 | `CORP-IP-R1.md` | ⏳ |

### 5.7 카테고리 G: 원리 (7개)

| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| PRINCIPLE-CROSS-DOMAIN-SYNERGY | 크로스 도메인 시너지 | `PRINCIPLE-CROSS-DOMAIN-SYNERGY-R1.md` | ⏳ |
| PRINCIPLE-NUTRITION-SCIENCE | 영양학 원리 | `PRINCIPLE-NUTRITION-SCIENCE-R1.md` | ⏳ |
| PRINCIPLE-EXERCISE-PHYSIOLOGY | 운동생리학 | `PRINCIPLE-EXERCISE-PHYSIOLOGY-R1.md` | ⏳ |

### 5.8 카테고리 U: 크로스 도메인 조합 (10개) 🆕

| ID | 조합 | 출력 파일 | 상태 |
|----|------|----------|------|
| COMBO-PC-SKINCARE | 퍼스널컬러 × 스킨케어 | `COMBO-PC-SKINCARE-R1.md` | ⏳ |
| COMBO-SKIN-NUTRITION | 피부 × 영양 | `COMBO-SKIN-NUTRITION-R1.md` | ⏳ |
| CAPSULE-MULTI-DOMAIN | 다중 도메인 캡슐 | `CAPSULE-MULTI-DOMAIN-R1.md` | ⏳ |
| COMBO-BODY-EXERCISE | 체형 × 운동 | `COMBO-BODY-EXERCISE-R1.md` | ⏳ 🆕 |
| COMBO-SKIN-PROCEDURE | 피부 × 시술 | `COMBO-SKIN-PROCEDURE-R1.md` | ⏳ 🆕 |
| COMBO-ORAL-NUTRITION | 구강 × 영양 | `COMBO-ORAL-NUTRITION-R1.md` | ⏳ 🆕 |
| COMBO-NUTRITION-PROCEDURE | 영양 × 시술 | `COMBO-NUTRITION-PROCEDURE-R1.md` | ⏳ 🆕 |

### 5.9 카테고리 M: 심화 (12개)

#### AI/ML 심화 (4개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| AI-ETHICS-BIAS | AI 윤리/편향 | `AI-ETHICS-BIAS-R1.md` | ⏳ |
| AI-PROMPT-ENGINEERING | 프롬프트 엔지니어링 | `AI-PROMPT-ENGINEERING-R1.md` | ⏳ |
| AI-VLM-OPTIMIZATION | VLM 최적화 | `AI-VLM-OPTIMIZATION-R1.md` | ⏳ |
| AI-CONFIDENCE-CALIBRATION | 신뢰도 보정 | `AI-CONFIDENCE-CALIBRATION-R1.md` | ⏳ |

#### 보안 심화 (3개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| SEC-OWASP-NEXTJS | OWASP Next.js | `SEC-OWASP-NEXTJS-R1.md` | ⏳ |
| SEC-IMAGE-SECURITY | 이미지 보안 | `SEC-IMAGE-SECURITY-R1.md` | ⏳ |
| SEC-MALICIOUS-UPLOAD | 악성 업로드 방지 | `SEC-MALICIOUS-UPLOAD-R1.md` | ⏳ |

#### 한국 시장 특화 (3개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| KR-BEAUTY-TREND | 한국 뷰티 트렌드 | `KR-BEAUTY-TREND-R1.md` | ⏳ |
| KR-PAYMENT-SYSTEM | 한국 결제 시스템 | `KR-PAYMENT-SYSTEM-R1.md` | ⏳ |
| KR-PIPA-DETAIL | PIPA 상세 | `KR-PIPA-DETAIL-R1.md` | ⏳ |

#### 디자인/UX 심화 (2개)
| ID | 제목 | 출력 파일 | 상태 |
|----|------|----------|------|
| DESIGN-KBEAUTY-TREND | K-뷰티 디자인 트렌드 | `DESIGN-KBEAUTY-TREND-R1.md` | ⏳ |
| DESIGN-COLOR-PSYCHOLOGY | 색상 심리학 | `DESIGN-COLOR-PSYCHOLOGY-R1.md` | ⏳ |

---

## 6. 통계 요약

### 6.1 상태별 분류

```
✅ 완료: 46개 (36%)
⏳ 미완료: 82개 (64%)
🆕 신규 추가: 4개
```

### 6.2 우선순위별 분류

| 우선순위 | 항목 수 | 비율 |
|---------|---------|------|
| P0 | 12개 | 9% |
| P1 | 72개 | 56% |
| P2 | 32개 | 25% |
| P3 | 12개 | 9% |

### 6.3 도메인별 분류

| 도메인 | 항목 수 |
|--------|---------|
| 도메인 지식 | 34개 |
| 기술 | 12개 |
| 비즈니스 | 12개 |
| 운영 | 14개 |
| 사용자 | 11개 |
| 팀/조직 | 8개 |
| 원리 | 7개 |
| 크로스 도메인 | 10개 |
| 심화 | 12개 |
| 기타 | 8개 |

---

**Version**: 2.0 | **Created**: 2026-01-18 | **Items**: 128
