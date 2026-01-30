# BUNDLE-06: 크로스 도메인 시너지

> 도메인 간 N×M 조합 및 시너지 효과 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-06 |
| **우선순위** | P1 |
| **예상 시간** | 3시간 |
| **도메인** | 크로스 도메인 |
| **포함 항목** | PRINCIPLE-CROSS-DOMAIN-SYNERGY, COMBO-PC-SKINCARE, COMBO-SKIN-NUTRITION, CAPSULE-MULTI-DOMAIN, COMBO-BODY-EXERCISE, COMBO-SKIN-PROCEDURE |

---

## 입력

### 참조 문서
- `docs/principles/` - 원리 문서들
- `docs/research/claude-ai-research/*-R1.md` - 완료된 리서치
- `apps/web/lib/wardrobe-combinations.ts` - N×M 조합 패턴

### 선행 리서치
- BUNDLE-01: Next.js 기술 스택
- BUNDLE-02: 수익화 전략
- BUNDLE-14: 도메인 원리

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/PRINCIPLE-CROSS-DOMAIN-SYNERGY-R1.md` | 크로스 도메인 시너지 원리 |
| `docs/research/claude-ai-research/COMBO-PC-SKINCARE-R1.md` | 퍼스널컬러 × 스킨케어 |
| `docs/research/claude-ai-research/COMBO-SKIN-NUTRITION-R1.md` | 피부 × 영양 |
| `docs/research/claude-ai-research/CAPSULE-MULTI-DOMAIN-R1.md` | 다중 도메인 캡슐 알고리즘 |
| `docs/research/claude-ai-research/COMBO-BODY-EXERCISE-R1.md` | 체형 × 운동 **🆕** |
| `docs/research/claude-ai-research/COMBO-SKIN-PROCEDURE-R1.md` | 피부 × 시술 **🆕** |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### PRINCIPLE-CROSS-DOMAIN-SYNERGY

```
다중 도메인 분석 결과의 시너지 효과 원리를 조사해주세요.

조사 범위:
1. 크로스 도메인 추천의 이론적 기반
2. 시너지 효과 측정 방법론
3. 도메인 간 상관관계 분석
4. 통합 추천 시스템 아키텍처
5. 충돌하는 추천 해결 전략
6. 시너지 가치 정량화

기대 결과:
- 크로스 도메인 시너지 원리 문서
- 도메인 조합 우선순위 매트릭스
- 시너지 계산 알고리즘 설계
- 충돌 해결 규칙
```

### COMBO-PC-SKINCARE

```
퍼스널컬러와 스킨케어 제품 추천의 교차 분석을 조사해주세요.

조사 범위:
1. 피부톤과 스킨케어 성분 상관관계
2. 멜라닌 유형별 자외선 차단 전략
3. 톤업 크림/메이크업 베이스 선택 기준
4. 피부톤 변화 요인과 스킨케어
5. 계절별 피부톤-스킨케어 가이드
6. 한국인 피부톤 특성과 제품 매칭

기대 결과:
- PC-1 × S-1 교차 추천 알고리즘
- 톤별 스킨케어 성분 가이드
- 제품 카테고리별 매칭 규칙
- 시즌별 추천 변화 로직
```

### COMBO-SKIN-NUTRITION

```
피부 상태와 영양소 섭취의 상관관계를 조사해주세요.

조사 범위:
1. 피부 건강에 필수적인 영양소 (비타민 A, C, E, 아연 등)
2. 피부 문제별 영양 보충 전략
3. 경구 섭취 vs 외용 제품 효과 비교
4. 장-피부 축 (Gut-Skin Axis)
5. 수분 섭취와 피부 수분도
6. 콜라겐 보충제 효과 과학적 근거

기대 결과:
- 피부 상태 → 영양소 추천 매핑
- 영양소 시너지/길항 관계
- 일일 권장 섭취량 가이드
- 내복/외용 통합 케어 플랜
```

### CAPSULE-MULTI-DOMAIN

```
다중 도메인 캡슐 알고리즘 설계를 조사해주세요.

조사 범위:
1. 캡슐 워드로브 개념의 뷰티 적용
2. 최소 제품 세트 (Essential Kit) 구성
3. 제품 간 호환성 매트릭스
4. 예산별 캡슐 구성 전략
5. 계절/상황별 캡슐 변형
6. 개인화된 캡슐 생성 알고리즘

기대 결과:
- 캡슐 뷰티 킷 알고리즘 설계
- 카테고리별 필수 아이템 정의
- 호환성 점수 계산 방법
- 단계별 확장 가이드
```

### COMBO-BODY-EXERCISE 🆕

```
체형 분석과 운동 추천의 교차 분석을 조사해주세요. (N×M 조합)

조사 범위:
1. 체형 유형별 효과적인 운동 종류
2. 근골격계 불균형과 교정 운동
3. 체형별 피해야 할 운동
4. 자세 분석 결과와 재활 운동 연계
5. 목표 체형을 위한 운동 계획
6. 한국인 체형 특성과 맞춤 운동

기대 결과:
- C-1 × W-1 교차 추천 알고리즘
- 체형별 운동 프로그램 템플릿
- 금기 운동 경고 시스템
- 운동 효과 예측 모델
```

### COMBO-SKIN-PROCEDURE 🆕

```
피부 분석과 시술 추천의 교차 분석을 조사해주세요. (N×M 조합)

조사 범위:
1. 피부 타입별 적합한 시술 종류
2. 피부 문제별 시술 옵션 (레이저, RF, 주사 등)
3. 시술 전후 스킨케어 프로토콜
4. 시술 간 조합/금기 사항
5. 한국 피부과/미용 시술 트렌드
6. 홈케어와 시술의 시너지

기대 결과:
- S-1 × 시술 교차 추천 알고리즘
- 피부 상태별 시술 우선순위
- 시술 후 관리 가이드
- 비용 대비 효과 분석

⚠️ 주의: 의료 행위 권유가 아닌 정보 제공 목적임을 명시
```

---

## 의존성

```
선행: BUNDLE-01 (Tech), BUNDLE-02 (Biz), BUNDLE-14 (Principles)
후행: BUNDLE-08 (Psychology)
병렬: 없음 (의존성 높음)
```

---

## 검증

- [ ] 6개 파일 모두 생성됨
- [ ] N×M 조합 패턴 적용됨
- [ ] 과학적 근거 명시
- [ ] 의료 정보 면책조항 포함

---

**Version**: 1.0 | **Created**: 2026-01-18
