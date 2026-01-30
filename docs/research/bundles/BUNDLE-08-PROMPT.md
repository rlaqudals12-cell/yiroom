# BUNDLE-08: 사용자 심리 및 경험

> 사용자 심리, 감정 여정, 신뢰 구축 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-08 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | UX/심리학 |
| **포함 항목** | USER-PAIN-POINTS, USER-MENTAL-MODEL, USER-EMOTIONAL-JOURNEY, USER-TRUST-BUILDING, USER-VALUE-PERCEPTION |

---

## 입력

### 참조 문서
- `docs/USER-FLOWS.md` - 사용자 플로우
- `docs/research/claude-ai-research/USER-HABIT-FORMATION-R1.md` - 습관 형성

### 선행 리서치
- BUNDLE-03: 사용자 획득
- BUNDLE-04: UX/접근성
- BUNDLE-06: 크로스 도메인

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/USER-PAIN-POINTS-R1.md` | 사용자 페인 포인트 분석 |
| `docs/research/claude-ai-research/USER-MENTAL-MODEL-R1.md` | 사용자 멘탈 모델 |
| `docs/research/claude-ai-research/USER-EMOTIONAL-JOURNEY-R1.md` | 감정 여정 매핑 |
| `docs/research/claude-ai-research/USER-TRUST-BUILDING-R1.md` | 신뢰 구축 전략 |
| `docs/research/claude-ai-research/USER-VALUE-PERCEPTION-R1.md` | 가치 인식 분석 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### USER-PAIN-POINTS

```
한국 뷰티/웰니스 앱 사용자의 페인 포인트를 조사해주세요.

조사 범위:
1. 기존 뷰티 앱 사용 불만 사항
2. AI 분석 결과에 대한 불신 요인
3. 개인정보/이미지 제공 거부감
4. 유료 전환 장벽
5. 추천 제품 구매 실패 경험
6. 정보 과부하 문제

기대 결과:
- 페인 포인트 우선순위 매트릭스
- 각 페인 포인트 해결 전략
- 사용자 인터뷰 질문 가이드
- 경쟁사 페인 포인트 분석
```

### USER-MENTAL-MODEL

```
뷰티 앱 사용자의 멘탈 모델을 조사해주세요.

조사 범위:
1. AI 분석에 대한 기대와 현실
2. "나에게 맞는 제품" 개념 인식
3. 피부/체형 자가 진단 방식
4. 정보 탐색 패턴
5. 전문가 vs AI 신뢰도 비교
6. 결과 해석 방식

기대 결과:
- 사용자 멘탈 모델 다이어그램
- 인식 격차 (Perception Gap) 분석
- UI/UX 개선 포인트
- 교육/온보딩 전략
```

### USER-EMOTIONAL-JOURNEY

```
이룸 앱 사용자의 감정 여정을 조사해주세요.

조사 범위:
1. 서비스 발견 시점의 감정
2. 온보딩 과정 감정 변화
3. 분석 대기 중 불안감
4. 결과 확인 시 감정 (기대, 실망, 놀라움)
5. 추천 제품 탐색 시 감정
6. 재방문 트리거 감정

기대 결과:
- 감정 여정 맵 (Emotion Journey Map)
- 터치포인트별 감정 최적화 전략
- 부정 감정 완화 방법
- "아하 모먼트" 설계
```

### USER-TRUST-BUILDING

```
AI 분석 서비스에 대한 사용자 신뢰 구축 전략을 조사해주세요.

조사 범위:
1. AI 투명성 (결과 설명, 신뢰도 표시)
2. 사회적 증거 (리뷰, 사용자 수)
3. 전문가 검증/보증
4. 개인정보 보호 커뮤니케이션
5. 일관된 브랜드 경험
6. 오류 처리 및 사과

기대 결과:
- 신뢰 구축 단계별 전략
- AI 투명성 UI 가이드
- 사회적 증거 표시 방법
- 신뢰도 측정 지표
```

### USER-VALUE-PERCEPTION

```
사용자의 이룸 서비스 가치 인식을 조사해주세요.

조사 범위:
1. 무료 vs 유료 가치 인식 차이
2. AI 분석 결과의 인지된 가치
3. 시간 절약 가치
4. 맞춤형 추천의 인지된 가치
5. 경쟁 서비스 대비 차별점 인식
6. 가치 증대 시점

기대 결과:
- 가치 제안 (Value Proposition) 정리
- 가치 인식 향상 전략
- 가격 민감도 분석
- 무료 사용자 → 유료 전환 가치 트리거
```

---

## 의존성

```
선행: BUNDLE-03 (Acquisition), BUNDLE-04 (UX), BUNDLE-06 (Cross-Domain)
후행: BUNDLE-09 (Personalization)
병렬: 없음
```

---

## 검증

- [ ] 5개 파일 모두 생성됨
- [ ] 한국 사용자 특성 반영
- [ ] 감정 여정 맵 포함
- [ ] 실행 가능한 개선 방안 제시

---

**Version**: 1.0 | **Created**: 2026-01-18
