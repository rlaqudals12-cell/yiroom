# 📋 N-1 Feature Spec Template
## AI 영양/식단 분석 시스템

**모듈 ID**: N-1  
**작성일**: 2025-11-27  
**작성자**: 이룸 개발팀  
**버전**: v1.0.3  
**상태**: [x] Draft / [ ] Review / [ ] Approved / [ ] Implemented

> **v1.0.3 주요 변경**: 온보딩 Step 2 확장 (성별/나이/키/활동수준 입력), TypeScript 타입 4개 추가, 테스트 케이스 보완

---

## 📑 목차

1. [개요 (Overview)](#1-개요-overview)
2. [기능 명세 (Functional Requirements)](#2-기능-명세-functional-requirements)
3. [크로스 모듈 연동](#3-크로스-모듈-연동)
4. [Hook Model 설계](#4-hook-model-설계)
5. [UI/UX 명세](#5-uiux-명세)
6. [AI 분석 로직](#6-ai-분석-로직)
7. [Database 스키마](#7-database-스키마)
8. [API 명세](#8-api-명세)
9. [기술 고려사항](#9-기술-고려사항)
10. [테스트 케이스](#10-테스트-케이스)
11. [성공 지표 (KPI)](#11-성공-지표-kpi)
12. [리스크 관리](#12-리스크-관리)
13. [구현 로드맵](#13-구현-로드맵)
14. [TypeScript 코드 예시](#14-typescript-코드-예시)
15. [버전 관리](#15-버전-관리)

---

## 1. 개요 (Overview)

### 1.1 목적
```yaml
핵심 목적:
  AI 기반 식단 기록 및 영양 분석을 통해
  개인화된 영양 관리 솔루션 제공
  
  피부(S-1), 체형(C-1), 운동(W-1) 데이터를 결합하여
  목표 기반 맞춤 식단 추천 제공

기대 효과:
  - 식단 기록 지속률 (D30 Retention): 35%
  - 일일 평균 기록 횟수: 2.5회
  - 목표 달성률: 60%
  - 크로스 모듈 전환율: 40%
  - 프리미엄 전환율: 12%
```

### 1.2 사용자 스토리
```gherkin
Feature: AI 식단 분석
  As a 건강한 식습관을 원하는 10대 후반~30대 초반 사용자
  I want to 쉽게 식단을 기록하고 영양 분석을 받고
  So that 목표에 맞는 식단 관리를 할 수 있다

Scenario: 음식 사진 AI 분석
  Given 사용자가 음식 사진을 촬영했을 때
  When AI가 음식을 인식하면
  Then 자동으로 칼로리와 영양소를 분석한다

Scenario: 목표 기반 식단 추천
  Given 사용자가 체중 감량 목표를 설정했을 때
  When 오늘의 식단을 확인하면
  Then 남은 칼로리에 맞는 식단을 추천한다

Scenario: 피부 연동 인사이트
  Given 사용자가 S-1 피부 분석을 완료했을 때
  When 피부 수분 부족이 감지되면
  Then 수분 섭취 및 관련 식품을 추천한다

Scenario: 운동 연동 식단
  Given 사용자가 W-1 운동을 완료했을 때
  When 운동 후 식단을 확인하면
  Then 회복에 필요한 영양소와 식단을 추천한다
```

### 1.3 핵심 차별화 포인트
```yaml
경쟁사 대비 차별화:

  vs 눔 (Noom):
    - 눔: 행동 심리학 기반 코칭 (유료 인력)
    - 이룸: AI 기반 자동 분석 + 크로스 모듈 연동

  vs MyFitnessPal:
    - MFP: 방대한 DB, 바코드 스캔 중심
    - 이룸: 음식 사진 AI + 피부/체형/운동 통합 인사이트

  vs 다노:
    - 다노: 식품 판매 + 습관 트래킹
    - 이룸: 개인화 추천 + 크로스 모듈 시너지

이룸 N-1 핵심 가치:
  1. "사진 한 장으로 끝" - AI 음식 인식
  2. "내 몸 전체를 위한 식단" - S-1/C-1/W-1 연동
  3. "나만의 맞춤 추천" - 선호도/스킬/예산 반영
```

---

## 2. 기능 명세 (Functional Requirements)

### 2.1 온보딩 (개인화 설정)
```yaml
온보딩 플로우 (2분 이내):

Step 1: 식사 목표 선택 (단일 선택)
  options:
    - 🔥 체중 감량: 칼로리 적자 식단
    - ⚖️ 체중 유지: 균형 잡힌 식단
    - 💪 근육 증가: 고단백 식단
    - ✨ 피부 개선: 피부 친화 식단 (S-1 연동)
    - ❤️ 건강 관리: 균형 영양 식단

Step 2: 기본 정보 입력 ⭐ (BMR/TDEE 계산 필수)
  
  2-1. C-1 데이터 확인:
    - C-1 있음: 키/체중 자동 불러오기 → 확인 후 다음
    - C-1 없음: 직접 입력 (아래 2-2)
  
  2-2. 신체 정보 입력:
    필수:
      - 성별: [남성] / [여성]
      - 생년월일: YYYY-MM-DD (나이 계산용)
      - 키: ___cm
      - 현재 체중: ___kg
    선택:
      - 목표 체중: ___kg
      - 목표 기간: ___주
  
  2-3. 활동 수준 선택 (TDEE 계산 필수): ⭐
    options:
      - 🪑 거의 활동 없음 (sedentary): 사무직, 재택근무
      - 🚶 가벼운 활동 (light): 주 1-3회 가벼운 운동
      - 🏃 보통 활동 (moderate): 주 3-5회 운동
      - 💪 활동적 (active): 주 6-7회 운동
      - 🔥 매우 활동적 (very_active): 운동선수급, 육체노동
    
    W-1 연동:
      - W-1 운동 기록 있음 → 활동 수준 자동 추천
      - 예: "주 4회 운동 기록 → '보통 활동' 추천"
  
  자동 계산 (입력 완료 시):
    - 기초대사량 (BMR): Harris-Benedict 공식
    - 일일 소비 칼로리 (TDEE): BMR × 활동 계수
    - 목표 칼로리: TDEE ± 목표별 조정
    
  UI 표시:
    ┌─────────────────────────────┐
    │  📊 당신의 칼로리 계산 결과  │
    │                             │
    │  기초대사량: 1,402 kcal     │
    │  일일 소비량: 2,173 kcal    │
    │  목표 칼로리: 1,673 kcal    │
    │                             │
    │  (체중 감량 목표 기준)       │
    └─────────────────────────────┘

Step 3: 선호 식습관 선택 (단일 선택)
  options:
    - 🍚 한식 위주: 밥, 국, 반찬 구성
    - 🥗 샐러드/가벼운 식사: 저탄고단
    - 🍝 양식/파스타/빵: 서양식 위주
    - 🍱 도시락/간편식: 편의점, 도시락
    - 🥡 배달/외식 많이: 외식 위주
    - 🔀 다양하게: 특정 선호 없음

Step 4: 요리 스킬 선택 (단일 선택)
  options:
    - 🔥 요리 고수: 복잡한 요리도 OK (30분+ 레시피)
    - 🍳 중급: 15-30분 요리 가능
    - 🥄 초급: 간단한 조리만 (10분 이내)
    - 🚫 요리 안 함: 완제품/배달만

Step 5: 식재료 예산 선택 (단일 선택)
  options:
    - 💰 가성비 위주: 저렴한 재료 선호
    - ⚖️ 적당히: 일반적인 수준
    - 💎 좋은 재료 선호: 품질 우선
    - 🔀 상관없음: 제한 없음

Step 6: 알레르기/기피 음식 설정 (복수 선택)
  categories:
    알레르기:
      - 갑각류 (새우, 게)
      - 견과류 (땅콩, 호두)
      - 유제품 (우유, 치즈)
      - 계란
      - 밀가루 (글루텐)
      - 대두
      - 생선
      - 기타: ___
    
    기피 음식:
      - 매운 음식
      - 생선/해산물
      - 육류
      - 채소류
      - 기타: ___
    
    식이 제한:
      - 비건
      - 베지테리안
      - 페스코 (생선 OK)
      - 할랄
      - 코셔
      - 저염식
      - 저당식
      - 없음

Step 7: 하루 식사 횟수 선택
  options:
    - 3끼: 아침 + 점심 + 저녁
    - 2끼: 점심 + 저녁 (간헐적 단식)
    - 4끼+: 소식 여러 번
    - 불규칙: 일정하지 않음
```

### 2.2 식단 기록 방식 (4가지)
```yaml
입력 방식 (복합 지원):

1. 📷 음식 사진 AI 분석 (핵심 기능):
   플로우:
     1) 카메라 촬영 또는 갤러리 선택
     2) AI가 음식 인식 (Gemini Vision)
     3) 인식 결과 확인/수정
     4) 양 조절 (0.5인분, 1인분, 1.5인분...)
     5) 기록 저장
   
   AI 출력:
     - 음식명
     - 예상 칼로리
     - 영양소 (탄단지)
     - 음식 신호등 (초록/노랑/빨강)
     - 신뢰도 표시 (높음/중간/낮음)
   
   정확도 향상:
     - 사용자 피드백 학습
     - 한국 음식 DB 우선 적용

2. 🔍 텍스트 검색 입력:
   플로우:
     1) 음식명 검색 (예: "김치찌개")
     2) 검색 결과에서 선택
     3) 양 조절
     4) 기록 저장
   
   검색 DB:
     - 한식 음식 DB (국/탕/찌개/반찬 등)
     - 프랜차이즈 메뉴 DB
     - 배달앱 메뉴 DB
     - 편의점 제품 DB
     - 사용자 등록 음식

3. 📊 바코드 스캔 (가공식품):
   플로우:
     1) 바코드 스캔
     2) 제품 정보 자동 불러오기
     3) 섭취량 조절
     4) 기록 저장
   
   활용 장면:
     - 편의점 도시락/샐러드
     - 음료/간식
     - 마트 가공식품
   
   DB:
     - 한국 식품 바코드 DB
     - 사용자 등록 제품

4. ✏️ 직접 입력 (커스텀):
   플로우:
     1) 음식명 직접 입력
     2) 칼로리 입력 (선택)
     3) 영양소 입력 (선택)
     4) 자주 먹는 음식으로 저장 (선택)
   
   활용 장면:
     - DB에 없는 음식
     - 집밥 (직접 만든 요리)
     - 특수 식단
```

### 2.3 음식 신호등 시스템
```yaml
음식 신호등 (눔 방식 적용):

분류 기준: 칼로리 밀도 (kcal/g)

🟢 초록색 (Green):
  - 칼로리 밀도: 1 미만
  - 설명: 적은 양으로도 포만감
  - 예시: 채소, 과일, 무지방 유제품, 달걀흰자
  - 목표: 하루 30% 이상

🟡 노란색 (Yellow):
  - 칼로리 밀도: 1 ~ 2.5
  - 설명: 적당히 섭취 권장
  - 예시: 저지방 육류, 통곡물, 저지방 유제품, 콩류
  - 목표: 하루 45% 이하

🔴 빨간색 (Red):
  - 칼로리 밀도: 2.5 초과
  - 설명: 소량만 섭취 권장
  - 예시: 튀김, 패스트푸드, 과자, 치즈, 기름기 많은 육류
  - 목표: 하루 25% 이하

추가 고려 요소 (목표 연동):

체중 감량 목표:
  - 🔴 고탄수화물 → 🟡로 격상
  - 🟢 저칼로리 채소 강조

근육 증가 목표:
  - 🟢 고단백 식품 강조
  - 🟡 탄수화물 적절히 허용

피부 개선 목표 (S-1 연동):
  - 🟢 수분 함량 높은 식품 강조
  - 🔴 당분/가공식품 경고
  - 🟡 오메가3, 비타민 식품 추천
```

### 2.4 영양 지표 시스템 (7가지)
```yaml
7가지 영양 지표:

1. 일일 칼로리 (kcal/일):
   - 측정: 기록된 음식 칼로리 합계
   - 목표: 목표 칼로리 (온보딩에서 계산)
   - 시각화: 원형 진행률 + 남은 칼로리
   - 표시: "1,200 / 1,800 kcal (67%)"

2. 탄수화물 (g/일):
   - 측정: 기록된 탄수화물 합계
   - 목표: 전체 칼로리의 45-65%
   - 시각화: 막대 그래프
   - 표시: "180g / 270g"

3. 단백질 (g/일):
   - 측정: 기록된 단백질 합계
   - 목표: 체중 x 1.2~2.0g (목표에 따라)
   - 시각화: 막대 그래프
   - 표시: "65g / 80g"

4. 지방 (g/일):
   - 측정: 기록된 지방 합계
   - 목표: 전체 칼로리의 20-35%
   - 시각화: 막대 그래프
   - 표시: "45g / 60g"

5. 수분 섭취 (mL/일):
   - 측정: 물/음료 기록 합계
   - 목표: 체중 x 30mL (기본 2,000mL)
   - 시각화: 물방울 아이콘 채우기
   - 표시: "1,500 / 2,000 mL"
   - S-1 연동: 피부 수분과 연결

6. 음식 신호등 비율 (%):
   - 측정: 초록/노랑/빨강 비율
   - 목표: 30%/45%/25% 이상
   - 시각화: 파이 차트
   - 표시: "🟢35% 🟡40% 🔴25%"

7. 식사 규칙성 (점수):
   - 측정: 식사 시간 일관성
   - 목표: 매일 비슷한 시간 식사
   - 시각화: 타임라인
   - 표시: "규칙성 점수: 85점"
```

### 2.5 식단 추천 시스템
```yaml
추천 시스템 구성:

1. 오늘의 추천 식단:
   트리거: 매일 아침 / 앱 접속 시
   구성:
     - 아침/점심/저녁/간식 추천
     - 남은 칼로리/영양소 반영
     - 개인 설정 반영 (선호도/스킬/예산)
   
   예시 (체중 감량 + 초급 요리):
     아침: 그릭요거트 + 블루베리 (5분)
     점심: 닭가슴살 샐러드 (10분)
     저녁: 두부 김치찌개 (15분)
     간식: 삶은 계란 2개

2. 남은 칼로리 추천:
   트리거: 식사 기록 후
   로직:
     - 남은 칼로리 계산
     - 부족 영양소 확인
     - 적합한 음식 추천
   
   예시:
     "남은 칼로리: 450kcal, 단백질 부족!
      추천: 닭가슴살 150g (210kcal, 단백질 35g)"

3. 오늘의 재료 활용:
   트리거: 사용자가 재료 입력 시
   로직:
     - 입력된 재료로 만들 수 있는 요리 추천
     - 요리 스킬에 맞는 레시피 제공
     - 칼로리/영양소 정보 포함
   
   예시:
     사용자: "소고기 안심 있어요"
     추천:
       - 안심 스테이크 (중급, 15분, 350kcal)
       - 안심 샤브샤브 (초급, 20분, 280kcal)
       - 안심 볶음 (초급, 10분, 320kcal)

4. 크로스 모듈 연동 추천:
   S-1 연동 (피부):
     - 피부 수분↓ → "수분 많은 과일, 물 섭취 추천"
     - 피부 트러블 → "저당, 항염 식품 추천"
     - 콜라겐↓ → "비타민C, 단백질 식품 추천"
   
   C-1 연동 (체형):
     - 근육 증가 목표 → "고단백 식단 강조"
     - 체지방 감소 목표 → "저탄고단 식단 추천"
   
   W-1 연동 (운동):
     - 운동 전 → "탄수화물 위주 가벼운 식사"
     - 운동 후 → "단백질 + 탄수화물 회복식"
     - 고강도 운동 → "칼로리 여유 추가"
```

### 2.6 외식/배달 메뉴 DB
```yaml
외식 메뉴 데이터베이스:

1. 프랜차이즈 메뉴:
   패스트푸드:
     - 맥도날드: 빅맥, 맥너겟, 감자튀김...
     - 버거킹: 와퍼, 치즈버거...
     - KFC: 치킨버켓, 징거버거...
     - 롯데리아: 불고기버거, 새우버거...
   
   카페:
     - 스타벅스: 아메리카노, 라떼, 샌드위치...
     - 투썸플레이스: 케이크, 음료...
     - 이디야: 음료, 베이커리...
   
   한식 프랜차이즈:
     - 본죽: 죽 메뉴...
     - 김밥천국: 김밥, 라면, 떡볶이...
     - 한솥: 도시락 메뉴...
   
   치킨:
     - BBQ, BHC, 교촌, 네네치킨...
   
   피자:
     - 도미노, 피자헛, 미스터피자...

2. 배달앱 인기 메뉴:
   - 배달의민족 TOP 100
   - 쿠팡이츠 인기 메뉴
   - 요기요 추천 메뉴

3. 편의점 메뉴:
   - CU: 도시락, 삼각김밥, 샌드위치...
   - GS25: 도시락, 즉석식품...
   - 세븐일레븐: 도시락, 간식...
   - 이마트24: 도시락, 즉석식품...

4. 한식 일반:
   categories:
     - 국/탕/찌개: 된장찌개, 김치찌개, 순두부...
     - 밥류: 비빔밥, 김밥, 볶음밥...
     - 면류: 칼국수, 냉면, 짜장면...
     - 반찬류: 김치, 나물, 젓갈...
     - 구이류: 삼겹살, 불고기, 갈비...
```

### 2.7 수분 섭취 추적
```yaml
수분 섭취 기능:

입력 방식:
  1. 빠른 추가 버튼:
     - [+물 1컵 (250mL)]
     - [+물 1병 (500mL)]
     - [+커피 1잔 (200mL)]
     - [+음료 직접 입력]
  
  2. 음료 종류별 기록:
     - 물: 100% 수분
     - 녹차/허브티: 100% 수분
     - 커피: 80% 수분 (카페인 이뇨 작용)
     - 주스: 70% 수분 + 당분 표시
     - 탄산음료: 50% 수분 + 당분 경고

목표 설정:
  기본: 2,000mL/일
  개인화: 체중 x 30mL
  운동 연동: 운동 시 +500mL 추가

S-1 연동:
  피부 수분 부족 감지 시:
    "오늘 수분 섭취가 부족해요! 
     피부 수분 유지를 위해 물 한 잔 더 마셔볼까요? 💧"

시각화:
  ┌─────────────────────────────┐
  │  💧 오늘의 수분 섭취        │
  │                             │
  │  [████████░░] 1,600mL      │
  │       / 2,000mL (80%)       │
  │                             │
  │  [+물 1컵]  [+물 1병]       │
  └─────────────────────────────┘
```

### 2.8 간헐적 단식 타이머
```yaml
간헐적 단식 지원:

단식 유형:
  - 16:8: 16시간 단식 / 8시간 식사
  - 18:6: 18시간 단식 / 6시간 식사
  - 20:4: 20시간 단식 / 4시간 식사
  - 커스텀: 직접 설정

기능:
  1. 단식 타이머:
     - 단식 시작/종료 시간 표시
     - 남은 시간 카운트다운
     - 푸시 알림 (단식 종료 30분 전)
  
  2. 식사 창 알림:
     - "식사 가능 시간: 12:00 ~ 20:00"
     - 식사 시간 외 음식 기록 시 경고
  
  3. 단식 기록:
     - 주간/월간 단식 성공률
     - 평균 단식 시간
     - 연속 성공일

시각화:
  ┌─────────────────────────────┐
  │  ⏰ 간헐적 단식 (16:8)      │
  │                             │
  │  현재: 🔒 단식 중           │
  │  남은 시간: 3시간 20분      │
  │                             │
  │  단식 시작: 20:00           │
  │  식사 가능: 12:00 ~ 20:00   │
  │                             │
  │  이번 주 성공률: 6/7 (86%)  │
  └─────────────────────────────┘
```

### 2.9 레시피 저장 기능
```yaml
자주 먹는 음식/레시피 저장:

저장 방식:
  1. 기록 후 저장:
     - 식단 기록 완료 → "자주 먹는 음식에 추가" 버튼
     - 카테고리 선택 (아침/점심/저녁/간식)
  
  2. 조합 저장:
     - 여러 음식을 한 세트로 저장
     - 예: "아침 세트" = 계란후라이 + 밥 + 김치

활용:
  - 빠른 기록: 저장된 음식 1탭으로 추가
  - 자주 먹는 순 정렬
  - 카테고리별 필터

시각화:
  ┌─────────────────────────────┐
  │  📁 자주 먹는 음식          │
  │                             │
  │  [아침] 계란후라이+밥       │
  │         350kcal | 단백질15g │
  │         [추가]              │
  │                             │
  │  [점심] 회사 구내식당 A     │
  │         550kcal | 탄단지 균형│
  │         [추가]              │
  │                             │
  │  [간식] 그릭요거트+견과류   │
  │         180kcal | 단백질10g │
  │         [추가]              │
  └─────────────────────────────┘
```

---

## 3. 크로스 모듈 연동

### 3.1 입력 연동 (← 방향)
```yaml
N-1 ← C-1 연동:
  데이터: 체형 타입, 신체 치수, 체중
  활용:
    - 체중 자동 불러오기 (온보딩 간소화)
    - 기초대사량/TDEE 계산
    - 체형 목표 기반 식단 추천

N-1 ← S-1 연동:
  데이터: 피부 수분, 피부 타입, 피부 고민
  활용:
    - 피부 문제별 식단 추천
    - 수분 섭취 목표 조정
    - 피부 친화 식품 강조

N-1 ← W-1 연동:
  데이터: 운동 기록, 칼로리 소모, 운동 타입
  활용:
    - 운동 칼로리 반영 (칼로리 여유)
    - 운동 전후 식단 추천
    - 운동 타입별 영양소 강조

❌ N-1 ← PC-1: 연동 없음
```

### 3.2 출력 연동 (→ 방향)
```yaml
N-1 → S-1 연동:
  트리거: 영양 인사이트 생성 시
  표시:
    ┌─────────────────────────────┐
    │  💧 피부를 위한 식단 팁     │
    │                             │
    │  이번 주 수분 섭취 부족!    │
    │  피부 수분 유지를 위해      │
    │  물 섭취를 늘려보세요.      │
    │                             │
    │  [피부 상태 확인하기] → S-1 │
    └─────────────────────────────┘
  전환율 목표: 25%

N-1 → C-1 연동:
  트리거: 체중 변화 감지 / 월간 리포트
  표시:
    ┌─────────────────────────────┐
    │  📏 체형 변화 확인          │
    │                             │
    │  4주간 식단 관리 성공! 🎉   │
    │  체중 -2kg 달성!            │
    │  체형에도 변화가 있을 수 있어요│
    │                             │
    │  [체형 재분석 받기] → C-1   │
    └─────────────────────────────┘
  전환율 목표: 30%

N-1 → W-1 연동:
  트리거: 칼로리 초과 / 운동 미진행
  표시:
    ┌─────────────────────────────┐
    │  🏃 칼로리 밸런스 알림      │
    │                             │
    │  오늘 섭취 칼로리: 2,200kcal│
    │  목표보다 400kcal 초과!     │
    │                             │
    │  30분 유산소로 균형 맞추기  │
    │  [운동 추천 받기] → W-1     │
    └─────────────────────────────┘
  전환율 목표: 35%
```

### 3.3 양방향 연동 상세
```yaml
N-1 ↔ W-1 상세 연동:

운동 전 식단:
  트리거: W-1에서 운동 예정 2시간 전
  N-1 표시:
    "2시간 후 운동 예정!
     가벼운 탄수화물 섭취 추천
     예: 바나나 1개 (100kcal)"

운동 후 식단:
  트리거: W-1에서 운동 완료 직후
  N-1 표시:
    "고생했어요! 💪
     소모 칼로리: 350kcal
     회복을 위한 추천:
     - 닭가슴살 150g (단백질 35g)
     - 바나나 1개 (탄수화물 27g)"

칼로리 밸런스 대시보드:
  ┌─────────────────────────────┐
  │  ⚖️ 오늘의 칼로리 밸런스    │
  │                             │
  │  섭취: 1,800 kcal           │
  │  소모: 350 kcal (W-1 연동)  │
  │  ─────────────────          │
  │  순 칼로리: 1,450 kcal      │
  │  목표: 1,600 kcal           │
  │                             │
  │  👍 목표 범위 내입니다!     │
  └─────────────────────────────┘
```

### 3.4 통합 웰니스 리포트 (N-1 포함)
```yaml
주간 리포트 (일요일 저녁):
  ┌─────────────────────────────┐
  │  📊 이번 주 당신의 웰니스   │
  │                             │
  │  🍽️ 식단: 목표 75% 달성     │
  │     평균 1,650kcal/일       │
  │     신호등: 🟢32% 🟡43% 🔴25%│
  │                             │
  │  🏃 운동: 목표 80% 달성     │
  │     총 4회, 1,200kcal 소모  │
  │     (W-1 데이터 연동)       │
  │                             │
  │  💧 피부: 수분 +3% 개선     │
  │     (S-1 데이터 연동)       │
  │                             │
  │  📏 체형: 체중 -0.5kg       │
  │     (C-1 데이터 연동)       │
  │                             │
  │  💡 AI 인사이트:            │
  │  "식단과 운동의 균형이 좋아요!│
  │   단백질 섭취를 조금 더     │
  │   늘리면 근육 유지에 도움!"  │
  │                             │
  │  다음 주 추천:              │
  │  "단백질 +10g/일 목표"      │
  └─────────────────────────────┘
```

---

## 4. Hook Model 설계

### 4.1 Trigger (계기)
```yaml
외부 트리거 (푸시 알림):

  식사 시간 알림:
    시간: 사용자 설정 (기본 12:00, 18:00)
    메시지: "점심 시간이에요! 오늘 뭐 드셨나요? 🍽️"
    빈도: 매일 설정 시간
    
  기록 리마인더:
    조건: 오늘 기록 0개 + 오후 3시
    메시지: "오늘 식사 기록이 없어요! 간단히 기록해볼까요?"
    
  칼로리 현황:
    조건: 저녁 6시 + 남은 칼로리 많음
    메시지: "오늘 남은 칼로리 800kcal! 저녁 추천 확인하기"
    
  목표 달성:
    조건: 일일 목표 칼로리 달성
    메시지: "대단해요! 오늘 목표 칼로리 달성 🎉"
    
  수분 섭취 알림:
    시간: 2-3시간 간격
    메시지: "물 마실 시간이에요! 💧"
    조건: 수분 목표 미달 시
    
  주간 리포트:
    시간: 일요일 20:00
    메시지: "이번 주 식단 리포트가 도착했어요! 📊"
    
  Streak 유지:
    조건: 6일 연속 기록
    메시지: "내일이면 7일 연속! 프리미엄 인사이트가 기다려요"

내부 트리거 (감정/상황):

  식사 전:
    감정: "오늘 뭐 먹지?"
    대응: 앱 메인에 "추천 식단" 바로가기
    
  식사 후:
    감정: "이거 칼로리 얼마지?"
    대응: 카메라 버튼 바로가기 (1탭)
    
  배고픔:
    감정: "간식 먹어도 될까?"
    대응: "남은 칼로리" 표시 + 간식 추천
    
  다이어트 중:
    감정: "오늘 너무 많이 먹었나?"
    대응: 일일 칼로리 현황 + 운동 추천
    
  쇼핑:
    감정: "이 음식 영양소가 어떨까?"
    대응: 바코드 스캔 기능
```

### 4.2 Action (행동)
```yaml
설계 원칙:
  ❌ 나쁜 예: 음식마다 수동 검색 + 영양소 입력
  ✅ 좋은 예: 사진 1장 → AI 자동 분석 → 확인만

진입 장벽 최소화:
  입력 시간: 30초 이내
    - 사진 촬영: 3초
    - AI 분석 대기: 2-3초
    - 확인/수정: 5초
    - 저장: 1탭

메인 Action:
  1. 사진 기록: 카메라 버튼 → 촬영 → 자동 분석 → 저장
  2. 빠른 추가: 자주 먹는 음식에서 1탭 추가
  3. 수분 추가: 물 버튼 → +250mL 1탭
  4. 검색 추가: 음식명 검색 → 선택 → 저장

화면 구성:
  ┌─────────────────────────────┐
  │  [📷]  [🔍]  [📊]  [💧]    │
  │  사진   검색  바코드  수분   │
  └─────────────────────────────┘
  
  * 가장 큰 버튼: 📷 사진 촬영
```

### 4.3 Reward (보상)
```yaml
고정 보상:
  - 음식 인식 결과 (음식명, 칼로리)
  - 영양소 분석 (탄단지)
  - 음식 신호등 (초록/노랑/빨강)
  - 일일 칼로리 현황

가변 보상 (Variable Reward):

  1. AI 영양 인사이트:
     출현: 식사 기록 후 / 하루 마무리
     빈도: 매일 1-3개 (다른 메시지)
     내용:
       - "오늘 단백질 섭취 충분해요! 근육 유지에 좋아요 💪"
       - "이번 주 채소 섭취 +30%! 피부에도 좋은 영향 🌿"
       - "저녁 식사 시간이 일정해지고 있어요! 👍"
     로직: 기록 패턴 분석 → 관련 인사이트 선택
     
  2. 또래/전체 비교:
     출현: 주간 리포트
     빈도: 주 1회
     내용:
       - "같은 목표 유저 중 상위 25%"
       - "평균보다 채소 섭취 +40%"
       - "같은 연령대 중 식단 균형 TOP 20%"
     로직: 익명화된 집계 데이터 기반
     
  3. 목표 달성 축하:
     출현: 일일/주간 목표 달성 시
     내용:
       - "🎉 오늘 칼로리 목표 달성!"
       - "이번 주 5일 연속 목표 달성!"
       - "한 달간 -3kg 달성! 대단해요!"
     
  4. 예상 효과:
     출현: 월간 리포트 / 목표 설정 시
     내용: "이 식단 유지 시 4주 후 예상: 체중 -2kg"
     로직: 현재 칼로리 패턴 + 목표 기반 시뮬레이션
     
  5. 크로스 모듈 인사이트:
     출현: 다른 모듈 데이터와 연결될 때
     내용:
       - "수분 섭취↑ + 피부 수분↑ 연관성 발견!"
       - "고단백 식단 + 운동 = 근육량↑ 시너지!"
       - "채소 섭취↑ + 피부 트러블↓ 패턴 발견!"
     
  6. 변화 추적:
     출현: 주간 리포트
     내용: "지난주 대비 칼로리 -15%! 목표에 가까워지고 있어요"
```

### 4.4 Investment (투자)
```yaml
데이터 축적:
  - 모든 식단 기록 자동 저장
  - 7가지 영양 지표 누적
  - 변화 그래프 생성
  
  메시지:
    "이 기록은 당신만의 식단 히스토리입니다.
     3개월 후 놀라운 변화를 확인하세요!"

Streak 시스템:
  진행도 표시:
    [✅][✅][✅][✅][✅][✅][⬜] 6/7
    "내일이면 7일 연속! 프리미엄 인사이트 획득"
    
  보상:
    3일: 응원 메시지 + 배지
    7일: 프리미엄 인사이트 리포트
    14일: 상세 영양 분석 리포트
    30일: 특별 배지 + 프리미엄 1주일

개인화 학습:
  - 자주 먹는 음식 자동 학습
  - 선호 식단 패턴 분석
  - AI 추천 정확도 향상

다음 모듈 유도:
  식단 기록 후:
    "피부도 신경 쓰세요! [피부 분석 받기]"
    
  칼로리 초과 시:
    "운동으로 균형 맞추기! [운동 추천 받기]"
    
  월간:
    "체중 변화 확인해볼까요? [체형 재분석]"
    
  전환율 목표: 40%

레시피 저장:
  - 자주 먹는 음식 저장
  - 나만의 식단 세트 구성
  - 빠른 기록 활용
```

---

## 5. UI/UX 명세

### 5.1 메인 대시보드
```yaml
메인 화면 구성:

상단 - 오늘의 칼로리 요약:
  ┌─────────────────────────────┐
  │  🍽️ 오늘의 식단             │
  │                             │
  │     [원형 진행률 차트]       │
  │        1,200               │
  │       / 1,800 kcal         │
  │         (67%)              │
  │                             │
  │  남은 칼로리: 600 kcal      │
  │  탄: 45g 단: 30g 지: 20g   │
  └─────────────────────────────┘

중단 - 식사별 기록:
  ┌─────────────────────────────┐
  │  🌅 아침  320 kcal         │
  │  ├─ 계란후라이 150kcal      │
  │  └─ 밥 반공기 170kcal       │
  │                             │
  │  🌞 점심  [+ 기록하기]      │
  │                             │
  │  🌙 저녁  [+ 기록하기]      │
  │                             │
  │  🍎 간식  [+ 기록하기]      │
  └─────────────────────────────┘

하단 - 빠른 버튼:
  ┌─────────────────────────────┐
  │  [📷 사진]  [🔍 검색]       │
  │  [📊 바코드] [💧 물 +250mL] │
  └─────────────────────────────┘

플로팅 버튼:
  [📷] - 사진 촬영 (가장 큰 버튼)
```

### 5.2 온보딩 화면
```yaml
온보딩 Step 1 - 목표:
  ┌─────────────────────────────┐
  │  어떤 목표를 가지고 계세요?  │
  │                             │
  │  [🔥 체중 감량]             │
  │  [⚖️ 체중 유지]             │
  │  [💪 근육 증가]             │
  │  [✨ 피부 개선]             │
  │  [❤️ 건강 관리]             │
  │                             │
  │         [다음] →            │
  └─────────────────────────────┘

온보딩 Step 3 - 식습관:
  ┌─────────────────────────────┐
  │  평소 어떤 식사를 선호하세요? │
  │                             │
  │  [🍚 한식 위주]             │
  │     밥, 국, 반찬 구성       │
  │                             │
  │  [🥗 샐러드/가벼운 식사]    │
  │     저탄고단 식단           │
  │                             │
  │  [🍝 양식/파스타/빵]        │
  │     서양식 위주             │
  │                             │
  │  [🥡 배달/외식 많이]        │
  │     외식 위주               │
  │                             │
  │         [다음] →            │
  └─────────────────────────────┘

온보딩 Step 4 - 요리 스킬:
  ┌─────────────────────────────┐
  │  요리는 어느 정도 하시나요?  │
  │                             │
  │  [🔥 요리 고수]             │
  │     복잡한 요리도 OK        │
  │                             │
  │  [🍳 중급]                  │
  │     15-30분 요리 가능       │
  │                             │
  │  [🥄 초급]                  │
  │     간단한 조리만           │
  │                             │
  │  [🚫 요리 안 함]            │
  │     완제품/배달만           │
  │                             │
  │         [다음] →            │
  └─────────────────────────────┘
```

### 5.3 음식 사진 분석 화면
```yaml
카메라 촬영:
  ┌─────────────────────────────┐
  │                             │
  │     [카메라 뷰파인더]        │
  │                             │
  │     💡 음식이 잘 보이게     │
  │        촬영해주세요         │
  │                             │
  │  [갤러리]    [◉ 촬영]       │
  └─────────────────────────────┘

AI 분석 중:
  ┌─────────────────────────────┐
  │                             │
  │     [촬영된 사진]            │
  │                             │
  │     🔄 AI가 음식을          │
  │        분석하고 있어요...   │
  │                             │
  │     [취소]                  │
  └─────────────────────────────┘

분석 결과:
  ┌─────────────────────────────┐
  │     [촬영된 사진]            │
  │                             │
  │  🍜 인식 결과               │
  │                             │
  │  김치찌개 (1인분)           │
  │  🟢 380 kcal               │
  │                             │
  │  탄수화물: 25g              │
  │  단백질: 20g                │
  │  지방: 22g                  │
  │                             │
  │  📊 신뢰도: 높음            │
  │                             │
  │  양 조절:                   │
  │  [0.5] [1] [1.5] [2]       │
  │                             │
  │  [✏️ 수정] [✅ 저장]        │
  └─────────────────────────────┘

인식 수정:
  ┌─────────────────────────────┐
  │  음식 수정                  │
  │                             │
  │  [검색창: 음식명 입력]      │
  │                             │
  │  인식된 음식:               │
  │  ✓ 김치찌개                 │
  │                             │
  │  비슷한 음식:               │
  │  ○ 된장찌개                 │
  │  ○ 순두부찌개               │
  │  ○ 부대찌개                 │
  │                             │
  │  [확인]                     │
  └─────────────────────────────┘
```

### 5.4 영양 대시보드
```yaml
상세 영양 분석:
  ┌─────────────────────────────┐
  │  📊 오늘의 영양 분석        │
  │                             │
  │  칼로리                     │
  │  [████████░░] 1,200/1,800  │
  │                 (67%)       │
  │                             │
  │  탄수화물                   │
  │  [██████░░░░] 150g/250g    │
  │                 (60%)       │
  │                             │
  │  단백질                     │
  │  [████░░░░░░] 45g/80g      │
  │                 (56%) ⚠️    │
  │                             │
  │  지방                       │
  │  [████████░░] 40g/50g      │
  │                 (80%)       │
  │                             │
  │  💡 단백질이 부족해요!      │
  │     닭가슴살 100g 추천      │
  └─────────────────────────────┘

음식 신호등 현황:
  ┌─────────────────────────────┐
  │  🚦 오늘의 음식 신호등      │
  │                             │
  │     [파이 차트]             │
  │                             │
  │  🟢 초록: 35% (목표 30%↑)  │
  │  🟡 노랑: 40% (목표 45%↓)  │
  │  🔴 빨강: 25% (목표 25%↓)  │
  │                             │
  │  ✅ 균형 잡힌 식단이에요!   │
  └─────────────────────────────┘

수분 섭취:
  ┌─────────────────────────────┐
  │  💧 수분 섭취               │
  │                             │
  │  [💧💧💧💧💧💧💧💧○○]      │
  │                             │
  │  1,600mL / 2,000mL (80%)   │
  │                             │
  │  [+물 1컵]  [+물 1병]       │
  │  [+커피]   [+직접 입력]     │
  └─────────────────────────────┘
```

### 5.5 주간 리포트
```yaml
주간 리포트 화면:
  ┌─────────────────────────────┐
  │  📊 11/18 ~ 11/24 리포트    │
  │                             │
  │  ── 칼로리 ──               │
  │  평균: 1,650 kcal/일        │
  │  목표 대비: -150 kcal 👍    │
  │  [주간 그래프]              │
  │                             │
  │  ── 영양소 균형 ──          │
  │  탄수화물: 적정 ✅          │
  │  단백질: 부족 ⚠️ (-15g)    │
  │  지방: 적정 ✅              │
  │                             │
  │  ── 음식 신호등 ──          │
  │  🟢 32% 🟡 45% 🔴 23%       │
  │  지난주보다 초록색 +5%! 👍  │
  │                             │
  │  ── 수분 섭취 ──            │
  │  평균: 1,800mL/일           │
  │  목표 달성률: 90% ✅        │
  │                             │
  │  ── AI 인사이트 ──          │
  │  💡 "채소 섭취가 늘었어요!  │
  │      피부에도 좋은 영향!"   │
  │                             │
  │  💡 "단백질을 조금 더       │
  │      섭취하면 좋겠어요"     │
  │                             │
  │  ── 다음 주 목표 ──         │
  │  ✓ 단백질 +15g/일          │
  │  ✓ 물 +200mL/일            │
  │                             │
  │  [공유하기]  [상세 보기]    │
  └─────────────────────────────┘
```

### 5.6 식단 추천 화면
```yaml
오늘의 추천 식단:
  ┌─────────────────────────────┐
  │  🍽️ 오늘의 추천 식단        │
  │                             │
  │  👤 초급 요리 / 가성비      │
  │  🎯 체중 감량 목표          │
  │                             │
  │  ── 아침 (350 kcal) ──      │
  │  그릭요거트 + 블루베리      │
  │  ⏱️ 5분 | 🟢 건강식         │
  │  [레시피 보기]              │
  │                             │
  │  ── 점심 (550 kcal) ──      │
  │  닭가슴살 샐러드            │
  │  ⏱️ 10분 | 🟢 고단백        │
  │  [레시피 보기]              │
  │                             │
  │  ── 저녁 (500 kcal) ──      │
  │  두부 김치찌개 + 밥 반공기  │
  │  ⏱️ 15분 | 🟡 균형식        │
  │  [레시피 보기]              │
  │                             │
  │  ── 간식 (150 kcal) ──      │
  │  삶은 계란 2개              │
  │  ⏱️ 0분 | 🟢 고단백         │
  │                             │
  │  📊 총 1,550 kcal           │
  │  탄: 180g 단: 95g 지: 45g   │
  │                             │
  │  [다른 추천 보기]           │
  └─────────────────────────────┘
```

---

## 6. AI 분석 로직

### 6.1 음식 사진 인식 (Gemini Vision)
```yaml
Gemini API 요청:

모델: gemini-2.5-flash

프롬프트 구조:
  system: |
    당신은 음식 영양 분석 전문가입니다.
    사진에서 음식을 인식하고 영양 정보를 분석합니다.
    
    규칙:
    1. 한국 음식을 우선적으로 인식합니다.
    2. 인식 신뢰도를 표시합니다.
    3. 1인분 기준으로 분석합니다.
    4. 정확한 영양 정보가 불확실하면 범위로 표시합니다.
    
  user: |
    이 음식 사진을 분석해주세요.
    
    출력 형식 (JSON):
    {
      "food_name": "음식명",
      "food_name_en": "Food Name",
      "category": "국/탕/찌개|밥류|면류|반찬|구이|기타",
      "confidence": "high|medium|low",
      "serving_size": "1인분 기준 g",
      "calories": 숫자,
      "carbohydrates": 숫자,
      "protein": 숫자,
      "fat": 숫자,
      "sodium": 숫자,
      "sugar": 숫자,
      "food_signal": "green|yellow|red",
      "alternatives": ["비슷한 음식1", "비슷한 음식2"]
    }

응답 예시:
  {
    "food_name": "김치찌개",
    "food_name_en": "Kimchi Stew",
    "category": "국/탕/찌개",
    "confidence": "high",
    "serving_size": "300g",
    "calories": 380,
    "carbohydrates": 25,
    "protein": 20,
    "fat": 22,
    "sodium": 1200,
    "sugar": 3,
    "food_signal": "yellow",
    "alternatives": ["된장찌개", "순두부찌개", "부대찌개"]
  }
```

### 6.2 일일 칼로리 계산
```yaml
기초대사량 (BMR) 계산:

데이터 출처: ⭐
  - 성별: users.gender
  - 나이: users.birth_date에서 계산
  - 키: body_analyses.height (최신) 또는 N-1 온보딩 입력
  - 몸무게: body_analyses.weight (최신) 또는 nutrition_settings.current_weight

공식 (Harris-Benedict):
  남성: BMR = 88.362 + (13.397 × 체중kg) + (4.799 × 키cm) - (5.677 × 나이)
  여성: BMR = 447.593 + (9.247 × 체중kg) + (3.098 × 키cm) - (4.330 × 나이)

활동 대사량 (TDEE) 계산:

활동 계수 (nutrition_settings.activity_level): ⭐
  - sedentary (거의 활동 없음): BMR × 1.2
  - light (가벼운 활동, 주 1-3회): BMR × 1.375
  - moderate (보통 활동, 주 3-5회): BMR × 1.55
  - active (활동적, 주 6-7회): BMR × 1.725
  - very_active (매우 활동적): BMR × 1.9

목표 칼로리 계산:

목표별 조정:
  - 체중 감량: TDEE - 500kcal (주 0.5kg 감량)
  - 체중 유지: TDEE
  - 근육 증가: TDEE + 300kcal

예시:
  입력:
    - 성별: 여성
    - 나이: 25세
    - 키: 165cm
    - 체중: 60kg
    - 활동: 보통 (주 3-5회)
    - 목표: 체중 감량
  
  계산:
    - BMR = 447.593 + (9.247 × 60) + (3.098 × 165) - (4.330 × 25)
    - BMR = 1,402 kcal
    - TDEE = 1,402 × 1.55 = 2,173 kcal
    - 목표 칼로리 = 2,173 - 500 = 1,673 kcal/일
```

### 6.3 영양소 목표 계산
```yaml
목표별 영양소 비율:

체중 감량:
  - 탄수화물: 40%
  - 단백질: 35%
  - 지방: 25%
  
체중 유지:
  - 탄수화물: 50%
  - 단백질: 25%
  - 지방: 25%

근육 증가:
  - 탄수화물: 45%
  - 단백질: 35%
  - 지방: 20%

계산 예시 (체중 감량, 1,673kcal):
  - 탄수화물: 1,673 × 0.40 ÷ 4 = 167g
  - 단백질: 1,673 × 0.35 ÷ 4 = 146g
  - 지방: 1,673 × 0.25 ÷ 9 = 46g
```

### 6.4 AI 인사이트 생성
```yaml
인사이트 트리거 및 내용:

1. 영양소 과부족:
   조건: 단백질 < 목표의 70%
   메시지: "오늘 단백질이 부족해요! 닭가슴살 100g 추천 🍗"
   
   조건: 탄수화물 > 목표의 120%
   메시지: "탄수화물 섭취가 많아요. 다음 끼니는 가볍게! 🥗"

2. 음식 신호등 균형:
   조건: 빨강 > 40%
   메시지: "오늘 고칼로리 음식이 많았어요. 내일은 초록색 위주로! 🟢"
   
   조건: 초록 > 40%
   메시지: "건강한 식단이에요! 이 습관 유지하세요 💚"

3. 패턴 분석:
   조건: 3일 연속 단백질 부족
   메시지: "최근 3일간 단백질이 부족해요. 근육 유지를 위해 신경 써주세요!"
   
   조건: 주간 채소 섭취 증가
   메시지: "이번 주 채소 섭취 +30%! 피부에도 좋은 영향 🌿"

4. 크로스 모듈 연동:
   조건: S-1 피부 수분↓ + 수분 섭취↓
   메시지: "수분 섭취와 피부 수분이 함께 낮아요! 물 마시기 챌린지 시작해볼까요? 💧"
   
   조건: W-1 고강도 운동 + 단백질↓
   메시지: "오늘 고강도 운동했어요! 회복을 위해 단백질 보충 추천 💪"

5. 목표 달성:
   조건: 일일 목표 칼로리 달성
   메시지: "🎉 오늘 목표 칼로리 달성! 내일도 화이팅!"
   
   조건: 7일 연속 기록
   메시지: "7일 연속 기록 달성! 프리미엄 인사이트 리포트를 확인하세요! 🏆"
```

### 6.5 AI 서비스 설정
```yaml
Gemini 2.5 Flash:
  용도:
    - 음식 사진 인식
    - 영양 정보 추정
    - AI 인사이트 생성
    - 식단 추천
  
  선택 이유:
    - 음식 인식은 상대적으로 단순한 작업
    - 비용 효율적
    - 빠른 응답 속도
  
  프롬프트 토큰 예상:
    - System: ~200 tokens
    - User (이미지 포함): ~1,000 tokens
    - Output: ~300 tokens
    - 총: ~1,500 tokens/분석
  
  비용 예상 (Gemini 2.5 Flash):
    - Input: $0.075/1M tokens
    - Output: $0.30/1M tokens
    - 분석당: ~$0.0002 (약 ₩0.26)
    - 월 10,000건: ~$2 (약 ₩2,600)

모델 전환 계획:
  Phase 2+:
    - Gemini 3 Pro로 업그레이드 고려
    - 복잡한 영양 분석 정확도 향상
    - 멀티모달 성능 강화
    - 비용 증가: ~10배 (분석당 ~₩3)
```

---

## 7. Database 스키마

### 7.1 설계 원칙
```yaml
FK 참조 방식:
  - user_id UUID: users(id) 참조 (CASCADE 삭제)
  - clerk_user_id TEXT: 검색/인덱스용 별도 저장
  - 기존 모듈(PC-1, S-1, C-1, W-1)과 동일 패턴

RLS 정책:
  - 모든 사용자 테이블에 RLS 적용
  - auth.uid() 기반 접근 제어
  - W-1과 동일한 보안 수준

크로스 모듈 데이터 참조:
  users 테이블 (확장 필요):
    - gender: 성별 (BMR 계산용)
    - birth_date: 생년월일 (나이 계산용)
    → DB 스키마 v2.5에서 추가 예정
  
  body_analyses 테이블 (C-1, 확장 필요):
    - height: 키 (BMR 계산용)
    - weight: 몸무게 (BMR 계산용, 최신값 사용)
    → DB 스키마 v2.5에서 추가 예정
  
  BMR/TDEE 계산 데이터 흐름:
    성별, 나이 ← users 테이블
    키, 몸무게 ← body_analyses 테이블 (최신 분석)
    활동 수준 ← nutrition_settings.activity_level
```

### 7.2 테이블 구조
```sql
-- =====================================================
-- N-1 영양/식단 분석 모듈 데이터베이스 스키마
-- =====================================================

-- 사용자 영양 설정
CREATE TABLE nutrition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,  -- 검색용
  
  -- 목표
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'maintain', 'muscle_gain', 'skin', 'health')),
  current_weight DECIMAL(5,2),  -- N-1 온보딩에서 입력 (C-1 없을 때)
  target_weight DECIMAL(5,2),
  target_weeks INTEGER,
  
  -- 활동 수준 (TDEE 계산용) ⭐ 필수
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  -- sedentary: 거의 활동 없음 (×1.2)
  -- light: 가벼운 활동, 주 1-3회 (×1.375)
  -- moderate: 보통 활동, 주 3-5회 (×1.55)
  -- active: 활동적, 주 6-7회 (×1.725)
  -- very_active: 매우 활동적 (×1.9)
  
  -- 일일 목표 (자동 계산 또는 직접 입력)
  daily_calories INTEGER,
  daily_carbs INTEGER,
  daily_protein INTEGER,
  daily_fat INTEGER,
  daily_water INTEGER DEFAULT 2000,
  
  -- 개인 설정
  food_preference TEXT CHECK (food_preference IN ('korean', 'salad', 'western', 'delivery', 'mixed')),
  cooking_skill TEXT CHECK (cooking_skill IN ('expert', 'intermediate', 'beginner', 'none')),
  budget_preference TEXT CHECK (budget_preference IN ('budget', 'normal', 'premium', 'any')),
  meal_count INTEGER DEFAULT 3,
  
  -- 알레르기/기피
  allergies TEXT[] DEFAULT '{}',
  dislikes TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  
  -- 간헐적 단식
  fasting_enabled BOOLEAN DEFAULT FALSE,
  fasting_type TEXT CHECK (fasting_type IN ('16:8', '18:6', '20:4', 'custom')),
  fasting_start_time TIME,
  eating_window_hours INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)  -- 사용자당 1개 설정
);

-- 음식 데이터베이스 (공용)
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT CHECK (category IN ('soup', 'rice', 'noodle', 'side', 'grill', 'salad', 'bread', 'snack', 'beverage', 'other')),
  brand TEXT,  -- 프랜차이즈/브랜드명 (null이면 일반 음식)
  barcode TEXT UNIQUE,
  
  -- 영양 정보 (100g 기준)
  serving_size INTEGER DEFAULT 100,
  calories INTEGER NOT NULL,
  carbohydrates DECIMAL(5,1),
  protein DECIMAL(5,1),
  fat DECIMAL(5,1),
  sodium INTEGER,
  sugar DECIMAL(5,1),
  fiber DECIMAL(5,1),
  
  -- 분류
  food_signal TEXT CHECK (food_signal IN ('green', 'yellow', 'red')),
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식단 기록
CREATE TABLE meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,  -- 검색용
  
  -- 식사 정보
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_time TIME,
  
  -- 기록 방식
  record_type TEXT NOT NULL CHECK (record_type IN ('photo', 'search', 'barcode', 'manual')),
  photo_url TEXT,
  
  -- AI 인식 결과
  ai_recognized_food TEXT,
  ai_confidence TEXT CHECK (ai_confidence IN ('high', 'medium', 'low')),
  ai_raw_response JSONB,  -- Gemini 원본 응답 저장
  user_confirmed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식단 기록 상세 (음식별)
CREATE TABLE meal_record_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_record_id UUID NOT NULL REFERENCES meal_records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- RLS용
  
  -- 음식 정보
  food_id UUID REFERENCES foods(id),
  custom_food_name TEXT,  -- 직접 입력 시
  
  -- 섭취량
  serving_multiplier DECIMAL(3,1) DEFAULT 1.0 CHECK (serving_multiplier > 0),
  
  -- 계산된 영양 정보
  calories INTEGER,
  carbohydrates DECIMAL(5,1),
  protein DECIMAL(5,1),
  fat DECIMAL(5,1),
  sodium INTEGER,
  sugar DECIMAL(5,1),
  
  -- 신호등
  food_signal TEXT CHECK (food_signal IN ('green', 'yellow', 'red')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수분 섭취 기록
CREATE TABLE water_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,  -- 검색용
  
  record_date DATE NOT NULL,
  record_time TIME NOT NULL,
  
  drink_type TEXT DEFAULT 'water' CHECK (drink_type IN ('water', 'tea', 'coffee', 'juice', 'soda', 'other')),
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  
  -- 수분 흡수율 (음료 종류별)
  hydration_factor DECIMAL(3,2) DEFAULT 1.0,  -- 물=1.0, 커피=0.8 등
  effective_ml INTEGER,  -- amount_ml * hydration_factor
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일일 요약
CREATE TABLE daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,  -- 검색용
  summary_date DATE NOT NULL,
  
  -- 총합
  total_calories INTEGER DEFAULT 0,
  total_carbs DECIMAL(5,1) DEFAULT 0,
  total_protein DECIMAL(5,1) DEFAULT 0,
  total_fat DECIMAL(5,1) DEFAULT 0,
  total_sodium INTEGER DEFAULT 0,
  total_sugar DECIMAL(5,1) DEFAULT 0,
  total_water INTEGER DEFAULT 0,
  
  -- 신호등 비율
  green_ratio INTEGER DEFAULT 0 CHECK (green_ratio >= 0 AND green_ratio <= 100),
  yellow_ratio INTEGER DEFAULT 0 CHECK (yellow_ratio >= 0 AND yellow_ratio <= 100),
  red_ratio INTEGER DEFAULT 0 CHECK (red_ratio >= 0 AND red_ratio <= 100),
  
  -- 목표 달성률
  calorie_achievement INTEGER DEFAULT 0,
  protein_achievement INTEGER DEFAULT 0,
  water_achievement INTEGER DEFAULT 0,
  
  -- 식사 횟수
  meal_count INTEGER DEFAULT 0,
  
  -- 기록 연속일
  streak_days INTEGER DEFAULT 0,
  
  -- AI 인사이트 (당일)
  ai_insights JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, summary_date)
);

-- 자주 먹는 음식
CREATE TABLE favorite_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,  -- 검색용
  
  food_id UUID REFERENCES foods(id),
  custom_name TEXT,  -- 사용자 지정 이름
  category TEXT CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'any')),
  
  -- 기본 섭취량
  default_serving DECIMAL(3,1) DEFAULT 1.0,
  
  -- 사용 통계
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, food_id)  -- 중복 방지
);

-- 간헐적 단식 기록
CREATE TABLE fasting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,  -- 검색용
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  target_hours INTEGER NOT NULL,
  actual_hours DECIMAL(4,1),
  
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- 메모
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 영양 Streak 테이블 (W-1 패턴)
CREATE TABLE nutrition_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Streak 정보
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_record_date DATE,
  
  -- 배지/보상
  badges_earned JSONB DEFAULT '[]',
  -- ["3day", "7day", "14day", "30day", "100day"]
  
  premium_rewards_claimed JSONB DEFAULT '[]',
  -- [{ type: "7day_insight", claimed_at: "2025-01-01" }]
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================

-- nutrition_settings
CREATE INDEX idx_nutrition_settings_user ON nutrition_settings(user_id);
CREATE INDEX idx_nutrition_settings_clerk ON nutrition_settings(clerk_user_id);

-- foods (공용)
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_brand ON foods(brand) WHERE brand IS NOT NULL;

-- meal_records
CREATE INDEX idx_meal_records_user ON meal_records(user_id);
CREATE INDEX idx_meal_records_user_date ON meal_records(user_id, meal_date);
CREATE INDEX idx_meal_records_clerk_date ON meal_records(clerk_user_id, meal_date);

-- meal_record_items
CREATE INDEX idx_meal_record_items_record ON meal_record_items(meal_record_id);
CREATE INDEX idx_meal_record_items_user ON meal_record_items(user_id);
CREATE INDEX idx_meal_record_items_food ON meal_record_items(food_id);

-- water_records
CREATE INDEX idx_water_records_user ON water_records(user_id);
CREATE INDEX idx_water_records_user_date ON water_records(user_id, record_date);

-- daily_nutrition_summary
CREATE INDEX idx_daily_summary_user ON daily_nutrition_summary(user_id);
CREATE INDEX idx_daily_summary_user_date ON daily_nutrition_summary(user_id, summary_date);

-- favorite_foods
CREATE INDEX idx_favorite_foods_user ON favorite_foods(user_id);
CREATE INDEX idx_favorite_foods_use_count ON favorite_foods(user_id, use_count DESC);

-- fasting_records
CREATE INDEX idx_fasting_records_user ON fasting_records(user_id);
CREATE INDEX idx_fasting_records_start ON fasting_records(user_id, start_time DESC);

-- nutrition_streaks
CREATE INDEX idx_nutrition_streaks_user ON nutrition_streaks(user_id);

-- =====================================================
-- updated_at 자동 업데이트 트리거
-- =====================================================

-- 트리거 함수 (기존 DB에 있으면 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_nutrition_settings_updated_at
  BEFORE UPDATE ON nutrition_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at
  BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_records_updated_at
  BEFORE UPDATE ON meal_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_nutrition_summary_updated_at
  BEFORE UPDATE ON daily_nutrition_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_streaks_updated_at
  BEFORE UPDATE ON nutrition_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7.3 RLS 정책 (W-1 패턴)
```sql
-- =====================================================
-- RLS 정책 (Row Level Security)
-- W-1과 동일한 auth.uid() 패턴 적용
-- =====================================================

-- nutrition_settings RLS
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own nutrition_settings"
  ON nutrition_settings FOR ALL
  USING (user_id = auth.uid());

-- meal_records RLS
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own meal_records"
  ON meal_records FOR ALL
  USING (user_id = auth.uid());

-- meal_record_items RLS
ALTER TABLE meal_record_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own meal_record_items"
  ON meal_record_items FOR ALL
  USING (user_id = auth.uid());

-- water_records RLS
ALTER TABLE water_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own water_records"
  ON water_records FOR ALL
  USING (user_id = auth.uid());

-- daily_nutrition_summary RLS
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own daily_nutrition_summary"
  ON daily_nutrition_summary FOR ALL
  USING (user_id = auth.uid());

-- favorite_foods RLS
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own favorite_foods"
  ON favorite_foods FOR ALL
  USING (user_id = auth.uid());

-- fasting_records RLS
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own fasting_records"
  ON fasting_records FOR ALL
  USING (user_id = auth.uid());

-- nutrition_streaks RLS
ALTER TABLE nutrition_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own nutrition_streaks"
  ON nutrition_streaks FOR ALL
  USING (user_id = auth.uid());

-- foods는 모든 사용자가 읽기 가능 (공용 DB)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read foods"
  ON foods FOR SELECT
  USING (true);

-- 관리자만 foods 수정 가능 (추후 admin 역할 추가 시)
-- CREATE POLICY "Admins can modify foods"
--   ON foods FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');
```

### 7.4 테이블 코멘트
```sql
-- =====================================================
-- 테이블 및 컬럼 코멘트
-- =====================================================

COMMENT ON TABLE nutrition_settings IS 'N-1 사용자 영양 설정 (목표, 선호도, 알레르기)';
COMMENT ON TABLE foods IS 'N-1 음식 마스터 DB (공용, 영양 정보)';
COMMENT ON TABLE meal_records IS 'N-1 식단 기록 (식사별)';
COMMENT ON TABLE meal_record_items IS 'N-1 식단 기록 상세 (음식별)';
COMMENT ON TABLE water_records IS 'N-1 수분 섭취 기록';
COMMENT ON TABLE daily_nutrition_summary IS 'N-1 일일 영양 요약';
COMMENT ON TABLE favorite_foods IS 'N-1 자주 먹는 음식';
COMMENT ON TABLE fasting_records IS 'N-1 간헐적 단식 기록';
COMMENT ON TABLE nutrition_streaks IS 'N-1 연속 기록 Streak';

COMMENT ON COLUMN nutrition_settings.user_id IS 'users(id) FK - CASCADE 삭제';
COMMENT ON COLUMN nutrition_settings.clerk_user_id IS 'Clerk ID - 검색/인덱스용';
COMMENT ON COLUMN meal_records.ai_raw_response IS 'Gemini Vision 원본 응답 (디버깅용)';
COMMENT ON COLUMN water_records.hydration_factor IS '수분 흡수율 (물=1.0, 커피=0.8, 주스=0.7)';
COMMENT ON COLUMN daily_nutrition_summary.ai_insights IS '당일 AI 인사이트 배열';
```

---

## 8. API 명세

### 8.1 엔드포인트 목록
```yaml
영양 설정:
  POST /api/nutrition/settings - 설정 생성/업데이트
  GET /api/nutrition/settings - 설정 조회

식단 기록:
  POST /api/nutrition/meals - 식단 기록 생성
  GET /api/nutrition/meals?date=YYYY-MM-DD - 일일 식단 조회
  PUT /api/nutrition/meals/:id - 식단 수정
  DELETE /api/nutrition/meals/:id - 식단 삭제

음식 검색:
  GET /api/nutrition/foods/search?q=검색어 - 음식 검색
  GET /api/nutrition/foods/barcode/:code - 바코드 조회
  POST /api/nutrition/foods/analyze - AI 음식 분석

수분 기록:
  POST /api/nutrition/water - 수분 기록 추가
  GET /api/nutrition/water?date=YYYY-MM-DD - 일일 수분 조회

요약/리포트:
  GET /api/nutrition/summary/daily?date=YYYY-MM-DD - 일일 요약
  GET /api/nutrition/summary/weekly?start=YYYY-MM-DD - 주간 요약
  GET /api/nutrition/insights - AI 인사이트

추천:
  GET /api/nutrition/recommend/daily - 오늘의 추천 식단
  GET /api/nutrition/recommend/remaining - 남은 칼로리 추천
  POST /api/nutrition/recommend/ingredient - 재료 기반 추천

자주 먹는 음식:
  GET /api/nutrition/favorites - 자주 먹는 음식 목록
  POST /api/nutrition/favorites - 추가
  DELETE /api/nutrition/favorites/:id - 삭제
```

### 8.2 주요 API 상세
```yaml
POST /api/nutrition/foods/analyze:
  description: AI 음식 사진 분석
  
  request:
    headers:
      Content-Type: multipart/form-data
      Authorization: Bearer {token}
    body:
      image: File (required)
  
  response:
    success:
      status: 200
      body:
        food_name: "김치찌개"
        food_name_en: "Kimchi Stew"
        confidence: "high"
        calories: 380
        carbohydrates: 25
        protein: 20
        fat: 22
        sodium: 1200
        food_signal: "yellow"
        alternatives: ["된장찌개", "순두부찌개"]
    
    error:
      status: 400
      body:
        error: "음식을 인식할 수 없습니다"

POST /api/nutrition/meals:
  description: 식단 기록 생성
  
  request:
    headers:
      Content-Type: application/json
      Authorization: Bearer {token}
    body:
      meal_date: "2025-11-27"
      meal_type: "lunch"
      meal_time: "12:30"
      record_type: "photo"
      photo_url: "https://..."
      items:
        - food_id: "uuid"
          serving_multiplier: 1.0
        - custom_food_name: "집밥 된장찌개"
          calories: 200
          carbohydrates: 15
          protein: 10
          fat: 12
          serving_multiplier: 1.0
  
  response:
    success:
      status: 201
      body:
        id: "uuid"
        meal_date: "2025-11-27"
        total_calories: 380
        message: "식단이 기록되었습니다"

GET /api/nutrition/summary/daily:
  description: 일일 영양 요약
  
  request:
    query:
      date: "2025-11-27"
  
  response:
    success:
      status: 200
      body:
        date: "2025-11-27"
        target:
          calories: 1800
          carbs: 250
          protein: 80
          fat: 50
          water: 2000
        consumed:
          calories: 1200
          carbs: 150
          protein: 45
          fat: 40
          water: 1500
        achievement:
          calories_percent: 67
          carbs_percent: 60
          protein_percent: 56
          fat_percent: 80
          water_percent: 75
        signal_ratio:
          green: 35
          yellow: 40
          red: 25
        meals:
          - meal_type: "breakfast"
            calories: 350
            items: [...]
          - meal_type: "lunch"
            calories: 550
            items: [...]
        insights:
          - "단백질이 부족해요! 저녁에 닭가슴살 추천"
          - "수분 섭취를 조금 더 늘려보세요"
```

---

## 9. 기술 고려사항

### 9.1 음식 DB 구축 전략
```yaml
Phase 1 - 기본 DB (MVP):
  한식 기본:
    - 국/탕/찌개: 50종
    - 밥류: 30종
    - 면류: 30종
    - 반찬: 100종
    - 구이류: 30종
  
  프랜차이즈:
    - 패스트푸드: 100종
    - 카페: 50종
    - 치킨/피자: 50종
  
  편의점:
    - 도시락: 100종
    - 간식: 50종
  
  총: 약 600종

Phase 2 - 확장:
  외식 메뉴:
    - 배달앱 인기 메뉴: 200종
    - 한식 프랜차이즈: 100종
  
  바코드 DB:
    - 한국 식품 바코드: 1,000종
  
  총: 약 1,300종 추가

데이터 소스:
  - 식품의약품안전처 영양성분 DB
  - 프랜차이즈 공식 영양정보
  - 사용자 기여 데이터 (검수 후 반영)
```

### 9.2 AI 분석 비용 최적화
```yaml
Gemini API 비용 관리:

캐싱 전략:
  - 동일 음식 사진 → 캐시 결과 반환
  - 인기 음식 → 사전 분석 결과 저장

요청 최적화:
  - 이미지 압축 (1MB 이하)
  - 배치 처리 (여러 음식 한 번에)

Free Tier 활용:
  - Basic 사용자: 일 3회 AI 분석
  - Premium 사용자: 무제한

Fallback:
  - AI 실패 시 → 텍스트 검색으로 유도
  - 신뢰도 낮음 시 → 사용자 확인 요청
```

### 9.3 오프라인 지원
```yaml
오프라인 기능:

캐시 저장:
  - 최근 검색 음식 100개
  - 자주 먹는 음식 전체
  - 바코드 스캔 결과

오프라인 기록:
  - 로컬에 임시 저장
  - 온라인 복귀 시 동기화

제한 기능:
  - AI 사진 분석: 온라인 필수
  - 음식 검색: 캐시된 데이터만
  - 수분 기록: 오프라인 가능
```

---

## 10. 테스트 케이스

### 10.1 기능 테스트
```yaml
온보딩:
  TC-N1-001: 목표 선택 후 다음 단계 이동
  TC-N1-002: 기본 정보(성별/나이/키/체중/활동수준) 입력 시 BMR/TDEE 자동 계산
  TC-N1-002-1: C-1 데이터 있을 때 키/체중 자동 불러오기
  TC-N1-002-2: C-1 데이터 없을 때 직접 입력 모드 전환
  TC-N1-002-3: 활동 수준 선택 시 TDEE 재계산
  TC-N1-003: 알레르기 복수 선택 가능
  TC-N1-004: 온보딩 완료 후 설정 저장 (activity_level NOT NULL 검증)

사진 분석:
  TC-N1-010: 음식 사진 촬영 후 AI 분석
  TC-N1-011: 갤러리에서 사진 선택 분석
  TC-N1-012: 인식 실패 시 대안 제시
  TC-N1-013: 인식 결과 수정 가능

식단 기록:
  TC-N1-020: 텍스트 검색으로 음식 추가
  TC-N1-021: 바코드 스캔으로 음식 추가
  TC-N1-022: 양 조절 (0.5, 1, 1.5, 2인분)
  TC-N1-023: 기록 삭제 가능

수분 기록:
  TC-N1-030: 물 빠른 추가 버튼
  TC-N1-031: 음료 종류별 기록
  TC-N1-032: 일일 수분 합계 계산

영양 분석:
  TC-N1-040: 일일 칼로리 합계 정확
  TC-N1-041: 영양소 (탄단지) 합계 정확
  TC-N1-042: 음식 신호등 비율 계산
  TC-N1-043: 목표 대비 달성률 표시

추천:
  TC-N1-050: 개인 설정 반영 추천
  TC-N1-051: 남은 칼로리 기반 추천
  TC-N1-052: 크로스 모듈 연동 추천
```

### 10.2 크로스 모듈 테스트
```yaml
S-1 연동:
  TC-N1-060: 피부 수분↓ 시 수분 섭취 추천
  TC-N1-061: 피부 분석 페이지 연결

C-1 연동:
  TC-N1-070: 체중 데이터 자동 불러오기
  TC-N1-071: 체형 재분석 유도

W-1 연동:
  TC-N1-080: 운동 칼로리 소모 반영
  TC-N1-081: 운동 전후 식단 추천
```

---

## 11. 성공 지표 (KPI)

### 11.1 정확도 지표
```yaml
음식 인식:
  - AI 인식 정확도: 80% 이상
  - 재인식 요청률: < 20%
  - 사용자 수정률: < 25%

칼로리 추정:
  - 추정 정확도: ±15% 이내
  - 사용자 만족도: 85% 이상
```

### 11.2 사용자 지표
```yaml
Engagement:
  - DAU/MAU: 40% 이상
  - 일평균 식단 기록률: 2.5회/일
  - 수분 기록률: 60%
  - 평균 세션 시간: 5분

Retention:
  - D1: 60%
  - D7: 40%
  - D30: 30%
  - D90: 20%

Streak:
  - 3일 연속 달성률: 45%
  - 7일 연속 달성률: 25%
  - 30일 연속 달성률: 8%
```

### 11.3 비즈니스 지표
```yaml
Conversion:
  - 무료 → 프리미엄 전환율: 12%
  - AI 사진 분석 사용률: 60%
  - 추천 식단 클릭률: 35%
  - ARPU: 월 6,000원

Cross-Module:
  - N-1 → S-1 전환율: 20%
  - N-1 → W-1 전환율: 30%
  - N-1 + W-1 동시 사용률: 25%
```

---

## 12. 리스크 관리

### 12.1 기술적 리스크
```yaml
음식 인식 오류:
  리스크: AI가 음식을 잘못 인식
  영향도: 중
  대응:
    - 사용자 수정 기능 제공
    - 대안 음식 제시 (상위 3개)
    - 피드백 수집 → 모델 개선

칼로리 추정 부정확:
  리스크: 실제와 큰 차이
  영향도: 중
  대응:
    - 범위로 표시 (350-420kcal)
    - 공인 DB 우선 사용
    - "추정치입니다" 면책 문구

데이터 손실:
  리스크: 식단 기록 유실
  영향도: 상
  대응:
    - 실시간 동기화
    - 로컬 임시 저장
    - 일일 백업
```

### 12.2 사업적 리스크
```yaml
경쟁사 대응:
  리스크: 눔/다노 유사 기능 강화
  영향도: 중
  대응:
    - 크로스 모듈 시너지 (S-1, C-1, W-1)
    - 퍼스널 컬러 연동 차별화
    - 한국 음식 특화

사용자 이탈:
  리스크: 기록 피로감으로 이탈
  영향도: 상
  대응:
    - AI 사진 인식으로 간편화
    - 자주 먹는 음식 즐겨찾기
    - Streak/배지 게이미피케이션
    - 푸시 알림 최적화
```

### 12.3 법적 리스크
```yaml
건강 조언:
  리스크: 의료 행위로 간주
  영향도: 상
  대응:
    - "영양 정보는 참고용" 면책 조항
    - "전문가 상담 권장" 문구
    - 의료 용어 사용 자제
    - 특정 질병 치료 언급 금지

개인정보:
  리스크: 체중/식단 기록 유출
  영향도: 상
  대응:
    - 암호화 저장 (AES-256)
    - 선택적 삭제 기능
    - GDPR/개인정보보호법 준수

음식 DB 저작권:
  리스크: 영양 정보 무단 사용
  영향도: 중
  대응:
    - 공공 데이터 우선 (식약처)
    - 자체 DB 구축
    - 출처 명시
```

---

## 13. 구현 로드맵

### 13.1 Sprint 구조 (3주)
```yaml
Sprint 1 (Week 1): 기반 구축
  Day 1-2: 환경 설정, DB 테이블 생성
  Day 3-4: 온보딩 UI 구현
  Day 5: 영양 설정 API
  
Sprint 2 (Week 2): 핵심 기능
  Day 1-2: 음식 사진 분석 (Gemini)
  Day 3-4: 식단 기록 CRUD
  Day 5: 수분 기록 기능
  
Sprint 3 (Week 3): 분석/추천
  Day 1-2: 일일 요약/리포트
  Day 3: AI 인사이트
  Day 4: 크로스 모듈 연동
  Day 5: QA/버그 수정
```

### 13.2 의존성
```yaml
선행 작업:
  - DB 스키마 v2.5 (users/body_analyses 확장)
  - Gemini API 설정 완료
  - 기본 음식 DB (500종)

병렬 가능:
  - 음식 DB 확장 (크라우드소싱)
  - UI 디자인 작업

후행 작업:
  - 바코드 스캔 연동
  - 간헐적 단식 상세 기능
  - 프리미엄 기능 (상세 리포트)
```

### 13.3 마일스톤
```yaml
Week 1 완료:
  - [ ] DB 테이블 생성 완료
  - [ ] 온보딩 플로우 동작
  - [ ] BMR/TDEE 계산 동작

Week 2 완료:
  - [ ] 음식 사진 → AI 분석 동작
  - [ ] 식단 기록 저장/조회 동작
  - [ ] 수분 기록 동작

Week 3 완료:
  - [ ] 일일 요약 페이지 동작
  - [ ] AI 인사이트 표시
  - [ ] W-1 연동 (운동 칼로리 반영)
  - [ ] 베타 테스트 준비 완료
```

---

## 14. TypeScript 코드 예시

### 14.1 BMR/TDEE 계산 함수
```typescript
// lib/nutrition/calculateCalories.ts

interface UserProfile {
  gender: 'male' | 'female';
  birthDate: Date;
  height: number;  // cm
  weight: number;  // kg
}

interface NutritionGoal {
  goalType: 'weight_loss' | 'maintain' | 'muscle_gain' | 'skin' | 'health';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

const GOAL_ADJUSTMENTS = {
  weight_loss: -500,
  maintain: 0,
  muscle_gain: 300,
  skin: 0,
  health: 0,
} as const;

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMR(profile: UserProfile): number {
  const age = calculateAge(profile.birthDate);
  
  if (profile.gender === 'male') {
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * age);
  }
}

export function calculateTDEE(bmr: number, activityLevel: NutritionGoal['activityLevel']): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateDailyCalories(
  profile: UserProfile,
  goal: NutritionGoal
): {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: { carbs: number; protein: number; fat: number };
} {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, goal.activityLevel);
  const targetCalories = Math.round(tdee + GOAL_ADJUSTMENTS[goal.goalType]);
  
  // 목표별 매크로 비율
  const macroRatios = {
    weight_loss: { carbs: 0.40, protein: 0.35, fat: 0.25 },
    maintain: { carbs: 0.50, protein: 0.25, fat: 0.25 },
    muscle_gain: { carbs: 0.45, protein: 0.35, fat: 0.20 },
    skin: { carbs: 0.50, protein: 0.25, fat: 0.25 },
    health: { carbs: 0.50, protein: 0.25, fat: 0.25 },
  }[goal.goalType];
  
  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    macros: {
      carbs: Math.round((targetCalories * macroRatios.carbs) / 4),
      protein: Math.round((targetCalories * macroRatios.protein) / 4),
      fat: Math.round((targetCalories * macroRatios.fat) / 9),
    },
  };
}
```

### 14.2 음식 분석 API Route
```typescript
// app/api/nutrition/foods/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const FOOD_ANALYSIS_PROMPT = `당신은 음식 영양 분석 전문가입니다.
사진에서 음식을 인식하고 영양 정보를 분석합니다.

규칙:
1. 한국 음식을 우선적으로 인식합니다.
2. 인식 신뢰도를 표시합니다.
3. 1인분 기준으로 분석합니다.
4. 정확한 영양 정보가 불확실하면 범위로 표시합니다.

출력 형식 (JSON만 출력):
{
  "food_name": "음식명",
  "food_name_en": "Food Name",
  "category": "국/탕/찌개|밥류|면류|반찬|구이|기타",
  "confidence": "high|medium|low",
  "serving_size": 1인분 기준 g (숫자),
  "calories": 숫자,
  "carbohydrates": 숫자,
  "protein": 숫자,
  "fat": 숫자,
  "sodium": 숫자,
  "sugar": 숫자,
  "food_signal": "green|yellow|red",
  "alternatives": ["비슷한 음식1", "비슷한 음식2"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
    }

    // 이미지를 base64로 변환
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type;

    // Gemini API 호출
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent([
      FOOD_ANALYSIS_PROMPT,
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    
    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '음식을 인식할 수 없습니다' }, { status: 400 });
    }
    
    const foodData = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(foodData);
  } catch (error) {
    console.error('Food analysis error:', error);
    return NextResponse.json(
      { error: '음식 분석 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

### 14.3 타입 정의
```typescript
// types/nutrition.ts

export interface NutritionSettings {
  id: string;
  userId: string;
  clerkUserId: string;
  goalType: 'weight_loss' | 'maintain' | 'muscle_gain' | 'skin' | 'health';
  currentWeight?: number;
  targetWeight?: number;
  targetWeeks?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalories?: number;
  dailyCarbs?: number;
  dailyProtein?: number;
  dailyFat?: number;
  dailyWater: number;
  foodPreference?: 'korean' | 'salad' | 'western' | 'delivery' | 'mixed';
  cookingSkill?: 'expert' | 'intermediate' | 'beginner' | 'none';
  budgetPreference?: 'budget' | 'normal' | 'premium' | 'any';
  mealCount: number;
  allergies: string[];
  dislikes: string[];
  dietaryRestrictions: string[];
  fastingEnabled: boolean;
  fastingType?: '16:8' | '18:6' | '20:4' | 'custom';
  fastingStartTime?: string;
  eatingWindowHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Food {
  id: string;
  name: string;
  nameEn?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  calories: number;
  carbohydrates?: number;
  protein?: number;
  fat?: number;
  sodium?: number;
  sugar?: number;
  fiber?: number;
  foodSignal?: 'green' | 'yellow' | 'red';
  isVerified: boolean;
}

export interface MealRecord {
  id: string;
  userId: string;
  mealDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealTime?: string;
  recordType: 'photo' | 'search' | 'barcode' | 'manual';
  photoUrl?: string;
  aiRecognizedFood?: string;
  aiConfidence?: 'high' | 'medium' | 'low';
  userConfirmed: boolean;
  items: MealRecordItem[];
  createdAt: string;
}

export interface MealRecordItem {
  id: string;
  mealRecordId: string;
  foodId?: string;
  customFoodName?: string;
  servingMultiplier: number;
  calories?: number;
  carbohydrates?: number;
  protein?: number;
  fat?: number;
  sodium?: number;
  sugar?: number;
  foodSignal?: 'green' | 'yellow' | 'red';
}

export interface DailyNutritionSummary {
  id: string;
  userId: string;
  summaryDate: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  totalSodium: number;
  totalSugar: number;
  totalWater: number;
  greenRatio: number;
  yellowRatio: number;
  redRatio: number;
  calorieAchievement: number;
  proteinAchievement: number;
  waterAchievement: number;
  mealCount: number;
  streakDays: number;
  aiInsights: string[];
}

// ⭐ 추가된 타입 정의 (v1.0.3)

export interface WaterRecord {
  id: string;
  userId: string;
  clerkUserId: string;
  recordDate: string;
  recordTime: string;
  drinkType: 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'other';
  amountMl: number;
  hydrationFactor: number;  // 물=1.0, 커피=0.8 등
  effectiveMl: number;      // amountMl * hydrationFactor
  createdAt: string;
}

export interface FavoriteFood {
  id: string;
  userId: string;
  clerkUserId: string;
  foodId?: string;
  customName?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
  defaultServing: number;
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

export interface FastingRecord {
  id: string;
  userId: string;
  clerkUserId: string;
  startTime: string;
  endTime?: string;
  targetHours: number;
  actualHours?: number;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export interface NutritionStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastRecordDate?: string;
  badgesEarned: string[];       // ["3day", "7day", "14day", "30day", "100day"]
  premiumRewardsClaimed: {
    type: string;
    claimedAt: string;
  }[];
  updatedAt: string;
}

export type FoodSignal = 'green' | 'yellow' | 'red';

export interface FoodSignalCriteria {
  signal: FoodSignal;
  caloriesPerServing: { min: number; max: number };
  description: string;
}

export const FOOD_SIGNAL_CRITERIA: FoodSignalCriteria[] = [
  {
    signal: 'green',
    caloriesPerServing: { min: 0, max: 150 },
    description: '저칼로리, 자유롭게 섭취 가능',
  },
  {
    signal: 'yellow',
    caloriesPerServing: { min: 151, max: 400 },
    description: '중간 칼로리, 적당히 섭취',
  },
  {
    signal: 'red',
    caloriesPerServing: { min: 401, max: Infinity },
    description: '고칼로리, 주의해서 섭취',
  },
];
```

---

## 15. 버전 관리

### 15.1 변경 이력
```yaml
v1.0.3 (2025-11-27): ⭐ 현재 버전
  변경 사항:
    - 온보딩 Step 2 전면 확장
      - C-1 데이터 확인 로직 추가 (있으면 자동 불러오기, 없으면 직접 입력)
      - 성별, 생년월일, 키 입력 항목 추가 (BMR 계산 필수)
      - 활동 수준 선택 UI 추가 (TDEE 계산 필수)
      - W-1 연동 활동 수준 자동 추천 로직 추가
      - 칼로리 계산 결과 UI 표시 추가
    - TypeScript 타입 정의 4개 추가
      - WaterRecord: 수분 섭취 기록
      - FavoriteFood: 자주 먹는 음식
      - FastingRecord: 간헐적 단식 기록
      - NutritionStreak: 영양 Streak 정보
    - 테스트 케이스 보완
      - TC-N1-002 수정: 기본 정보 입력 시 BMR/TDEE 자동 계산
      - TC-N1-002-1~3 추가: C-1 연동 및 활동 수준 테스트
  
  수정 근거:
    - BMR 계산에 성별/나이/키/활동수준 필수 → 온보딩에서 입력 필요
    - activity_level NOT NULL 제약조건 → UI에서 필수 입력 보장
    - W-1과의 일관성: C-1 미완료 시 폴백 처리 패턴 적용

v1.0.2 (2025-11-27):
  변경 사항:
    - nutrition_settings에 activity_level 필드 추가
    - 설계 원칙 확장 (크로스 모듈 데이터 참조)
    - BMR/TDEE 계산 데이터 출처 명시
    - AI 서비스 설정 섹션 추가 (비용 추정)
    - 성공 지표(KPI) 섹션 추가
    - 리스크 관리 섹션 추가
    - 구현 로드맵 섹션 추가
    - TypeScript 코드 예시 추가
    - W-1 기능 스펙과 동일 수준으로 완성도 향상
  
  의존성 추가:
    - users 테이블 확장 필요: gender, birth_date
    - body_analyses 테이블 확장 필요: height, weight
    → DB 스키마 v2.5에서 반영 예정

v1.0.1 (2025-11-27):
  변경 사항:
    - DB 스키마 전면 수정
    - FK 참조 방식 변경: clerk_user_id → user_id UUID
    - RLS 정책 W-1 패턴 적용: auth.uid() 기반
    - 누락 테이블 RLS 추가 (8개 테이블 모두 커버)
    - nutrition_streaks 테이블 추가 (W-1 패턴)
    - 인덱스 대폭 추가 (15개 → 25개+)
    - updated_at 트리거 추가
    - CHECK 제약조건 추가 (데이터 무결성)
    - 테이블 코멘트 추가
  
  결정 근거:
    - 보안 우선: RLS 적용으로 데이터 격리 강화
    - 일관성: 기존 모듈(PC-1, S-1, C-1, W-1)과 동일 패턴
    - CASCADE 삭제: user 삭제 시 관련 데이터 자동 정리

v1.0 (2025-11-27):
  - 초기 문서 작성
  - 기능 명세 완료
  - UI/UX 명세 완료
  - DB 스키마 설계
  - API 명세 작성
  
  주요 결정사항:
    - PC-1 연동: 제외 (관련성 없음)
    - 개인화 설정: 온보딩에서 선호도/스킬/예산 선택
    - 음식 신호등: 눔 방식 적용
    - 크로스 모듈: S-1/C-1/W-1 연동
```

### 15.2 다음 버전 계획
```yaml
v1.1 예정:
  - UI 와이어프레임 추가
  - AI 프롬프트 상세화
  - 음식 DB 초기 데이터 목록
  - Hook Model 검증

v1.2 예정:
  - Sprint Backlog 연동
  - 개발 일정 확정
  - QA 시나리오 상세화
```

---

## 📎 부록

### A. 음식 신호등 상세 분류표
```yaml
🟢 초록색 (칼로리 밀도 < 1):
  채소:
    - 시금치, 양배추, 브로콜리, 오이, 토마토
    - 당근, 피망, 양파, 버섯, 콩나물
  과일:
    - 사과, 배, 귤, 딸기, 블루베리
    - 수박, 참외, 멜론, 자몽
  단백질:
    - 달걀흰자, 두부, 닭가슴살(껍질X)
    - 흰살생선, 새우, 조개류
  유제품:
    - 무지방 우유, 무지방 요거트
  기타:
    - 곤약, 한천, 미역, 다시마

🟡 노란색 (칼로리 밀도 1~2.5):
  곡물:
    - 현미밥, 잡곡밥, 통밀빵
    - 오트밀, 고구마, 감자
  단백질:
    - 닭가슴살, 저지방 소고기, 돼지 안심
    - 연어, 고등어, 달걀
  유제품:
    - 저지방 우유, 저지방 치즈
    - 그릭요거트
  기타:
    - 두부, 콩류, 견과류(소량)

🔴 빨간색 (칼로리 밀도 > 2.5):
  정제 탄수화물:
    - 흰쌀밥, 흰빵, 파스타
    - 라면, 과자, 케이크
  고지방 단백질:
    - 삼겹살, 갈비, 소시지
    - 튀긴 치킨, 햄버거 패티
  유제품:
    - 일반 치즈, 버터, 크림
    - 아이스크림
  기름/소스:
    - 마요네즈, 드레싱
    - 튀김 기름
  간식:
    - 초콜릿, 사탕, 과자
    - 탄산음료, 주스
```

### B. 프랜차이즈 메뉴 예시 (MVP)
```yaml
맥도날드:
  - 빅맥: 550kcal, 탄45g 단26g 지30g, 🔴
  - 맥너겟 6조각: 270kcal, 탄16g 단13g 지16g, 🔴
  - 에그맥머핀: 290kcal, 탄29g 단17g 지12g, 🟡
  - 시저 샐러드: 120kcal, 탄8g 단8g 지6g, 🟢

스타벅스:
  - 아메리카노: 5kcal, 🟢
  - 카페라떼: 180kcal, 🟡
  - 카라멜마키아또: 250kcal, 🟡
  - 치킨 샌드위치: 380kcal, 🟡

편의점 (CU):
  - 백종원 도시락: 650kcal, 🟡
  - 불닭볶음면 도시락: 750kcal, 🔴
  - 닭가슴살 샐러드: 180kcal, 🟢
  - 삼각김밥: 180kcal, 🟡
```

---

**문서 끝**

*이 문서는 N-1 영양/식단 분석 모듈의 기능 명세입니다.*
*Sprint Backlog 작성 전 최종 검토 필요.*
