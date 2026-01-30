# Gemini Ultimate UI/UX Request Bundle

> **Version**: 1.0 | **Created**: 2026-01-21
> **목표**: 이룸 앱 궁극의 UI/UX 완성 (200+ 산출물)
> **기준**: "YIROOM IDENTITY ✨" 확정 디자인 (100/100점)

---

## 📋 전체 요청 목록 (50+ Requests)

| Phase | Request # | 내용 | 산출물 |
|-------|-----------|------|--------|
| 1 | R01-R05 | 기본 50화면 | 50 screens |
| 2 | R06-R09 | 컴포넌트 라이브러리 | 60+ components |
| 3 | R10-R19 | 상태별 변형 | 150+ states |
| 4 | R20-R24 | 반응형 (Tablet/Desktop) | 75+ layouts |
| 5 | R25-R27 | Light Mode | 50+ variants |
| 6 | R28-R30 | Micro-interactions | 30+ animations |
| 7 | R31 | 접근성 감사 | 1 report |
| 8 | R32 | 핸드오프 가이드 | 1 document |

**Total: 32 Requests → 400+ 산출물**

---

# 🌐 공통 마스터 컨텍스트

모든 요청의 시작에 이 컨텍스트를 포함하세요:

```markdown
## Yiroom 브랜드 컨텍스트 (필수 포함)

### 앱 정보
- **앱명**: Yiroom (이룸)
- **헤더**: "YIROOM IDENTITY ✨"
- **서브타이틀**: "YIROOM INTELLIGENCE"
- **슬로건**: "Absolute Singularity - 당신만의 아름다움을 발견하세요"
- **핵심 가치**: 통합 웰니스 AI 플랫폼 (퍼스널컬러 + 피부 + 체형 + 영양 + 운동)

### 디자인 토큰 (Dark Mode 기본)

**배경/표면**
- Background: #0F0F0F
- Card: #1A1A1A
- Border: #2A2A2A
- Elevated: #242424

**텍스트**
- Primary: #FFFFFF
- Secondary: #9CA3AF
- Muted: #6B7280
- Inverse: #0A0A0A

**브랜드 컬러**
- Primary Gradient: linear-gradient(135deg, #F8C8DC 0%, #FFB6C1 100%)
- Accent Blue: #60A5FA (피부 S-1)
- Accent Purple: #A78BFA (체형 C-1)
- Accent Pink: #F472B6 (퍼스널컬러 PC-1)
- Accent Green: #4ADE80 (웰니스 N-1/W-1)

**시맨틱**
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

### 필수 UI 패턴

**1. Header**
"YIROOM IDENTITY ✨" (중앙 정렬, 흰색)

**2. Progress Bar**
"1/3 완료 (33%)" + 단계 아이콘 (⬡ ◯ ◯)

**3. Trust Badge**
상단 우측: "10만+ 사용자 신뢰" | "AI 정확도 92%"

**4. Sub-card**
컬러 아이콘 + 한글 설명 (예: 🔵 "6존 AI 스캐닝")

**5. CTA Button**
핑크 그라디언트, 검정 텍스트, rounded-full, py-4 px-8

**6. AD Badge**
제품 카드 우상단, 회색 배경, "AD" 텍스트

### 기술 제약
- 모바일 퍼스트 (375px 기준)
- 터치 타겟 최소 44px
- shadcn/ui 호환 구조
- Tailwind CSS 클래스 사용
- Pretendard 폰트

### 참조 이미지
[확정된 Dashboard 스크린샷 첨부 필수]
```

---

# Phase 1: 기본 50화면 (R01-R05)

## R01: Core Flow Part 1 - 온보딩 & 인증 (1-10)

