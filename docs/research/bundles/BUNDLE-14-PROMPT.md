# BUNDLE-14: 도메인 원리 (뷰티/웰니스)

> 핵심 도메인 과학 원리 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-14 |
| **우선순위** | P1 |
| **예상 시간** | 3시간 |
| **도메인** | 과학/원리 |
| **포함 항목** | PRINCIPLE-NUTRITION-SCIENCE, PRINCIPLE-EXERCISE-PHYSIOLOGY, W-2-REHAB-BUNDLE, W-2-POSTURE-PROTOCOL |

---

## 입력

### 참조 문서
- `docs/principles/` - 기존 원리 문서
- `docs/principles/README.md` - 원리 문서 가이드

### 선행 리서치
- 없음 (기초 원리, 독립적)

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/PRINCIPLE-NUTRITION-SCIENCE-R1.md` | 영양학 원리 |
| `docs/research/claude-ai-research/PRINCIPLE-EXERCISE-PHYSIOLOGY-R1.md` | 운동생리학 원리 |
| `docs/research/claude-ai-research/W-2-REHAB-BUNDLE-R1.md` | 재활 운동 번들 |
| `docs/research/claude-ai-research/W-2-POSTURE-PROTOCOL-R1.md` | 자세 교정 프로토콜 |

### 원리 문서 (추가 생성)

| 파일명 | 내용 |
|--------|------|
| `docs/principles/nutrition-science.md` | 영양학 원리 (P2 준수) |
| `docs/principles/exercise-physiology.md` | 운동생리학 원리 (P2 준수) |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 원리 문서는 `docs/principles/README.md` 템플릿 준수
- 각 파일 2000-4000단어

---

## 프롬프트

### PRINCIPLE-NUTRITION-SCIENCE

```
뷰티/웰니스 앱에 필요한 영양학 기초 원리를 조사해주세요.

조사 범위:
1. 필수 영양소와 피부 건강 관계
   - 비타민 (A, C, E, B군)
   - 미네랄 (아연, 셀레늄, 구리)
   - 단백질/콜라겐
   - 필수 지방산 (오메가-3)
2. 영양소 상호작용 (시너지/길항)
3. 권장 섭취량 (RDA) 기준
4. 식이 vs 보충제 효과 비교
5. 장-피부 축 (Gut-Skin Axis)
6. 수분 대사와 피부

기대 결과:
- 영양소-피부 연관성 과학적 근거
- 영양소 추천 알고리즘 기반
- 한국인 영양 권장량 참조
- 면책조항 및 의료 조언 경계

생성할 원리 문서: docs/principles/nutrition-science.md
```

### PRINCIPLE-EXERCISE-PHYSIOLOGY

```
체형 분석과 운동 추천에 필요한 운동생리학 원리를 조사해주세요.

조사 범위:
1. 근골격계 해부학 기초
2. 근육 수축 원리 (동심성/편심성)
3. 에너지 시스템 (ATP, 유산소/무산소)
4. 운동과 체형 변화 메커니즘
5. 운동 순서 및 강도 원칙
6. 회복 및 적응 (초과회복)

기대 결과:
- 운동 추천 알고리즘 과학적 기반
- 체형별 효과적 운동 원리
- 안전한 운동 가이드라인
- 과학적 근거 문헌 목록

생성할 원리 문서: docs/principles/exercise-physiology.md
```

### W-2-REHAB-BUNDLE

```
체형 불균형 교정을 위한 재활 운동 번들을 조사해주세요.

조사 범위:
1. 흔한 체형 불균형 유형
   - 상/하 교차 증후군
   - 거북목/라운드 숄더
   - 골반 전방/후방 경사
2. 각 불균형별 원인 근육
3. 스트레칭/강화 운동 조합
4. 운동 순서 및 빈도
5. 자가 평가 방법
6. 전문가 의뢰 기준

기대 결과:
- 불균형 유형별 운동 프로토콜
- 동영상/이미지 참조 가이드
- 진행 상황 추적 지표
- 주의사항 및 금기

⚠️ 의료 행위가 아님을 명시
```

### W-2-POSTURE-PROTOCOL

```
자세 분석 및 교정 프로토콜을 조사해주세요.

조사 범위:
1. 이상적인 자세 정의 (정면/측면)
2. 자세 분석 랜드마크 포인트
3. 자세 점수 계산 방법
4. 교정 운동 단계별 프로그램
5. 생활 습관 개선 가이드
6. 자세 모니터링 방법

기대 결과:
- 자세 분석 알고리즘 기반
- 점수화 기준 및 공식
- 8주 교정 프로그램 템플릿
- 일상 자세 체크리스트
```

---

## 의존성

```
선행: 없음 (기초 원리)
후행: BUNDLE-06 (Cross-Domain)
병렬: 없음 (우선 완료 권장)
```

---

## 검증

- [ ] 4개 리서치 파일 생성됨
- [ ] 2개 원리 문서 생성됨 (docs/principles/)
- [ ] 과학적 근거 명시
- [ ] P2 원리 우선 규칙 준수
- [ ] 의료 면책조항 포함

---

**Version**: 1.0 | **Created**: 2026-01-18
