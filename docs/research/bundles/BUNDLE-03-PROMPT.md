# BUNDLE-03: 사용자 획득 및 성장

> 오가닉 성장 및 바이럴 전략 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-03 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | 마케팅/성장 |
| **포함 항목** | BIZ-ACQUISITION-ORGANIC, BIZ-VIRAL-GROWTH, BIZ-ASO-STRATEGY, USER-HABIT-FORMATION |

---

## 입력

### 참조 문서
- `docs/specs/SDD-*.md` - 기존 스펙 문서
- `docs/research/claude-ai-research/BIZ-MONETIZATION-R1.md` - 수익화 전략

### 선행 리서치
- BUNDLE-02: 수익화 및 비즈니스 모델

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/BIZ-ACQUISITION-ORGANIC-R1.md` | 오가닉 사용자 획득 전략 |
| `docs/research/claude-ai-research/BIZ-VIRAL-GROWTH-R1.md` | 바이럴 성장 메커니즘 |
| `docs/research/claude-ai-research/BIZ-ASO-STRATEGY-R1.md` | 앱스토어 최적화 |
| `docs/research/claude-ai-research/USER-HABIT-FORMATION-R1.md` | 습관 형성 전략 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### BIZ-ACQUISITION-ORGANIC

```
한국 뷰티/웰니스 앱의 오가닉 사용자 획득 전략을 조사해주세요.

조사 범위:
1. SEO/콘텐츠 마케팅 (블로그, 유튜브, 인스타그램)
2. 인플루언서 마케팅 (마이크로/나노 인플루언서)
3. 커뮤니티 빌딩 (네이버 카페, 인스타 DM 그룹)
4. PR/미디어 노출 전략
5. 입소문 유도 전략
6. 크로스 프로모션

기대 결과:
- 한국 뷰티 앱 성공 사례 분석
- 채널별 CAC (고객 획득 비용) 추정
- 초기 1만 사용자 확보 전략
- 콘텐츠 마케팅 캘린더 템플릿
```

### BIZ-VIRAL-GROWTH

```
AI 분석 결과의 바이럴 공유 메커니즘을 조사해주세요.

조사 범위:
1. 공유 가능한 콘텐츠 설계 (분석 결과 카드)
2. 소셜 미디어 공유 최적화 (인스타, 카카오톡)
3. 친구 초대 프로그램 설계
4. 바이럴 루프 구축 (K-factor 최적화)
5. FOMO 및 사회적 증거 활용
6. 챌린지/이벤트 마케팅

기대 결과:
- 이룸 분석 결과 공유 UI/UX 가이드
- 친구 초대 보상 체계 설계
- 바이럴 계수 목표 및 측정 방법
- 성공적인 바이럴 캠페인 사례

참고: components/common/ShareButtons.tsx 현재 구현 확인
```

### BIZ-ASO-STRATEGY

```
한국 앱스토어 최적화 (ASO) 전략을 조사해주세요.

조사 범위:
1. 앱 이름 및 서브타이틀 최적화
2. 키워드 전략 (검색량 vs 경쟁도)
3. 앱 아이콘 및 스크린샷 최적화
4. 앱 설명 A/B 테스트
5. 리뷰 관리 전략
6. 업데이트 노트 최적화
7. 카테고리 선택 전략

기대 결과:
- 이룸 앱 ASO 체크리스트
- 핵심 키워드 50개 후보
- 스크린샷 구성 가이드
- 리뷰 응대 템플릿
```

### USER-HABIT-FORMATION

```
뷰티/웰니스 앱에서의 습관 형성 전략을 조사해주세요.

조사 범위:
1. Nir Eyal의 Hooked 모델 적용
2. 트리거 설계 (외부/내부)
3. 보상 시스템 (가변적 보상)
4. 스트릭 및 게이미피케이션
5. 푸시 알림 최적화
6. 리텐션 곡선 분석

기대 결과:
- 이룸 앱 습관 루프 설계
- 일별/주별/월별 사용자 행동 목표
- 이탈 방지 개입 시점 정의
- 푸시 알림 전략 가이드
```

---

## 의존성

```
선행: BUNDLE-02 (Biz)
후행: BUNDLE-08 (Psychology), BUNDLE-09 (Personalization)
병렬: BUNDLE-04 (UX), BUNDLE-12 (Team)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 한국 시장 사례 포함
- [ ] 구체적인 액션 아이템 제시
- [ ] 측정 가능한 KPI 포함

---

**Version**: 1.0 | **Created**: 2026-01-18