```markdown
# Request R01: 온보딩 & 인증 UI (10화면)

[마스터 컨텍스트 삽입]

## 요청 화면

### 1. Splash Screen
- 중앙: "YIROOM" 로고 (핑크 그라디언트 또는 화이트)
- 배경: #0F0F0F
- 하단: 로딩 바 (핑크)
- 로고 아래: 슬로건 작게

### 2. Onboarding 1 - Welcome
- 상단: 일러스트 (AI 분석 시각화)
- 중앙: "당신만의 아름다움을 발견하세요"
- 하단: 페이지 인디케이터 (● ○ ○)
- 버튼: "다음" (secondary style)

### 3. Onboarding 2 - Features
- 상단: 3개 분석 아이콘 (PC/Skin/Body)
- 중앙: "AI가 분석하고, 맞춤 추천을 드려요"
- 기능 리스트:
  - ✓ 퍼스널컬러 분석
  - ✓ 피부 상태 분석
  - ✓ 체형 분석
- 인디케이터: (○ ● ○)

### 4. Onboarding 3 - Social Proof
- 상단: 사용자 아바타 그룹 (5-6명)
- 중앙: "10만+ 사용자가 이미 경험했어요"
- Trust badges: "AI 정확도 92%" | "만족도 4.8/5"
- 인디케이터: (○ ○ ●)
- 버튼: "시작하기" (primary gradient)

### 5. Login Screen
- 헤더: "YIROOM IDENTITY ✨"
- 소셜 버튼 (세로 정렬):
  - [G] Google로 계속하기
  - [🍎] Apple로 계속하기
  - [💬] 카카오로 계속하기
- 구분선: "또는"
- 이메일 로그인 링크
- 하단: "계정이 없으신가요? 가입하기"

### 6. Sign Up Screen
- 헤더: "YIROOM IDENTITY ✨"
- 입력 필드:
  - 이름 (placeholder: "홍길동")
  - 이메일 (placeholder: "email@example.com")
  - 비밀번호 (placeholder: "8자 이상")
- 체크박스: "이용약관 및 개인정보처리방침에 동의합니다"
- 버튼: "가입하기" (primary gradient)
- 하단: "이미 계정이 있으신가요? 로그인"

### 7. Dashboard (Home) ⭐ 핵심 화면
- 상단: "YIROOM IDENTITY ✨"
- Trust Badge: "10만+ 사용자 신뢰" (우상단)
- Progress: "1/3 완료 (33%)" + ⬡ ◯ ◯
- 메인 카드: "나의 분석 현황"
- Sub-cards (3개 그리드):
  - 🔵 피부 분석 "6존 AI 스캐닝" [미완료]
  - 🟣 체형 분석 "5-TYPE 분류" [미완료]
  - 💗 퍼스널컬러 "4계절 16타입" [완료 ✓]
- CTA: "무료로 시작하기" (핑크 그라디언트)
- 하단 네비게이션: 홈(활성)/분석/옷장/웰니스/마이

### 8. Analysis Hub
- 헤더: "분석 허브"
- 진행률 원형 차트: "1/4 완료"
- 분석 카드 (4개 세로 리스트):
  - PC-1 퍼스널컬러 [완료 ✓] 💗
  - S-1 피부 분석 [시작하기 →] 🔵
  - C-1 체형 분석 [시작하기 →] 🟣
  - IC-1 통합 분석 [잠금 🔒]
- 하단: "모두 완료하면 통합 인사이트를 받아보세요"

### 9. PC-1 Camera (퍼스널컬러 촬영)
- 카메라 프리뷰 (전체 화면)
- 얼굴 가이드 오버레이 (타원형, 핑크 테두리)
- 상단 안내: "자연광에서 촬영해주세요"
- 조명 품질 인디케이터 (좋음/보통/나쁨)
- 하단:
  - 좌: 갤러리 아이콘
  - 중앙: 촬영 버튼 (원형, 핑크 테두리)
  - 우: 카메라 전환 아이콘

### 10. PC-1 Processing (분석 중)
- 중앙: 로딩 애니메이션 (핑크 원형)
- 메시지: "AI가 퍼스널컬러를 분석 중입니다..."
- Progress bar: 0% → 100% 애니메이션
- 분석 단계 표시:
  - ✓ 피부톤 추출 중...
  - ○ 색상 분석 중...
  - ○ 시즌 판별 중...
- 하단: 예상 소요 시간 "약 10초"

## 출력 형식
각 화면당:
1. 375px 너비 모바일 목업 (PNG)
2. 컴포넌트 명세 (사용된 요소)
3. 색상 코드 확인
```

---

## R02: Core Flow Part 2 - 분석 결과 (11-20)

```markdown
# Request R02: 분석 결과 UI (10화면)

[마스터 컨텍스트 삽입]

## 요청 화면

### 11. PC-1 Result (퍼스널컬러 결과)
- 헤더: "퍼스널컬러 분석 결과" + 공유 아이콘
- 메인 결과: "봄 웜 라이트 ☀️" (큰 텍스트)
- 특징 카드:
  - "따뜻하고 밝은 톤이 어울려요"
  - "골드, 코랄, 피치 계열 추천"
- 컬러 팔레트:
  - Best Colors (8색 그리드)
  - Worst Colors (4색 그리드)
- 고정 하단: [다시 분석] [결과 공유]

### 12. S-1 Camera (피부 촬영)
- 카메라 프리뷰
- 6존 가이드 오버레이:
  - 이마/코/왼뺨/오른뺨/턱/눈밑
  - 각 존 원형 표시
- 안내: "정면을 바라보고 가이드에 맞춰주세요"
- 조명 품질: 밝기 게이지
- 촬영 버튼 (파란색 강조)

### 13. S-1 Processing
- 로딩 애니메이션 (파란색)
- "6존 피부 상태를 분석 중입니다..."
- 단계별 체크리스트:
  - ✓ T존 분석 완료
  - ○ U존 분석 중...
  - ○ 전체 점수 계산 중...

### 14. S-1 Result (피부 분석 결과)
- 헤더: "피부 분석 결과"
- FaceZoneMap: 6존 시각화 (터치 가능)
  - 각 존 색상 코딩 (좋음/보통/주의)
- 피부 활력도: "72점" (원형 게이지)
- 피부 타입: "복합성 (T존 지성 / U존 건성)"
- 점수 요약 카드:
  - 수분도: 65/100
  - 유분도: 45/100
  - 민감도: 30/100
  - 주름: 25/100
- 탭: [스킨케어 솔루션] 버튼

### 15. S-1 Zone Detail (존 상세)
- 바텀 시트 모달 (슬라이드업)
- 선택된 존 하이라이트
- 존 이름: "T존 (이마/코)"
- 상세 점수:
  - 수분: ████████░░ 80%
  - 유분: ██████████ 100%
- 문제점: "유분 과다, 모공 확장"
- 추천 케어: "클레이 마스크, 토너 패드"
- 추천 제품 (AD 뱃지 포함)

### 16. C-1 Camera (체형 촬영)
- 전신 가이드 오버레이
- 거리 안내: "2m 거리에서 촬영"
- 포즈 가이드: 정면/측면 선택
- 수평 가이드라인
- 촬영 버튼 (보라색 강조)

### 17. C-1 Processing
- 로딩 애니메이션 (보라색)
- "체형 비율을 분석 중입니다..."
- 측정 항목 표시:
  - 어깨 너비 측정 중...
  - 허리 라인 분석 중...
  - 힙 비율 계산 중...

### 18. C-1 Result (체형 분석 결과)
- 헤더: "체형 분석 결과"
- 메인: "웨이브 타입 💜"
- 체형 일러스트 (실루엣)
- 특징:
  - "어깨가 부드럽고 허리가 가늘어요"
  - "곡선적인 라인이 특징이에요"
- 비율 데이터:
  - 어깨:허리:힙 = 1:0.7:1
- 추천 스타일:
  - ✓ 핏앤플레어
  - ✓ 하이웨이스트
  - ✗ 박시핏 (피하기)
- [스타일링 추천 보기] 버튼

### 19. IC-1 Integrated (통합 결과)
- 헤더: "나의 종합 분석"
- 완료율: 원형 차트 "4/4 완료 ✓"
- 분석 요약 카드 (4개):
  - 💗 봄웜라이트
  - 🔵 복합성 피부
  - 🟣 웨이브 체형
  - 🟢 BMI 정상
- 크로스 인사이트 섹션:
  - "봄웜 + 웨이브 조합"
  - "소프트하고 여성스러운 이미지 추천"
- [통합 리포트 다운로드] 버튼
- [AI 코치와 상담하기] 버튼

### 20. Share Result (결과 공유)
- 공유 카드 프리뷰 (Instagram 정사각형)
  - 로고 + 결과 타입 + 컬러 팔레트
- 공유 옵션 버튼:
  - 카카오톡
  - 인스타그램 스토리
  - 링크 복사
- [이미지로 저장] 버튼
- 워터마크 토글: "Yiroom 로고 표시"

## 출력 형식
[R01과 동일]
```

