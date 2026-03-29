# 랜딩 페이지 / 온보딩 / 사용 가이드 UX 패턴 리서치

> 세계적 성공 앱 및 SaaS의 패턴 분석 (2025-2026)
> 작성일: 2026-03-29

---

## 목차

1. [뷰티/헬스 AI 앱 (직접 경쟁)](#1-뷰티헬스-ai-앱)
2. [성공한 한국 앱](#2-성공한-한국-앱)
3. [글로벌 SaaS 최고 사례](#3-글로벌-saas-최고-사례)
4. [공통 패턴 종합](#4-공통-패턴-종합)
5. [이룸 적용 시사점](#5-이룸-적용-시사점)

---

## 1. 뷰티/헬스 AI 앱

### 1.1 Perfect Corp (YouCam Makeup)

**규모**: 9억+ 다운로드, 320+ 글로벌 브랜드 파트너

**랜딩 페이지**

- 히어로: "The ultimate makeup app and face editor for flawless selfies"
- 핵심 가치 제안: 가상 메이크업 체험 → 즉각적 시각 결과
- CTA: 앱 다운로드 유도 (App Store / Google Play 뱃지)
- 소셜 프루프: "900 Million+ Global Downloads", "320+ Brand Partners"

**온보딩**

- 즉시 카메라 접근 → 가상 메이크업 체험 (TTFV 매우 짧음)
- 로그인 없이 핵심 기능(가상 체험) 시도 가능
- AI Beauty Agent (2025 신규): 대화형 뷰티 컨설턴트로 자연어 대화

**사용 가이드**

- 카테고리별 탭: 메이크업/스킨케어/헤어/패션
- AI가 얼굴 분석 후 바로 추천 → 결과 해석이 직관적
- "Shop Search": 가상 체험 후 바로 제품 구매 연결

**핵심 교훈**: 가치를 먼저 체험시키고(가상 메이크업) 가입은 나중에

---

### 1.2 Cal AI (칼로리 트래커)

**규모**: 월 $2M 매출, $2.50/다운로드, 800K 월간 다운로드

**랜딩 페이지 (calai.app)**

- 심플한 히어로: 음식 사진 → 칼로리 분석 가치 제안
- App Store 뱃지 중심 CTA
- "How it works": 사진 찍기 → AI 분석 → 추적 (3단계)

**온보딩 (20+ 스텝, 매우 긴 온보딩)**

- **개인화 질문**: 목표 체중, 현재 체중, 활동 수준, 식이 선호 등
- **목표 검증 화면**: "Your goal is realistic!" → 자신감 부여 (핵심 순간)
- **진행 그래프**: 목표까지의 예상 타임라인 시각화
- **사회적 증거**: 온보딩 중간에 사용자 후기 삽입
- **정직한 기대 설정**: "시간이 걸릴 수 있다"고 솔직하게 안내 → 환불 감소
- **AI 추천 편집 가능**: AI를 "독재자"가 아닌 "조언자"로 포지셔닝
- **Hard Paywall**: 온보딩 끝에 페이월 (3일 무료 체험)
  - 타임라인으로 체험/결제 시점 명확 안내
  - 월간 vs 연간 옵션 (연간 강조)

**핵심 교훈**: 긴 온보딩이라도 개인화가 충분하면 전환율 높음. 단, 핵심은 "당신의 목표는 현실적이다"라는 심리적 안심 제공.

---

### 1.3 FaceApp

**규모**: 1억+ 다운로드

**온보딩**

- 최소한의 온보딩: 앱 설치 → 즉시 얼굴 변환 체험
- 사진 선택/촬영 → 변환 결과 즉시 확인 (TTFV ~5초)
- 프리미엄 기능은 결과 화면에서 잠금 표시 (소프트 페이월)
- 가입 없이 기본 기능 사용 가능

**핵심 교훈**: 바이럴 앱은 가치 도달 시간을 극단적으로 줄임

---

### 1.4 Oh My Skin (ohmy.skin)

**규모**: ~1,200건 분석 (소규모, 직접 경쟁자)

**랜딩 페이지**

- Next.js + Supabase + OpenAI 기반 (이룸과 동일 스택)
- AI 피부 분석 결과 시각화 중심
- 3단계 "How it works": 사진 촬영 → AI 분석 → 결과 확인

**핵심 교훈**: 동일 스택의 경쟁자가 이미 존재. 이룸의 차별점은 "8모듈 통합"

---

### 1.5 AI 피부 분석 앱 공통 패턴

| 요소        | 공통 패턴                              |
| ----------- | -------------------------------------- |
| 히어로      | "Scan your face" / "Take a photo" 중심 |
| 프로세스    | 3단계: 촬영 → 분석 → 결과              |
| TTFV        | 사진 한 장 → 결과 (30초 이내 목표)     |
| 소셜 프루프 | 분석 건수, 별점, 사용자 수             |
| CTA         | "무료로 분석하기" / "지금 스캔하기"    |
| 데모        | 샘플 결과 이미지 미리보기              |

---

## 2. 성공한 한국 앱

### 2.1 토스 (Toss)

**규모**: 한국 1위 금융 슈퍼앱, 2,000만+ 사용자

**핵심 디자인 원칙 (이룸에 직접 적용 가능)**

| 원칙                        | 설명                            | 이룸 적용                  |
| --------------------------- | ------------------------------- | -------------------------- |
| **One Thing per One Page**  | 하나의 화면은 하나의 메시지만   | 분석 결과를 섹션별로 분리  |
| **Easy to Answer**          | 모든 질문에 3초 안에 답변 가능  | 입력 폼 단순화             |
| **Value First, Cost Later** | 가치 먼저, 비용(가입 등)은 나중 | 결과 미리보기 후 가입 유도 |

**온보딩**

- 최소 입력: 전화번호 하나로 가입
- 즉시 잔액 확인 가능 (TTFV ~30초)
- "기억하기 힘든 정보는 알아서 찾아줌" → 인지 부담 최소화

**UX 사례**

- 병원비 돌려받기: "서류 있나요?" 질문 하나로 분기 → 이탈 60% 감소
- 캐주얼하고 둥글둥글한 디자인으로 "딱딱한 금융" 이미지 탈피
- 해요체 사용 (합니다 → 해요)

**핵심 교훈**: 한 화면 한 메시지 + 가치 먼저 제공 + 인지 부담 최소화

---

### 2.2 화해 (Hwahae)

**규모**: 1,000만 다운로드, 누적 리뷰 1,000만 건, 한국 여성 60% 사용

**랜딩/가치 제안**

- "대한민국 1등 뷰티 앱"
- 핵심 가치: 피부 타입별 성분 분석 + 실제 사용자 리뷰
- "궁합 점수": 내 피부에 맞는 제품 매칭

**온보딩**

- 피부 타입 질문 (건성/지성/복합/민감)
- 피부 고민 선택 (여드름/주름/잡티 등)
- 입력 기반으로 즉시 개인화된 제품 추천

**소셜 프루프**

- "1,000만 건 리뷰" (구체적 숫자)
- EWG 등급 (외부 신뢰 기관)
- 실제 사용자 사진 리뷰

**핵심 교훈**: 사용자 생성 콘텐츠(리뷰)가 최강의 소셜 프루프. "궁합 점수" 같은 개인화 매칭은 강력한 가치 제안.

---

### 2.3 오늘의집

**규모**: 한국인 2명 중 1명 다운로드, 유니콘 기업

**랜딩/가치 제안**

- "라이프스타일 슈퍼앱"
- 실제 집 사진에 제품 태그 → 바로 구매 가능
- 콘텐츠(영감) → 커머스(구매) 자연 연결

**온보딩**

- 이벤트 영역 아래 자주 찾는 메뉴를 아이콘으로 구성
- 커뮤니티 콘텐츠(집 소개)로 상품 간접 노출
- 탐색 → 영감 → 구매 자연 플로우

**핵심 교훈**: 콘텐츠가 곧 온보딩. 실제 사례(집 사진)가 제품 발견으로 자연 연결.

---

## 3. 글로벌 SaaS 최고 사례

### 3.1 Duolingo (게이미피케이션 온보딩)

**규모**: DAU 4,770만, 유료 구독 1,090만, 매출 $1B+ (2025)

**온보딩 핵심 (이룸 게이미피케이션에 직접 참고)**

| 단계 | 설명                                 | TTFV |
| ---- | ------------------------------------ | ---- |
| 1    | 언어 선택                            | 5초  |
| 2    | 목표 설정 ("travel"/"school"/"work") | 15초 |
| 3    | 경험 수준 자가 평가                  | 20초 |
| 4    | **즉시 첫 번째 퀴즈** (가입 전!)     | 60초 |
| 5    | "맞았다!" 성취감 → 가입 유도         | 90초 |

**핵심 패턴: "가치 먼저, 가입 나중"**

- 가입 전에 첫 번째 번역 퀴즈 완료
- "나도 할 수 있다"는 자신감 → 그 다음에 계정 생성
- 계정 없이도 핵심 가치 체험 가능

**게이미피케이션 요소**

- 스트릭 (연속 출석): 손실 회피 심리 활용 → 스트릭 길수록 이탈 고통 증가
- XP (경험치): 매 활동마다 포인트
- 리그/리더보드: 사회적 경쟁
- 퀘스트/배지: 달성 목표 다양화

**핵심 교훈**: 가입 전 가치 체험 → 성취감 → 가입. 스트릭은 가장 강력한 리텐션 도구.

---

### 3.2 Notion (점진적 공개 온보딩)

**온보딩 소요 시간**: ~50초 (개인 사용 기준)

**온보딩 핵심 패턴**

| 요소           | 설명                                           |
| -------------- | ---------------------------------------------- |
| 용도 질문      | "What will you use Notion for?" (개인/팀/학교) |
| 맞춤 템플릿    | 답변 기반 5개 템플릿 자동 추천                 |
| 빈 상태 = 교육 | 빈 페이지 대신 체크리스트형 가이드             |
| Learn-by-doing | "Type / for slash commands" → 직접 해보며 학습 |
| 점진적 공개    | 기능을 한번에 보여주지 않고, 사용 시점에 안내  |

**빈 상태 처리 (이룸에 직접 참고)**

- 빈 화면 = 교육 콘텐츠 + 데모 콘텐츠 + 체크리스트
- "Getting Started" 페이지가 곧 튜토리얼
- 체크리스트 완료 → 자연스럽게 핵심 기능 학습

**핵심 교훈**: 빈 상태를 교육 기회로 활용. 50초 안에 개인화된 작업 공간 제공.

---

### 3.3 Canva (즉시 체험 온보딩)

**온보딩 핵심 패턴**

| 단계 | 설명                                                            |
| ---- | --------------------------------------------------------------- |
| 1    | 용도 질문: "What will you design?" (소셜미디어/프레젠테이션 등) |
| 2    | 답변 기반 맞춤 템플릿 추천                                      |
| 3    | 템플릿 클릭 → 즉시 편집기 진입                                  |
| 4    | 드래그앤드롭으로 체험 → "나도 만들 수 있다"                     |

**핵심 수치**: 포스터 카테고리 개인화 → 활성화율 +10%

**즉시 가치 제공**

- 가입 직후 수초 내 전문적 디자인 시작 가능
- 템플릿이 곧 가치 (빈 캔버스가 아님)
- 드래그앤드롭 에디터가 시각적 큐로 사용법 안내

**핵심 교훈**: 템플릿 = 즉시 가치. 사용자 의도(용도) 기반 개인화가 활성화 핵심.

---

### 3.4 Spotify (개인화 온보딩)

**온보딩 소요 시간**: 설치 → 음악 재생 2분 이내

**온보딩 핵심 패턴**

| 단계 | 설명                               |
| ---- | ---------------------------------- |
| 1    | 가입 (이메일/소셜)                 |
| 2    | 좋아하는 아티스트 3명+ 선택        |
| 3    | 팟캐스트 관심사 선택               |
| 4    | 즉시 맞춤 플레이리스트 생성 → 재생 |

**개인화 전략**

- 선택한 아티스트 기반 즉시 추천
- 빈 홈 화면 없음 → 항상 콘텐츠로 채움
- 추천이 100% 정확하지 않아도 "유용하다"는 느낌 제공
- 각 화면에 하나의 명확한 액션

**개선 가능점 (PM 분석, 2025)**

- 온보딩 중 진행 표시기(Step 2 of 4) 없음
- 생년월일/성별 요청 시 이유 설명 부재

**핵심 교훈**: 완벽하지 않아도 즉시 개인화된 콘텐츠 제공이 중요. "채워진 화면"이 "빈 화면"보다 항상 낫다.

---

## 4. 공통 패턴 종합

### 4.1 랜딩 페이지 공식

```
히어로 섹션
├── 한 줄 가치 제안 (10단어 이내)
├── 부제: 구체적 혜택 설명 (2줄 이내)
├── 주요 CTA 버튼 (1개, 대비색)
└── 히어로 이미지/비디오 (제품 사용 모습)

How it Works 섹션
├── 3단계 (최대 4단계)
├── 아이콘 + 짧은 설명
└── 형식: 번호 + 아이콘 + 1줄 설명

소셜 프루프 섹션
├── 구체적 숫자 ("10,000+ 분석 완료")
├── 별점 (4.5+)
├── 사용자 후기 (실명 + 사진)
└── 로고 배너 (파트너/미디어)

CTA 반복 섹션
└── 페이지 하단에 동일 CTA 반복
```

### 4.2 온보딩 패턴 유형

| 유형                 | 대표 앱          | TTFV  | 특징                     |
| -------------------- | ---------------- | ----- | ------------------------ |
| **즉시 체험**        | FaceApp, Canva   | <30초 | 가입 전 핵심 기능 체험   |
| **개인화 긴 온보딩** | Cal AI           | 3-5분 | 20+ 스텝, 하드 페이월    |
| **Learn-by-doing**   | Notion, Duolingo | <2분  | 실제 사용하며 학습       |
| **최소 마찰**        | 토스             | <30초 | 전화번호만으로 즉시 시작 |
| **콘텐츠 중심**      | 오늘의집         | <1분  | 콘텐츠가 곧 온보딩       |

### 4.3 빈 상태 처리 패턴

| 패턴        | 설명                   | 사용 앱        |
| ----------- | ---------------------- | -------------- |
| 교육형      | 빈 화면 = 튜토리얼     | Notion         |
| CTA형       | 아이콘 + 설명 + 버튼   | 대부분         |
| 샘플 데이터 | 데모 데이터로 채움     | Spotify, Canva |
| 캐릭터형    | 마스코트 + 격려 메시지 | Duolingo       |
| 일러스트형  | 감성 일러스트 + 안내   | Google Gemini  |

### 4.4 TTFV(Time to First Value) 벤치마크

| 앱       | TTFV  | 첫 가치                |
| -------- | ----- | ---------------------- |
| FaceApp  | ~5초  | 변환된 얼굴            |
| Spotify  | ~2분  | 맞춤 플레이리스트 재생 |
| Canva    | ~3분  | 첫 디자인 완성         |
| Duolingo | ~90초 | "맞았다!" 첫 정답      |
| Notion   | ~50초 | 맞춤 워크스페이스      |
| 토스     | ~30초 | 잔액 확인              |
| Cal AI   | ~5분  | 맞춤 칼로리 플랜       |

**업계 기준**: 20분 넘으면 70% 이탈 (Visa 조사). TTFV 24시간 미만이면 NRR 18% 높음.

---

## 5. 이룸 적용 시사점

### 5.1 랜딩 페이지 개선 방향

**히어로 섹션**

```
현재: [확인 필요]
권장: "사진 한 장으로 나를 알아가는 AI 뷰티 분석"
     부제: "퍼스널 컬러부터 피부, 체형, 영양까지 — 8가지 분석을 무료로"
     CTA: "무료로 분석 시작하기"
     시각: Before/After 또는 분석 결과 미리보기 이미지
```

**How it Works (3단계)**

```
1. 사진 촬영 (카메라 아이콘)
   "정면 셀카 한 장이면 충분해요"

2. AI 분석 (분석 아이콘)
   "8가지 모듈이 30초 만에 분석해요"

3. 맞춤 결과 (결과 아이콘)
   "나만의 뷰티 리포트를 받아보세요"
```

**소셜 프루프**

```
- "[N]건 분석 완료" (구체적 숫자)
- "전문가 90% 수준의 분석을 무료로" (이룸 가치 제안)
- 샘플 분석 결과 미리보기 (스크린샷)
```

### 5.2 온보딩 개선 방향

**권장 패턴: "즉시 체험" + "개인화"**

```
1단계: 사진 촬영 (가입 전) — TTFV 목표 30초
  → 퍼스널 컬러 미리보기 결과 즉시 표시
  → "상세 결과를 보려면 무료 가입하세요" (Duolingo 패턴)

2단계: 간편 가입 (소셜 로그인)
  → 토스 패턴: 최소 정보만 (이름 + 소셜 계정)

3단계: 개인화 질문 (3개 이내)
  → 관심 분야 선택: 퍼스널 컬러 / 피부 / 체형 / 영양 / 운동
  → 피부 고민 선택 (화해 패턴)
  → 목표 설정 ("나에게 어울리는 것을 찾고 싶어요")

4단계: 맞춤 대시보드
  → 빈 상태 = "첫 분석 시작하기" CTA (Notion 패턴)
  → 추천 분석 순서 안내
```

### 5.3 빈 상태 처리

**분석 전 대시보드**

```
현재: [확인 필요]
권장:
  - 일러스트 + "아직 분석 결과가 없어요"
  - "사진 한 장으로 시작해볼까요?" CTA 버튼
  - 샘플 결과 카드 미리보기 (흐림 처리)
  - 추천 분석 순서: "퍼스널 컬러부터 시작하면 좋아요"
```

### 5.4 토스 원칙 적용

| 토스 원칙               | 이룸 적용                                             |
| ----------------------- | ----------------------------------------------------- |
| One Thing per One Page  | 분석 결과 페이지: 섹션별 카드, 한번에 하나의 인사이트 |
| Easy to Answer          | 입력 폼: 선택형 위주, 3초 안에 답변 가능              |
| Value First, Cost Later | 분석 결과 미리보기 → 가입 → 상세 결과                 |

### 5.5 Cal AI 패턴 적용 (주의사항 포함)

| Cal AI 패턴           | 이룸 적용 가능                                    | 주의사항         |
| --------------------- | ------------------------------------------------- | ---------------- |
| 목표 검증 ("현실적")  | 분석 후 "당신의 피부는 관리하면 좋아질 수 있어요" | 과장 금지        |
| AI 추천 편집 가능     | "AI 제안을 수정할 수 있어요" → 조언자 포지셔닝    | 이룸 철학과 부합 |
| 온보딩 중 사회적 증거 | 분석 진행 중 "N명이 같은 결과"                    | 프라이버시 주의  |
| Hard Paywall          | **부적합** — 이룸은 영원히 무료 원칙              | 절대 적용 안 함  |

### 5.6 Duolingo 게이미피케이션 적용

이룸에 이미 게이미피케이션(BadgeCard, CrossDomainChallenge, LevelUpModal 등)이 구현되어 있으므로:

| Duolingo 요소 | 이룸 현재         | 강화 방향                         |
| ------------- | ----------------- | --------------------------------- |
| 스트릭        | -                 | 일일 루틴 체크 스트릭 (피부 일기) |
| XP            | -                 | 분석 완료 시 경험치               |
| 리더보드      | -                 | 프라이버시 이슈로 비적용          |
| 배지          | BadgeCard 있음    | 모듈별 달성 배지 확장             |
| 레벨업        | LevelUpModal 있음 | 레벨별 새 기능 해금               |

---

## 부록: 주요 수치 정리

| 앱           | 다운로드/사용자 | 핵심 메트릭             |
| ------------ | --------------- | ----------------------- |
| Perfect Corp | 9억+            | 320+ 브랜드 파트너      |
| Cal AI       | 800K/월         | $2M 월매출, $2.50/DL    |
| FaceApp      | 1억+            | -                       |
| 토스         | 2,000만+        | 한국 1위 금융앱         |
| 화해         | 1,000만+        | 리뷰 1,000만 건         |
| 오늘의집     | 한국인 50%      | 유니콘                  |
| Duolingo     | DAU 4,770만     | 유료 1,090만, $1B+ 매출 |
| Notion       | -               | 온보딩 50초             |
| Spotify      | -               | 2분 내 첫 재생          |

---

## Sources

### 뷰티/헬스 AI

- [YouCam Apps - 200M AI Visuals in 2025](https://www.stocktitan.net/news/PERF/you-cam-apps-celebrate-a-breakthrough-year-of-ai-creativity-ar-4gmpksq3ph5h.html)
- [YouCam AI Beauty Agent Launch](https://www.businesswire.com/news/home/20251110601035/en/Perfect-Corp.-Launches-YouCam-AI-Beauty-Agent-in-YouCam-Makeup-App)
- [Perfect Corp CES 2026](https://www.stocktitan.net/news/PERF/perfect-corp-unveils-next-generation-ai-beauty-agent-and-api-xgo3vtfy8dm5.html)
- [Cal AI on ScreensDesign](https://screensdesign.com/showcase/cal-ai-calorie-tracker)
- [Cal AI App Review - Toolify](https://www.toolify.ai/ai-news/cal-ai-app-review-maximizing-your-calorie-tracking-3625848)
- [Cal AI Review - Eesel](https://www.eesel.ai/blog/cal-ai)
- [Cal AI Official](https://www.calai.app/)
- [AI Skin Analyzer Apps](https://www.glamar.io/blog/ai-skin-analyzer-apps)
- [AI Skincare Landing Page Design - Medium](https://medium.com/@grusha124/how-i-designed-an-aesthetic-landing-page-for-an-ai-driven-skincare-recommendation-app-15702466a8d2)

### 한국 앱

- [토스 디자인 원칙 Easy to Answer](https://toss.tech/article/insurance-claim-process)
- [토스 8가지 라이팅 원칙](https://toss.tech/article/8-writing-principles-of-toss)
- [토스 UX 사용자 경험](https://byline.network/2021/09/01-45/)
- [토스 10가지 UX 법칙](https://www.mobiinside.co.kr/2023/03/29/toss-ux-2/)
- [토스 UI/UX 개발 이야기](https://ditoday.com/%EB%88%84%EA%B5%AC%EB%82%98-%ED%8E%B8%EB%A6%AC%ED%95%9C-%ED%86%A0%EC%8A%A4-ui%C2%B7ux-%EA%B0%9C%EB%B0%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0/)
- [화해 App Store](https://apps.apple.com/us/app/%ED%99%94%ED%95%B4-%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD-1%EB%93%B1-%EB%B7%B0%ED%8B%B0-%EC%95%B1/id940056100)
- [화해 누적 리뷰 1000만 건](https://www.venturesquare.net/1042810)
- [Hwahae - K-Beauty - 10Mag](https://10mag.com/introducing-hwahae-%ED%99%94%ED%95%B4-the-best-thing-to-happen-to-k-beauty-lovers-and-your-skin/)
- [오늘의집 공식](https://ohou.se/)
- [오늘의집 Design Compass](https://designcompass.org/en/2024/12/03/kaleidoscope-21/)

### 글로벌 SaaS

- [Duolingo Onboarding - Appcues](https://goodux.appcues.com/blog/duolingo-user-onboarding)
- [Duolingo Gamification - StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- [Duolingo Neuromarketing Study](https://www.braingineers.com/post/user-experience-design-a-neuromarketing-evaluation-of-duolingos-onboarding-flow)
- [Duolingo Case Study 2025](https://www.youngurbanproject.com/duolingo-case-study/)
- [Duolingo Onboarding - UserGuiding](https://userguiding.com/blog/duolingo-onboarding-ux)
- [Notion Onboarding - Appcues](https://goodux.appcues.com/blog/notions-lightweight-onboarding)
- [Notion Personalized Onboarding - Candu](https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users)
- [Notion Onboarding - UX Guide](https://uxguide.co/notion-onboarding-new-users-0c026fc6ca11)
- [Canva Growth +10% Activation - Appcues](https://www.appcues.com/blog/canva-growth-process)
- [Canva Personalization - Raw Studio](https://raw.studio/blog/level-up-your-onboarding-how-canva-personalizes-for-user-success/)
- [Canva UserTesting Case Study](https://www.usertesting.com/blog/canva-case-study)
- [Spotify Onboarding Deep Dive - Medium](https://medium.com/@smarthvasdev/deep-dive-into-spotifys-user-onboarding-experience-f2eefb8619d6)
- [Spotify Onboarding PM Analysis 2025](https://medium.com/@PMinProgress/how-spotify-onboards-new-users-and-what-id-improve-as-a-pm-c05b4eb318df)
- [Spotify Retention Strategy 2026](https://www.trypropel.ai/resources/customer-retention-strategies-spotify-techniques-to-reduce-churn)

### 일반 UX 패턴

- [Empty State UX - Eleken](https://www.eleken.co/blog-posts/empty-state-ux)
- [Empty State - Toptal](https://www.toptal.com/designers/ux/empty-state-ux-design)
- [Empty State - Mobbin](https://mobbin.com/glossary/empty-state)
- [TTFV - Product School](https://productschool.com/blog/product-strategy/time-to-value)
- [TTFV - Medium](https://medium.com/@mervin.jad/time-to-first-value-ttfv-the-ux-metric-that-decides-retention-f47e07977fa6)
- [Hero Section Examples - Thrive Themes](https://thrivethemes.com/hero-section-examples/)
- [CTA Best Practices 2026](https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages)
- [Beauty Landing Page Examples](https://landingi.com/landing-page/beauty-examples/)
- [Landing Pages 2025 - Medium](https://medium.com/@marias_martin/landing-pages-in-2025-and-how-to-get-them-right-for-ai-products-802ebf43a1ee)
- [App Onboarding Secrets - YouTube Transcript](https://my.infocaptor.com/hub/summaries/adam-lyttle/the-app-onboarding-secrets-that-convert-proven-strategies-QMo2T5apdYw)
- [200 Onboarding Flows Study](https://designerup.co/blog/i-studied-the-ux-ui-of-over-200-onboarding-flows-heres-everything-i-learned/)
- [Onboarding Best Practices 2025](https://userguiding.com/blog/user-onboarding-best-practices)

---

**Version**: 1.0 | **Created**: 2026-03-29 | 리서치 전용 (코드 변경 없음)
