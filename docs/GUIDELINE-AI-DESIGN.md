# AI 디자인 도구 사용 가이드라인

> Stitch, Midjourney, Figma AI 등 AI 디자인 도구 사용 시 주의사항
> 작성일: 2026-01-12

## 1. 개요

### 1.1 배경

AI 디자인 도구(Stitch 등)는 빠르게 UI 초안을 생성할 수 있지만, 이룸 브랜드와 기능에 맞지 않는 결과물을 생성할 수 있습니다.

### 1.2 이 문서의 목적

- AI 디자인 도구 사용 시 피해야 할 실수 정리
- 이룸 브랜드 일관성 유지
- 검토 체크리스트 제공

---

## 2. 이룸 앱 정체성 (필수 이해)

### 2.1 이룸은 무엇인가

```
이룸 = AI 퍼스널 분석 + 자기 기록 앱

핵심 기능:
- AI가 사용자의 피부/체형/퍼스널컬러 분석
- 사용자가 직접 운동/영양 기록
- 개인화된 제품 추천
```

### 2.2 이룸이 아닌 것

| 이룸이 아닌 것        | 왜 아닌지                   |
| --------------------- | --------------------------- |
| 전문가 예약 앱        | 전문가 목록/예약 기능 없음  |
| 프로그램 마켓플레이스 | 유료 프로그램 판매 없음     |
| 피트니스 수업 앱      | 실시간 수업/코칭 없음       |
| 커뮤니티 앱           | 소셜은 부가 기능, 핵심 아님 |

---

## 3. AI 디자인 생성 시 흔한 오류

### 3.1 기능 오해 (Critical)

**문제**: AI가 "wellness app"을 일반적인 피트니스/예약 앱으로 해석

| AI 생성 결과        | 실제 이룸                          |
| ------------------- | ---------------------------------- |
| "Top Experts" 섹션  | 없음 - 전문가 목록 없음            |
| 프로그램 예약 버튼  | 없음 - 예약 기능 없음              |
| 가격 표시 (₩60,000) | 없음 - 현재 무료 서비스            |
| 리뷰/평점 시스템    | 제품 리뷰만 있음, 전문가 리뷰 없음 |

**해결**: 프롬프트에 명확히 명시

```
NOT a booking/marketplace app.
This is a PERSONAL AI ANALYSIS app:
- User uploads photo → AI analyzes
- User tracks their own workout/meals
- No experts, no programs to book
```

### 3.2 색상 불일치 (High)

**문제**: 비슷하지만 다른 색상 사용