---

## R03: Styling & Wardrobe (21-29)

```markdown
# Request R03: 스타일링 & 옷장 UI (9화면)

[마스터 컨텍스트 삽입]

## 요청 화면

### 21. Color Palette (추천 컬러)
- 헤더: "나의 컬러 팔레트"
- 시즌 뱃지: "봄 웜 라이트 ☀️"
- Best Colors 섹션:
  - 12색 그리드 (4x3)
  - 각 색상 탭 시 HEX 코드 표시
- 카테고리별 가이드:
  - 립: 코랄, 피치
  - 아이: 골드, 브라운
  - 의류: 아이보리, 베이지
- [팔레트 저장] [공유하기] 버튼

### 22. Makeup Recommend (메이크업 추천)
- 헤더: "추천 메이크업"
- 탭: [립] [아이] [치크] [베이스]
- 추천 룩 캐러셀:
  - 데일리 룩
  - 오피스 룩
  - 데이트 룩
- 제품 추천 (AD 뱃지):
  - 제품 이미지 + 이름 + 가격
  - 매칭률: "92% 매칭"
- [전체 보기] 링크

### 23. Hair Style (헤어스타일)
- 헤더: "추천 헤어스타일"
- 얼굴형 + 퍼스널컬러 기반
- 추천 헤어 갤러리 (스와이프):
  - 스타일 이미지
  - 스타일 이름
  - "이 스타일 저장" 하트 아이콘
- 추천 헤어 컬러:
  - 애쉬브라운
  - 밀크브라운
  - 다크블론드
- 주의 컬러: 블루블랙 (피하기)

### 24. Wardrobe Hub (옷장 허브)
- 헤더: "내 옷장"
- 통계: "32개 아이템 | 864개 코디 가능"
- 필터 탭: [전체] [상의] [하의] [아우터] [원피스]
- 아이템 그리드 (3열):
  - 각 아이템 이미지
  - 컬러 태그 (하단)
  - 하트 아이콘 (즐겨찾기)
- FAB: "+" 아이템 추가

### 25. Outfit Suggest (코디 추천)
- 헤더: "오늘의 코디"
- 선택 칩: 날씨(맑음/흐림/비) TPO(일상/출근/데이트)
- 추천 코디 카드 (스와이프):
  - 상의 + 하의 + 아우터 조합
  - 전체 매칭 점수: "95% 조화"
  - 각 아이템 탭 시 상세
- [이 코디 저장] [다른 추천] 버튼

### 26. Virtual Try-On (가상 피팅)
- 상단: 사용자 실루엣 또는 아바타
- 의류 오버레이 (선택한 아이템)
- 사이드 패널:
  - 의류 리스트
  - 색상 옵션
- 매칭 점수: "컬러 매칭 88%"
- [장바구니 추가] 버튼

### 27. Style History (착용 기록)
- 헤더: "스타일 히스토리"
- 뷰 전환: [캘린더] [리스트]
- 캘린더 뷰:
  - 날짜별 착용 썸네일
  - 날씨 아이콘
- 리스트 뷰:
  - 날짜 + 착용 사진 + 평점
- 통계: "가장 많이 입은: 화이트 니트"

### 28. Capsule Wardrobe (캡슐 옷장)
- 헤더: "33 캡슐 옷장"
- 진행률: "24/33 완료"
- 카테고리별 체크리스트:
  - 상의 (10개): ████████░░
  - 하의 (8개): ██████░░░░
  - 아우터 (5개): █████░░░░░
  - 원피스 (3개): ███░░░░░░░
  - 악세서리 (7개): ███████░░░
- 미보유 아이템: "추천 아이템 보기" 링크

### 29. Shopping List (쇼핑 리스트)
- 헤더: "쇼핑 리스트"
- 필요 아이템 리스트:
  - 아이템 이름 + 카테고리
  - 우선순위 (높음/중간/낮음)
  - 예상 가격
- 추천 제품 (AD):
  - 제품 카드 + 가격 + 링크
- 총 예상 비용: "₩320,000"
- 예산 설정 슬라이더

## 출력 형식
[R01과 동일]
```

