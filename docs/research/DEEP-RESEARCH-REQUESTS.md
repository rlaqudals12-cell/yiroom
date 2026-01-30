# Claude AI 딥 리서치 요청 목록 (통합판 v3.4)

> **작성일**: 2026-01-18 (v3.4 N×M 조합 확장, 중복 통합)
> **사용 방법**: 아래 프롬프트를 claude.ai에 복사하여 딥 리서치 실행
> **총 128개 리서치** (중복 15개 통합 + N×M 4개 추가)
>
> **변경사항 v3.4**:
> - 중복 항목 15개 통합 (RATE-LIMIT↔P0-6, TESTING↔QA-1, PERFORMANCE↔QA-3 등)
> - N×M 조합 4개 추가 (COMBO-BODY-EXERCISE, SKIN-PROCEDURE, ORAL-NUTRITION, NUTRITION-PROCEDURE)
> - 프롬프트에 출력 파일명 명시 (번들 형식)

---

## 목차

### A. 도메인 지식 리서치 (2개)
1. [W-2-REHAB-BUNDLE](#1-w-2-rehab-bundle-재활-스트레칭) - 재활 스트레칭
2. [W-2-POSTURE-PROTOCOL](#2-w-2-posture-protocol-자세교정-프로토콜) - 자세교정 프로토콜

### B. 기술 리서치 - Critical (2개)
3. [SEO-NEXTJS-2026](#3-seo-nextjs-2026-seo-최적화) - SEO 최적화 ⚠️ P0
4. [RATE-LIMIT-REDIS](#4-rate-limit-redis-rate-limiting) - Rate Limiting ⚠️ P0

### C. 기술 리서치 - High (4개)
5. [FORM-PATTERNS-2026](#5-form-patterns-2026-폼-시스템) - 폼 시스템
6. [A11Y-WCAG22](#6-a11y-wcag22-접근성) - 접근성
7. [DESIGN-TOKENS-2026](#7-design-tokens-2026-디자인-토큰) - 디자인 토큰
8. [ANIMATION-MOTION-2026](#8-animation-motion-2026-애니메이션모션) - 애니메이션/모션

### D. 기술 리서치 - Medium (4개)
9. [DATA-FETCHING-2026](#9-data-fetching-2026-데이터-페칭) - 데이터 페칭
10. [STATE-MANAGEMENT-2026](#10-state-management-2026-상태-관리) - 상태 관리
11. [PERFORMANCE-2026](#11-performance-2026-성능-최적화) - 성능 최적화
12. [TESTING-E2E-2026](#12-testing-e2e-2026-테스트-전략) - 테스트 전략

### E. 기술 리서치 - Low (2개)
13. [I18N-NEXTJS](#13-i18n-nextjs-다국어) - 다국어
14. [MONITORING-SENTRY](#14-monitoring-sentry-모니터링) - 모니터링

### F. 비즈니스 리서치 - 사용자 획득 (3개) 🆕
15. [BIZ-ACQUISITION-ORGANIC](#15-biz-acquisition-organic-유기적-사용자-획득) - 유기적 사용자 획득
16. [BIZ-ACQUISITION-PAID](#16-biz-acquisition-paid-유료-마케팅) - 유료 마케팅
17. [BIZ-ASO-STRATEGY](#17-biz-aso-strategy-앱스토어-최적화) - 앱스토어 최적화

### G. 비즈니스 리서치 - 활성화 & 리텐션 (3개) 🆕
18. [BIZ-ONBOARDING](#18-biz-onboarding-온보딩-최적화) - 온보딩 최적화
19. [BIZ-RETENTION](#19-biz-retention-리텐션-전략) - 리텐션 전략
20. [BIZ-ENGAGEMENT](#20-biz-engagement-사용자-참여) - 사용자 참여

### H. 비즈니스 리서치 - 수익화 (3개) 🆕
21. [BIZ-MONETIZATION](#21-biz-monetization-수익화-모델) - 수익화 모델 ⚠️ P0
22. [BIZ-PAYMENT](#22-biz-payment-결제-시스템) - 결제 시스템
23. [BIZ-PRICING](#23-biz-pricing-가격-책정) - 가격 책정

### I. 비즈니스 리서치 - 운영 (3개) 🆕
24. [BIZ-COST-OPTIMIZATION](#24-biz-cost-optimization-비용-최적화) - 비용 최적화 ⚠️ P0
25. [BIZ-CUSTOMER-SUPPORT](#25-biz-customer-support-고객-지원) - 고객 지원
26. [BIZ-ANALYTICS](#26-biz-analytics-데이터-분석) - 데이터 분석

### J. 비즈니스 리서치 - 성장 & 법적 (2개) 🆕
27. [BIZ-VIRAL-GROWTH](#27-biz-viral-growth-바이럴-성장) - 바이럴 성장
28. [BIZ-LEGAL-COMPLIANCE](#28-biz-legal-compliance-법적-규제) - 법적 규제

### K. 회사 운영 - 조직/팀 (4개) 🆕 v3.0
29. [ORG-HIRING](#29-org-hiring-채용-전략) - 채용 전략
30. [ORG-CULTURE](#30-org-culture-조직-문화) - 조직 문화
31. [ORG-REMOTE](#31-org-remote-원격근무) - 원격근무
32. [ORG-PERFORMANCE](#32-org-performance-성과-관리) - 성과 관리

### L. 회사 운영 - 재무/투자 (4개) 🆕 v3.0
33. [FIN-FUNDRAISING](#33-fin-fundraising-투자-유치) - 투자 유치 ⚠️ P1
34. [FIN-MODELING](#34-fin-modeling-재무-모델링) - 재무 모델링
35. [FIN-CASHFLOW](#35-fin-cashflow-현금흐름-관리) - 현금흐름 관리
36. [FIN-TAX](#36-fin-tax-세무-회계) - 세무/회계

### M. 회사 운영 - 인프라/운영 (4개) 🆕 v3.0
37. [OPS-DR](#37-ops-dr-재해-복구) - 재해 복구
38. [OPS-INCIDENT](#38-ops-incident-인시던트-관리) - 인시던트 관리
39. [OPS-DEVOPS](#39-ops-devops-데브옵스) - DevOps
40. [OPS-SECURITY-AUDIT](#40-ops-security-audit-보안-감사) - 보안 감사

### N. 회사 운영 - 법인/행정 (4개) 🆕 v3.0
41. [CORP-INCORPORATION](#41-corp-incorporation-법인-설립) - 법인 설립
42. [CORP-STOCK-OPTION](#42-corp-stock-option-스톡옵션) - 스톡옵션
43. [CORP-IP](#43-corp-ip-지식재산권) - 지식재산권
44. [CORP-CONTRACT](#44-corp-contract-계약-관리) - 계약 관리

### O. 회사 운영 - 제품 전략 (4개) 🆕 v3.0
45. [PROD-COMPETITOR](#45-prod-competitor-경쟁사-분석) - 경쟁사 분석
46. [PROD-USER-RESEARCH](#46-prod-user-research-사용자-리서치) - 사용자 리서치
47. [PROD-ROADMAP](#47-prod-roadmap-로드맵-관리) - 로드맵 관리
48. [PROD-PIVOT](#48-prod-pivot-피봇-전략) - 피봇 전략

### P. 파트너십 & 확장 (2개) 🆕 v3.0
49. [PARTNER-B2B](#49-partner-b2b-b2b-파트너십) - B2B 파트너십
50. [PARTNER-ECOSYSTEM](#50-partner-ecosystem-api-생태계) - API 생태계

### Q. 위기 관리 (2개) 🆕 v3.0
51. [CRISIS-PR](#51-crisis-pr-pr-위기관리) - PR 위기관리
52. [CRISIS-DATA-BREACH](#52-crisis-data-breach-데이터-유출-대응) - 데이터 유출 대응

### R. 앱 vs 웹 전략 (5개) 🆕 v3.0
53. [PLATFORM-WEB-VS-APP](#53-platform-web-vs-app-웹-vs-앱-전략) - 웹 vs 앱 전략 ⚠️ P0
54. [PLATFORM-PWA](#54-platform-pwa-pwa-전략) - PWA 전략
55. [PLATFORM-NATIVE](#55-platform-native-네이티브-앱) - 네이티브 앱
56. [PLATFORM-CROSS](#56-platform-cross-크로스플랫폼) - 크로스플랫폼
57. [PLATFORM-BACKEND](#57-platform-backend-백엔드-아키텍처) - 백엔드 아키텍처

### S. 품질 속성 (6개) 🆕 v3.0
58. [QUALITY-SCALABILITY](#58-quality-scalability-확장성) - 확장성 ⚠️ P1
59. [QUALITY-RELIABILITY](#59-quality-reliability-안정성) - 안정성 ⚠️ P1
60. [QUALITY-MAINTAINABILITY](#60-quality-maintainability-유지보수성) - 유지보수성
61. [QUALITY-TECH-DEBT](#61-quality-tech-debt-기술-부채) - 기술 부채
62. [QUALITY-CODE-METRICS](#62-quality-code-metrics-코드-품질-지표) - 코드 품질 지표
63. [QUALITY-RELEASE](#63-quality-release-릴리스-관리) - 릴리스 관리

### T. 원리 문서 (3개) 🆕 v3.1 - N×M 조합 분석
64. [PRINCIPLE-NUTRITION-SCIENCE](#64-principle-nutrition-science-영양학-원리) - 영양학 원리 ⚠️ P1
65. [PRINCIPLE-EXERCISE-PHYSIOLOGY](#65-principle-exercise-physiology-운동생리학-원리) - 운동생리학 원리
66. [PRINCIPLE-CROSS-DOMAIN-SYNERGY](#66-principle-cross-domain-synergy-크로스도메인-시너지) - 크로스도메인 시너지 ⚠️ P1

### U. 크로스 도메인 조합 (10개) 🆕 v3.4 - N×M 조합 확장
67. [COMBO-PC-SKINCARE](#67-combo-pc-skincare-퍼스널컬러-스킨케어) - 퍼스널컬러 × 스킨케어 ⚠️ P1
68. [COMBO-SKIN-NUTRITION](#68-combo-skin-nutrition-피부-영양) - 피부 × 영양 ⚠️ P1
69. [COMBO-BODY-NUTRITION](#69-combo-body-nutrition-체형-영양) - 체형 × 영양
70. [COMBO-POSTURE-CLOTHING](#70-combo-posture-clothing-자세-의류) - 자세 × 의류
71. [COMBO-NUTRITION-EXERCISE](#71-combo-nutrition-exercise-영양-운동) - 영양 × 운동
72. [COMBO-SKIN-EXERCISE](#72-combo-skin-exercise-피부-운동) - 피부 × 운동
140. [COMBO-BODY-EXERCISE](#140-combo-body-exercise-체형-운동) - 체형 × 운동 ⚠️ **P0** 🆕
141. [COMBO-SKIN-PROCEDURE](#141-combo-skin-procedure-피부-시술) - 피부 × 시술 ⚠️ **P0** 🆕
142. [COMBO-ORAL-NUTRITION](#142-combo-oral-nutrition-구강-영양) - 구강 × 영양 ⚠️ P1 🆕
143. [COMBO-NUTRITION-PROCEDURE](#143-combo-nutrition-procedure-영양-시술) - 영양 × 시술 🆕

### V. 캡슐 알고리즘 확장 (3개) 🆕 v3.1 - N×M 조합 분석
73. [CAPSULE-MULTI-DOMAIN](#73-capsule-multi-domain-다중-도메인-캡슐) - 다중 도메인 캡슐 ⚠️ P1
74. [CAPSULE-SUBSTITUTION-MATRIX](#74-capsule-substitution-matrix-대체-매트릭스) - 대체 매트릭스
75. [CAPSULE-CONSTRAINT-SOLVER](#75-capsule-constraint-solver-제약-해결기) - 제약 해결기

### W. 완전한 앱 관점 (15개) 🆕 v3.2 - 앱 완성도 분석
76. [APP-USER-JOURNEY-GAP](#76-app-user-journey-gap-사용자-여정-갭) - 사용자 여정 갭 ⚠️ P1
77. [APP-FEATURE-PARITY](#77-app-feature-parity-기능-완성도) - 기능 완성도
78. [APP-DATA-FLOW](#78-app-data-flow-데이터-흐름) - 데이터 흐름 통합
79. [APP-PERSONALIZATION](#79-app-personalization-개인화-수준) - 개인화 수준 ⚠️ P1
80. [APP-FEEDBACK-LOOP](#80-app-feedback-loop-피드백-루프) - 피드백 루프
81. [APP-OFFLINE-FIRST](#81-app-offline-first-오프라인-우선) - 오프라인 우선
82. [APP-NOTIFICATION](#82-app-notification-알림-시스템) - 알림 시스템
83. [APP-GAMIFICATION](#83-app-gamification-게이미피케이션) - 게이미피케이션
84. [APP-SOCIAL-FEATURES](#84-app-social-features-소셜-기능) - 소셜 기능
85. [APP-CONTENT-STRATEGY](#85-app-content-strategy-콘텐츠-전략) - 콘텐츠 전략
86. [APP-ERROR-RECOVERY](#86-app-error-recovery-에러-복구) - 에러 복구
87. [APP-PROGRESSIVE-DISCLOSURE](#87-app-progressive-disclosure-점진적-노출) - 점진적 노출
88. [APP-ACCESSIBILITY-DEPTH](#88-app-accessibility-depth-접근성-심화) - 접근성 심화
89. [APP-ANALYTICS-DEPTH](#89-app-analytics-depth-분석-심화) - 분석 심화
90. [APP-AB-TESTING](#90-app-ab-testing-ab-테스팅) - A/B 테스팅

### X. 운영 심화 관점 (15개) 🆕 v3.2 - 운영 완성도 분석
91. [OPS-COST-MODEL](#91-ops-cost-model-비용-모델) - 비용 모델 ⚠️ P1
92. [OPS-SCALING-STRATEGY](#92-ops-scaling-strategy-스케일링-전략) - 스케일링 전략
93. [OPS-SUPPORT-AUTOMATION](#93-ops-support-automation-지원-자동화) - 지원 자동화
94. [OPS-DATA-PIPELINE](#94-ops-data-pipeline-데이터-파이프라인) - 데이터 파이프라인
95. [OPS-FEATURE-FLAG-OPS](#95-ops-feature-flag-ops-피처플래그-운영) - 피처플래그 운영
96. [OPS-CANARY-DEPLOY](#96-ops-canary-deploy-카나리-배포) - 카나리 배포
97. [OPS-LOG-MANAGEMENT](#97-ops-log-management-로그-관리) - 로그 관리
98. [OPS-ALERT-STRATEGY](#98-ops-alert-strategy-알림-전략) - 알림 전략
99. [OPS-BACKUP-STRATEGY](#99-ops-backup-strategy-백업-전략) - 백업 전략
100. [OPS-COMPLIANCE-AUTO](#100-ops-compliance-auto-규정-자동화) - 규정 자동화
101. [OPS-VENDOR-MANAGEMENT](#101-ops-vendor-management-벤더-관리) - 벤더 관리
102. [OPS-CAPACITY-PLANNING](#102-ops-capacity-planning-용량-계획) - 용량 계획
103. [OPS-RUNBOOK](#103-ops-runbook-런북-관리) - 런북 관리
104. [OPS-CHAOS-ENGINEERING](#104-ops-chaos-engineering-카오스-엔지니어링) - 카오스 엔지니어링
105. [OPS-SLO-SLI](#105-ops-slo-sli-서비스-수준-목표) - 서비스 수준 목표

### Y. 사용자 관점 (12개) 🆕 v3.2 - 사용자 경험 분석
106. [USER-PAIN-POINTS](#106-user-pain-points-페인포인트) - 페인포인트 분석 ⚠️ P1
107. [USER-MENTAL-MODEL](#107-user-mental-model-멘탈모델) - 멘탈모델 분석
108. [USER-EMOTIONAL-JOURNEY](#108-user-emotional-journey-감정-여정) - 감정 여정
109. [USER-TRUST-BUILDING](#109-user-trust-building-신뢰-구축) - 신뢰 구축
110. [USER-VALUE-PERCEPTION](#110-user-value-perception-가치-인식) - 가치 인식 ⚠️ P1
111. [USER-HABIT-FORMATION](#111-user-habit-formation-습관-형성) - 습관 형성
112. [USER-PERSONALIZATION-FEEL](#112-user-personalization-feel-개인화-체감) - 개인화 체감
113. [USER-PROGRESS-TRACKING](#113-user-progress-tracking-진행-추적) - 진행 추적
114. [USER-COMMUNITY-NEED](#114-user-community-need-커뮤니티-니즈) - 커뮤니티 니즈
115. [USER-PRIVACY-CONCERN](#115-user-privacy-concern-프라이버시-우려) - 프라이버시 우려
116. [USER-MULTI-DEVICE](#116-user-multi-device-멀티디바이스) - 멀티디바이스
117. [USER-ACCESSIBILITY-REAL](#117-user-accessibility-real-실제-접근성) - 실제 접근성

### Z. 회사/팀 관점 (10개) 🆕 v3.2 - 조직 역량 분석
118. [TEAM-SKILL-GAP](#118-team-skill-gap-스킬-갭) - 스킬 갭 분석 ⚠️ P1
119. [TEAM-VELOCITY](#119-team-velocity-개발-속도) - 개발 속도
120. [TEAM-TECHNICAL-DEBT-RATIO](#120-team-technical-debt-ratio-기술부채-비율) - 기술부채 비율
121. [TEAM-DOCUMENTATION-HEALTH](#121-team-documentation-health-문서-건강도) - 문서 건강도
122. [TEAM-KNOWLEDGE-SHARING](#122-team-knowledge-sharing-지식-공유) - 지식 공유
123. [TEAM-TOOL-EFFICIENCY](#123-team-tool-efficiency-도구-효율성) - 도구 효율성
124. [COMPANY-MARKET-POSITION](#124-company-market-position-시장-포지션) - 시장 포지션 ⚠️ P1
125. [COMPANY-COMPETITIVE-MOAT](#125-company-competitive-moat-경쟁-해자) - 경쟁 해자
126. [COMPANY-GROWTH-LEVER](#126-company-growth-lever-성장-레버) - 성장 레버
127. [COMPANY-EXIT-STRATEGY](#127-company-exit-strategy-엑싯-전략) - 엑싯 전략

### AA. AI/ML 심화 (4개) 🆕 v3.3 - 갭 분석 추가
128. [AI-ETHICS-BIAS](#128-ai-ethics-bias-ai-윤리편향) - AI 윤리/편향 ⚠️ P1
129. [AI-PROMPT-ENGINEERING](#129-ai-prompt-engineering-프롬프트-엔지니어링) - 프롬프트 엔지니어링 ⚠️ P1
130. [AI-VLM-OPTIMIZATION](#130-ai-vlm-optimization-vlm-최적화) - VLM 최적화
131. [AI-CONFIDENCE-CALIBRATION](#131-ai-confidence-calibration-신뢰도-보정) - 신뢰도 보정

### AB. 보안 심화 (3개) 🆕 v3.3 - 갭 분석 추가
132. [SEC-OWASP-NEXTJS](#132-sec-owasp-nextjs-owasp-nextjs) - OWASP Next.js ⚠️ P0
133. [SEC-IMAGE-SECURITY](#133-sec-image-security-이미지-보안) - 이미지 보안 ⚠️ P1
134. [SEC-MALICIOUS-UPLOAD](#134-sec-malicious-upload-악성-업로드-방지) - 악성 업로드 방지

### AC. 한국 시장 특화 (3개) 🆕 v3.3 - 갭 분석 추가
135. [KR-BEAUTY-TREND](#135-kr-beauty-trend-k뷰티-트렌드) - K-뷰티 트렌드 ⚠️ P1
136. [KR-PAYMENT-SYSTEM](#136-kr-payment-system-한국-결제-시스템) - 한국 결제 시스템
137. [KR-PIPA-DETAIL](#137-kr-pipa-detail-개인정보보호법-상세) - 개인정보보호법 상세

### AD. 디자인/UX 심화 (2개) 🆕 v3.3 - 갭 분석 추가
138. [DESIGN-KBEAUTY-TREND](#138-design-kbeauty-trend-k뷰티-디자인) - K-뷰티 디자인 트렌드
139. [DESIGN-COLOR-PSYCHOLOGY](#139-design-color-psychology-색채-심리학) - 색채 심리학

---

## 우선순위 요약

| 우선순위 | 항목 수 | 리서치 ID |
|----------|---------|-----------|
| **P0 (Critical)** | 6개 | SEO, RATE-LIMIT, BIZ-MONETIZATION, BIZ-COST-OPTIMIZATION, PLATFORM-WEB-VS-APP, QUALITY-SCALABILITY |
| **P1 (High)** | 10개 | FORM, A11Y, DESIGN-TOKENS, ANIMATION, BIZ-ONBOARDING, BIZ-PAYMENT, FIN-FUNDRAISING, QUALITY-RELIABILITY, QUALITY-MAINTAINABILITY, OPS-DR |
| **P2 (Medium)** | 22개 | DATA-FETCHING, STATE, PERFORMANCE, TESTING, BIZ-RETENTION, BIZ-ACQUISITION-ORGANIC, BIZ-ANALYTICS, BIZ-PRICING, BIZ-ENGAGEMENT, BIZ-VIRAL, ORG-HIRING, FIN-MODELING, OPS-INCIDENT, OPS-DEVOPS, PROD-COMPETITOR, PROD-USER-RESEARCH, PROD-ROADMAP, PLATFORM-PWA, PLATFORM-NATIVE, PLATFORM-BACKEND, QUALITY-TECH-DEBT, QUALITY-CODE-METRICS |
| **P3 (Low)** | 25개 | I18N, MONITORING, W-2-REHAB, W-2-POSTURE, BIZ-ASO, BIZ-ACQUISITION-PAID, BIZ-CUSTOMER-SUPPORT, BIZ-LEGAL, ORG-CULTURE, ORG-REMOTE, ORG-PERFORMANCE, FIN-CASHFLOW, FIN-TAX, OPS-SECURITY-AUDIT, CORP-*, PROD-PIVOT, PARTNER-*, CRISIS-*, PLATFORM-CROSS, QUALITY-RELEASE |

---

## 비즈니스 영역 원자 단위 분석

### AARRR 프레임워크 기반 분석

```
┌─────────────────────────────────────────────────────────────────┐
│                    AARRR 퍼널 (해적 지표)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Acquisition (획득) ─────────────────── 현재: 10%            │
│     ├── SEO/ASO                                                 │
│     ├── 콘텐츠 마케팅                                           │
│     ├── 소셜 미디어                                             │
│     ├── 유료 광고                                               │
│     └── 파트너십/PR                                             │
│                                                                 │
│  2. Activation (활성화) ─────────────────── 현재: 60%           │
│     ├── 온보딩 플로우                                           │
│     ├── 첫 사용 경험 (FTUE)                                     │
│     ├── Aha Moment 도달                                         │
│     └── 튜토리얼/가이드                                         │
│                                                                 │
│  3. Retention (유지) ────────────────────── 현재: 40%           │
│     ├── 푸시 알림                                               │
│     ├── 이메일 마케팅                                           │
│     ├── 습관 형성                                               │
│     └── 재방문 유도                                             │
│                                                                 │
│  4. Revenue (수익) ──────────────────────── 현재: 0%            │
│     ├── 구독 모델                                               │
│     ├── 결제 시스템                                             │
│     ├── 가격 책정                                               │
│     └── 프로모션                                                │
│                                                                 │
│  5. Referral (추천) ─────────────────────── 현재: 20%           │
│     ├── 공유 기능                                               │
│     ├── 친구 초대                                               │
│     ├── 바이럴 루프                                             │
│     └── 리워드 시스템                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 비즈니스 원자 완성도 매트릭스

```
                     0%    25%    50%    75%   100%
                     |------|------|------|------|

[Acquisition]
SEO                  ██████████████████░░░░░░░░░░░░ 50%
ASO                  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
콘텐츠 마케팅        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
소셜 마케팅          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
유료 광고            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
레퍼럴 프로그램      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

[Activation]
온보딩 플로우        ████████████████████░░░░░░░░░░ 60%
튜토리얼            ████████████░░░░░░░░░░░░░░░░░░ 40%
Aha Moment 설계     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

[Retention]
푸시 알림 (구현)     ██████████████████████████░░░░ 80%
푸시 알림 (전략)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
이메일 마케팅        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
습관 형성            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
게이미피케이션       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

[Revenue]
수익 모델 설계       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
결제 시스템          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
가격 책정            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
어필리에이트         ████████░░░░░░░░░░░░░░░░░░░░░░ 20% (기획만)

[Referral]
공유 기능            ████████████████████░░░░░░░░░░ 60%
친구 초대            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
바이럴 루프          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

[Operations]
고객 지원            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
피드백 수집          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
비용 최적화          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
데이터 분석          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

[Legal]
개인정보보호         ██████████████████████████░░░░ 80%
청소년보호           ██████████████████████████████ 100%
이용약관             ██████████████████████████████ 100%
AI 면책 고지         ████████████░░░░░░░░░░░░░░░░░░ 40%
```

---

## A. 도메인 지식 리서치

### 1. W-2-REHAB-BUNDLE (재활 스트레칭)

```markdown
[리서치 ID: W-2-REHAB-BUNDLE]
[우선순위: P3]

# 재활 스트레칭 7개 종합 리서치

## 대상 부위 (7개)
1. 어깨 (회전근개, 오십견)
2. 무릎 (ACL/MCL/반월판)
3. 허리 (요추 디스크, 협착증)
4. 발목 (염좌, 아킬레스건)
5. 손목 (건초염, 수근관증후군)
6. 목 (경추 디스크, 일자목)
7. 고관절 (FAI, 관절순 손상)

## 각 부위별 필요 정보
1. 해부학적 구조 및 손상 메커니즘
2. 재활 단계 (급성기 → 아급성기 → 회복기)
3. 단계별 스트레칭 프로토콜 (동작, 시간, 빈도)
4. 금기사항 및 Red Flags
5. 전문의 의뢰 기준
6. 한국 재활의학회/ACSM/NSCA 가이드라인 참고

## 출력 형식
마크다운, 표 활용, 참고 자료 포함
```

---

### 2. W-2-POSTURE-PROTOCOL (자세교정 프로토콜)

```markdown
[리서치 ID: W-2-POSTURE-PROTOCOL]
[우선순위: P3]

# 자세 교정 스트레칭 프로토콜 7개 종합

## 기존 안전정보 참조
W-2-POSTURE-SAFETY.md의 금기사항/Red Flags 적용

## 대상 자세 문제 (7개)
1. 거북목 (Forward Head Posture)
2. 라운드숄더 (Rounded Shoulders)
3. 골반전방경사 (Anterior Pelvic Tilt)
4. 골반후방경사 (Posterior Pelvic Tilt)
5. 일자허리 (Flat Back/Hypolordosis)
6. O다리/X다리 (Genu Varum/Valgum)
7. 척추측만 (Scoliosis)

## 각 자세별 필요 정보
1. 자세 문제 진단 기준 (시각적, 각도 측정)
2. 원인 근육 (단축근 vs 신장근)
3. 교정 스트레칭 프로토콜 (동적 + 정적)
4. 강화 운동 (antagonist muscles)
5. 일상 교정 팁 (자세, 수면, 작업환경)
6. 진행도 측정 방법
7. Janda 교차증후군 연계

## 출력 형식
마크다운, 표 활용, 동작 설명 포함
```

---

## B. 기술 리서치 - Critical (P0)

### 3. SEO-NEXTJS-2026 (SEO 최적화)

```markdown
[리서치 ID: SEO-NEXTJS-2026]
[우선순위: P0 - Critical]
[현재 상태: 50% (robots.txt, sitemap.xml 없음)]

# Next.js 16 SEO 최적화 리서치

## 현재 상태 (긴급)
- Metadata API: 80%
- robots.txt: 없음 ❌ Critical
- sitemap.xml: 없음 ❌ Critical
- JSON-LD: WebSite만 존재
- OG 이미지: 기본만

## 리서치 필요 항목

### 1. 기본 SEO 설정 (필수)
- robots.ts 작성 패턴 (Next.js 16)
- sitemap.ts 동적 생성
- 다중 sitemap (sitemapindex)
- Canonical URL 관리
- 메타 태그 우선순위

### 2. Metadata API 완성
- 동적 메타데이터 (generateMetadata)
- 기본 메타데이터 상속
- OpenGraph 완성
- Twitter Card 완성
- 메타데이터 병합 전략

### 3. 구조화된 데이터 (JSON-LD)
- Organization
- WebSite + SearchAction
- Product (제품 페이지)
- Article (블로그/가이드)
- FAQ
- HowTo (가이드)
- BreadcrumbList
- 검증 도구 (Schema.org Validator)

### 4. 동적 OG 이미지
- @vercel/og (ImageResponse)
- 한글 폰트 처리 (Noto Sans KR)
- 템플릿 디자인
- 캐싱 전략
- Edge Runtime 최적화

### 5. Core Web Vitals
- LCP 최적화 (이미지, 폰트)
- CLS 방지 (레이아웃 시프트)
- INP 개선 (상호작용 지연)
- 측정 도구 (PageSpeed Insights, Lighthouse)

### 6. 한국 검색엔진 최적화
- 네이버 서치어드바이저 설정
- 네이버 웹마스터도구 등록
- 다음 웹마스터도구 등록
- 네이버 지도/플레이스 연동 (향후)

## 출력 형식
마크다운, 코드 예시, 체크리스트, 참고 링크
```

---

### 4. RATE-LIMIT-REDIS (Rate Limiting)

```markdown
[리서치 ID: RATE-LIMIT-REDIS]
[우선순위: P0 - Critical]
[현재 상태: 20% (인메모리 → 프로덕션 무의미)]

# Redis 기반 Rate Limiting 리서치

## 현재 상태 (긴급)
- 인메모리 Rate Limiting (프로덕션 무의미)
- 서버 재시작 시 초기화
- 분산 환경 미지원
- Vercel Edge 미호환

## 리서치 필요 항목

### 1. Upstash Redis 설정
- 계정 설정 및 데이터베이스 생성
- 환경변수 설정 (UPSTASH_REDIS_REST_URL, TOKEN)
- Edge Runtime 호환성
- Vercel 통합

### 2. @upstash/ratelimit 패턴
- Sliding Window vs Fixed Window vs Token Bucket
- 각 알고리즘 장단점 비교
- 사용자별 제한 (userId)
- IP 기반 제한
- 엔드포인트별 제한 설정

### 3. Rate Limit 전략 설계
| 엔드포인트 | 제한 | 근거 |
|-----------|------|------|
| AI 분석 API | 50 req/24h/user | API 비용 |
| 인증 API | 20 req/1m/IP | 브루트포스 방지 |
| 업로드 API | 5 req/1m/user | 스토리지 보호 |
| 일반 API | 100 req/1m/user | 남용 방지 |

### 4. 응답 헤더 표준
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset
- Retry-After

### 5. 에러 처리
- 429 Too Many Requests 응답
- 사용자 친화적 에러 메시지 (한국어)
- 프론트엔드 재시도 로직 (exponential backoff)
- Toast 알림 패턴

### 6. 분석 및 모니터링
- Upstash Analytics 활용
- 남용 패턴 탐지
- Slack/Discord 알림 설정
- 대시보드 구축

## 출력 형식
마크다운, 코드 예시, 설정 가이드, 비용 예측
```

---

## C. 기술 리서치 - High (P1)

### 5. FORM-PATTERNS-2026 (폼 시스템)

```markdown
[리서치 ID: FORM-PATTERNS-2026]
[우선순위: P1]
[현재 상태: 60% (react-hook-form 미사용)]

# React 폼 시스템 최신 패턴 리서치

## 현재 상태
- react-hook-form 설치됨, 미사용
- useState 기반 폼만 존재
- Zod 검증 API에만 적용
- 클라이언트-서버 검증 불일치

## 리서치 필요 항목

### 1. react-hook-form v7+ 최적 패턴
- useForm 설정 최적화
- Controller vs register 선택 기준
- FormProvider 활용 패턴
- DevTools 활용법
- 성능 최적화 (shouldUnregister, mode)

### 2. Zod 스키마 통합
- zodResolver 설정
- 클라이언트-서버 스키마 공유 전략
- 조건부 검증 (refine, superRefine)
- 에러 메시지 한국어화 (i18n)
- 커스텀 에러 맵

### 3. 폼 접근성 (WCAG 2.2)
- aria-describedby 패턴
- 에러 메시지 라이브 리전 (aria-live)
- 필수 필드 표시 (aria-required)
- 키보드 네비게이션
- 포커스 관리

### 4. 서버 액션과 폼
- Next.js 16 Server Actions
- Progressive Enhancement
- useFormStatus, useFormState
- 낙관적 업데이트
- 에러 복구

### 5. shadcn/ui Form 컴포넌트 패턴
- FormField, FormItem, FormLabel, FormMessage 활용
- 기존 컴포넌트와 통합
- 커스텀 Form 컴포넌트 확장

## 출력 형식
마크다운, 코드 예시, 비교 표
```

---

### 6. A11Y-WCAG22 (접근성)

```markdown
[리서치 ID: A11Y-WCAG22]
[우선순위: P1]
[현재 상태: 76% (폼 접근성 50%)]

# WCAG 2.2 웹 접근성 리서치

## 현재 상태
- 전체 접근성: 76%
- Radix UI 자동 처리 활용
- 폼 접근성: 50% (가장 약함)
- 건너뛰기 링크: 없음 ❌
- 랜드마크: 부분 적용

## 리서치 필요 항목

### 1. WCAG 2.2 신규 기준 (2023)
- 2.4.11 Focus Not Obscured (AA)
- 2.4.12 Focus Not Obscured Enhanced (AAA)
- 2.5.7 Dragging Movements (AA)
- 2.5.8 Target Size Minimum (AA)
- 3.2.6 Consistent Help (A)
- 3.3.7 Redundant Entry (A)
- 3.3.8 Accessible Authentication (AA)

### 2. 폼 접근성 완성
- Label 연결 패턴 (htmlFor, aria-labelledby)
- 에러 메시지 (aria-describedby, role="alert")
- 필수 필드 (aria-required)
- 힌트 텍스트
- 입력 포맷 안내

### 3. 네비게이션 접근성
- 건너뛰기 링크 구현
- 랜드마크 구조 (header, nav, main, footer)
- 포커스 관리
- 페이지 제목 관리

### 4. 모달/대화상자
- 포커스 트랩
- ESC 키 닫기
- 이전 포커스 복원
- aria-modal, role="dialog"

### 5. 한국 접근성 인증 (KWCAG 2.2)
- 국내 웹 접근성 인증 기준
- 모바일 앱 접근성 지침
- 실무 체크리스트
- 인증 기관 목록

## 출력 형식
마크다운, 체크리스트, 코드 예시
```

---

### 7. DESIGN-TOKENS-2026 (디자인 토큰)

```markdown
[리서치 ID: DESIGN-TOKENS-2026]
[우선순위: P1]
[현재 상태: 65% (간격 40%, 타이포그래피 35%, z-index 30%)]

# 2026년 최신 디자인 토큰 시스템 리서치

## 현재 상태
- 색상 토큰: 95% 완성 (OKLCh 기반)
- 간격 토큰: 40% (Tailwind 기본값만)
- 타이포그래피: 35% (시스템 폰트만)
- z-index: 30% (시스템 미정의)

## 리서치 필요 항목

### 1. 간격 시스템 (Spacing System)
- 8px 그리드 vs 4px 그리드 비교
- 컴포넌트별 내부 간격 표준
- 반응형 간격 스케일 (모바일 → 데스크탑)
- Tailwind CSS v4 spacing 커스터마이징
- CSS 변수 명명 규칙

### 2. 타이포그래피 시스템
- 가변 폰트(Variable Fonts) 최적화
- 한국어 타이포그래피 특성 (줄간격, 자간)
- Fluid Typography (clamp() 기반)
- 반응형 폰트 스케일 (Major Third, Perfect Fourth)
- Font Pairing (한글 + 영문)

### 3. z-index 시스템
- 레이어 분류 체계 (base, dropdown, modal, toast, tooltip)
- Stacking Context 충돌 방지 전략
- CSS 변수 기반 관리
- Radix UI z-index 연동

### 4. Design Token 관리 도구
- Style Dictionary vs Figma Tokens vs Panda CSS
- JSON → CSS/JS 변환 파이프라인
- 다크모드 토큰 자동 생성
- 디자이너-개발자 협업 워크플로우

## 출력 형식
마크다운, 코드 예시, 비교 표, 토큰 구조 예시
```

---

### 8. ANIMATION-MOTION-2026 (애니메이션/모션) ⭐ 신규

```markdown
[리서치 ID: ANIMATION-MOTION-2026]
[우선순위: P1]
[현재 상태: 68% (페이지 전환 0%, 스크롤 애니메이션 20%)]

# React/Next.js 애니메이션 및 모션 리서치

## 현재 상태
- CSS @keyframes: 90% (14개 정의)
- Tailwind animate: 85%
- prefers-reduced-motion: 100%
- 페이지 전환: 0% ❌
- 스크롤 애니메이션: 20%
- 마이크로 인터랙션: 50%

## 리서치 필요 항목

### 1. 페이지 전환 애니메이션
- View Transitions API (Chrome 111+)
- Next.js App Router 호환성
- Framer Motion 페이지 전환
- CSS-only 대안 (fallback)
- 성능 고려사항

### 2. 스크롤 기반 애니메이션
- Intersection Observer API
- CSS Scroll-driven Animations (CSS Scroll Timeline)
- 스크롤 진행도 표시
- Parallax 효과
- 요소 등장 애니메이션 (fade-in, slide-up)

### 3. 마이크로 인터랙션
- 버튼 클릭 피드백 (ripple, scale)
- 호버 효과 (lift, glow)
- 로딩 스피너/스켈레톤
- 토스트/알림 애니메이션
- 성공/에러 피드백 (checkmark, shake)

### 4. 모션 라이브러리 비교
- Framer Motion vs Motion One vs GSAP
- 번들 크기 비교
- 성능 비교
- React 19 호환성
- 학습 곡선

### 5. 접근성 고려
- prefers-reduced-motion 지원
- 애니메이션 일시정지 옵션
- 집중 방해 최소화
- 발작 유발 방지 (3Hz 이상 깜빡임 금지)

### 6. 성능 최적화
- will-change 사용법
- 레이어 생성 최소화
- requestAnimationFrame 활용
- GPU 가속 속성 (transform, opacity)

## 출력 형식
마크다운, 코드 예시, 데모 설명, 비교 표
```

---

## D. 기술 리서치 - Medium (P2)

### 9. DATA-FETCHING-2026 (데이터 페칭)

```markdown
[리서치 ID: DATA-FETCHING-2026]
[우선순위: P2]
[현재 상태: 65% (React Query 0%, 캐싱 30%)]

# React/Next.js 데이터 페칭 최신 패턴 리서치

## 현재 상태
- 클라이언트: useEffect 기반
- 서버: Supabase 직접 호출
- 캐싱: PWA만 적용
- React Query 미사용 ❌
- ISR 미사용 ❌

## 리서치 필요 항목

### 1. TanStack Query (React Query) v5
- 기본 설정 및 QueryClientProvider
- useQuery, useMutation 패턴
- 캐싱 전략 (staleTime, gcTime)
- 쿼리 키 설계 패턴
- Prefetching 전략
- Suspense 모드 활용
- Devtools 활용

### 2. Next.js 16 Data Fetching
- Server Components 데이터 페칭
- Streaming과 Suspense
- Parallel Data Fetching
- Sequential Data Fetching
- Route Handlers 패턴
- 캐시 제어 (cache, revalidate)

### 3. ISR (Incremental Static Regeneration)
- revalidate 설정
- On-Demand Revalidation
- generateStaticParams 최적화
- 적합한 페이지 선정 기준
- Time-based vs On-demand

### 4. Supabase + React Query 통합
- Supabase 클라이언트 래핑
- RLS와 쿼리 키
- Realtime과 Query Invalidation
- 낙관적 업데이트 패턴

### 5. 에러/로딩 상태
- Error Boundaries
- Suspense Fallbacks
- Skeleton 패턴
- 재시도 전략

## 출력 형식
마크다운, 코드 예시, 아키텍처 다이어그램
```

---

### 10. STATE-MANAGEMENT-2026 (상태 관리) ⭐ 신규

```markdown
[리서치 ID: STATE-MANAGEMENT-2026]
[우선순위: P2]
[현재 상태: 70% (동시성 제어 0%, 롤백 0%)]

# React 상태 관리 고급 패턴 리서치

## 현재 상태
- Zustand 스토어: 90% (3개 스토어)
- persist 미들웨어: 85%
- React Context: 80%
- URL 상태: 60%
- 동시성 제어: 0% ❌
- 롤백 메커니즘: 0% ❌

## 리서치 필요 항목

### 1. Zustand 고급 패턴
- Immer 미들웨어 (불변성 관리)
- devtools 미들웨어 (디버깅)
- subscribeWithSelector (선택적 구독)
- 스토어 분리 vs 통합 전략
- 타입 안전성 (TypeScript)

### 2. 동시성 제어
- Race Condition 방지
- Debounce/Throttle 패턴
- AbortController 활용
- 요청 취소 및 재시도
- 순서 보장 (Last Write Wins vs First Write Wins)

### 3. 낙관적 업데이트 + 롤백
- 즉시 UI 업데이트
- 서버 응답 대기
- 에러 시 롤백
- 충돌 해결 전략
- 사용자 피드백

### 4. URL 상태 관리
- nuqs (useQueryState)
- searchParams 동기화
- 딥링크 지원
- 히스토리 관리

### 5. 서버 상태 vs 클라이언트 상태
- React Query (서버 상태)
- Zustand (클라이언트 상태)
- 경계 명확화
- 동기화 전략

### 6. 상태 지속성
- localStorage/sessionStorage
- IndexedDB (대용량)
- 암호화 저장
- 만료 정책

## 출력 형식
마크다운, 코드 예시, 상태 흐름 다이어그램
```

---

### 11. PERFORMANCE-2026 (성능 최적화) ⭐ 신규

```markdown
[리서치 ID: PERFORMANCE-2026]
[우선순위: P2]
[현재 상태: 75% (ISR 0%, 리스트 가상화 40%)]

# Next.js/React 성능 최적화 리서치

## 현재 상태
- next/font: 95%
- next/image: 90%
- dynamic import: 80%
- 번들 최적화: 85%
- PWA 캐싱: 80%
- ISR: 0% ❌
- 리스트 가상화: 40%
- 메모이제이션: 60%

## 리서치 필요 항목

### 1. ISR 및 캐싱 전략
- 정적 생성 vs ISR vs SSR 선택 기준
- revalidate 최적값 설정
- On-Demand Revalidation 트리거
- fetch 캐시 제어
- CDN 캐싱 전략

### 2. 리스트 가상화
- @tanstack/react-virtual
- react-window vs react-virtualized
- 무한 스크롤 + 가상화
- 동적 높이 항목 처리
- 접근성 고려

### 3. 코드 스플리팅
- dynamic import 최적화
- Route-based 스플리팅
- Component-based 스플리팅
- Named Exports 처리
- 로딩 상태 UX

### 4. 이미지 최적화
- next/image 고급 설정
- 반응형 이미지 (srcset, sizes)
- AVIF/WebP 자동 변환
- Blur Placeholder
- Priority 설정

### 5. 메모이제이션 전략
- useMemo vs useCallback 사용 기준
- React.memo 적용 기준
- 과도한 메모이제이션 방지
- React Compiler (React 19)

### 6. Core Web Vitals 최적화
- LCP: 이미지, 폰트, 서버 응답
- CLS: 레이아웃 안정성
- INP: 상호작용 지연
- 측정 및 모니터링 도구

## 출력 형식
마크다운, 코드 예시, 성능 측정 방법
```

---

### 12. TESTING-E2E-2026 (테스트 전략) ⭐ 신규

```markdown
[리서치 ID: TESTING-E2E-2026]
[우선순위: P2]
[현재 상태: 기존 QA-1-R1 존재, 업데이트 필요]

# 프론트엔드 테스트 전략 2026 리서치

## 현재 상태
- Vitest: 설정 완료
- React Testing Library: 사용 중
- Playwright: 기본 설정만
- 테스트 커버리지: 미측정
- CI/CD 통합: 부분

## 리서치 필요 항목

### 1. Playwright E2E 테스트
- 프로젝트 설정 (playwright.config.ts)
- 페이지 객체 패턴 (Page Object Model)
- 인증 플로우 테스트
- API Mocking (MSW 연동)
- 시각적 회귀 테스트 (Visual Regression)
- 접근성 테스트 통합 (axe-playwright)

### 2. 컴포넌트 테스트
- React Testing Library 베스트 프랙티스
- 사용자 이벤트 시뮬레이션
- 비동기 테스트 패턴
- 커스텀 훅 테스트
- MSW를 이용한 API 모킹

### 3. 테스트 전략 (Testing Trophy)
- 단위 테스트 vs 통합 테스트 vs E2E
- 테스트 비율 결정
- 테스트 우선순위 선정
- 효율적인 테스트 작성

### 4. CI/CD 통합
- GitHub Actions 설정
- 병렬 테스트 실행
- 테스트 결과 리포팅
- 실패 시 알림
- 커버리지 리포트

### 5. AI 분석 테스트
- Gemini API 모킹
- 분석 결과 검증
- 타임아웃/폴백 테스트
- 스냅샷 테스트 활용

## 출력 형식
마크다운, 코드 예시, CI 설정 예시
```

---

## E. 기술 리서치 - Low (P3)

### 13. I18N-NEXTJS (다국어) ⭐ 신규

```markdown
[리서치 ID: I18N-NEXTJS]
[우선순위: P3]
[현재 상태: 0%]

# Next.js 16 다국어(i18n) 리서치

## 현재 상태
- 다국어 지원: 없음
- 한국어만 지원

## 리서치 필요 항목 (향후 확장 대비)

### 1. Next.js 16 i18n 전략
- next-intl vs next-i18next vs Paraglide
- App Router 호환성
- 서버 컴포넌트 지원
- 타입 안전성

### 2. 라우팅 전략
- 서브패스 (/ko, /en)
- 서브도메인 (ko.yiroom.app)
- 도메인 (yiroom.kr, yiroom.com)
- 장단점 비교

### 3. 번역 관리
- JSON 파일 구조
- 네임스페이스 설계
- 동적 콘텐츠 번역
- 복수형/날짜/숫자 포맷

### 4. SEO 다국어
- hreflang 태그
- 언어별 sitemap
- 언어별 메타데이터

### 5. 번역 워크플로우
- Crowdin vs Lokalise vs POEditor
- 개발자-번역가 협업
- 자동 번역 활용 (DeepL, Google)

## 출력 형식
마크다운, 코드 예시, 비교 표
```

---

### 14. MONITORING-SENTRY (모니터링) ⭐ 신규

```markdown
[리서치 ID: MONITORING-SENTRY]
[우선순위: P3]
[현재 상태: 기본 에러 로깅만]

# 프론트엔드 모니터링 및 에러 추적 리서치

## 현재 상태
- 에러 로깅: console.error만
- 사용자 분석: 없음
- 성능 모니터링: 없음

## 리서치 필요 항목

### 1. Sentry 설정
- Next.js 16 통합
- 소스맵 업로드
- 환경 분리 (dev/staging/prod)
- 릴리스 추적
- 세션 리플레이

### 2. 에러 추적
- Error Boundary 연동
- 커스텀 에러 컨텍스트
- 사용자 정보 첨부
- 브레드크럼
- 에러 그룹화

### 3. 성능 모니터링
- Web Vitals 추적
- 트랜잭션 모니터링
- 느린 API 감지
- 프로파일링

### 4. 사용자 분석 (선택)
- Vercel Analytics vs Plausible vs PostHog
- 페이지뷰/이벤트 추적
- 퍼널 분석
- 개인정보 보호

### 5. 알림 설정
- Slack/Discord 연동
- 알림 규칙 설정
- 온콜 로테이션
- 에스컬레이션

## 출력 형식
마크다운, 설정 가이드, 비용 비교
```

---

## 리서치 실행 순서 (권장)

```
Week 1 (P0 - Critical)
├── Day 1-2: SEO-NEXTJS-2026
└── Day 3-4: RATE-LIMIT-REDIS

Week 2 (P1 - High)
├── Day 1: FORM-PATTERNS-2026
├── Day 2: A11Y-WCAG22
├── Day 3: DESIGN-TOKENS-2026
└── Day 4: ANIMATION-MOTION-2026

Week 3 (P2 - Medium)
├── Day 1: DATA-FETCHING-2026
├── Day 2: STATE-MANAGEMENT-2026
├── Day 3: PERFORMANCE-2026
└── Day 4: TESTING-E2E-2026

Week 4 (P3 - Low + Domain)
├── Day 1: I18N-NEXTJS
├── Day 2: MONITORING-SENTRY
├── Day 3: W-2-REHAB-BUNDLE
└── Day 4: W-2-POSTURE-PROTOCOL
```

---

## 체크리스트

### 완료 시 체크

- [ ] SEO-NEXTJS-2026
- [ ] RATE-LIMIT-REDIS
- [ ] FORM-PATTERNS-2026
- [ ] A11Y-WCAG22
- [ ] DESIGN-TOKENS-2026
- [ ] ANIMATION-MOTION-2026
- [ ] DATA-FETCHING-2026
- [ ] STATE-MANAGEMENT-2026
- [ ] PERFORMANCE-2026
- [ ] TESTING-E2E-2026
- [ ] I18N-NEXTJS
- [ ] MONITORING-SENTRY
- [ ] W-2-REHAB-BUNDLE
- [ ] W-2-POSTURE-PROTOCOL

---

## F. 비즈니스 리서치 - 사용자 획득

### 15. BIZ-ACQUISITION-ORGANIC (유기적 사용자 획득)

```markdown
[리서치 ID: BIZ-ACQUISITION-ORGANIC]
[우선순위: P2]
[현재 상태: 10%]

# 유기적 사용자 획득 전략 리서치

## 현재 상태
- SEO: 50% (기술적 SEO만)
- 콘텐츠 마케팅: 0%
- 소셜 미디어: 0%
- 커뮤니티: 0%

## 리서치 필요 항목

### 1. 콘텐츠 마케팅 전략
- 뷰티/웰니스 콘텐츠 카테고리 설계
- 블로그/가이드 콘텐츠 계획
- 검색 의도 기반 키워드 리서치
- 콘텐츠 캘린더 템플릿
- 한국 뷰티 트렌드 반영 (K-뷰티)

### 2. 소셜 미디어 전략
- 채널별 특성 (인스타그램, 틱톡, 유튜브 숏츠)
- K-뷰티 인플루언서 협업 모델
- UGC (사용자 생성 콘텐츠) 유도 전략
- 바이럴 콘텐츠 패턴 분석
- 해시태그 전략

### 3. SEO 콘텐츠 전략
- 롱테일 키워드 타겟팅
- 피처드 스니펫 최적화
- FAQ 스키마 활용
- 지역 SEO (한국 시장)

### 4. 커뮤니티 빌딩
- 네이버 카페/블로그 활용
- 에브리타임/네이트판 등 커뮤니티
- 카카오톡 오픈채팅
- Discord 커뮤니티 운영

### 5. PR 및 미디어
- 보도자료 작성 가이드
- 뷰티/테크 미디어 리스트
- 스타트업 미디어 노출 전략

## 출력 형식
마크다운, 채널별 전략표, ROI 예측, 실행 체크리스트
```

---

### 16. BIZ-ACQUISITION-PAID (유료 마케팅)

```markdown
[리서치 ID: BIZ-ACQUISITION-PAID]
[우선순위: P3]
[현재 상태: 0%]

# 유료 마케팅 및 광고 전략 리서치

## 현재 상태
- 유료 광고: 미실행
- 예산: 미책정

## 리서치 필요 항목

### 1. 광고 플랫폼 비교
| 플랫폼 | 장점 | 단점 | CPA 예상 |
|--------|------|------|---------|
| 메타 (인스타/FB) | 타겟팅 정밀 | 비용 상승 | ? |
| 구글 애즈 | 검색 의도 | 경쟁 치열 | ? |
| 카카오 비즈보드 | 한국 사용자 | 데이터 제한 | ? |
| 네이버 광고 | 검색 점유율 | 비용 높음 | ? |
| 틱톡 광고 | MZ 타겟 | 크리에이티브 중요 | ? |

### 2. 퍼포먼스 마케팅 기초
- CAC (고객 획득 비용) 계산
- LTV (고객 생애 가치) 예측
- ROAS (광고 수익률) 목표
- 어트리뷰션 모델

### 3. 캠페인 전략
- 인지도 캠페인 vs 전환 캠페인
- 리타겟팅 전략
- Lookalike 오디언스
- A/B 테스트 방법론

### 4. 크리에이티브 제작
- 플랫폼별 광고 포맷
- 카피라이팅 패턴
- 이미지/영상 가이드라인
- 한국 소비자 반응 패턴

### 5. 예산 계획
- 초기 테스트 예산 (MVP)
- 스케일링 기준
- 채널별 예산 배분
- 시즌별 예산 조정

### 6. 측정 및 분석
- UTM 파라미터 설계
- 전환 추적 설정
- 대시보드 구축
- 주간/월간 리포트 템플릿

## 출력 형식
마크다운, 플랫폼 비교표, 예산 템플릿, KPI 대시보드 설계
```

---

### 17. BIZ-ASO-STRATEGY (앱스토어 최적화)

```markdown
[리서치 ID: BIZ-ASO-STRATEGY]
[우선순위: P3]
[현재 상태: 0%]

# 앱스토어 최적화 (ASO) 전략 리서치

## 현재 상태
- 앱스토어 등록: 미완료
- ASO: 미적용

## 리서치 필요 항목

### 1. 앱스토어 기본 최적화
- 앱 이름 최적화 (30자 이내)
- 부제목 (iOS) / 짧은 설명 (Android)
- 키워드 연구 (iOS 100자)
- 긴 설명 (4000자)

### 2. 시각적 요소
- 앱 아이콘 디자인 가이드
- 스크린샷 최적화 (개수, 순서, 메시지)
- 앱 프리뷰 비디오
- 피처 그래픽 (Android)

### 3. 키워드 전략
- 한국 뷰티 앱 키워드 분석
- 경쟁 앱 키워드 분석
- 시즌별 키워드 변화
- 롱테일 키워드 타겟

### 4. 리뷰 관리
- 리뷰 요청 타이밍
- 부정적 리뷰 대응 전략
- 리뷰 답변 템플릿
- 별점 개선 전략

### 5. 앱스토어 피처링
- 에디터스 초이스 신청
- 시즌별 피처링 기회
- Apple/Google과의 관계 구축

### 6. A/B 테스트
- Google Play 실험 기능
- iOS A/B 테스트 도구
- 테스트 항목 우선순위

### 7. 카테고리 및 경쟁 분석
- 카테고리 선택 전략
- 경쟁 앱 분석 프레임워크
- 랭킹 알고리즘 이해

## 출력 형식
마크다운, 키워드 리스트, 스크린샷 가이드, 체크리스트
```

---

## G. 비즈니스 리서치 - 활성화 & 리텐션

### 18. BIZ-ONBOARDING (온보딩 최적화)

```markdown
[리서치 ID: BIZ-ONBOARDING]
[우선순위: P1]
[현재 상태: 60%]

# 온보딩 및 사용자 활성화 리서치

## 현재 상태
- 온보딩 플로우: 60% (기본 구현)
- 튜토리얼: 40%
- Aha Moment 설계: 0%

## 리서치 필요 항목

### 1. Aha Moment 설계
- 이룸의 핵심 가치 전달 시점
- 첫 번째 성공 경험 정의
- 시간 목표 (Time to Value)
- Aha Moment 측정 지표

### 2. 온보딩 플로우 최적화
- 단계별 완료율 분석
- 이탈 지점 식별
- 스킵 vs 필수 선택
- 개인화 온보딩

### 3. 프로그레시브 온보딩
- 기능별 점진적 소개
- 사용 맥락 기반 가이드
- 빈 상태(Empty State) 디자인
- 인터랙티브 힌트

### 4. 데이터 수집 최적화
- 필수 정보 최소화
- 점진적 프로필 완성
- 개인정보 동의 UX
- 소셜 로그인 활용

### 5. 첫 사용 경험 (FTUE)
- 첫 분석 경험 최적화
- 결과 전달 방식
- 다음 행동 유도
- 성공 축하 UI

### 6. 온보딩 메트릭
- 완료율
- Time to First Value
- Day 1/7/30 리텐션과 상관관계
- A/B 테스트 설계

## 출력 형식
마크다운, 플로우차트, 메트릭 정의, 체크리스트
```

---

### 19. BIZ-RETENTION (리텐션 전략)

```markdown
[리서치 ID: BIZ-RETENTION]
[우선순위: P2]
[현재 상태: 40%]

# 사용자 리텐션 전략 리서치

## 현재 상태
- 푸시 알림 (구현): 80%
- 푸시 알림 (전략): 0%
- 이메일 마케팅: 0%
- 습관 형성: 0%

## 리서치 필요 항목

### 1. 리텐션 프레임워크
- Cohort 분석 방법
- Day 1/7/30/90 리텐션 벤치마크
- 리텐션 커브 분석
- Churn 예측 모델

### 2. 푸시 알림 전략
- 알림 유형별 전략
  - 분석 리마인더
  - 새 기능 안내
  - 개인화 추천
  - 성취/마일스톤
- 발송 시점 최적화
- 빈도 제한
- 개인화 수준

### 3. 이메일 마케팅
- 웰컴 시퀀스 설계
- 재활성화 캠페인
- 뉴스레터 콘텐츠
- 세그먼트별 전략

### 4. 습관 형성 (Hooked 모델)
- 트리거 (내부/외부)
- 행동 (최소 노력)
- 가변적 보상
- 투자 (사용자 데이터)

### 5. 재방문 유도
- 분석 주기 설계 (피부: 월 1회, 체형: 3개월)
- 변화 추적 동기부여
- 스트릭/연속 기록
- 시즌별 분석 제안

### 6. 이탈 방지
- 이탈 징후 감지
- 윈백 캠페인
- 휴면 사용자 재활성화
- 피드백 수집

## 출력 형식
마크다운, 리텐션 전략 매트릭스, 캠페인 템플릿, 측정 지표
```

---

### 20. BIZ-ENGAGEMENT (사용자 참여)

```markdown
[리서치 ID: BIZ-ENGAGEMENT]
[우선순위: P2]
[현재 상태: 30%]

# 사용자 참여도 향상 리서치

## 현재 상태
- 공유 기능: 60%
- 게이미피케이션: 0%
- 커뮤니티 기능: 0%

## 리서치 필요 항목

### 1. 게이미피케이션
- 포인트/뱃지 시스템
- 레벨/등급 체계
- 챌린지/미션
- 리더보드 (적합성 검토)
- 성취 알림

### 2. 사용자 참여 루프
- 일일 체크인
- 주간 요약 리포트
- 월간 변화 분석
- 연간 리캡

### 3. 소셜 기능
- 프로필 공개 범위
- 팔로우/팔로잉
- 피드/타임라인
- 비교 기능 (적절성 검토)

### 4. 콘텐츠 소비
- 뷰티 팁/가이드
- 제품 리뷰
- 사용자 후기
- 전문가 콘텐츠

### 5. 참여 메트릭
- DAU/MAU 비율
- 세션 길이
- 기능별 사용률
- 참여 점수 계산

### 6. 알림 최적화
- 알림 유형별 CTR
- 최적 발송 시간
- 개인화 수준
- 알림 피로도 관리

## 출력 형식
마크다운, 게이미피케이션 설계, 참여 루프 다이어그램
```

---

## H. 비즈니스 리서치 - 수익화

### 21. BIZ-MONETIZATION (수익화 모델) ⚠️ P0

```markdown
[리서치 ID: BIZ-MONETIZATION]
[우선순위: P0 - Critical]
[현재 상태: 0%]

# 수익화 모델 설계 리서치

## 현재 상태
- 수익 모델: 미정의 ❌
- 결제 시스템: 미구현 ❌
- 가격 책정: 미정 ❌

## 리서치 필요 항목

### 1. 수익 모델 비교 분석

| 모델 | 장점 | 단점 | 적합성 |
|------|------|------|--------|
| 프리미엄 | 진입장벽 낮음 | 전환율 의존 | ⭐⭐⭐⭐⭐ |
| 구독 (SaaS) | 예측 가능 | 해지율 관리 | ⭐⭐⭐⭐ |
| 인앱 구매 | 유연성 | 불규칙 | ⭐⭐⭐ |
| 광고 기반 | 무료 유지 | UX 저하 | ⭐⭐ |
| 어필리에이트 | 추가 수익 | 신뢰 이슈 | ⭐⭐⭐ |

### 2. 프리미엄 모델 설계
- 무료 기능 범위
- 프리미엄 기능 정의
- 페이월 위치
- 무료→유료 전환 트리거

### 3. 구독 티어 설계
- 티어 수 (2-3개 권장)
- 티어별 기능 차별화
- 연간 vs 월간 할인
- 팀/가족 플랜

### 4. 뷰티 앱 수익화 벤치마크
- 화해 (국내)
- 글로우 레시피 (글로벌)
- FaceApp (글로벌)
- 뷰티플러스 (국내)

### 5. 전환 최적화
- 무료 체험 전략
- 업그레이드 유도 UI
- 가격 앵커링
- 사회적 증거

### 6. 수익 예측 모델
- MAU → 유료 전환율 (목표 5%)
- ARPU (Average Revenue Per User)
- MRR/ARR 목표
- Break-even 분석

## 출력 형식
마크다운, 수익 모델 비교표, 재무 예측 템플릿, 벤치마크 데이터
```

---

### 22. BIZ-PAYMENT (결제 시스템)

```markdown
[리서치 ID: BIZ-PAYMENT]
[우선순위: P1]
[현재 상태: 0%]

# 결제 시스템 구현 리서치

## 현재 상태
- 결제 시스템: 미구현
- PG 연동: 없음

## 리서치 필요 항목

### 1. 결제 수단 비교

| 결제 수단 | 수수료 | 장점 | 단점 |
|-----------|--------|------|------|
| 토스페이먼츠 | 2.5-3.5% | 쉬운 연동 | |
| 아임포트 | 2-3% | 통합 API | |
| Stripe | 2.9% | 글로벌 | 국내 제한 |
| 카카오페이 | 2.3% | 높은 사용률 | 젊은 층 |
| 네이버페이 | 3.3% | 네이버 시너지 | |

### 2. 인앱 결제 (모바일)
- Apple IAP (30% 수수료)
- Google Play Billing (15-30%)
- 외부 결제 우회 전략
- Reader Rule 활용 (iOS)

### 3. 구독 관리
- 결제 실패 처리
- 자동 갱신 관리
- 환불 정책
- 다운그레이드/업그레이드

### 4. 구현 아키텍처
- 웹훅 처리
- 결제 상태 관리
- 영수증 검증
- 보안 고려사항

### 5. 법적 요구사항
- 전자금융거래법
- 청약철회/환불
- 세금계산서/현금영수증
- PG사 계약 조건

### 6. 테스트 및 모니터링
- 샌드박스 테스트
- 결제 성공률 모니터링
- 실패 알림
- 분쟁 처리

## 출력 형식
마크다운, PG사 비교표, 아키텍처 다이어그램, 체크리스트
```

---

### 23. BIZ-PRICING (가격 책정)

```markdown
[리서치 ID: BIZ-PRICING]
[우선순위: P2]
[현재 상태: 0%]

# 가격 책정 전략 리서치

## 현재 상태
- 가격: 미정
- 경쟁사 분석: 미완료

## 리서치 필요 항목

### 1. 가격 책정 방법론
- 원가 기반 가격 (Cost-plus)
- 가치 기반 가격 (Value-based)
- 경쟁 기반 가격 (Competitive)
- 침투 가격 vs 스키밍 가격

### 2. 한국 뷰티 앱 가격 벤치마크

| 앱 | 월 구독 | 연 구독 | 비고 |
|----|---------|---------|------|
| 화해 프리미엄 | ? | ? | |
| FaceApp Pro | 4,400원 | 29,000원 | |
| 뷰티플러스 | 6,500원 | 45,000원 | |
| Lensa | 7,500원 | 50,000원 | |

### 3. 가격 심리학
- 앵커링 효과
- 미끼 가격 (Decoy)
- 번들링 전략
- 가격 종결 (9,900원 vs 10,000원)

### 4. 할인 전략
- 연간 구독 할인율 (보통 40-50%)
- 첫 달 할인
- 프로모션 주기
- 학생/청소년 할인

### 5. 가격 테스트
- A/B 테스트 설계
- 지불 의사 조사 (WTP)
- Van Westendorp 가격 민감도
- Conjoint 분석

### 6. 가격 커뮤니케이션
- 가격 페이지 디자인
- 가치 제안 강조
- FAQ 작성
- 가격 변경 공지

## 출력 형식
마크다운, 가격 비교표, 테스트 설계, 가격 페이지 와이어프레임
```

---

## I. 비즈니스 리서치 - 운영

### 24. BIZ-COST-OPTIMIZATION (비용 최적화) ⚠️ P0

```markdown
[리서치 ID: BIZ-COST-OPTIMIZATION]
[우선순위: P0 - Critical]
[현재 상태: 0%]

# 운영 비용 최적화 리서치

## 현재 상태
- 비용 추적: 미구현
- 최적화: 미적용

## 현재 비용 구조 (예상)

| 항목 | 1K MAU/월 | 10K MAU/월 | 비고 |
|------|-----------|------------|------|
| Vercel | $20 | $100+ | Pro Plan |
| Supabase | $25 | $75+ | Pro Plan |
| Gemini API | $50+ | $500+ | 분석당 비용 |
| Clerk | $25 | $100+ | 1K MAU/월 포함 |
| Upstash | $10 | $30 | Rate Limiting |
| 총 | ~$130 | ~$805+ | |

## 리서치 필요 항목

### 1. AI API 비용 최적화
- 프롬프트 최적화 (토큰 감소)
- 캐싱 전략 (동일 분석 재사용)
- 배치 처리 가능 영역
- 모델 선택 (Flash vs Pro)
- Fallback 비용 절감 효과

### 2. 인프라 비용 최적화
- Vercel 사용량 모니터링
- Edge Function vs Serverless 비용
- 이미지 최적화 (스토리지 절감)
- CDN 캐싱 극대화

### 3. 데이터베이스 최적화
- 쿼리 최적화 (비용 = 읽기/쓰기 수)
- 인덱스 최적화
- 데이터 보관 정책
- 읽기 레플리카 활용

### 4. 비용 모니터링
- 일일/주간 비용 리포트
- 이상 감지 알림
- 예산 경고
- 비용 대시보드 구축

### 5. 스케일링 전략
- MAU별 비용 예측 모델
- Break-even 포인트
- 비용 절감 우선순위
- 클라우드 예약 인스턴스

### 6. 대안 서비스 검토
- Vercel → Cloudflare Pages
- Supabase → PlanetScale
- Gemini → Anthropic/OpenAI 비용 비교
- Clerk → 자체 인증

## 출력 형식
마크다운, 비용 예측 스프레드시트, 모니터링 대시보드 설계
```

---

### 25. BIZ-CUSTOMER-SUPPORT (고객 지원)

```markdown
[리서치 ID: BIZ-CUSTOMER-SUPPORT]
[우선순위: P3]
[현재 상태: 0%]

# 고객 지원 시스템 리서치

## 현재 상태
- 고객 지원: 미구현
- FAQ: 없음
- 피드백 채널: 없음

## 리서치 필요 항목

### 1. 지원 채널 선정
- 인앱 채팅 (Intercom, Zendesk, Crisp)
- 이메일 지원
- 카카오톡 채널
- 전화 지원 (필요성 검토)

### 2. 셀프서비스 최적화
- FAQ 구조 설계
- 검색 기능
- 가이드/튜토리얼
- 트러블슈팅 가이드

### 3. 지원 티켓 시스템
- 티켓 분류 체계
- SLA (응답 시간 목표)
- 에스컬레이션 경로
- 자동 응답

### 4. 챗봇/AI 지원
- FAQ 기반 챗봇
- GPT 기반 지원 도우미
- 휴먼 에스컬레이션
- 한국어 자연어 처리

### 5. 피드백 수집
- 인앱 피드백 버튼
- NPS (Net Promoter Score)
- CSAT (Customer Satisfaction)
- 기능 요청 수집

### 6. 지원 메트릭
- 응답 시간 (First Response Time)
- 해결 시간 (Resolution Time)
- 만족도 점수
- 티켓 볼륨 추이

## 출력 형식
마크다운, 지원 채널 비교표, SLA 정의, FAQ 템플릿
```

---

### 26. BIZ-ANALYTICS (데이터 분석)

```markdown
[리서치 ID: BIZ-ANALYTICS]
[우선순위: P2]
[현재 상태: 0%]

# 데이터 분석 및 BI 시스템 리서치

## 현재 상태
- 분석 도구: 없음
- 이벤트 추적: 기본만
- 대시보드: 없음

## 리서치 필요 항목

### 1. 분석 도구 선정

| 도구 | 가격 | 장점 | 단점 |
|------|------|------|------|
| Vercel Analytics | 포함 | 간편 | 제한적 |
| PostHog | 무료 | 풀스택 | 셀프호스팅 |
| Mixpanel | $25+/월 | 강력 | 비용 |
| Amplitude | 무료티어 | 상세 | 학습곡선 |
| Plausible | $9/월 | 개인정보 | 기능 제한 |

### 2. 이벤트 추적 설계
- 핵심 이벤트 정의
- 이벤트 명명 규칙
- 속성(Property) 설계
- 퍼널 정의

### 3. 핵심 지표 (KPI) 정의
- AARRR 지표
- 제품 지표 (DAU, MAU, 세션)
- 비즈니스 지표 (MRR, Churn, LTV)
- 건강 지표 (에러율, 응답 시간)

### 4. 대시보드 설계
- 경영진 대시보드
- 제품 대시보드
- 마케팅 대시보드
- 실시간 모니터링

### 5. 코호트 분석
- 가입 코호트
- 행동 코호트
- 리텐션 코호트
- 수익 코호트

### 6. 실험 (A/B 테스트)
- 가설 설정
- 샘플 크기 계산
- 통계적 유의성
- 실험 문화

### 7. 개인정보 보호
- GDPR/개인정보보호법 준수
- 익명화 전략
- 동의 관리
- 데이터 보관 정책

## 출력 형식
마크다운, 이벤트 스키마, 대시보드 와이어프레임, KPI 정의서
```

---

## J. 비즈니스 리서치 - 성장 & 법적

### 27. BIZ-VIRAL-GROWTH (바이럴 성장)

```markdown
[리서치 ID: BIZ-VIRAL-GROWTH]
[우선순위: P2]
[현재 상태: 20%]

# 바이럴 성장 전략 리서치

## 현재 상태
- 공유 기능: 60%
- 친구 초대: 0%
- 바이럴 루프: 0%

## 리서치 필요 항목

### 1. 바이럴 계수 (K-Factor)
- 계산 공식: K = 초대 수 × 전환율
- 목표 K > 1 (자연 성장)
- 측정 방법
- 개선 레버

### 2. 공유 최적화
- 공유 가능 콘텐츠 식별
- 공유 UI/UX 최적화
- 플랫폼별 공유 포맷
- OG 이미지 최적화

### 3. 초대 시스템
- 초대 코드/링크
- 양면 인센티브 (초대자 + 피초대자)
- 추적 및 어트리뷰션
- 부정 방지

### 4. 바이럴 루프 설계
- 트리거 (언제 공유?)
- 채널 (어디서 공유?)
- 가치 (왜 공유?)
- 전환 (어떻게 가입?)

### 5. 레퍼럴 프로그램
- 보상 체계 설계
- 티어 시스템
- 리더보드
- 법적 고려사항

### 6. 소셜 프루프
- 사용자 후기
- 사례 연구
- 미디어 커버리지
- 인플루언서 증언

### 7. 네트워크 효과
- 직접 네트워크 효과
- 간접 네트워크 효과
- 이룸에 적용 가능성

## 출력 형식
마크다운, 바이럴 루프 다이어그램, K-Factor 계산기, 초대 UI 설계
```

---

### 28. BIZ-LEGAL-COMPLIANCE (법적 규제)

```markdown
[리서치 ID: BIZ-LEGAL-COMPLIANCE]
[우선순위: P3]
[현재 상태: 70% (기존 N-1~4 존재)]

# 비즈니스 법적 규제 리서치

## 현재 상태
- 청소년보호: 100% ✅
- 개인정보보호: 80%
- 이용약관: 100% ✅
- AI 면책: 40%
- 전자상거래: 미검토

## 리서치 필요 항목

### 1. 전자상거래 법규
- 전자상거래소비자보호법
- 표시/광고 의무
- 청약철회 규정
- 결제/환불 의무

### 2. AI 서비스 관련 법규
- AI 면책 고지 강화
- 의료기기 해당 여부 (피부/체형 분석)
- 식품/건강 관련 표시 규제
- 허위/과장 광고 방지

### 3. 수익화 관련 법규
- 자동결제 관련 규정
- 구독 해지 용이성
- 가격 표시 의무
- 부가세/세금 처리

### 4. 마케팅 관련 법규
- 광고 표시 의무
- 후기/리뷰 관련 규정
- 인플루언서 마케팅 규제
- 이메일/SMS 마케팅 동의

### 5. 앱스토어 규정
- Apple App Store 가이드라인
- Google Play 정책
- 인앱 결제 규정
- 콘텐츠 규정

### 6. 글로벌 확장 시 고려사항
- GDPR (유럽)
- CCPA (미국 캘리포니아)
- PDPA (동남아)
- 각국 연령 제한

### 7. 법적 문서 정비
- 이용약관 보완
- 개인정보처리방침 보완
- 환불 정책
- 분쟁 해결 절차

## 출력 형식
마크다운, 규제 체크리스트, 법적 문서 템플릿, 위험 평가
```

---

## 리서치 실행 순서 (업데이트)

```
Week 1 (P0 - Critical) - 4개
├── Day 1: SEO-NEXTJS-2026
├── Day 2: RATE-LIMIT-REDIS
├── Day 3: BIZ-MONETIZATION ⭐
└── Day 4: BIZ-COST-OPTIMIZATION ⭐

Week 2 (P1 - High) - 6개
├── Day 1: FORM-PATTERNS-2026
├── Day 2: A11Y-WCAG22
├── Day 3: DESIGN-TOKENS-2026
├── Day 4: ANIMATION-MOTION-2026
├── Day 5: BIZ-ONBOARDING ⭐
└── Day 6: BIZ-PAYMENT ⭐

Week 3 (P2 - Medium) - 10개
├── Day 1: DATA-FETCHING-2026
├── Day 2: STATE-MANAGEMENT-2026
├── Day 3: PERFORMANCE-2026
├── Day 4: TESTING-E2E-2026
├── Day 5: BIZ-RETENTION ⭐
├── Day 6: BIZ-ACQUISITION-ORGANIC ⭐
├── Day 7: BIZ-ANALYTICS ⭐
├── Day 8: BIZ-PRICING ⭐
├── Day 9: BIZ-ENGAGEMENT ⭐
└── Day 10: BIZ-VIRAL-GROWTH ⭐

Week 4 (P3 - Low + Domain) - 8개
├── Day 1: I18N-NEXTJS
├── Day 2: MONITORING-SENTRY
├── Day 3: W-2-REHAB-BUNDLE
├── Day 4: W-2-POSTURE-PROTOCOL
├── Day 5: BIZ-ASO-STRATEGY ⭐
├── Day 6: BIZ-ACQUISITION-PAID ⭐
├── Day 7: BIZ-CUSTOMER-SUPPORT ⭐
└── Day 8: BIZ-LEGAL-COMPLIANCE ⭐
```

---

## 체크리스트 (업데이트)

### A. 도메인 리서치
- [ ] W-2-REHAB-BUNDLE
- [ ] W-2-POSTURE-PROTOCOL

### B. 기술 리서치 - Critical
- [ ] SEO-NEXTJS-2026
- [ ] RATE-LIMIT-REDIS

### C. 기술 리서치 - High
- [ ] FORM-PATTERNS-2026
- [ ] A11Y-WCAG22
- [ ] DESIGN-TOKENS-2026
- [ ] ANIMATION-MOTION-2026

### D. 기술 리서치 - Medium
- [ ] DATA-FETCHING-2026
- [ ] STATE-MANAGEMENT-2026
- [ ] PERFORMANCE-2026
- [ ] TESTING-E2E-2026

### E. 기술 리서치 - Low
- [ ] I18N-NEXTJS
- [ ] MONITORING-SENTRY

### F. 비즈니스 - 사용자 획득
- [ ] BIZ-ACQUISITION-ORGANIC
- [ ] BIZ-ACQUISITION-PAID
- [ ] BIZ-ASO-STRATEGY

### G. 비즈니스 - 활성화 & 리텐션
- [ ] BIZ-ONBOARDING
- [ ] BIZ-RETENTION
- [ ] BIZ-ENGAGEMENT

### H. 비즈니스 - 수익화
- [ ] BIZ-MONETIZATION ⚠️ P0
- [ ] BIZ-PAYMENT
- [ ] BIZ-PRICING

### I. 비즈니스 - 운영
- [ ] BIZ-COST-OPTIMIZATION ⚠️ P0
- [ ] BIZ-CUSTOMER-SUPPORT
- [ ] BIZ-ANALYTICS

### J. 비즈니스 - 성장 & 법적
- [ ] BIZ-VIRAL-GROWTH
- [ ] BIZ-LEGAL-COMPLIANCE

### K. 회사 운영 - 조직/팀
- [ ] ORG-HIRING
- [ ] ORG-CULTURE
- [ ] ORG-REMOTE
- [ ] ORG-PERFORMANCE

### L. 회사 운영 - 재무/투자
- [ ] FIN-FUNDRAISING ⚠️ P1
- [ ] FIN-MODELING
- [ ] FIN-CASHFLOW
- [ ] FIN-TAX

### M. 회사 운영 - 인프라/운영
- [ ] OPS-DR ⚠️ P1
- [ ] OPS-INCIDENT
- [ ] OPS-DEVOPS
- [ ] OPS-SECURITY-AUDIT

### N. 회사 운영 - 법인/행정
- [ ] CORP-INCORPORATION
- [ ] CORP-STOCK-OPTION
- [ ] CORP-IP
- [ ] CORP-CONTRACT

### O. 회사 운영 - 제품 전략
- [ ] PROD-COMPETITOR
- [ ] PROD-USER-RESEARCH
- [ ] PROD-ROADMAP
- [ ] PROD-PIVOT

### P. 파트너십 & 확장
- [ ] PARTNER-B2B
- [ ] PARTNER-ECOSYSTEM

### Q. 위기 관리
- [ ] CRISIS-PR
- [ ] CRISIS-DATA-BREACH

### R. 앱 vs 웹 전략
- [ ] PLATFORM-WEB-VS-APP ⚠️ P0
- [ ] PLATFORM-PWA
- [ ] PLATFORM-NATIVE
- [ ] PLATFORM-CROSS
- [ ] PLATFORM-BACKEND

### S. 품질 속성
- [ ] QUALITY-SCALABILITY ⚠️ P1
- [ ] QUALITY-RELIABILITY ⚠️ P1
- [ ] QUALITY-MAINTAINABILITY
- [ ] QUALITY-TECH-DEBT
- [ ] QUALITY-CODE-METRICS
- [ ] QUALITY-RELEASE

---

**Version**: 3.0 | **Created**: 2026-01-18
**변경 이력**:
- v1.0: 기술 리서치 14개
- v2.0: 비즈니스 리서치 14개 추가 (총 28개)
- v3.0: 회사 운영 20개 + 앱/웹 전략 5개 + 품질 속성 6개 추가 (총 63개)

**다음 업데이트**: 각 리서치 완료 시 체크 및 결과 링크 추가

---

## K. 회사 운영 - 조직/팀

### 29. ORG-HIRING (채용 전략)

```markdown
[리서치 ID: ORG-HIRING]
[우선순위: P2]
[현재 상태: 0%]

# 스타트업 채용 전략 리서치

## 리서치 필요 항목

### 1. 채용 전략 기초
- 창업 초기 역할 우선순위
- 기술 팀 구성 로드맵
- 채용 vs 외주 결정 기준
- 풀타임 vs 파트타임 vs 계약직

### 2. 채용 채널
- 링크드인, 원티드, 로켓펀치
- 개발자 커뮤니티 (OKKY, GeekNews)
- 대학 네트워크
- 해드헌터 활용

### 3. 기술 면접 설계
- 코딩 테스트 vs 과제 vs 페어프로그래밍
- 문화 적합성 평가
- 레퍼런스 체크
- 면접 프로세스 효율화

### 4. 보상 설계
- 시장 임금 벤치마크
- 스톡옵션 활용
- 복지 패키지
- 성장 기회 강조

### 5. 온보딩
- 신규 입사자 체크리스트
- 버디 시스템
- 문서화 및 지식 전달
- 30/60/90일 계획

## 출력 형식
마크다운, 채용 체크리스트, JD 템플릿
```

---

### 30. ORG-CULTURE (조직 문화)

```markdown
[리서치 ID: ORG-CULTURE]
[우선순위: P3]
[현재 상태: 0%]

# 스타트업 조직 문화 설계 리서치

## 리서치 필요 항목

### 1. 핵심 가치 정의
- 미션/비전/밸류 프레임워크
- 행동 강령 작성
- 의사결정 원칙

### 2. 커뮤니케이션 문화
- 투명성 수준 결정
- 피드백 문화
- 1:1 미팅 패턴
- 전사 미팅 주기

### 3. 성장 문화
- 학습 지원 (교육비, 컨퍼런스)
- 지식 공유 세션
- 실패 허용 문화
- OKR/목표 설정

### 4. 워라밸
- 근무 시간 정책
- 휴가 정책
- 번아웃 방지
- 팀 빌딩 활동

## 출력 형식
마크다운, 문화 핸드북 템플릿
```

---

### 31. ORG-REMOTE (원격근무)

```markdown
[리서치 ID: ORG-REMOTE]
[우선순위: P3]
[현재 상태: 0%]

# 원격/하이브리드 근무 설계 리서치

## 리서치 필요 항목

### 1. 근무 모델 선택
- 완전 원격 vs 하이브리드 vs 오피스
- 시간대 관리 (동기/비동기)
- 코어 타임 설정

### 2. 협업 도구
- Slack/Discord/MS Teams 비교
- Notion/Confluence 비교
- 화상회의 도구
- 프로젝트 관리 (Linear, Jira)

### 3. 생산성 관리
- 성과 측정 방법
- 마이크로매니지먼트 방지
- 자율성과 책임

### 4. 팀 연결
- 가상 팀빌딩
- 정기 오프라인 모임
- 온보딩 원격화

## 출력 형식
마크다운, 원격근무 정책 템플릿
```

---

### 32. ORG-PERFORMANCE (성과 관리)

```markdown
[리서치 ID: ORG-PERFORMANCE]
[우선순위: P3]
[현재 상태: 0%]

# 성과 관리 시스템 리서치

## 리서치 필요 항목

### 1. 목표 설정 프레임워크
- OKR vs KPI vs MBO
- 개인/팀/회사 목표 연계
- 분기별 리뷰 주기

### 2. 피드백 시스템
- 360도 피드백
- 실시간 피드백 도구
- 1:1 미팅 프레임워크
- 피드백 교육

### 3. 보상 연계
- 성과급 설계
- 승진 기준
- 스톡옵션 베스팅
- 비금전적 보상

### 4. 저성과자 관리
- PIP (Performance Improvement Plan)
- 역할 재배치
- 법적 고려사항

## 출력 형식
마크다운, OKR 템플릿, 리뷰 체크리스트
```

---

## L. 회사 운영 - 재무/투자

### 33. FIN-FUNDRAISING (투자 유치) ⚠️ P1

```markdown
[리서치 ID: FIN-FUNDRAISING]
[우선순위: P1]
[현재 상태: 0%]

# 스타트업 투자 유치 리서치

## 리서치 필요 항목

### 1. 투자 라운드 이해
- Pre-Seed / Seed / Series A 차이
- 각 라운드별 기대치
- 한국 VC 생태계
- 엔젤투자자 vs VC

### 2. 투자 유치 준비
- 피치덱 구성요소 (12슬라이드)
- 재무 모델 요구사항
- KPI 및 트랙션 증명
- 팀 소개 방법

### 3. 밸류에이션
- Pre-money vs Post-money
- 밸류에이션 방법론
- 희석률 계산
- 협상 전략

### 4. 투자 계약
- 텀시트 주요 조항
- 우선주 vs 보통주
- 안티희석 조항
- 보드 구성

### 5. 정부 지원
- 창업진흥원 프로그램
- 중소기업청 지원
- TIPS 프로그램
- 각종 창업 경진대회

## 출력 형식
마크다운, 피치덱 체크리스트, 밸류에이션 계산기
```

---

### 34. FIN-MODELING (재무 모델링)

```markdown
[리서치 ID: FIN-MODELING]
[우선순위: P2]
[현재 상태: 0%]

# 스타트업 재무 모델링 리서치

## 리서치 필요 항목

### 1. 수익 모델링
- 매출 예측 방법론
- Bottom-up vs Top-down
- 코호트 기반 예측
- 시즌별 변동

### 2. 비용 모델링
- 고정비 vs 변동비
- 인건비 계획
- 인프라 비용 스케일링
- 마케팅 비용

### 3. Unit Economics
- CAC (고객 획득 비용)
- LTV (고객 생애 가치)
- LTV/CAC 비율 목표
- Payback Period

### 4. 재무제표
- 손익계산서 예측
- 현금흐름표
- 대차대조표
- 월별 vs 연별

### 5. 시나리오 분석
- Best/Base/Worst 시나리오
- 민감도 분석
- Break-even 분석
- 런웨이 계산

## 출력 형식
마크다운, 재무 모델 템플릿 (스프레드시트)
```

---

### 35. FIN-CASHFLOW (현금흐름 관리)

```markdown
[리서치 ID: FIN-CASHFLOW]
[우선순위: P3]
[현재 상태: 0%]

# 현금흐름 관리 리서치

## 리서치 필요 항목

### 1. 현금 관리 기초
- 런웨이 계산 및 모니터링
- 최소 현금 보유량
- 현금 vs 수익 구분
- 예비비 정책

### 2. 수금 관리
- 결제 주기 최적화
- 미수금 관리
- 자동결제 활용
- 환불 처리

### 3. 지출 관리
- 고정 지출 최소화
- 결제 주기 협상
- 비용 승인 프로세스
- 신용카드 활용

### 4. 위기 대응
- 현금 부족 시 옵션
- 브릿지 파이낸싱
- 비용 절감 우선순위
- 피봇 고려

## 출력 형식
마크다운, 현금흐름 템플릿
```

---

### 36. FIN-TAX (세무/회계)

```markdown
[리서치 ID: FIN-TAX]
[우선순위: P3]
[현재 상태: 0%]

# 스타트업 세무/회계 리서치

## 리서치 필요 항목

### 1. 법인세 기초
- 법인세율 이해
- 세금 신고 일정
- 결산 프로세스
- 세무대리인 선정

### 2. 스타트업 세제 혜택
- 창업중소기업 세액감면
- R&D 세액공제
- 벤처기업 혜택
- 고용증대 세액공제

### 3. 부가가치세
- 매출/매입 세금계산서
- 신고 주기
- 환급 프로세스
- 글로벌 서비스 VAT

### 4. 회계 시스템
- 회계 소프트웨어 (더존, 얼마에요)
- 복식부기 기초
- 증빙 관리
- 외부 감사 준비

## 출력 형식
마크다운, 세금 캘린더, 절세 체크리스트
```

---

## M. 회사 운영 - 인프라/운영

### 37. OPS-DR (재해 복구) ⚠️ P1

```markdown
[리서치 ID: OPS-DR]
[우선순위: P1]
[현재 상태: 0%]

# 재해 복구 (DR) 전략 리서치

## 리서치 필요 항목

### 1. DR 기초 개념
- RTO (Recovery Time Objective)
- RPO (Recovery Point Objective)
- DR 티어 (Cold/Warm/Hot)
- 비용 vs 복구 시간 trade-off

### 2. 백업 전략
- 데이터베이스 백업 (Supabase)
- 코드 저장소 (GitHub)
- 설정/환경변수 백업
- 백업 검증 주기

### 3. 장애 시나리오
- 서비스 장애 대응
- 데이터 손실 대응
- 보안 침해 대응
- 제3자 서비스 장애

### 4. DR 계획 문서화
- 비상 연락망
- 복구 절차서
- 역할 및 책임
- 정기 훈련

## 출력 형식
마크다운, DR 플레이북, 체크리스트
```

---

### 38. OPS-INCIDENT (인시던트 관리)

```markdown
[리서치 ID: OPS-INCIDENT]
[우선순위: P2]
[현재 상태: 0%]

# 인시던트 관리 프로세스 리서치

## 리서치 필요 항목

### 1. 인시던트 분류
- 심각도 레벨 정의 (P0-P3)
- 영향 범위 평가
- 에스컬레이션 기준
- SLA 정의

### 2. 대응 프로세스
- 감지 → 대응 → 복구 → 사후분석
- 온콜 로테이션
- 커뮤니케이션 채널
- 상태 페이지 운영

### 3. 사후 분석 (Postmortem)
- Blameless 문화
- 5 Whys 분석
- 재발 방지 조치
- 문서화 및 공유

### 4. 도구
- PagerDuty / Opsgenie
- 상태 페이지 (Statuspage)
- 인시던트 로그

## 출력 형식
마크다운, 인시던트 템플릿, Postmortem 템플릿
```

---

### 39. OPS-DEVOPS (데브옵스)

```markdown
[리서치 ID: OPS-DEVOPS]
[우선순위: P2]
[현재 상태: 60%]

# DevOps 성숙도 향상 리서치

## 현재 상태
- CI: GitHub Actions (80%)
- CD: Vercel 자동 배포 (90%)
- IaC: 미적용 (0%)
- 모니터링: 기본 (30%)

## 리서치 필요 항목

### 1. CI/CD 고도화
- 테스트 병렬화
- 캐싱 최적화
- 배포 전략 (Canary, Blue-Green)
- Feature Flags 연동

### 2. Infrastructure as Code
- Terraform vs Pulumi
- Vercel 설정 코드화
- 환경 일관성
- 변경 추적

### 3. 컨테이너화
- Docker 활용 검토
- 로컬 개발 환경 통일
- 프로덕션 적용 여부

### 4. 관측성 (Observability)
- 로깅 전략
- 메트릭 수집
- 분산 추적
- 대시보드

## 출력 형식
마크다운, CI/CD 파이프라인 설계, 체크리스트
```

---

### 40. OPS-SECURITY-AUDIT (보안 감사)

```markdown
[리서치 ID: OPS-SECURITY-AUDIT]
[우선순위: P3]
[현재 상태: 0%]

# 보안 감사 및 침투 테스트 리서치

## 리서치 필요 항목

### 1. 보안 감사 유형
- 코드 감사 (SAST)
- 동적 분석 (DAST)
- 침투 테스트
- 규정 준수 감사

### 2. 자동화 도구
- Snyk / Dependabot
- SonarQube
- OWASP ZAP
- 비용 vs 효과

### 3. 외부 감사
- 침투 테스트 업체 선정
- 범위 정의
- 비용 및 주기
- 결과 대응

### 4. 인증
- ISO 27001
- SOC 2
- ISMS-P
- 필요성 및 시기

## 출력 형식
마크다운, 보안 체크리스트, 벤더 비교
```

---

## N. 회사 운영 - 법인/행정

### 41. CORP-INCORPORATION (법인 설립)

```markdown
[리서치 ID: CORP-INCORPORATION]
[우선순위: P3]
[현재 상태: 0%]

# 법인 설립 및 운영 리서치

## 리서치 필요 항목

### 1. 법인 형태 선택
- 주식회사 vs 유한회사
- 자본금 결정
- 설립 절차 및 비용
- 벤처기업 인증

### 2. 등기 및 행정
- 필요 서류
- 법인 인감
- 사업자등록
- 계좌 개설

### 3. 주주 구성
- 창업자 지분 구조
- 공동창업자 계약
- 베스팅 조건
- 의결권 설계

### 4. 정관 설계
- 필수 조항
- 이사회 구성
- 주주총회 규정
- 변경 절차

## 출력 형식
마크다운, 설립 체크리스트, 비용 예측
```

---

### 42. CORP-STOCK-OPTION (스톡옵션)

```markdown
[리서치 ID: CORP-STOCK-OPTION]
[우선순위: P3]
[현재 상태: 0%]

# 스톡옵션 설계 리서치

## 리서치 필요 항목

### 1. 스톡옵션 기초
- 스톡옵션 vs RSU
- 법적 요건
- 세금 처리
- 행사 방법

### 2. 풀 설계
- 전체 풀 크기 (보통 10-15%)
- 직급별 배분
- 베스팅 스케줄 (4년/1년 클리프)
- 리프레시 정책

### 3. 가격 결정
- 행사가격 산정
- 409A 밸류에이션
- 한국 특수성
- 재평가 시기

### 4. 관리
- 스톡옵션 계약서
- 행사 프로세스
- 퇴사 시 처리
- 기록 관리

## 출력 형식
마크다운, 스톡옵션 정책 템플릿, 계산기
```

---

### 43. CORP-IP (지식재산권)

```markdown
[리서치 ID: CORP-IP]
[우선순위: P3]
[현재 상태: 0%]

# 지식재산권 관리 리서치

## 리서치 필요 항목

### 1. IP 유형 이해
- 특허 (발명)
- 상표 (브랜드)
- 저작권 (코드, 콘텐츠)
- 디자인권

### 2. 상표 등록
- "이룸" 상표 검색
- 출원 절차
- 비용 및 시간
- 국제 상표 (마드리드)

### 3. 특허 전략
- 특허 출원 필요성 검토
- 방어적 특허
- 비용 대비 효과
- 특허 기술 공유

### 4. 저작권
- 코드 저작권
- 오픈소스 라이선스 관리
- AI 생성 콘텐츠 저작권
- 사용자 콘텐츠 권리

## 출력 형식
마크다운, IP 체크리스트, 비용 예측
```

---

### 44. CORP-CONTRACT (계약 관리)

```markdown
[리서치 ID: CORP-CONTRACT]
[우선순위: P3]
[현재 상태: 0%]

# 계약 관리 리서치

## 리서치 필요 항목

### 1. 필수 계약서
- 근로계약서
- 비밀유지계약 (NDA)
- 서비스이용약관
- 개인정보처리방침

### 2. B2B 계약
- 서비스 계약 (SaaS)
- 파트너십 계약
- 어필리에이트 계약
- 벤더 계약

### 3. 투자 관련 계약
- 텀시트
- 투자계약서
- 주주간 계약
- SAFE/Convertible Note

### 4. 계약 관리 시스템
- 전자계약 도구
- 버전 관리
- 갱신 알림
- 법률 자문 활용

## 출력 형식
마크다운, 계약서 템플릿 목록, 체크리스트
```

---

## O. 회사 운영 - 제품 전략

### 45. PROD-COMPETITOR (경쟁사 분석)

```markdown
[리서치 ID: PROD-COMPETITOR]
[우선순위: P2]
[현재 상태: 0%]

# 경쟁사 분석 프레임워크 리서치

## 리서치 필요 항목

### 1. 경쟁사 맵핑
- 직접 경쟁사 (K-뷰티 앱)
- 간접 경쟁사 (일반 뷰티 앱)
- 잠재 경쟁사 (빅테크)
- 대체재

### 2. 분석 프레임워크
- SWOT 분석
- Porter's Five Forces
- 기능 비교 매트릭스
- 가격 비교

### 3. 경쟁사 모니터링
- 앱스토어 순위 추적
- 소셜 미디어 분석
- 채용 공고 분석
- 특허/상표 출원

### 4. 차별화 전략
- 경쟁 우위 정의
- 블루오션 전략
- 니치 타겟팅
- 포지셔닝

## 출력 형식
마크다운, 경쟁사 비교표, 분석 템플릿
```

---

### 46. PROD-USER-RESEARCH (사용자 리서치)

```markdown
[리서치 ID: PROD-USER-RESEARCH]
[우선순위: P2]
[현재 상태: 0%]

# 사용자 리서치 방법론 리서치

## 리서치 필요 항목

### 1. 정량 리서치
- 설문조사 설계
- A/B 테스트
- 분석 데이터 활용
- 통계적 유의성

### 2. 정성 리서치
- 사용자 인터뷰
- 포커스 그룹
- 다이어리 스터디
- 섀도잉

### 3. 사용성 테스트
- 모더레이티드 테스트
- 언모더레이티드 테스트
- 원격 테스트 도구
- 태스크 설계

### 4. 인사이트 활용
- 친화도 다이어그램
- 페르소나 업데이트
- 제품 결정 연계
- 리서치 리포지토리

## 출력 형식
마크다운, 인터뷰 가이드, 설문 템플릿
```

---

### 47. PROD-ROADMAP (로드맵 관리)

```markdown
[리서치 ID: PROD-ROADMAP]
[우선순위: P2]
[현재 상태: 30%]

# 제품 로드맵 관리 리서치

## 리서치 필요 항목

### 1. 로드맵 유형
- 타임라인 기반
- Now/Next/Later
- 테마 기반
- OKR 연계

### 2. 우선순위 프레임워크
- RICE 스코어링
- Kano 모델
- Value vs Effort
- MoSCoW

### 3. 이해관계자 관리
- 내부 커뮤니케이션
- 고객 로드맵 공유
- 피드백 수집
- 변경 관리

### 4. 도구
- Linear, Jira, Notion
- 로드맵 시각화
- 진행 추적
- 버전 관리

## 출력 형식
마크다운, 로드맵 템플릿, 우선순위 매트릭스
```

---

### 48. PROD-PIVOT (피봇 전략)

```markdown
[리서치 ID: PROD-PIVOT]
[우선순위: P3]
[현재 상태: 0%]

# 피봇 전략 리서치

## 리서치 필요 항목

### 1. 피봇 신호 감지
- PMF 미달 지표
- 성장 정체
- 시장 변화
- 경쟁 압박

### 2. 피봇 유형
- 고객 세그먼트 피봇
- 문제 피봇
- 솔루션 피봇
- 수익모델 피봇
- 채널 피봇

### 3. 피봇 실행
- 가설 수립
- 빠른 검증
- 팀 커뮤니케이션
- 투자자 대응

### 4. 사례 연구
- 성공적 피봇 (Slack, Instagram)
- 실패 피봇 분석
- 의사결정 프로세스

## 출력 형식
마크다운, 피봇 체크리스트, 사례 분석
```

---

## P. 파트너십 & 확장

### 49. PARTNER-B2B (B2B 파트너십)

```markdown
[리서치 ID: PARTNER-B2B]
[우선순위: P3]
[현재 상태: 0%]

# B2B 파트너십 전략 리서치

## 리서치 필요 항목

### 1. B2B 기회 탐색
- 뷰티 브랜드 제휴
- 피트니스 센터 연동
- 병원/클리닉 파트너
- 기업 복지 프로그램

### 2. 제휴 모델
- 화이트라벨
- 수익 공유
- API 제공
- 공동 마케팅

### 3. 영업 전략
- 파이프라인 관리
- 제안서 작성
- 가격 책정
- 계약 협상

### 4. 파트너 관리
- 파트너 온보딩
- 성과 모니터링
- 관계 유지
- 분쟁 해결

## 출력 형식
마크다운, 파트너 제안서 템플릿, 파이프라인 관리
```

---

### 50. PARTNER-ECOSYSTEM (API 생태계)

```markdown
[리서치 ID: PARTNER-ECOSYSTEM]
[우선순위: P3]
[현재 상태: 0%]

# API 생태계 구축 리서치

## 리서치 필요 항목

### 1. 공개 API 전략
- API 공개 범위 결정
- 버전 관리 전략
- 문서화 (OpenAPI)
- 개발자 포털

### 2. 개발자 경험
- 빠른 시작 가이드
- SDK 제공 (JS, Python)
- 샌드박스 환경
- 커뮤니티 지원

### 3. 비즈니스 모델
- API 과금 모델 (호출당, 구독)
- 무료 티어 설계
- 엔터프라이즈 플랜
- 파트너 할인

### 4. 거버넌스
- API 가이드라인
- SLA 정의
- 변경 관리
- 폐기 정책

## 출력 형식
마크다운, API 전략 문서, 비즈니스 모델
```

---

## Q. 위기 관리

### 51. CRISIS-PR (PR 위기관리)

```markdown
[리서치 ID: CRISIS-PR]
[우선순위: P3]
[현재 상태: 0%]

# PR 위기관리 리서치

## 리서치 필요 항목

### 1. 위기 유형
- 서비스 장애
- 개인정보 유출
- 부정적 리뷰/바이럴
- 법적 분쟁

### 2. 대응 체계
- 위기 대응팀 구성
- 커뮤니케이션 채널
- 대변인 지정
- 의사결정 권한

### 3. 커뮤니케이션 전략
- 초기 대응 (골든 타임)
- 공식 입장문 작성
- SNS 대응
- 미디어 대응

### 4. 복구 전략
- 재발 방지 조치
- 고객 신뢰 회복
- 보상 정책
- 사후 분석

## 출력 형식
마크다운, 위기 대응 플레이북, 입장문 템플릿
```

---

### 52. CRISIS-DATA-BREACH (데이터 유출 대응)

```markdown
[리서치 ID: CRISIS-DATA-BREACH]
[우선순위: P3]
[현재 상태: 0%]

# 데이터 유출 대응 리서치

## 리서치 필요 항목

### 1. 법적 의무
- 개인정보보호법 신고 의무 (72시간)
- KISA 신고 절차
- 정보주체 통지 의무
- 과태료 기준

### 2. 기술적 대응
- 유출 범위 확인
- 증거 보전
- 취약점 차단
- 포렌식 분석

### 3. 커뮤니케이션
- 고객 통지 방법
- 통지 내용 구성
- FAQ 준비
- 고객센터 대응

### 4. 복구 및 예방
- 보상 정책
- 재발 방지 조치
- 보안 강화
- 정기 점검

## 출력 형식
마크다운, 유출 대응 체크리스트, 통지문 템플릿
```

---

## R. 앱 vs 웹 전략

### 53. PLATFORM-WEB-VS-APP (웹 vs 앱 전략) ⚠️ P0

```markdown
[리서치 ID: PLATFORM-WEB-VS-APP]
[우선순위: P0 - Critical]
[현재 상태: 0%]

# 웹 vs 앱 플랫폼 전략 리서치

## 리서치 필요 항목

### 1. 플랫폼별 특성 비교

| 측면 | 웹 | 네이티브 앱 | PWA |
|------|-----|-----------|-----|
| 접근성 | URL 공유, 검색 | 앱스토어 | URL + 설치 |
| 성능 | 중간 | 최상 | 상 |
| 기능 | 제한적 | 풀 액세스 | 중간 |
| 업데이트 | 즉시 | 앱스토어 심사 | 즉시 |
| 오프라인 | 제한적 | 가능 | Service Worker |
| 비용 | 낮음 | 높음 | 중간 |
| 리텐션 | 낮음 | 높음 | 중간 |

### 2. 이룸 특화 고려사항
- 카메라 접근 (이미지 분석)
- 푸시 알림 (리텐션)
- 오프라인 기능 필요성
- 타겟 사용자 행동 패턴

### 3. 순차 전략
- Web First vs App First
- 병행 개발 vs 순차 개발
- 리소스 배분
- 마일스톤 설정

### 4. 기술 스택 결정
- 웹: Next.js (현재)
- 앱: React Native vs Flutter vs Swift/Kotlin
- 코드 공유 전략
- 팀 역량

### 5. 비용-효과 분석
- 개발 비용
- 유지보수 비용
- 사용자 획득 비용 (CAC)
- LTV 차이

## 출력 형식
마크다운, 의사결정 매트릭스, 비용 분석
```

---

### 54. PLATFORM-PWA (PWA 전략)

```markdown
[리서치 ID: PLATFORM-PWA]
[우선순위: P2]
[현재 상태: 80%]

# PWA 고도화 전략 리서치

## 현재 상태
- Service Worker: 80%
- 오프라인: 60%
- 설치 프롬프트: 50%
- 푸시 알림: 80%

## 리서치 필요 항목

### 1. PWA 완성도 향상
- Workbox 고급 활용
- 오프라인 UX 개선
- Background Sync
- Periodic Background Sync

### 2. 설치 경험 최적화
- 설치 배너 타이밍
- 설치 혜택 안내
- 설치율 추적
- A/B 테스트

### 3. iOS 제약 대응
- Safari PWA 한계
- 푸시 알림 (iOS 16.4+)
- 홈화면 추가 유도
- 웹뷰 대안

### 4. 성능 최적화
- 앱 쉘 아키텍처
- 프리캐싱 전략
- 런타임 캐싱
- 이미지 최적화

## 출력 형식
마크다운, PWA 체크리스트, 구현 가이드
```

---

### 55. PLATFORM-NATIVE (네이티브 앱)

```markdown
[리서치 ID: PLATFORM-NATIVE]
[우선순위: P2]
[현재 상태: 계획 단계]

# 네이티브 앱 개발 전략 리서치

## 현재 상태
- Expo 설정: 완료
- 기본 구조: 60%
- 기능 구현: 20%

## 리서치 필요 항목

### 1. 네이티브 필수 기능
- 카메라 최적화
- 갤러리 통합
- 푸시 알림 (APNs, FCM)
- 생체 인증

### 2. 앱스토어 전략
- iOS App Store 심사 가이드
- Google Play 정책
- 앱 메타데이터 최적화
- 심사 거절 대응

### 3. 성능 최적화
- 네이티브 모듈 활용
- 이미지 처리 최적화
- 메모리 관리
- 배터리 최적화

### 4. 배포 전략
- 테스트플라이트/내부 테스트
- 단계적 출시
- 버전 관리
- 강제 업데이트

## 출력 형식
마크다운, 앱스토어 체크리스트, 심사 가이드
```

---

### 56. PLATFORM-CROSS (크로스플랫폼)

```markdown
[리서치 ID: PLATFORM-CROSS]
[우선순위: P3]
[현재 상태: React Native 선택]

# 크로스플랫폼 기술 비교 리서치

## 리서치 필요 항목

### 1. 프레임워크 비교

| 측면 | React Native | Flutter | Kotlin MM |
|------|-------------|---------|-----------|
| 언어 | JavaScript/TS | Dart | Kotlin |
| 성능 | 좋음 | 매우 좋음 | 네이티브 |
| UI | 네이티브 | 커스텀 | 네이티브 |
| 생태계 | 풍부 | 성장 중 | 새로움 |
| 웹 공유 | 가능 | 가능 | 제한적 |

### 2. 코드 공유 전략
- 웹-앱 공유 범위
- 공유 패키지 설계
- 플랫폼별 분기
- 모노레포 구조

### 3. Expo 활용
- Expo Go vs Development Build
- EAS Build
- Expo 모듈
- 네이티브 확장

### 4. 팀 역량 고려
- 현재 팀 스킬셋
- 학습 곡선
- 채용 풀
- 유지보수

## 출력 형식
마크다운, 기술 비교표, 의사결정 가이드
```

---

### 57. PLATFORM-BACKEND (백엔드 아키텍처)

```markdown
[리서치 ID: PLATFORM-BACKEND]
[우선순위: P2]
[현재 상태: Supabase Serverless]

# 백엔드 아키텍처 확장 리서치

## 현재 상태
- Supabase: PostgreSQL + RLS
- Vercel: Serverless API
- Edge Functions: 일부 활용

## 리서치 필요 항목

### 1. 아키텍처 옵션

| 패턴 | 장점 | 단점 | 적합성 |
|------|------|------|--------|
| Serverless (현재) | 간단, 저비용 | Cold Start | ⭐⭐⭐⭐ |
| Microservices | 확장성 | 복잡성 | ⭐⭐ |
| Monolith | 단순 | 확장 한계 | ⭐⭐⭐ |

### 2. API 설계
- REST vs GraphQL
- API 버전 관리
- Rate Limiting
- 캐싱 전략

### 3. 데이터베이스 스케일링
- 읽기 레플리카
- 샤딩 전략
- 커넥션 풀링
- 쿼리 최적화

### 4. 서버리스 고도화
- Edge Functions 활용
- Long-running Tasks
- Queue (Inngest, Trigger)
- Cron Jobs

## 출력 형식
마크다운, 아키텍처 다이어그램, 확장 로드맵
```

---

## S. 품질 속성

### 58. QUALITY-SCALABILITY (확장성) ⚠️ P1

```markdown
[리서치 ID: QUALITY-SCALABILITY]
[우선순위: P1]
[현재 상태: 50%]

# 시스템 확장성 리서치

## 현재 상태
- Vercel Edge: 글로벌 배포
- Supabase: 싱글 리전
- CDN: 기본 활용
- 캐싱: 부분 적용

## 리서치 필요 항목

### 1. 수평적 확장
- Serverless 자동 확장
- 데이터베이스 레플리케이션
- 로드 밸런싱
- 지역 분산

### 2. 수직적 확장
- 리소스 최적화
- 쿼리 튜닝
- 인덱스 최적화
- 메모리 관리

### 3. 확장성 패턴
- CQRS (명령/쿼리 분리)
- Event Sourcing
- 비동기 처리
- 큐 기반 아키텍처

### 4. 용량 계획
- MAU별 리소스 예측
- 병목 지점 식별
- 부하 테스트
- 자동 스케일링 트리거

### 5. 비용 vs 확장성
- 스케일링 비용 모델
- 최적화 우선순위
- 예산 제약 대응
- ROI 분석

## 출력 형식
마크다운, 확장성 아키텍처, 용량 계획서
```

---

### 59. QUALITY-RELIABILITY (안정성) ⚠️ P1

```markdown
[리서치 ID: QUALITY-RELIABILITY]
[우선순위: P1]
[현재 상태: 60%]

# 시스템 안정성 리서치

## 현재 상태
- 가용성: ~99% (추정)
- 모니터링: 기본
- 장애 대응: 수동

## 리서치 필요 항목

### 1. 가용성 목표
- SLA 정의 (99.9% = 8.76시간/년)
- 가용성 측정 방법
- 다운타임 예산
- 성능 저하 정의

### 2. 장애 복원력
- Circuit Breaker 패턴
- Retry with Backoff
- Fallback 전략
- Graceful Degradation

### 3. 중복성 설계
- 다중 가용 영역
- 장애 조치 (Failover)
- 데이터 복제
- 상태 비저장 설계

### 4. 카오스 엔지니어링
- Chaos Monkey 개념
- 장애 시뮬레이션
- 게임 데이
- 점진적 도입

### 5. 모니터링 및 알림
- 헬스체크
- 핵심 지표 모니터링
- 알림 임계값
- 에스컬레이션

## 출력 형식
마크다운, SLA 정의서, 안정성 체크리스트
```

---

### 60. QUALITY-MAINTAINABILITY (유지보수성)

```markdown
[리서치 ID: QUALITY-MAINTAINABILITY]
[우선순위: P1]
[현재 상태: 70%]

# 코드 유지보수성 리서치

## 현재 상태
- TypeScript: 100%
- 린팅: 90%
- 테스트: 60%
- 문서화: 50%

## 리서치 필요 항목

### 1. 코드 구조
- 디렉토리 구조 표준
- 모듈 분리 원칙
- 의존성 관리
- 순환 의존성 방지

### 2. 코딩 표준
- 네이밍 컨벤션
- 코드 리뷰 가이드
- PR 템플릿
- 자동화된 스타일 검사

### 3. 문서화
- 코드 주석 기준
- API 문서화
- 아키텍처 문서
- ADR (Architecture Decision Records)

### 4. 리팩토링
- 리팩토링 시점
- 안전한 리팩토링 방법
- 회귀 테스트
- 점진적 개선

### 5. 기술 부채 관리
- 부채 식별 방법
- 우선순위 결정
- 해결 시간 확보
- 예방 전략

## 출력 형식
마크다운, 코딩 가이드, 문서화 템플릿
```

---

### 61. QUALITY-TECH-DEBT (기술 부채)

```markdown
[리서치 ID: QUALITY-TECH-DEBT]
[우선순위: P2]
[현재 상태: 관리 시작]

# 기술 부채 관리 리서치

## 리서치 필요 항목

### 1. 기술 부채 유형
- 계획된 부채 (의도적 단축)
- 비의도적 부채 (실수, 지식 부족)
- 낡은 부채 (기술 진부화)
- 환경적 부채 (의존성 업데이트)

### 2. 부채 추적
- 부채 목록 관리
- 영향도 평가
- 비용 추정
- 우선순위 매트릭스

### 3. 해결 전략
- 20% 규칙 (매 스프린트)
- 리팩토링 스프린트
- 기능과 병행
- Boy Scout Rule

### 4. 예방 전략
- 코드 리뷰 강화
- TDD 도입
- 페어 프로그래밍
- 지속적 학습

### 5. 커뮤니케이션
- 이해관계자 설명
- ROI 제시
- 시간 확보 협상
- 진행 보고

## 출력 형식
마크다운, 부채 추적 템플릿, 우선순위 매트릭스
```

---

### 62. QUALITY-CODE-METRICS (코드 품질 지표)

```markdown
[리서치 ID: QUALITY-CODE-METRICS]
[우선순위: P2]
[현재 상태: 기본 린팅만]

# 코드 품질 지표 리서치

## 리서치 필요 항목

### 1. 코드 복잡도
- Cyclomatic Complexity
- Cognitive Complexity
- 중첩 깊이
- 함수/파일 길이

### 2. 테스트 커버리지
- 라인 커버리지
- 브랜치 커버리지
- 변이 테스팅
- 커버리지 목표

### 3. 정적 분석
- ESLint 규칙 확장
- SonarQube
- TypeScript strict 모드
- 보안 취약점 스캔

### 4. 코드 중복
- jscpd 도구
- 중복 임계값
- 리팩토링 기준
- 공통 모듈화

### 5. 의존성 건강
- npm audit
- 버전 관리
- 라이선스 검사
- 취약점 알림

### 6. 대시보드
- 품질 트렌드
- 팀별 비교
- 목표 대비 현황
- 자동화된 리포트

## 출력 형식
마크다운, 지표 정의서, 대시보드 설계
```

---

### 63. QUALITY-RELEASE (릴리스 관리)

```markdown
[리서치 ID: QUALITY-RELEASE]
[우선순위: P2]
[현재 상태: Vercel 자동 배포]

# 릴리스 관리 전략 리서치

## 현재 상태
- 배포: Vercel 자동
- 롤백: 수동
- 릴리스 노트: 없음

## 리서치 필요 항목

### 1. 배포 전략
- Canary 배포
- Blue-Green 배포
- Rolling 배포
- Feature Flags 연동

### 2. 버전 관리
- Semantic Versioning
- 릴리스 브랜치 전략
- 태깅 규칙
- Changelog 자동화

### 3. 릴리스 프로세스
- 릴리스 체크리스트
- QA 단계
- 스테이징 환경
- 최종 승인

### 4. 롤백 전략
- 자동 롤백 트리거
- 수동 롤백 절차
- 데이터 마이그레이션 롤백
- 핫픽스 프로세스

### 5. 커뮤니케이션
- 릴리스 노트 작성
- 내부 공지
- 사용자 공지
- 문서 업데이트

## 출력 형식
마크다운, 릴리스 체크리스트, 전략 가이드
```

---

## T. 원리 문서 (N×M 조합 분석)

### 64. PRINCIPLE-NUTRITION-SCIENCE (영양학 원리)

```markdown
[리서치 ID: PRINCIPLE-NUTRITION-SCIENCE]
[우선순위: P1]
[현재 상태: 0% - docs/principles/nutrition-science.md 없음]

# 영양학 기본 원리 리서치

## 현재 상태
- 영양 분석 기능: 존재
- 원리 문서: 없음 ❌
- 과학적 근거: 미문서화

## 리서치 필요 항목

### 1. 매크로 영양소 원리
- 탄수화물/단백질/지방 비율 (목표별)
- 열량 계산 공식 (Harris-Benedict, Mifflin-St Jeor)
- 체형별 매크로 비율 최적화
- 운동 목표별 영양 비율

### 2. 마이크로 영양소 원리
- 필수 비타민/미네랄 역할
- 결핍 증상과 피부/건강 연관성
- 한국인 영양섭취기준 (KDRIs)
- 상호작용 (흡수 촉진/억제)

### 3. 영양-피부 연결 원리
- 콜라겐 생성: 비타민C, 아미노산
- 항산화: 비타민E, 셀레늄
- 피지 조절: 아연, 오메가3
- 수분 유지: 히알루론산 전구체

### 4. 영양-운동 연결 원리
- 운동 전후 영양 타이밍
- 근육 합성 최적화
- 회복 영양학
- 에너지 시스템별 영양

### 5. 구현 도출
- 원리 → 알고리즘 연결
- 추천 로직 수학적 기반
- 검증 방법

## 출력 형식
마크다운, docs/principles/nutrition-science.md 템플릿
```

---

### 65. PRINCIPLE-EXERCISE-PHYSIOLOGY (운동생리학 원리)

```markdown
[리서치 ID: PRINCIPLE-EXERCISE-PHYSIOLOGY]
[우선순위: P2]
[현재 상태: 0% - docs/principles/exercise-physiology.md 없음]

# 운동생리학 기본 원리 리서치

## 리서치 필요 항목

### 1. 에너지 시스템
- ATP-PC 시스템 (무산소, 즉시)
- 젖산 시스템 (무산소, 단기)
- 유산소 시스템 (장기)
- 운동 강도별 에너지원

### 2. 근육 생리학
- 근섬유 유형 (Type I, IIa, IIx)
- 근비대 메커니즘
- 초과회복 원리
- 점진적 과부하

### 3. 체형별 운동 원리
- S(Straight): 근력 중심
- W(Wave): 유연성 + 코어
- N(Natural): 균형 + 기능성

### 4. 자세 교정 원리
- 근막 연결선
- 상호억제
- 단축근/신장근 불균형
- 교정 운동 순서

### 5. 회복 생리학
- 수면과 회복
- 영양과 회복
- 능동적 휴식
- 오버트레이닝 징후

## 출력 형식
마크다운, docs/principles/exercise-physiology.md 템플릿
```

---

### 66. PRINCIPLE-CROSS-DOMAIN-SYNERGY (크로스도메인 시너지)

```markdown
[리서치 ID: PRINCIPLE-CROSS-DOMAIN-SYNERGY]
[우선순위: P1]
[현재 상태: 0%]

# 크로스 도메인 시너지 원리 리서치

## 핵심 질문
"이룸의 각 도메인이 어떻게 상호작용하여 통합된 가치를 만드는가?"

## 리서치 필요 항목

### 1. 도메인 연결 매트릭스
| From \ To | PC | 피부 | 체형 | 운동 | 영양 |
|-----------|-----|------|------|------|------|
| PC        | -   | 베이스톤 | 착장색 | - | - |
| 피부      | -   | -    | -    | 땀관리 | 이너뷰티 |
| 체형      | -   | -    | -    | 교정 | 체형식단 |
| 운동      | -   | 혈행 | 근육 | -    | 회복 |
| 영양      | -   | 피부영양 | 체중 | 에너지 | - |

### 2. 시너지 패턴 유형
- 직접 연결: A → B (PC → 의류색)
- 간접 연결: A → B → C (영양 → 피부 → 메이크업)
- 상호 강화: A ↔ B (운동 ↔ 영양)
- 제약 조건: A가 B를 제한 (민감피부 → 격렬운동 제한)

### 3. 통합 추천 알고리즘
- 다중 도메인 점수 가중치
- 상충 조건 해결
- 우선순위 결정 로직

### 4. 사용자 경험 통합
- 크로스 도메인 인사이트 제공
- "A를 했으니 B도 해보세요" 패턴
- 전체 웰니스 점수 설계

## 출력 형식
마크다운, 도메인 연결 다이어그램, 알고리즘 설계
```

---

## U. 크로스 도메인 조합 (N×M 분석)

### 67. COMBO-PC-SKINCARE (퍼스널컬러 × 스킨케어)

```markdown
[리서치 ID: COMBO-PC-SKINCARE]
[우선순위: P1]
[현재 상태: 0%]

# 퍼스널컬러 기반 스킨케어/베이스 추천 리서치

## 핵심 질문
"웜톤/쿨톤에 맞는 파운데이션/베이스 톤은 어떻게 결정되는가?"

## 리서치 필요 항목

### 1. 언더톤과 파운데이션
- 옐로 언더톤: 웜베이지, 샌드
- 핑크 언더톤: 쿨핑크, 로즈
- 뉴트럴 언더톤: 뉴트럴 베이지
- 올리브 언더톤: 올리브 베이지

### 2. 시즌별 베이스 추천
| 시즌 | 언더톤 | 추천 베이스 톤 |
|------|--------|--------------|
| Spring | 밝은 웜 | 아이보리 베이지 |
| Summer | 밝은 쿨 | 로즈 베이지 |
| Autumn | 깊은 웜 | 탄 베이지 |
| Winter | 깊은 쿨 | 포슬린/뉴트럴 |

### 3. 컬러 코렉팅
- 붉은기: 그린 컬러코렉터
- 노란기: 퍼플/라벤더
- 다크서클: 피치/오렌지

### 4. 제품 매칭 알고리즘
- 퍼스널컬러 시즌 입력
- 베이스 제품 톤 필터링
- 매칭 점수 계산

## 출력 형식
마크다운, 매칭 테이블, 알고리즘 설계
```

---

### 68. COMBO-SKIN-NUTRITION (피부 × 영양)

```markdown
[리서치 ID: COMBO-SKIN-NUTRITION]
[우선순위: P1]
[현재 상태: 0%]

# 피부 상태 기반 영양/이너뷰티 추천 리서치

## 핵심 질문
"피부 타입/고민별로 어떤 영양소가 도움이 되는가?"

## 리서치 필요 항목

### 1. 피부 타입별 영양소
| 피부 타입 | 필요 영양소 | 식품/보조제 |
|----------|------------|------------|
| 건성 | 오메가3, 비타민E | 연어, 아보카도, 아몬드 |
| 지성 | 아연, 비타민A | 굴, 호박씨, 당근 |
| 민감성 | 비타민C, 항산화제 | 베리류, 녹차 |
| 복합성 | 밸런스 영양 | 균형식 |

### 2. 피부 고민별 영양소
- 주름/탄력: 콜라겐, 비타민C, 코엔자임Q10
- 색소침착: 비타민C, 글루타치온
- 트러블: 아연, 프로바이오틱스
- 수분: 히알루론산, 세라마이드 전구체

### 3. 이너뷰티 원리
- 경구 섭취 → 혈류 → 피부 도달
- 흡수율과 생체이용률
- 외용 vs 내용 시너지

### 4. 추천 알고리즘
- 피부 분석 결과 입력
- 영양 갭 분석
- 보조제/식품 추천

## 출력 형식
마크다운, 피부-영양 매핑 테이블, 추천 로직
```

---

### 69. COMBO-BODY-NUTRITION (체형 × 영양)

```markdown
[리서치 ID: COMBO-BODY-NUTRITION]
[우선순위: P2]
[현재 상태: 0%]

# 체형 목표 기반 영양/식단 추천 리서치

## 리서치 필요 항목

### 1. 체형별 영양 전략
| 체형 | 특성 | 영양 전략 |
|------|------|----------|
| S(Straight) | 근육질/직선적 | 고단백 유지, 클린 탄수화물 |
| W(Wave) | 곡선적/하체 | 저나트륨, 수분 관리 |
| N(Natural) | 골격/자연적 | 균형 매크로, 관절 영양 |

### 2. 목표별 매크로 비율
- 벌크업: 탄40/단30/지30
- 컷팅: 탄30/단40/지30
- 유지: 탄50/단25/지25

### 3. 체형 보완 식단
- 복부 팽만 줄이기: 저FODMAP, 프로바이오틱스
- 하체 부종: 저나트륨, 칼륨 증가
- 상체 근육: 고단백, BCAA

### 4. 캡슐 식단 알고리즘
- 체형 분석 + 목표 입력
- 매크로 비율 계산
- 대체 식품 추천

## 출력 형식
마크다운, 체형-영양 매트릭스, 식단 템플릿
```

---

### 70. COMBO-POSTURE-CLOTHING (자세 × 의류)

```markdown
[리서치 ID: COMBO-POSTURE-CLOTHING]
[우선순위: P2]
[현재 상태: 0%]

# 자세 보정을 위한 착장 추천 리서치

## 핵심 질문
"자세 문제를 시각적으로 보완하는 착장법은?"

## 리서치 필요 항목

### 1. 자세별 착장 보완
| 자세 문제 | 시각적 문제 | 착장 보완법 |
|----------|------------|------------|
| 거북목 | 목이 짧아 보임 | V넥, 세로 줄무늬, 어깨 강조 |
| 라운드숄더 | 어깨 좁아 보임 | 패드 어깨, 가로 줄무늬 상의 |
| 골반전방경사 | 배가 나와 보임 | A라인, 하이웨이스트 |
| 골반후방경사 | 엉덩이 납작 | 포켓 디테일, 라이트 컬러 |
| O다리 | 다리가 휘어 보임 | 와이드팬츠, 부츠컷 |

### 2. 어깨/목 보정
- 거북목: 뒷목이 짧으므로 뒷목 드러내지 않기
- 라운드숄더: 래글런 슬리브 피하기
- 어깨처짐: 스트럭처드 재킷

### 3. 하체 보정
- 골반 비대칭: 비대칭 디테일 피하기
- 척추측만: 수직 디테일 활용
- O/X다리: 실루엣 조절

### 4. 캡슐 옷장 연동
- 자세 분석 결과 입력
- 보완 착장 필터링
- 코디 조합 점수에 반영

## 출력 형식
마크다운, 자세-착장 매트릭스, 코디 예시
```

---

### 71. COMBO-NUTRITION-EXERCISE (영양 × 운동)

```markdown
[리서치 ID: COMBO-NUTRITION-EXERCISE]
[우선순위: P2]
[현재 상태: 0%]

# 영양 상태 기반 운동 조절 리서치

## 리서치 필요 항목

### 1. 에너지 상태와 운동 강도
| 에너지 상태 | 권장 강도 | 권장 운동 |
|------------|----------|----------|
| 충분 | 고강도 | HIIT, 웨이트 |
| 보통 | 중강도 | 조깅, 서킷 |
| 부족 | 저강도 | 걷기, 요가 |
| 결핍 | 휴식 | 스트레칭만 |

### 2. 운동 전후 영양
- 운동 2시간 전: 복합 탄수화물
- 운동 30분 전: 간단 당
- 운동 직후: 단백질 + 단순당
- 운동 2시간 후: 균형식

### 3. 영양 결핍과 운동 제한
- 철분 부족: 유산소 제한
- 단백질 부족: 근력 효과 저하
- 탈수: 모든 운동 위험

### 4. 시너지 알고리즘
- 영양 분석 결과 연동
- 운동 추천 강도 조절
- 영양 보충 + 운동 통합 플랜

## 출력 형식
마크다운, 영양-운동 매트릭스, 통합 플랜 템플릿
```

---

### 72. COMBO-SKIN-EXERCISE (피부 × 운동)

```markdown
[리서치 ID: COMBO-SKIN-EXERCISE]
[우선순위: P3]
[현재 상태: 0%]

# 피부 상태 고려 운동 관리 리서치

## 리서치 필요 항목

### 1. 운동과 피부 영향
- 땀: 모공 청소 효과 + 자극 가능성
- 혈행 개선: 피부 광채
- 스트레스 해소: 트러블 감소

### 2. 피부 타입별 운동 주의점
| 피부 타입 | 주의점 | 관리법 |
|----------|--------|--------|
| 민감성 | 자극 최소화 | 저강도, 즉시 세안 |
| 지성 | 과다 피지 | 통기성 옷, 자주 닦기 |
| 건성 | 수분 손실 | 수분 섭취, 보습 |
| 트러블 | 마찰 자극 | 넓은 옷, 깨끗한 타월 |

### 3. 운동 후 스킨케어 루틴
- 즉시: 클렌징
- 10분 내: 토너 + 수분
- 정상 복귀 후: 풀 루틴

### 4. 야외 운동 피부 관리
- 자외선 차단
- 미세먼지 대응
- 온도 변화 대응

## 출력 형식
마크다운, 피부-운동 가이드
```

---

## V. 캡슐 알고리즘 확장 (N×M 분석)

### 73. CAPSULE-MULTI-DOMAIN (다중 도메인 캡슐)

```markdown
[리서치 ID: CAPSULE-MULTI-DOMAIN]
[우선순위: P1]
[현재 상태: 0%]

# 다중 도메인 통합 캡슐 루틴 리서치

## 핵심 개념
"패션 + 스킨케어 + 영양 + 운동을 하나의 통합 루틴으로"

## 리서치 필요 항목

### 1. 다중 도메인 캡슐 정의
```
기존 캡슐: 상의 N개 × 하의 M개 = 코디
확장 캡슐:
  아침 루틴 = 스킨케어 + 영양 + 착장
  하루 루틴 = 아침 + 운동 + 저녁 케어
  주간 루틴 = 7일 × 하루 루틴
```

### 2. 도메인 간 의존성 그래프
```
[시간순]
기상 → 스킨케어 → 영양(아침) → 착장 → ... → 운동 → 영양(저녁) → 스킨케어(저녁)

[우선순위]
필수: 스킨케어, 착장
권장: 영양, 운동
선택: 메이크업, 보조제
```

### 3. 통합 추천 알고리즘
- 다중 도메인 점수 통합
- 시간 제약 반영
- 에너지/피로도 반영
- 대체 옵션 다중 레벨

### 4. 통합 인사이트 제공
- "오늘의 전체 웰니스 점수"
- 도메인별 기여도
- 개선 가능 영역

### 5. 구현 아키텍처
- 통합 루틴 데이터 모델
- 크로스 도메인 점수 계산기
- 대시보드 통합 위젯

## 출력 형식
마크다운, 통합 루틴 스키마, 알고리즘 설계
```

---

### 74. CAPSULE-SUBSTITUTION-MATRIX (대체 매트릭스)

```markdown
[리서치 ID: CAPSULE-SUBSTITUTION-MATRIX]
[우선순위: P2]
[현재 상태: 0%]

# 전 도메인 대체 옵션 매트릭스 리서치

## 핵심 개념
"어떤 상황에서도 대안이 있는 유연한 시스템"

## 리서치 필요 항목

### 1. 대체 유형 정의
| 대체 유형 | 설명 | 예시 |
|----------|------|------|
| 1:1 대체 | 직접 대체 | 스쿼트 → 레그프레스 |
| N:1 대체 | 여러 개로 대체 | 덤벨 → 물병 + 탄성밴드 |
| 1:M 대체 | 하나로 여러 개 | 운동복 → 상의+하의 |
| 조건부 대체 | 조건 충족 시 | 야외 러닝 (비올 때) → 실내 트레드밀 |

### 2. 도메인별 대체 매트릭스

#### 패션 대체
| 원본 | 대체 1 | 대체 2 | 조건 |
|------|--------|--------|------|
| 블레이저 | 가디건 | 셔츠 | 포멀 정도 |
| 구두 | 로퍼 | 스니커즈 | TPO |

#### 스킨케어 대체
| 원본 | 대체 1 | 대체 2 | 조건 |
|------|--------|--------|------|
| 세럼 | 에센스 | 앰플 | 농도 |
| 크림 | 로션 | 오일 | 피부타입 |

#### 운동 대체
| 원본 | 대체 1 | 대체 2 | 조건 |
|------|--------|--------|------|
| 바벨 스쿼트 | 덤벨 | 맨몸 | 기구 |
| 러닝 | 제자리 뛰기 | 줄넘기 | 공간 |

### 3. 대체 점수 계산
- 원본 대비 효과 비율 (%)
- 대체 난이도
- 비용/접근성

### 4. 대체 추천 알고리즘
- 사용자 인벤토리 스캔
- 부족 아이템 식별
- 대체 옵션 순위화
- 대체 조합 생성

## 출력 형식
마크다운, 대체 매트릭스 테이블, 알고리즘
```

---

### 75. CAPSULE-CONSTRAINT-SOLVER (제약 해결기)

```markdown
[리서치 ID: CAPSULE-CONSTRAINT-SOLVER]
[우선순위: P2]
[현재 상태: 0%]

# 제약 조건 하 최적 조합 해결기 리서치

## 핵심 질문
"예산/시간/접근성 제약 하에서 최적의 조합은?"

## 리서치 필요 항목

### 1. 제약 조건 유형
| 제약 유형 | 예시 | 해결 전략 |
|----------|------|----------|
| 예산 | 총 5만원 이내 | 비용 최적화 |
| 시간 | 30분 이내 | 필수만 선택 |
| 접근성 | 집에서만 | 보유 아이템만 |
| 에너지 | 피로함 | 저강도 옵션 |
| 선호도 | 특정 색상 싫음 | 필터링 |

### 2. 최적화 알고리즘
- 그리디 알고리즘: 가장 좋은 것 우선
- 배낭 문제: 제약 내 최대 가치
- 제약 만족 문제 (CSP): 모든 조건 충족

### 3. 제약 우선순위
1. 하드 제약 (반드시 충족)
   - 예산 초과 불가
   - 알레르기 성분 제외
2. 소프트 제약 (가능하면 충족)
   - 선호 브랜드
   - 특정 색상

### 4. 트레이드오프 제시
- "예산 1만원 추가 시 매칭 20% 향상"
- "시간 10분 추가 시 풀 루틴 가능"

### 5. 구현 아키텍처
- 제약 정의 스키마
- 해결기 엔진
- 결과 순위화
- 트레이드오프 설명 생성

## 출력 형식
마크다운, 알고리즘 설계, 예시 시나리오
```

---

## W. 완전한 앱 관점 (다중 관점 분석)

### 76. APP-USER-JOURNEY-GAP (사용자 여정 갭) ⚠️ P1

```markdown
[리서치 ID: APP-USER-JOURNEY-GAP]
[우선순위: P1]
[현재 상태: 미분석]

# 사용자 여정 갭 분석 리서치

## 핵심 질문
"사용자가 첫 방문부터 목표 달성까지 어디서 막히는가?"

## 리서치 필요 항목

### 1. 전체 사용자 여정 매핑
- 인지 → 가입 → 온보딩 → 첫 분석 → 습관화 → 공유
- 각 단계별 예상 이탈률
- 병목 구간 식별

### 2. 단계별 갭 분석
| 단계 | 예상 갭 | 현재 해결책 | 개선 필요 |
|------|--------|------------|----------|
| 가입 | 진입장벽 | 소셜로그인 | ? |
| 온보딩 | 복잡함 | 튜토리얼 | 간소화 |
| 첫 분석 | 이미지 업로드 불편 | 카메라 연동 | UX 개선 |
| 습관화 | 재방문 동기 부족 | 푸시알림 | 가치 제공 |

### 3. 사용자 페르소나별 여정
- 뷰티 초보자
- 웰니스 관심자
- 전문가/인플루언서

## 출력 형식
마크다운, 사용자 여정 다이어그램, 갭 매트릭스
```

---

### 77. APP-FEATURE-PARITY (기능 완성도)

```markdown
[리서치 ID: APP-FEATURE-PARITY]
[우선순위: P2]
[현재 상태: 미분석]

# 기능 완성도 분석 리서치

## 리서치 필요 항목

### 1. 모듈별 완성도 점검
| 모듈 | 핵심 기능 | 완성도 | 미구현 |
|------|----------|--------|--------|
| PC-1 | 퍼스널컬러 분석 | 90% | 세부 서브톤 |
| S-1 | 피부분석 | 85% | 실시간 변화 추적 |
| C-1 | 체형분석 | 80% | 3D 모델링 |
| W-1 | 운동추천 | 75% | 동영상 가이드 |
| N-1 | 영양분석 | 70% | 식단 플래너 |

### 2. 경쟁사 기능 벤치마크
- FaceApp, MeituXiuXiu (뷰티)
- MyFitnessPal, Noom (웰니스)
- 기능 갭 분석

### 3. 사용자 요청 기능 우선순위

## 출력 형식
마크다운, 기능 완성도 매트릭스
```

---

### 78. APP-DATA-FLOW (데이터 흐름)

```markdown
[리서치 ID: APP-DATA-FLOW]
[우선순위: P2]
[현재 상태: 미분석]

# 데이터 흐름 통합 리서치

## 리서치 필요 항목

### 1. 도메인 간 데이터 흐름
```
PC-1 분석 결과 → S-1 피부 추천 → 제품 매칭
     ↓
     → C-1 의류 추천 → 옷장 연동
```

### 2. 데이터 활용 갭
- 수집은 하지만 활용 안 하는 데이터
- 활용하지만 수집 안 하는 데이터
- 크로스 도메인 활용 가능 데이터

### 3. 데이터 통합 아키텍처
- 중앙 프로필 vs 분산 저장
- 실시간 동기화 vs 배치 처리

## 출력 형식
마크다운, 데이터 흐름 다이어그램
```

---

### 79. APP-PERSONALIZATION (개인화 수준) ⚠️ P1

```markdown
[리서치 ID: APP-PERSONALIZATION]
[우선순위: P1]
[현재 상태: 기본 수준]

# 개인화 수준 심화 리서치

## 핵심 질문
"사용자가 '나만을 위한 앱'이라고 느끼는가?"

## 리서치 필요 항목

### 1. 개인화 수준 정의
| 레벨 | 설명 | 현재 상태 |
|------|------|----------|
| L0 | 모든 사용자 동일 | - |
| L1 | 기본 세그먼트 | 일부 적용 |
| L2 | 개인 프로필 기반 | 분석 결과 반영 |
| L3 | 행동 기반 | 미구현 |
| L4 | 실시간 컨텍스트 | 미구현 |

### 2. 개인화 적용 영역
- 콘텐츠 추천
- UI/UX 커스터마이징
- 알림 개인화
- 분석 결과 제시 방식

### 3. 개인화 기술 스택
- 추천 알고리즘
- A/B 테스팅
- 기계학습 모델

## 출력 형식
마크다운, 개인화 로드맵
```

---

### 80. APP-FEEDBACK-LOOP (피드백 루프)

```markdown
[리서치 ID: APP-FEEDBACK-LOOP]
[우선순위: P2]
[현재 상태: 미구현]

# 사용자 피드백 루프 리서치

## 리서치 필요 항목

### 1. 피드백 수집 채널
- 인앱 피드백
- NPS 서베이
- 사용 행동 분석
- 고객 지원 데이터

### 2. 피드백 처리 프로세스
- 수집 → 분류 → 우선순위 → 반영 → 소통

### 3. 피드백 기반 개선 사례
- 사용자 요청 → 기능 추가
- 불만 → UX 개선
- 칭찬 → 강화

## 출력 형식
마크다운, 피드백 루프 다이어그램
```

---

### 81-90. APP 카테고리 추가 항목

```markdown
[요약 리스트]
81. APP-OFFLINE-FIRST: 오프라인 우선 전략, PWA 캐싱, 동기화
82. APP-NOTIFICATION: 푸시/인앱 알림 전략, 개인화, 타이밍
83. APP-GAMIFICATION: 게임 요소, 뱃지, 레벨, 스트릭
84. APP-SOCIAL-FEATURES: 공유, 커뮤니티, 친구, 챌린지
85. APP-CONTENT-STRATEGY: 앱 내 콘텐츠 전략, 에듀테인먼트
86. APP-ERROR-RECOVERY: 에러 발생 시 복구 UX, 재시도 로직
87. APP-PROGRESSIVE-DISCLOSURE: 정보 점진적 노출, 복잡도 관리
88. APP-ACCESSIBILITY-DEPTH: WCAG 심화, 스크린리더 완벽 지원
89. APP-ANALYTICS-DEPTH: 행동 분석 심화, 퍼널, 코호트
90. APP-AB-TESTING: 실험 프레임워크, 통계적 유의성
```

---

## X. 운영 심화 관점 (다중 관점 분석)

### 91. OPS-COST-MODEL (비용 모델) ⚠️ P1

```markdown
[리서치 ID: OPS-COST-MODEL]
[우선순위: P1]
[현재 상태: 미분석]

# 운영 비용 모델 리서치

## 핵심 질문
"MAU 1만, 10만, 100만에서 비용 구조는?"

## 리서치 필요 항목

### 1. 비용 항목 분해
| 항목 | 고정비 | 변동비 (per user) |
|------|--------|------------------|
| Vercel | $20/월 | 대역폭 종량 |
| Supabase | $25/월 | 저장소/요청 |
| Gemini API | - | $0.01/분석 |
| Clerk | $0 (10K) | $0.02/MAU |

### 2. 스케일별 비용 예측
- 1K MAU: $X/월
- 10K MAU: $X/월
- 100K MAU: $X/월

### 3. 비용 최적화 전략
- 캐싱으로 API 호출 감소
- 이미지 최적화로 스토리지 절감
- 프리티어 최대 활용

## 출력 형식
마크다운, 비용 스프레드시트, 스케일 그래프
```

---

### 92-105. OPS 카테고리 추가 항목

```markdown
[요약 리스트]
92. OPS-SCALING-STRATEGY: 수평/수직 스케일링, 오토스케일
93. OPS-SUPPORT-AUTOMATION: 챗봇, FAQ, 자동 응답
94. OPS-DATA-PIPELINE: ETL, 분석 데이터 파이프라인
95. OPS-FEATURE-FLAG-OPS: 플래그 관리, 점진적 롤아웃
96. OPS-CANARY-DEPLOY: 카나리 배포, 롤백 자동화
97. OPS-LOG-MANAGEMENT: 로그 수집, 검색, 보존
98. OPS-ALERT-STRATEGY: 알림 규칙, 에스컬레이션, 온콜
99. OPS-BACKUP-STRATEGY: 백업 주기, 복구 테스트, RTO/RPO
100. OPS-COMPLIANCE-AUTO: GDPR/개인정보 자동 처리
101. OPS-VENDOR-MANAGEMENT: 서드파티 관리, SLA, 대안
102. OPS-CAPACITY-PLANNING: 용량 예측, 버퍼, 계절성
103. OPS-RUNBOOK: 운영 매뉴얼, 자동화 스크립트
104. OPS-CHAOS-ENGINEERING: 장애 주입 테스트
105. OPS-SLO-SLI: 서비스 수준 목표, 지표, 에러 버짓
```

---

## Y. 사용자 관점 (다중 관점 분석)

### 106. USER-PAIN-POINTS (페인포인트) ⚠️ P1

```markdown
[리서치 ID: USER-PAIN-POINTS]
[우선순위: P1]
[현재 상태: 미분석]

# 사용자 페인포인트 심층 리서치

## 핵심 질문
"사용자가 이룸을 쓰기 전, 쓰는 중, 쓴 후 겪는 불편은?"

## 리서치 필요 항목

### 1. 페인포인트 매핑
| 시점 | 페인포인트 | 현재 해결책 | 갭 |
|------|-----------|------------|-----|
| 이전 | 내 톤을 모름 | PC 분석 | ✅ |
| 이전 | 맞는 제품 찾기 어려움 | 제품 추천 | 부분 |
| 사용중 | 분석 결과 이해 어려움 | 설명 제공 | 개선 필요 |
| 사용중 | 추천대로 안 해도 됨 | - | 동기부여 |
| 이후 | 변화 체감 어려움 | - | 추적 기능 |

### 2. 경쟁 솔루션과 비교
- 이룸이 해결하는 것
- 이룸이 해결 못하는 것
- 경쟁사가 해결하는 것

### 3. 해결 우선순위
- 영향도 × 빈도 매트릭스

## 출력 형식
마크다운, 페인포인트 맵
```

---

### 107-117. USER 카테고리 추가 항목

```markdown
[요약 리스트]
107. USER-MENTAL-MODEL: 사용자가 앱을 어떻게 인식하는가
108. USER-EMOTIONAL-JOURNEY: 감정 변화 (기대→불안→만족)
109. USER-TRUST-BUILDING: AI 분석 결과 신뢰 구축
110. USER-VALUE-PERCEPTION: 유료 전환 시 가치 인식 ⚠️ P1
111. USER-HABIT-FORMATION: 습관 형성 메커니즘, Hook 모델
112. USER-PERSONALIZATION-FEEL: 개인화 체감 정도
113. USER-PROGRESS-TRACKING: 변화 추적 니즈, 비포/애프터
114. USER-COMMUNITY-NEED: 커뮤니티/소셜 니즈
115. USER-PRIVACY-CONCERN: 이미지 업로드 시 프라이버시 우려
116. USER-MULTI-DEVICE: 여러 기기에서 사용 니즈
117. USER-ACCESSIBILITY-REAL: 실제 장애인 사용자 테스트
```

---

## Z. 회사/팀 관점 (다중 관점 분석)

### 118. TEAM-SKILL-GAP (스킬 갭) ⚠️ P1

```markdown
[리서치 ID: TEAM-SKILL-GAP]
[우선순위: P1]
[현재 상태: 미분석]

# 팀 스킬 갭 분석 리서치

## 핵심 질문
"로드맵 실행에 필요한 역량 vs 현재 보유 역량의 갭은?"

## 리서치 필요 항목

### 1. 필요 스킬 매트릭스
| 영역 | 필요 스킬 | 현재 수준 | 갭 |
|------|----------|----------|-----|
| 프론트엔드 | Next.js 16, React 19 | 80% | 20% |
| 백엔드 | Supabase, Edge | 70% | 30% |
| AI/ML | Gemini, 프롬프트 | 60% | 40% |
| 디자인 | Figma, UX | 40% | 60% |
| 마케팅 | 그로스해킹 | 20% | 80% |

### 2. 갭 해결 전략
- 학습으로 해결
- 채용으로 해결
- 외주로 해결
- 도구로 해결

### 3. 시급도 우선순위

## 출력 형식
마크다운, 스킬 매트릭스, 학습 로드맵
```

---

### 119-127. TEAM/COMPANY 카테고리 추가 항목

```markdown
[요약 리스트]
119. TEAM-VELOCITY: 개발 속도 측정, 예측 정확도
120. TEAM-TECHNICAL-DEBT-RATIO: 기술부채 비율, 상환 계획
121. TEAM-DOCUMENTATION-HEALTH: 문서 최신성, 완성도
122. TEAM-KNOWLEDGE-SHARING: 지식 사일로 방지
123. TEAM-TOOL-EFFICIENCY: 개발 도구 효율성

124. COMPANY-MARKET-POSITION: 시장 내 포지셔닝 ⚠️ P1
125. COMPANY-COMPETITIVE-MOAT: 경쟁 해자, 방어 가능성
126. COMPANY-GROWTH-LEVER: 성장 레버, 핵심 지표
127. COMPANY-EXIT-STRATEGY: 장기 엑싯 전략, 인수 가능성
```

---

## AA. AI/ML 심화 🆕 v3.3 - 갭 분석 추가

### 128. AI-ETHICS-BIAS (AI 윤리/편향)

```markdown
# AI 윤리 및 편향 연구

## 배경
- 이룸의 AI 분석이 특정 인종/피부색에 편향되지 않아야 함
- 뷰티 AI의 다양성 문제 연구

## 조사 항목

### 1. 편향 유형
- 데이터 편향 (학습 데이터 불균형)
- 알고리즘 편향 (모델 내재적 편향)
- 출력 편향 (결과 해석 편향)

### 2. 편향 탐지 방법
- Fairness 지표 (Demographic Parity, Equalized Odds)
- 서브그룹 분석
- 편향 감사 도구

### 3. 편향 완화 전략
- 데이터 증강/리샘플링
- 정규화 기법
- 후처리 보정

### 4. 뷰티 AI 특수 고려
- 피부색 다양성
- 문화적 미의 기준 차이
- 포용적 추천 시스템

## 출력 형식
마크다운, 편향 탐지 체크리스트, 완화 전략 가이드
```

### 129. AI-PROMPT-ENGINEERING (프롬프트 엔지니어링)

```markdown
# 프롬프트 엔지니어링 고급 연구

## 배경
- Gemini 2.5 Flash의 최적 프롬프트 설계
- VLM 분석 정확도 향상을 위한 프롬프트 최적화

## 조사 항목

### 1. 프롬프트 설계 패턴
- Few-shot vs Zero-shot
- Chain-of-Thought (CoT)
- Tree-of-Thought (ToT)
- Self-Consistency

### 2. VLM 특화 프롬프팅
- 이미지 컨텍스트 제공 방법
- 멀티모달 프롬프트 구조
- 시각적 추론 유도

### 3. 도메인 특화 최적화
- 피부 분석 프롬프트 템플릿
- 퍼스널컬러 분석 프롬프트
- 체형 분석 프롬프트

### 4. 품질 보증
- 프롬프트 테스트 방법론
- A/B 테스트 설계
- 성능 측정 지표

## 출력 형식
마크다운, 프롬프트 템플릿 라이브러리, 테스트 결과
```

### 130. AI-VLM-OPTIMIZATION (VLM 최적화)

```markdown
# Vision Language Model 최적화 연구

## 배경
- Gemini 2.5 Flash 활용 극대화
- 응답 시간 및 비용 최적화

## 조사 항목

### 1. 이미지 전처리 최적화
- 최적 해상도 (품질 vs 비용)
- 이미지 압축 전략
- 배치 처리 방법

### 2. 모델 호출 최적화
- Streaming 응답 활용
- 캐싱 전략
- Rate Limit 관리

### 3. 응답 품질 향상
- Temperature 조정
- Top-K/Top-P 설정
- 출력 형식 제어 (JSON Mode)

### 4. 비용 효율화
- 토큰 사용량 최적화
- 티어별 할당 전략
- 예산 모니터링

## 출력 형식
마크다운, 최적화 설정 가이드, 비용 모델
```

### 131. AI-CONFIDENCE-CALIBRATION (신뢰도 보정)

```markdown
# AI 신뢰도 보정 연구

## 배경
- AI 분석 결과의 신뢰도 표시
- 사용자에게 적절한 불확실성 전달

## 조사 항목

### 1. 신뢰도 측정 방법
- 모델 자체 confidence score
- Ensemble 기반 불확실성
- MC Dropout 방법

### 2. 보정(Calibration) 기법
- Temperature Scaling
- Platt Scaling
- Isotonic Regression

### 3. 사용자 커뮤니케이션
- 신뢰도 시각화 방법
- 불확실성 전달 UX
- 조건부 추천 ("~할 수 있음")

### 4. 재분석 트리거
- 낮은 신뢰도 시 재촬영 권유
- 추가 정보 요청
- 전문가 리뷰 연결

## 출력 형식
마크다운, 보정 알고리즘, UI 가이드
```

---

## AB. 보안 심화 🆕 v3.3 - 갭 분석 추가

### 132. SEC-OWASP-NEXTJS (OWASP Next.js)

```markdown
# OWASP Next.js 보안 가이드 연구

## 배경
- Next.js 16 App Router 보안 모범 사례
- 서버 컴포넌트/클라이언트 컴포넌트 보안 경계

## 조사 항목

### 1. Next.js 특화 취약점
- Server Action 보안
- Route Handler 인증/인가
- Middleware 보안 패턴

### 2. 데이터 유출 방지
- 서버 전용 코드 분리
- 환경변수 노출 방지
- 클라이언트로 민감정보 전송 차단

### 3. 인젝션 방지
- SQL Injection (Supabase RLS)
- XSS 방지 (React 기본 + 추가 조치)
- CSRF 보호

### 4. 인증/세션 보안
- Clerk 통합 모범 사례
- JWT 처리
- 세션 타임아웃

## 출력 형식
마크다운, 보안 체크리스트, 코드 예제
```

### 133. SEC-IMAGE-SECURITY (이미지 보안)

```markdown
# 이미지 업로드 보안 연구

## 배경
- 사용자 얼굴/신체 이미지 처리
- 이미지 기반 공격 방지

## 조사 항목

### 1. 이미지 검증
- MIME 타입 확인 (Magic Number)
- 이미지 메타데이터 검증
- 크기/해상도 제한

### 2. 악성 이미지 탐지
- Polyglot 파일 탐지
- 스테가노그래피 방지
- 메타데이터 내 악성 코드

### 3. 저장 및 전송 보안
- 서명된 URL 사용
- 저장 시 암호화
- CDN 보안 설정

### 4. 개인정보 보호
- EXIF 데이터 제거
- 얼굴 익명화 옵션
- 저장 기간 정책

## 출력 형식
마크다운, 검증 파이프라인, 체크리스트
```

### 134. SEC-MALICIOUS-UPLOAD (악성 업로드 방지)

```markdown
# 악성 파일 업로드 방지 연구

## 배경
- 파일 업로드 취약점 방어
- 서버 보호 및 다른 사용자 보호

## 조사 항목

### 1. 파일 유형 검증
- 허용 목록 기반 필터링
- 확장자 + MIME + Magic Number 3중 검증
- 파일 변환으로 무해화

### 2. 안티바이러스 통합
- ClamAV 등 스캐너 통합
- 비동기 스캔 처리
- 격리 및 알림

### 3. 업로드 제한
- 파일 크기 제한
- 업로드 빈도 제한
- 동시 업로드 제한

### 4. 저장 격리
- 별도 저장소 사용
- 실행 권한 제거
- 접근 제어

## 출력 형식
마크다운, 검증 로직, 아키텍처 다이어그램
```

---

## AC. 한국 시장 특화 🆕 v3.3 - 갭 분석 추가

### 135. KR-BEAUTY-TREND (K-뷰티 트렌드)

```markdown
# K-뷰티 시장 트렌드 연구

## 배경
- 한국 뷰티 시장의 최신 트렌드
- 이룸 서비스 기획에 반영

## 조사 항목

### 1. 2024-2026 트렌드
- 스킵케어/미니멀 스킨케어
- 클린 뷰티/비건 화장품
- 맞춤형 화장품 규제 완화 영향

### 2. 소비자 행동 변화
- MZ세대 구매 패턴
- 성분 중심 소비
- 지속가능성 관심

### 3. 채널 변화
- 소셜 커머스 성장
- 라이브 커머스
- D2C 브랜드 부상

### 4. 글로벌 K-뷰티
- 해외 수출 트렌드
- 현지화 전략
- 경쟁 구도

## 출력 형식
마크다운, 트렌드 리포트, 시사점
```

### 136. KR-PAYMENT-SYSTEM (한국 결제 시스템)

```markdown
# 한국 결제 시스템 통합 연구

## 배경
- 한국 사용자를 위한 결제 시스템
- 간편결제/정기결제 구현

## 조사 항목

### 1. 결제 방식
- 신용카드/체크카드
- 간편결제 (네이버페이, 카카오페이, 토스페이)
- 휴대폰 결제

### 2. PG사 비교
- 토스페이먼츠
- 포트원 (구 아임포트)
- NHN KCP
- 수수료/기능 비교

### 3. 정기 결제 (구독)
- 자동결제 구현
- 결제 실패 처리
- 해지 프로세스

### 4. 법적 요구사항
- 전자금융업 등록
- PCI DSS 요건
- 소비자 보호법

## 출력 형식
마크다운, PG사 비교표, 통합 가이드
```

### 137. KR-PIPA-DETAIL (개인정보보호법 상세)

```markdown
# 한국 개인정보보호법 상세 연구

## 배경
- 이룸의 민감정보(얼굴, 신체) 처리
- PIPA 완전 준수 필요

## 조사 항목

### 1. 민감정보 처리
- 생체정보(얼굴) 처리 요건
- 건강정보 처리 요건
- 별도 동의 절차

### 2. 동의 관리
- 필수/선택 동의 구분
- 동의 철회 절차
- 미성년자 법정대리인 동의

### 3. 기술적 보호조치
- 암호화 요건
- 접근 통제
- 로그 관리

### 4. 의무 사항
- 개인정보 처리방침 필수 항목
- 개인정보 보호책임자 지정
- 정기 점검 의무

## 출력 형식
마크다운, 체크리스트, 개인정보처리방침 템플릿
```

---

## AD. 디자인/UX 심화 🆕 v3.3 - 갭 분석 추가

### 138. DESIGN-KBEAUTY-TREND (K-뷰티 디자인)

```markdown
# K-뷰티 디자인 트렌드 연구

## 배경
- 한국 뷰티 앱/웹의 디자인 트렌드
- 이룸의 비주얼 아이덴티티 방향

## 조사 항목

### 1. UI/UX 트렌드
- 미니멀리즘 vs 맥시멀리즘
- 그라데이션/글라스모피즘 활용
- 애니메이션/마이크로인터랙션

### 2. 색상 트렌드
- 2024-2026 컬러 팔레트
- 뷰티 브랜드 색상 분석
- 신뢰감 vs 트렌디함

### 3. 타이포그래피
- 한글 폰트 트렌드
- 가독성 vs 개성
- 앱 내 폰트 사용 사례

### 4. 이미지/일러스트
- 실사 vs 일러스트
- AI 생성 이미지 활용
- 다양성 표현

## 출력 형식
마크다운, 무드보드, 디자인 가이드라인
```

### 139. DESIGN-COLOR-PSYCHOLOGY (색채 심리학)

```markdown
# 색채 심리학 연구

## 배경
- 퍼스널컬러 분석의 심리학적 근거
- UI 색상이 사용자 행동에 미치는 영향

## 조사 항목

### 1. 색채 심리학 기초
- 색상별 심리적 연상
- 문화권별 색상 의미 차이
- 한국인의 색채 선호

### 2. 퍼스널컬러 심리학
- 색상과 자기 인식
- 색상 조화가 주는 심리적 효과
- 자신감과 색상 선택

### 3. UI/UX 색상 심리학
- CTA 버튼 색상 효과
- 신뢰감을 주는 색상
- 경고/에러 색상

### 4. 실험적 연구
- A/B 테스트 결과
- 색상 변경에 따른 전환율
- 사용자 피드백

## 출력 형식
마크다운, 색상 가이드, 실험 설계
```

---

## AE. N×M 조합 확장 🆕 v3.4 - 핵심 크로스도메인 추가

### 140. COMBO-BODY-EXERCISE (체형 × 운동)

```markdown
# 체형별 맞춤 운동 프로그램 리서치

## 입력
- 참조: docs/principles/body-mechanics.md, docs/research/claude-ai-research/C-2-R1-체형분석v2.md
- 선행 리서치: C-2-R1, PRINCIPLE-EXERCISE-PHYSIOLOGY

## 출력
- 파일: docs/research/claude-ai-research/COMBO-BODY-EXERCISE-R1.md
- 형식: RESEARCH-OUTPUT-FORMAT.md 준수

## 배경
- 이룸의 체형 분석(C-1) 결과를 운동 추천과 연결
- 과일형(사과, 배, 바나나, 딸기, 아보카도) 체형별 최적 운동

## 조사 항목

### 1. 체형-운동 과학적 연관성
- 체형별 근육/지방 분포 특성
- 체형에 따른 대사적 차이
- 부위별 집중 운동의 효과

### 2. 체형별 운동 매핑
- 사과형: 유산소 + 코어 강화
- 배형: 하체 위주 + 전신 균형
- 바나나형: 근력 운동 + 균형 잡힌 프로그램
- 딸기형: 하체 강화 + 상체 유지
- 아보카도형: 전신 균형 프로그램

### 3. 알고리즘 설계
```typescript
interface BodyExerciseMatch {
  bodyType: 'apple' | 'pear' | 'banana' | 'strawberry' | 'avocado';
  primaryExercises: Exercise[];
  secondaryExercises: Exercise[];
  avoidExercises: Exercise[];
  weeklyPlan: WeeklyPlan;
}
```

### 4. 사용자 시나리오
- 체형 분석 후 자동 운동 추천
- 진행 추적 및 체형 변화 모니터링

## 의존성
- 선행: C-2-R1, PRINCIPLE-EXERCISE-PHYSIOLOGY
- 후행: CAPSULE-MULTI-DOMAIN
- 병렬: COMBO-BODY-NUTRITION

## 메타데이터
- 우선순위: P0
- 예상 시간: 3h
- 도메인: 체형 × 운동
```

### 141. COMBO-SKIN-PROCEDURE (피부 × 시술)

```markdown
# 피부 상태별 시술 추천 알고리즘 리서치

## 입력
- 참조: docs/principles/skin-physiology.md, docs/research/claude-ai-research/S-2-R1-피부텍스처메트릭.md
- 선행 리서치: S-2-R1, SK-1-LASER-BUNDLE

## 출력
- 파일: docs/research/claude-ai-research/COMBO-SKIN-PROCEDURE-R1.md
- 형식: RESEARCH-OUTPUT-FORMAT.md 준수

## 배경
- 피부 분석(S-1) 결과와 시술 추천(SK-1) 연결
- 피부 상태(수분, 유분, 민감도, 탄력)별 적합 시술 매핑

## 조사 항목

### 1. 피부 상태-시술 과학적 근거
- 피부 타입별 시술 적합성
- 시술 전후 피부 상태 변화
- 시술 간 간격 및 조합 규칙

### 2. 피부 상태별 시술 매핑
| 피부 상태 | 추천 시술 | 주의 시술 |
|-----------|----------|----------|
| 건조 + 민감 | 물광, 리쥬란 | 레이저 토닝 |
| 지성 + 모공 | 피코, 스케일링 | 유분 기반 |
| 노화 + 탄력저하 | 울쎄라, 써마지 | 강한 필링 |

### 3. 알고리즘 설계
```typescript
interface SkinProcedureMatch {
  skinProfile: SkinAnalysisResult;
  recommendedProcedures: Procedure[];
  contraindicated: Procedure[];
  treatmentPlan: TreatmentSchedule;
  expectedOutcome: string;
}
```

### 4. 안전 고려사항
- 금기 피부 상태
- 시술 후 관리 필수사항
- 부작용 경고

## 의존성
- 선행: S-2-R1, SK-1-*-BUNDLE
- 후행: CAPSULE-MULTI-DOMAIN
- 병렬: COMBO-NUTRITION-PROCEDURE

## 메타데이터
- 우선순위: P0
- 예상 시간: 3h
- 도메인: 피부 × 시술
```

### 142. COMBO-ORAL-NUTRITION (구강 × 영양)

```markdown
# 구강 건강 영양소 리서치

## 입력
- 참조: docs/principles/oral-health.md, docs/research/claude-ai-research/OH-1-DAILY-CARE.md
- 선행 리서치: OH-1-DAILY-CARE, PRINCIPLE-NUTRITION-SCIENCE

## 출력
- 파일: docs/research/claude-ai-research/COMBO-ORAL-NUTRITION-R1.md
- 형식: RESEARCH-OUTPUT-FORMAT.md 준수

## 배경
- 구강 건강(OH-1)에 영향을 미치는 영양소 분석
- 치아, 잇몸, 구강 점막 건강 유지 영양 가이드

## 조사 항목

### 1. 구강 건강 필수 영양소
- 칼슘, 인: 치아 구조 강화
- 비타민 C: 잇몸 건강
- 비타민 D: 칼슘 흡수
- 비타민 A: 점막 건강
- 오메가-3: 항염 효과

### 2. 구강 문제별 영양 처방
| 구강 문제 | 권장 영양소 | 피해야 할 음식 |
|-----------|------------|---------------|
| 잇몸 출혈 | 비타민 C, K | 산성 음식 |
| 충치 예방 | 칼슘, 불소 | 당류 |
| 구강 건조 | 오메가-3, 수분 | 카페인 |

### 3. 식품 및 보충제 추천
- 치아 강화 식품 목록
- 잇몸 건강 식품 목록
- 보충제 권장량

### 4. 주의사항
- 치아 착색 유발 식품
- 치아 부식 위험 식품
- 식사 후 구강 관리

## 의존성
- 선행: OH-1-*, PRINCIPLE-NUTRITION-SCIENCE
- 후행: 없음
- 병렬: COMBO-NUTRITION-PROCEDURE

## 메타데이터
- 우선순위: P1
- 예상 시간: 2h
- 도메인: 구강 × 영양
```

### 143. COMBO-NUTRITION-PROCEDURE (영양 × 시술)

```markdown
# 시술 전후 영양 관리 리서치

## 입력
- 참조: docs/principles/skin-procedures.md, docs/research/claude-ai-research/SK-1-*
- 선행 리서치: SK-1-BUNDLE 시리즈, PRINCIPLE-NUTRITION-SCIENCE

## 출력
- 파일: docs/research/claude-ai-research/COMBO-NUTRITION-PROCEDURE-R1.md
- 형식: RESEARCH-OUTPUT-FORMAT.md 준수

## 배경
- 피부 시술 전후 영양 관리로 효과 극대화
- 회복 촉진 및 부작용 최소화

## 조사 항목

### 1. 시술 전 영양 준비
- 피부 회복력 강화 영양소
- 시술 전 피해야 할 영양소/보충제
- 시술 유형별 준비 기간

### 2. 시술 후 회복 영양
| 시술 유형 | 권장 영양소 | 회복 기간 |
|-----------|------------|----------|
| 레이저 | 비타민 C, E, 아연 | 1-2주 |
| 필러/보톡스 | 오메가-3, 콜라겐 | 3-5일 |
| 필링 | 비타민 A, B5 | 5-7일 |

### 3. 회복 촉진 식단
- 시술 직후 권장 식품
- 피해야 할 식품 (알코올, 자극성 음식)
- 수분 섭취 가이드

### 4. 보충제 프로토콜
- 시술 전 2주 프로토콜
- 시술 후 4주 프로토콜
- 장기 유지 프로토콜

## 의존성
- 선행: SK-1-*, PRINCIPLE-NUTRITION-SCIENCE
- 후행: 없음
- 병렬: COMBO-SKIN-PROCEDURE

## 메타데이터
- 우선순위: P2
- 예상 시간: 2h
- 도메인: 영양 × 시술
```

---

## 체크리스트 (업데이트)

### T. 원리 문서 🆕 v3.1
- [ ] PRINCIPLE-NUTRITION-SCIENCE ⚠️ P1
- [ ] PRINCIPLE-EXERCISE-PHYSIOLOGY
- [ ] PRINCIPLE-CROSS-DOMAIN-SYNERGY ⚠️ P1

### U. 크로스 도메인 조합 🆕 v3.1
- [ ] COMBO-PC-SKINCARE ⚠️ P1
- [ ] COMBO-SKIN-NUTRITION ⚠️ P1
- [ ] COMBO-BODY-NUTRITION
- [ ] COMBO-POSTURE-CLOTHING
- [ ] COMBO-NUTRITION-EXERCISE
- [ ] COMBO-SKIN-EXERCISE

### V. 캡슐 알고리즘 확장 🆕 v3.1
- [ ] CAPSULE-MULTI-DOMAIN ⚠️ P1
- [ ] CAPSULE-SUBSTITUTION-MATRIX
- [ ] CAPSULE-CONSTRAINT-SOLVER

### W. 완전한 앱 관점 🆕 v3.2
- [ ] APP-USER-JOURNEY-GAP ⚠️ P1
- [ ] APP-FEATURE-PARITY
- [ ] APP-DATA-FLOW
- [ ] APP-PERSONALIZATION ⚠️ P1
- [ ] APP-FEEDBACK-LOOP
- [ ] APP-OFFLINE-FIRST ~ APP-AB-TESTING (81-90)

### X. 운영 심화 관점 🆕 v3.2
- [ ] OPS-COST-MODEL ⚠️ P1
- [ ] OPS-SCALING-STRATEGY ~ OPS-SLO-SLI (92-105)

### Y. 사용자 관점 🆕 v3.2
- [ ] USER-PAIN-POINTS ⚠️ P1
- [ ] USER-VALUE-PERCEPTION ⚠️ P1
- [ ] USER-MENTAL-MODEL ~ USER-ACCESSIBILITY-REAL (107-117)

### Z. 회사/팀 관점 🆕 v3.2
- [ ] TEAM-SKILL-GAP ⚠️ P1
- [ ] COMPANY-MARKET-POSITION ⚠️ P1
- [ ] TEAM-VELOCITY ~ COMPANY-EXIT-STRATEGY (119-127)

### AA. AI/ML 심화 🆕 v3.3
- [ ] AI-ETHICS-BIAS ⚠️ P1
- [ ] AI-PROMPT-ENGINEERING ⚠️ P1
- [ ] AI-VLM-OPTIMIZATION
- [ ] AI-CONFIDENCE-CALIBRATION

### AB. 보안 심화 🆕 v3.3
- [ ] SEC-OWASP-NEXTJS ⚠️ P0
- [ ] SEC-IMAGE-SECURITY ⚠️ P1
- [ ] SEC-MALICIOUS-UPLOAD

### AC. 한국 시장 특화 🆕 v3.3
- [ ] KR-BEAUTY-TREND ⚠️ P1
- [ ] KR-PAYMENT-SYSTEM
- [ ] KR-PIPA-DETAIL

### AD. 디자인/UX 심화 🆕 v3.3
- [ ] DESIGN-KBEAUTY-TREND
- [ ] DESIGN-COLOR-PSYCHOLOGY

### AE. N×M 조합 확장 🆕 v3.4
- [ ] COMBO-BODY-EXERCISE ⚠️ **P0** (체형별 맞춤 운동)
- [ ] COMBO-SKIN-PROCEDURE ⚠️ **P0** (피부 상태별 시술 추천)
- [ ] COMBO-ORAL-NUTRITION ⚠️ P1 (구강 건강 영양소)
- [ ] COMBO-NUTRITION-PROCEDURE (시술 전후 영양 관리)

---

**Version**: 3.4 | **Updated**: 2026-01-18
**변경 이력**:
- v1.0: 기술 리서치 14개
- v2.0: 비즈니스 리서치 14개 추가 (총 28개)
- v3.0: 회사 운영 20개 + 앱/웹 전략 5개 + 품질 속성 6개 추가 (총 63개)
- v3.1: N×M 조합 분석 - 원리 3개 + 크로스도메인 6개 + 캡슐확장 3개 추가 (총 75개)
- v3.2: 다중 관점 분석 - 앱완성 15개 + 운영심화 15개 + 사용자 12개 + 회사/팀 10개 추가 (총 127개)
- v3.3: 갭 분석 - AI심화 4개 + 보안심화 3개 + 한국특화 3개 + 디자인심화 2개 추가 (총 139개)
- v3.4: N×M 조합 확장 - 중복 15개 통합 + 크로스도메인 4개 추가 (총 128개)