| AI 생성              | 이룸 실제            | 차이          |
| -------------------- | -------------------- | ------------- |
| Teal (#009688, 180°) | Mint (#4A8B7C, 155°) | 25° 차이      |
| Cool gray background | Warm white (#FDFCFB) | 톤 반대       |
| 높은 채도 모듈 색상  | 뮤트 톤 모듈 색상    | 채도 20% 차이 |

**해결**: HEX 코드 명시

```
EXACT colors (do not approximate):
- Primary: #4A8B7C (not teal, not green)
- Background: #FDFCFB (warm white, not cool gray)
- Workout: #D4A574 (muted orange)
```

### 3.3 언어 오류 (Medium)

**문제**: 영어 UI 생성

| AI 생성                  | 이룸 실제            |
| ------------------------ | -------------------- |
| "Good Morning, Ji-min"   | "안녕하세요, 지민님" |
| "Expert Recommendations" | "추천 제품"          |
| "Start Workout"          | "운동 시작"          |

**해결**: 프롬프트에 언어 강제

```
ALL UI text must be in Korean (한국어):
- Greeting: "안녕하세요, [이름]님"
- Buttons: "시작하기", "기록하기"
- No English except brand name "Yiroom"
```

### 3.4 스타일 불일치 (Medium)

**문제**: 브랜드 톤과 맞지 않는 스타일

| AI 생성           | 이룸 의도          |
| ----------------- | ------------------ |
| 화려한 그라디언트 | 미니멀 단색        |
| 진한 그림자       | 은은한 그림자      |
| 둥근 버블 UI      | 각진 카드 UI       |
| 유행 디자인       | 절제된 전문가 느낌 |

**해결**: 참고 브랜드 명시

```
Style reference: Aesop, Glossier, 탬버린즈
- Warm neutrals, not cool blues
- Subtle shadows, not heavy
- Professional, not playful
- Minimal, not busy
```

---

## 4. 프롬프트 작성 가이드

### 4.1 필수 포함 요소

```markdown
## 앱 정체성 (필수)

- NOT a booking/marketplace app
- Personal AI analysis + self-tracking app
- No experts, no programs, no pricing

## 색상 (필수, HEX 명시)

- Primary: #4A8B7C
- Background: #FDFCFB
- Module colors: [정확한 HEX]

## 언어 (필수)

- ALL text in Korean (한국어)
- Exception: brand name "Yiroom"

## 스타일 참고

- Aesop, Glossier, 탬버린즈
- Warm, professional, minimal
```

### 4.2 템플릿

```
Design a mobile screen for "Yiroom" (이룸), a Korean AI wellness analysis app.

IMPORTANT - This is NOT:
- A booking app (no experts to book)
- A marketplace (no programs to purchase)
- A fitness class app (no live sessions)

This IS:
- AI analyzes user's skin/body/personal color from photos
- User tracks their own workout and meals
- App recommends products based on analysis

EXACT Colors:
- Primary: #4A8B7C (logo mint)
- Background: #FDFCFB (warm white)
- Text: #1C1C1E (soft black)

Language: ALL Korean text
Style: Minimal, warm, professional (like Aesop, Glossier)

Screen: [화면 설명]
```

---

## 5. 생성 결과 검토 체크리스트

### 5.1 기능 검증 (Critical)

- [ ] 전문가 예약/목록 UI가 없는가?
- [ ] 가격 표시가 없는가?
- [ ] 프로그램 구매 버튼이 없는가?
- [ ] 실제 이룸 기능만 표시되는가?

### 5.2 색상 검증 (High)

- [ ] Primary가 민트(#4A8B7C)인가? (틸/그린 아님)
- [ ] 배경이 웜화이트(#FDFCFB)인가? (쿨그레이 아님)
- [ ] 모듈 색상이 뮤트 톤인가?

### 5.3 언어 검증 (Medium)

- [ ] 모든 UI 텍스트가 한국어인가?
- [ ] 영어가 있다면 브랜드명(Yiroom)만인가?

### 5.4 스타일 검증 (Medium)

- [ ] 과도한 그라디언트/애니메이션이 없는가?
- [ ] 그림자가 은은한가?
- [ ] 전문가 앱 느낌인가? (유행 디자인 X)

---

## 6. 채택/거부 기준

### 6.1 즉시 거부 (Critical 위반)

- 존재하지 않는 기능 UI 포함 (전문가, 예약, 가격)
- 완전히 다른 색상 체계 사용
- 이룸 브랜드와 무관한 스타일

### 6.2 수정 후 채택 가능 (High/Medium 위반)

- 색상 미세 조정 필요
- 일부 영어 텍스트 → 한국어 변환
- 스타일 톤 조정

### 6.3 채택 (모든 검증 통과)

- 기존 디자인 기반으로 부분 적용
- 또는 직접 색상만 동기화

---

## 7. 권장 접근법

### 7.1 AI 디자인 도구 활용 시

1. **영감 수집 용도로만** - 직접 채택 X
2. **레이아웃 아이디어** - 색상/텍스트는 수동 수정
3. **컴포넌트 탐색** - 개별 요소만 참고

### 7.2 이룸 디자인 변경 시 권장

| 상황            | 권장 방법               |
| --------------- | ----------------------- |
| 색상 변경       | CSS 변수 직접 수정      |
| 레이아웃 변경   | 기존 컴포넌트 수정      |
| 새 화면 추가    | 기존 패턴 복제 후 수정  |
| 대규모 리디자인 | 웹 → 모바일 색상 동기화 |

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                         |
| ---- | ---------- | --------------------------------- |
| 1.0  | 2026-01-12 | 초기 작성 (Stitch 사용 경험 기반) |