---

## R04: Wellness & Products (30-41)

```markdown
# Request R04: 웰니스 & 제품 UI (12화면)

[마스터 컨텍스트 삽입]

## 요청 화면

### 30. Wellness Hub (웰니스 허브)
- 헤더: "나의 웰니스"
- 오늘의 목표:
  - 칼로리: 1,800 / 2,200 kcal
  - 물: 6 / 8 잔
  - 운동: 미완료
- 요약 카드 (2열):
  - 영양 분석 카드
  - 운동 추천 카드
- [AI 코치 상담] 버튼

### 31. N-1 Nutrition (영양 분석)
- 헤더: "나의 영양 분석"
- 신체 정보:
  - 키: 165cm | 몸무게: 55kg
  - 활동량: 보통
- 계산 결과:
  - BMR: 1,350 kcal
  - TDEE: 2,092 kcal
- 권장 섭취:
  - 탄수화물: 260g
  - 단백질: 70g
  - 지방: 58g
- [식단 추천 보기] 버튼

### 32. Meal Plan (식단 추천)
- 헤더: "오늘의 식단"
- 날짜 선택 (좌우 스와이프)
- 식사별 카드:
  - 🌅 아침: 오트밀 + 바나나 (350kcal)
  - 🌞 점심: 닭가슴살 샐러드 (450kcal)
  - 🌙 저녁: 연어 스테이크 (500kcal)
  - 🍎 간식: 그릭요거트 (150kcal)
- 총 칼로리: 1,450 / 2,092 kcal
- [다른 메뉴 추천] 버튼

### 33. Supplement (영양제 추천)
- 헤더: "추천 영양제"
- 분석 기반 부족 영양소:
  - 비타민 D: 부족 ⚠️
  - 오메가3: 보통
  - 철분: 정상 ✓
- 추천 제품 (AD 뱃지):
  - 제품 이미지 + 이름 + 브랜드
  - 가격 + 파트너 (iHerb)
  - "구매하기" 버튼
- 섭취 가이드: "아침 식후 1정"

### 34. W-1 Workout (운동 추천)
- 헤더: "나의 운동 플랜"
- 체형 타입: "웨이브" 기반 추천
- 주간 캘린더:
  - 월/수/금: 근력 운동
  - 화/목: 유산소
  - 토/일: 휴식
- 오늘의 운동 카드:
  - 운동 이름 + 예상 시간 + 칼로리
- [운동 시작하기] 버튼

### 35. Exercise Detail (운동 상세)
- 헤더: "스쿼트"
- 운동 GIF/비디오
- 운동 정보:
  - 타입: 근력 (하체)
  - MET: 5.0
  - 예상 칼로리: 150 kcal / 30분
- 가이드:
  - 세트: 3세트
  - 횟수: 15회
  - 휴식: 60초
- 타이머 버튼: [타이머 시작]
- 완료 체크박스

### 36. Product Hub (제품 허브)
- 헤더: "추천 제품"
- 필터 탭: [전체] [스킨케어] [메이크업] [패션]
- 분석 기반 배너: "복합성 피부를 위한 추천"
- 제품 그리드 (2열):
  - 제품 이미지 + AD 뱃지
  - 브랜드 + 제품명
  - 가격 + 매칭률
- 정렬: 매칭률순 / 가격순 / 인기순

### 37. Product Detail (제품 상세)
- 제품 이미지 갤러리 (스와이프)
- AD 뱃지 (우상단)
- 브랜드 + 제품명
- 가격: ₩32,000
- 매칭률: "당신과 92% 매칭 💗"
- 매칭 이유:
  - ✓ 복합성 피부에 적합
  - ✓ 봄웜 컬러 톤
- 성분 분석 요약:
  - 좋은 성분: 히알루론산, 나이아신아마이드
  - 주의 성분: 없음
- [구매하러 가기] 버튼 (딥링크)
- 파트너 로고 (쿠팡/iHerb)

### 38. Product Compare (제품 비교)
- 헤더: "제품 비교"
- 비교 테이블 (2-3열):
  - 제품 이미지
  - 가격
  - 매칭률
  - 주요 성분
  - 사용자 평점
- 하이라이트: "추천" 뱃지
- [선택한 제품 보기] 버튼

### 39. Ingredient Scan (성분 스캔)
- 헤더: "성분 스캔"
- 카메라 뷰 (성분표 촬영)
- OCR 결과:
  - 성분 리스트 (스크롤)
  - 각 성분 옆 아이콘:
    - 🟢 좋음
    - 🟡 보통
    - 🔴 주의
- 전체 평가: "이 제품은 복합성 피부에 적합해요"
- [대체 제품 보기] 버튼

### 40. Coach Chat (AI 코치)
- 헤더: "AI 웰니스 코치"
- 채팅 UI:
  - AI 메시지 (좌측, 회색 배경)
  - 사용자 메시지 (우측, 핑크)
- 예시 대화:
  - AI: "안녕하세요! 무엇을 도와드릴까요?"
  - 사용자: "오늘 뭐 먹을지 추천해줘"
  - AI: "체형과 목표를 고려한 식단을 추천드릴게요..."
- 하단 입력 필드 + 전송 버튼
- 추천 질문 칩: "식단 추천" "운동 추천" "스타일 상담"

### 41. Coach History (상담 히스토리)
- 헤더: "상담 히스토리"
- 날짜별 상담 리스트:
  - 날짜 + 요약 (첫 줄 미리보기)
  - 탭 시 전체 대화 보기
- 주요 인사이트 섹션:
  - "자주 물어본 주제: 식단, 운동"
- [새 상담 시작] 버튼

## 출력 형식
[R01과 동일]
```

---

## R05: My Page & Settings (42-50)

```markdown
# Request R05: 마이페이지 & 설정 UI (9화면)

[마스터 컨텍스트 삽입]

## 요청 화면

### 42. My Page (마이페이지 메인)
- 프로필 섹션:
  - 프로필 이미지 (원형)
  - 이름: "김이룸"
  - 이메일: "yiroom@example.com"
- 분석 완료 뱃지: "3/4 완료" (가로 배열)
- 메뉴 리스트:
  - 📊 분석 히스토리
  - ✏️ 프로필 수정
  - 📏 신체 정보
  - ⚙️ 설정
  - ❓ 도움말
- 하단: [로그아웃] 텍스트 버튼

### 43. Analysis History (분석 히스토리)
- 헤더: "분석 히스토리"
- 필터 칩: [전체] [퍼스널컬러] [피부] [체형]
- 타임라인 리스트:
  - 날짜 구분선
  - 분석 카드:
    - 아이콘 + 분석 타입
    - 결과 요약 (봄웜라이트, 복합성 등)
    - 상세 보기 →
- 빈 상태: "아직 분석 기록이 없어요"

### 44. Profile Edit (프로필 수정)
- 헤더: "프로필 수정" + [저장]
- 프로필 이미지 (탭하여 변경)
- 입력 필드:
  - 이름: [텍스트 입력]
  - 이메일: [읽기 전용, 회색]
  - 생년월일: [날짜 선택]
  - 성별: [남성/여성/기타]
- [변경사항 저장] 버튼

### 45. Body Info (신체 정보)
- 헤더: "신체 정보" + [저장]
- 입력 필드:
  - 키: [숫자 입력] cm
  - 몸무게: [숫자 입력] kg
  - 활동량: [비활동적/가벼운/보통/활동적/매우활동적]
- 자동 계산 결과:
  - BMI: 20.2 (정상)
  - BMR: 1,350 kcal
- [정보 업데이트] 버튼

### 46. Settings (설정)
- 헤더: "설정"
- 섹션별 메뉴:
  - 🔔 알림 설정 →
  - 🌙 테마: [다크모드] 토글
  - 🌐 언어: 한국어 →
  - 📱 앱 버전: 1.0.0
- 데이터 관리:
  - 캐시 삭제
  - 데이터 내보내기
- 계정:
  - 로그아웃
  - 계정 삭제

### 47. Notification (알림 설정)
- 헤더: "알림 설정"
- 토글 리스트:
  - 푸시 알림: [ON]
  - 분석 리마인더: [ON]
  - 제품 추천 알림: [ON]
  - 코치 메시지: [ON]
  - 마케팅 알림: [OFF]
- 각 항목 설명 텍스트

### 48. Privacy (개인정보)
- 헤더: "개인정보 관리"
- 내 데이터:
  - [데이터 다운로드] 버튼
  - [분석 데이터 삭제] 버튼 (빨간색)
- 계정:
  - [계정 삭제] 버튼 (빨간색, 확인 필요)
- 링크:
  - 개인정보처리방침 →
  - 이용약관 →

### 49. Help/FAQ (도움말)
- 헤더: "도움말"
- 검색 바: "궁금한 내용을 검색하세요"
- FAQ 아코디언:
  - "분석 결과가 정확한가요?"
  - "사진은 어떻게 촬영해야 하나요?"
  - "결과를 다시 받을 수 있나요?"
  - (각 탭 시 답변 펼침)
- [문의하기] 버튼 (이메일/채팅)
- [피드백 보내기] 버튼

### 50. Terms (약관)
- 헤더: "약관 및 정책"
- 아코디언 리스트:
  - 서비스 이용약관 (펼치기/접기)
  - 개인정보처리방침 (펼치기/접기)
  - 마케팅 수신 동의 (펼치기/접기)
- 동의 현황:
  - 필수 약관: ✓ 동의됨
  - 마케팅: [동의 변경] 버튼

## 출력 형식
[R01과 동일]
```

---

# Phase 2: 컴포넌트 라이브러리 (R06-R09)

## R06: Atoms (원자 컴포넌트)

```markdown
# Request R06: Atom Components

[마스터 컨텍스트 삽입]

## 요청 컴포넌트

모든 컴포넌트에 대해 다음을 제공해주세요:
1. 모든 Variants (변형)
2. 모든 States (상태): default, hover, active, disabled, loading
3. 모든 Sizes (크기): sm, md, lg, xl
4. Tailwind CSS 클래스

### 1. Button
**Variants**
- Primary: 핑크 그라디언트, 검정 텍스트
- Secondary: 투명, 흰 테두리
- Ghost: 투명, 테두리 없음
- Danger: 빨간 배경

**Sizes**
- sm: h-8, text-sm, px-3
- md: h-10, text-base, px-4
- lg: h-12, text-lg, px-6
- xl: h-14, text-xl, px-8

**States**
- default / hover (opacity-90) / active (scale-95) / disabled (opacity-50) / loading (spinner)

**Icon Variants**
- 아이콘 왼쪽
- 아이콘 오른쪽
- 아이콘만 (원형)

### 2. Input
**Variants**
- Text (기본)
- Password (마스킹 + 눈 아이콘)
- Search (돋보기 아이콘)
- Number (증감 버튼)

**States**
- default / focus (핑크 테두리) / error (빨간 테두리) / disabled

**With Addons**
- 왼쪽 아이콘
- 오른쪽 아이콘
- 접두사 텍스트
- 접미사 텍스트

### 3. Badge
**Variants**
- Default (회색)
- Primary (핑크)
- Success (녹색)
- Warning (노랑)
- Error (빨강)
- AD (회색, "AD" 텍스트)
- Trust (반투명, 아이콘 포함)

**Sizes**
- sm: h-5, text-xs
- md: h-6, text-sm
- lg: h-7, text-base

### 4. Avatar
**Sizes**
- xs: 24px
- sm: 32px
- md: 40px
- lg: 56px
- xl: 80px

**Variants**
- 이미지
- 이니셜 (배경색 + 텍스트)
- 아이콘 (기본 유저 아이콘)

**States**
- default / 온라인 (녹색 점) / 오프라인

### 5. Checkbox & Radio & Toggle
**Checkbox**
- unchecked / checked / indeterminate / disabled

**Radio**
- unselected / selected / disabled

**Toggle**
- off / on / disabled
- 크기: sm, md, lg

### 6. Progress
**Bar**
- 기본 (회색 배경 + 핑크 채움)
- 세그먼트 (단계별)
- 버퍼 (로딩 중)

**Circle**
- 기본 (백분율 표시)
- 대시보드 스타일

**Steps**
- 단계 아이콘 (⬡ ◯) + 라벨

### 7. Skeleton
**Variants**
- Text (한 줄, 여러 줄)
- Circle (아바타용)
- Rectangle (카드용)
- Image (이미지 플레이스홀더)

**Animation**
- Pulse (opacity 변화)
- Wave (좌→우 이동)

### 8. Icon
**Sizes**
- 16px, 20px, 24px, 32px, 48px

**Colors**
- 현재 색상 상속 (currentColor)
- 고정 색상 옵션

**카테고리별 아이콘 리스트**
- Navigation: home, search, menu, back, close
- Action: edit, delete, share, download, add
- Status: check, error, warning, info
- Analysis: face, body, color, skin
- Social: heart, comment, bookmark

## 출력 형식
각 컴포넌트당:
1. 모든 변형을 한 이미지에 그리드로 표시
2. Tailwind CSS 클래스 명세
```

---

## R07: Molecules (분자 컴포넌트)

```markdown
# Request R07: Molecule Components

[마스터 컨텍스트 삽입]

## 요청 컴포넌트

### 1. FormField
- Label + Input + Helper/Error 조합
- 필수 표시 (*)
- 에러 상태 (빨간 테두리 + 에러 메시지)

### 2. Card Variants
**Basic Card**
- 제목 + 내용 + 액션

**Product Card**
- 이미지 + AD 뱃지
- 브랜드 + 제품명
- 가격 + 매칭률

**Analysis Card**
- 컬러 아이콘 + 제목
- 설명 텍스트
- 상태 (완료/미완료/잠금)

**Stat Card**
- 아이콘 + 레이블
- 큰 숫자
- 변화율 (+5% ↑)

### 3. ListItem
**Variants**
- 기본: 아이콘 + 텍스트
- 상세: 아이콘 + 제목 + 설명
- 네비게이션: 텍스트 + 화살표
- 토글: 텍스트 + 토글 스위치
- 삭제: 스와이프 시 삭제 버튼

### 4. Toast
**Variants**
- Success: 녹색 아이콘 + 메시지
- Error: 빨간 아이콘 + 메시지
- Warning: 노란 아이콘 + 메시지
- Info: 파란 아이콘 + 메시지

**Position**
- 상단 중앙
- 하단 중앙

### 5. Modal
**Variants**
- Basic: 제목 + 내용 + 버튼
- Confirm: 아이콘 + 메시지 + 확인/취소
- BottomSheet: 하단 슬라이드업

### 6. Tab
**Variants**
- Basic: 밑줄 강조
- Pill: 배경색 강조
- Scrollable: 가로 스크롤

### 7. Chip
**Variants**
- Filter: 선택/미선택 + x 버튼
- Tag: 읽기 전용
- Input: 입력 + 추가

### 8. Empty State
- 일러스트/아이콘
- 제목 + 설명
- CTA 버튼

### 9. Error State
- 에러 아이콘
- 제목 + 설명
- 재시도 버튼

### 10. Loading State
- 스피너 또는 스켈레톤
- 로딩 메시지

## 출력 형식
[R06과 동일]
```

---

## R08: Organisms (유기체 컴포넌트)

```markdown
# Request R08: Organism Components

[마스터 컨텍스트 삽입]

## 요청 컴포넌트

### 1. Header Variants
**Basic**
- 로고 중앙

**WithBack**
- 뒤로 버튼 + 제목 + 액션 버튼

**WithMenu**
- 햄버거 + 로고 + 알림

**Dashboard**
- "YIROOM IDENTITY ✨" + Trust Badge

### 2. Navigation
**BottomTab**
- 5개 탭: 홈/분석/옷장/웰니스/마이
- 활성/비활성 상태
- 알림 뱃지

**Sidebar (태블릿/데스크톱)**
- 로고
- 메뉴 리스트
- 하단 설정

### 3. ProductGrid
**2 Column**
- 모바일 기본

**3 Column**
- 태블릿

**List View**
- 가로 카드

### 4. AnalysisCard (대형)
**PC-1 Card**
- 핑크 그라디언트 테두리
- 아이콘 + 제목 + 설명
- 진행 상태

**S-1 Card**
- 파란색 테두리
- FaceZoneMap 미니 프리뷰

**C-1 Card**
- 보라색 테두리
- 체형 실루엣 아이콘

### 5. CoachChat
**Message Bubble**
- AI (좌측, 회색)
- 사용자 (우측, 핑크)

**Input Area**
- 텍스트 입력
- 전송 버튼
- 추천 질문 칩

**Typing Indicator**
- 점 3개 애니메이션

### 6. CalendarView
**Month View**
- 날짜 그리드
- 이벤트 도트

**Week View**
- 7일 가로 배열
- 시간대별 이벤트

### 7. ColorPalette
- 색상 그리드 (4x3)
- 선택 시 확대 + HEX 표시
- 카테고리 라벨

### 8. FaceZoneMap
- 6존 시각화
- 터치 가능 영역
- 색상 코딩 (점수 기반)
- 선택 시 하이라이트

## 출력 형식
[R06과 동일]
```

---

## R09: Templates (템플릿)

```markdown
# Request R09: Page Templates

[마스터 컨텍스트 삽입]

## 요청 템플릿

### 1. AuthLayout
- 로고 상단
- 콘텐츠 중앙
- 푸터 링크

### 2. DashboardLayout
- 고정 헤더
- 스크롤 콘텐츠
- 고정 하단 네비게이션

### 3. AnalysisLayout
**Camera**
- 전체 화면 카메라
- 오버레이 가이드
- 하단 컨트롤

**Processing**
- 중앙 로딩
- 단계 표시

**Result**
- 스크롤 결과
- 고정 하단 액션

### 4. SettingsLayout
**Form**
- 헤더 + 저장 버튼
- 폼 필드 리스트

**List**
- 헤더
- 메뉴 리스트

### 5. ModalLayout
**Center**
- 중앙 모달
- 어두운 오버레이

**Bottom**
- 하단 시트
- 드래그 핸들

## 출력 형식
375px 와이어프레임 + 구조 설명
```

---

# Phase 3: 상태별 변형 (R10-R19)

## R10-R14: 핵심 화면 상태 (Loading/Empty/Error/Success)

```markdown
# Request R10: Dashboard States

[마스터 컨텍스트 삽입]

## Dashboard 4가지 상태

### 1. Loading State
- 헤더: 스켈레톤
- Trust Badge: 스켈레톤
- Progress: 스켈레톤 바
- 카드: 스켈레톤 (3개)
- CTA: 스켈레톤

### 2. Empty State (첫 방문)
- 헤더: 정상
- 중앙: 환영 일러스트
- 텍스트: "이룸에 오신 것을 환영해요!"
- 서브: "첫 분석을 시작해보세요"
- CTA: "분석 시작하기" (핑크)

### 3. Error State (네트워크)
- 헤더: 정상
- 중앙: 연결 오류 아이콘
- 텍스트: "연결에 문제가 있어요"
- 서브: "네트워크 상태를 확인해주세요"
- CTA: "다시 시도" 버튼

### 4. Success State (분석 완료)
- 헤더: 정상
- 컨페티 애니메이션
- 중앙: "분석 완료!" 텍스트
- 서브: "결과를 확인해보세요"
- CTA: "결과 보기" 버튼

## 출력 형식
각 상태당 375px 목업
```

**(R11-R14도 동일 패턴으로 다른 핵심 화면에 적용)**

---

## R15-R19: 추가 화면 상태

```markdown
# Request R15: Analysis Hub States
# Request R16: Product Hub States
# Request R17: Wardrobe Hub States
# Request R18: Wellness Hub States
# Request R19: My Page States

(각각 Loading/Empty/Error/Success 4가지 상태)
```

---

# Phase 4: 반응형 레이아웃 (R20-R24)

## R20: Dashboard Responsive

```markdown
# Request R20: Dashboard Responsive Layouts

[마스터 컨텍스트 삽입]

## 4가지 브레이크포인트

### 1. Mobile (375px) - 기본
- 1열 세로 레이아웃
- 하단 네비게이션

### 2. Tablet (768px)
- 2열 카드 그리드
- 하단 네비게이션

### 3. Desktop (1024px)
- 좌측 사이드바 네비게이션
- 메인: 2열 그리드
- 우측: 빠른 액션 패널

### 4. Wide (1280px)
- 좌측 사이드바
- 메인: 3열 그리드
- 우측: 통계 대시보드

## 출력 형식
각 브레이크포인트 목업 (4개)
```

**(R21-R24도 동일 패턴으로 다른 핵심 화면에 적용)**

---

# Phase 5: Light Mode (R25-R27)

## R25: Light Mode - Core Screens

```markdown
# Request R25: Light Mode Core Screens

[마스터 컨텍스트 - Light Mode 버전]

## Light Mode 컬러
- Background: #FFFFFF
- Card: #F9FAFB
- Border: #E5E7EB
- Text Primary: #111827
- Text Secondary: #6B7280
- Primary Gradient: 유지 (#F8C8DC → #FFB6C1)

## 요청 화면 (Light Mode 버전)
1. Splash
2. Dashboard
3. Analysis Hub
4. PC-1 Result
5. S-1 Result
6. C-1 Result
7. Product Hub
8. Product Detail
9. Settings
10. My Page

## 출력 형식
각 화면 Light Mode 목업
```

---

# Phase 6: Micro-interactions (R28-R30)

## R28: Button & Card Animations

```markdown
# Request R28: Button & Card Micro-interactions

[마스터 컨텍스트 삽입]

## 애니메이션 스펙

### 1. Button Press
- 0ms: scale(1), opacity(1)
- 50ms: scale(0.95)
- 150ms: scale(1)
- Easing: ease-out

### 2. Button Hover (Desktop)
- 0ms: normal
- 150ms: opacity(0.9), shadow increase
- Easing: ease-in-out

### 3. Card Tap
- Touch start: opacity(0.9)
- Touch end: ripple effect
- Duration: 300ms

### 4. Card Hover (Desktop)
- 0ms: translateY(0), shadow-md
- 200ms: translateY(-4px), shadow-lg
- Easing: ease-out

### 5. Toggle Switch
- Off → On: spring animation
- Handle slide: 200ms
- Background color: 150ms fade

## 출력 형식
각 애니메이션 프레임별 시각화 (스토리보드)
```

## R29: Page Transitions

```markdown
# Request R29: Page Transitions

## 전환 애니메이션

### 1. Push (새 페이지)
- 새 페이지: 오른쪽에서 슬라이드 인
- 현재 페이지: 왼쪽으로 살짝 이동 + 어두워짐
- Duration: 300ms

### 2. Pop (뒤로가기)
- 현재 페이지: 오른쪽으로 슬라이드 아웃
- 이전 페이지: 왼쪽에서 복원
- Duration: 300ms

### 3. Modal Present
- 모달: 아래에서 슬라이드 업
- 배경: fade to dark
- Duration: 250ms

### 4. Modal Dismiss
- 모달: 아래로 슬라이드 다운
- 배경: fade to clear
- Duration: 200ms

### 5. Tab Switch
- 콘텐츠: 크로스페이드
- Duration: 150ms

## 출력 형식
전환 애니메이션 스토리보드
```

## R30: Feedback Animations

```markdown
# Request R30: Feedback Animations

## 피드백 애니메이션

### 1. Success (분석 완료)
- 0ms: 체크마크 아이콘 scale(0)
- 200ms: scale(1.2)
- 400ms: scale(1)
- 500ms: 컨페티 파티클 시작
- 2000ms: 컨페티 종료

### 2. Error (Shake)
- 0ms: translateX(0)
- 50ms: translateX(-10px)
- 100ms: translateX(10px)
- 150ms: translateX(-5px)
- 200ms: translateX(5px)
- 250ms: translateX(0)

### 3. Loading (Progress)
- 프로그레스 바 fill 애니메이션
- 단계 체크마크 순차 등장
- 퍼센트 카운트업

### 4. Pull to Refresh
- 당기기: 스피너 회전 시작
- 놓기: 로딩 → 콘텐츠 리프레시
- Duration: 탄성 있는 복귀

### 5. Heart Like
- 0ms: scale(1)
- 100ms: scale(1.3), 파티클 버스트
- 200ms: scale(1)
- 색상: 회색 → 빨강

## 출력 형식
애니메이션 스토리보드 (프레임별)
```

---

# Phase 7: 접근성 (R31)

```markdown
# Request R31: Accessibility Audit Report

[마스터 컨텍스트 삽입]

## 접근성 감사 요청

### 1. 색상 대비 분석
모든 텍스트/배경 조합의 대비 비율 계산:
- 일반 텍스트: 4.5:1 이상 필요
- 큰 텍스트: 3:1 이상 필요
- UI 컴포넌트: 3:1 이상 필요

### 2. 터치 타겟 분석
모든 인터랙티브 요소:
- 최소 44x44px 확인
- 인접 간격 8px 이상 확인

### 3. 포커스 순서
각 화면의 논리적 탭 순서 다이어그램

### 4. 스크린 리더 호환성
- alt 텍스트 필요 요소
- aria-label 필요 요소
- heading 계층 구조

### 5. 색맹 시뮬레이션
주요 화면의 색맹 유형별 시뮬레이션:
- 적록색맹
- 청황색맹
- 완전색맹

## 출력 형식
접근성 감사 리포트 (PDF/문서)
```

---

# Phase 8: 핸드오프 가이드 (R32)

```markdown
# Request R32: Developer Handoff Guide

[마스터 컨텍스트 삽입]

## 개발자 핸드오프 문서

### 1. Design Token 정의
- CSS 변수 전체 목록
- Tailwind 설정 예시
- shadcn/ui 테마 설정

### 2. 컴포넌트 명세서
각 컴포넌트:
- Props 정의
- 사용 예시 코드
- 접근성 요구사항

### 3. 페이지별 구현 가이드
각 페이지:
- 와이어프레임
- 사용 컴포넌트 목록
- API 연동 포인트
- 상태 관리 가이드

### 4. 애니메이션 구현 가이드
- CSS transition 코드
- Framer Motion 예시
- 성능 최적화 팁

### 5. 반응형 구현 가이드
- Breakpoint 정의
- 레이아웃 변경 규칙
- 컴포넌트별 반응형 동작

## 출력 형식
Markdown 문서 + 코드 스니펫
```

---

# 📊 최종 산출물 체크리스트

## 이미지/목업
- [ ] 50개 기본 화면 (R01-R05)
- [ ] 60개 컴포넌트 (R06-R09)
- [ ] 150개 상태 변형 (R10-R19)
- [ ] 75개 반응형 (R20-R24)
- [ ] 50개 Light Mode (R25-R27)
- [ ] 30개 애니메이션 (R28-R30)

## 문서
- [ ] 접근성 리포트 (R31)
- [ ] 핸드오프 가이드 (R32)

## 총계
- **이미지**: 400+
- **문서**: 2
- **Gemini 요청**: 32

---

**Document Version**: 1.0
**Created**: 2026-01-21
**Purpose**: Yiroom Ultimate UI/UX Design Request Bundle
