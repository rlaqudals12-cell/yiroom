# Phase 2 구현 계획서

**작성일**: 2025-11-28
**상태**: Plan Mode 분석 완료

---

## 1. Phase 2 문서 분석 요약

### 1.1 전체 규모

| 항목 | 내용 |
|------|------|
| **총 Task** | 150개 (W-1: 91개, N-1: 59개) |
| **복잡도 분포** | 🟢 87개 / 🟡 53개 / 🔴 10개 |
| **예상 기간** | 7~12주 (옵션에 따라) |

### 1.2 준비된 문서

| 문서 | 상태 | 내용 |
|------|------|------|
| W-1 Feature Spec | ✅ 완료 | 70KB, 매우 상세 |
| W-1 Sprint Backlog | ✅ v1.4 | 91개 Task, 테스트 포함 |
| N-1 Feature Spec | ✅ v1.0.3 | 88KB, 매우 상세 |
| N-1 Sprint Backlog | ✅ v1.3 | 59개 Task |
| Phase 2 로드맵 | ✅ v1.0 | 일정 옵션 3가지 |
| DB 스키마 v2.5 | ✅ 완료 | 마이그레이션 가이드 |
| 경쟁사 분석 | ✅ 완료 | 차별화 전략 |

---

## 2. W-1 운동/피트니스 모듈

### 2.1 핵심 기능

```yaml
온보딩 (7단계):
  1. C-1 데이터 확인 (체형)
  2. 운동 목표 선택 (다이어트/근력/토닝 등)
  3. 신체 고민 선택 (뱃살/허벅지/팔뚝 등)
  4. 운동 빈도 (주 2-3회 / 4-5회 / 매일)
  5. 운동 장소 (집/헬스장)
  6. 목표 설정 (체중/기한)
  7. 부상/통증 확인

운동 타입 (5가지):
  - 토너 (Toner): 탄탄한 몸매
  - 빌더 (Builder): 근육 증가
  - 버너 (Burner): 체지방 감소
  - 무버 (Mover): 체력 증진
  - 플렉서 (Flexer): 유연성

결과 화면:
  - 운동 타입 카드 + 희소성
  - 주간 운동 플랜
  - 오늘의 추천 운동 (3-5개)
  - PC 연동 운동복 추천
  - 연예인 루틴

운동 기록:
  - 운동 완료 체크
  - Streak 시스템
  - 7가지 지표 추적
```

### 2.2 Sprint 구성 (91개 Task)

| Sprint | 기간 | Task | 목표 |
|--------|------|------|------|
| Sprint 1 | Week 1-2 | 31개 | 기본 UI/UX, 온보딩 7단계 |
| Sprint 2 | Week 3-4 | 23개 | AI 연동, Gemini 인사이트 |
| Sprint 3 | Week 5-6 | 21개 | 운동 기록, Streak |
| Sprint 4 | Week 7-8 | 16개 | 쇼핑 연동, 최적화 |

### 2.3 핵심 차별화

1. **C-1 체형 기반 맞춤 운동** (유일)
2. **PC-1 퍼스널컬러 연동 운동복 추천** (유일)
3. **크로스 모듈 통합 웰니스** (유일)

---

## 3. N-1 영양/식단 모듈

### 3.1 핵심 기능

```yaml
온보딩 (7단계):
  1. 식사 목표 (감량/유지/증량/피부/건강)
  2. 기본 정보 (성별/나이/키/체중/활동수준) → BMR/TDEE 계산
  3. 선호 식습관 (한식/샐러드/양식 등)
  4. 요리 스킬 (고수/중급/초급/안함)
  5. 식재료 예산
  6. 알레르기/기피 음식
  7. 하루 식사 횟수

식단 기록 (4가지):
  1. 📷 음식 사진 AI 분석 (Gemini Vision)
  2. 🔍 텍스트 검색
  3. 📊 바코드 스캔 (Later)
  4. ✏️ 직접 입력

음식 신호등 (눔 방식):
  - 🟢 초록: 칼로리 밀도 1 미만 (채소, 과일)
  - 🟡 노랑: 칼로리 밀도 1-2.5 (곡물, 고기)
  - 🔴 빨강: 칼로리 밀도 2.5+ (튀김, 과자)

추가 기능:
  - 수분 섭취 트래킹
  - 간헐적 단식 타이머
  - 일일 영양 요약 대시보드
```

### 3.2 Sprint 구성 (59개 Task)

| Sprint | 기간 | Task | 목표 |
|--------|------|------|------|
| Sprint 1 | Week 1-2 | 20개 | 온보딩, DB 스키마, BMR 계산 |
| Sprint 2 | Week 3-4 | 24개 | AI 음식 분석, 기록 CRUD |
| Sprint 3 | Week 5 | 13개 | 대시보드, 크로스 연동 |

### 3.3 핵심 차별화

1. **사진 한 장으로 끝** - Gemini Vision AI 음식 인식
2. **내 몸 전체를 위한 식단** - S-1/C-1/W-1 크로스 연동
3. **나만의 맞춤 추천** - 선호도/스킬/예산 반영

---

## 4. Database 스키마 변경 (v2.5)

### 4.1 기존 테이블 확장

```sql
-- users 테이블
ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE users ADD COLUMN birth_date DATE;

-- body_analyses 테이블
ALTER TABLE body_analyses ADD COLUMN height DECIMAL(5,1);  -- cm
ALTER TABLE body_analyses ADD COLUMN weight DECIMAL(5,1);  -- kg
```

### 4.2 신규 테이블

```yaml
W-1 테이블 (7개):
  - workout_types
  - exercises
  - exercise_body_type_mappings
  - workout_inputs
  - workout_results
  - workout_logs
  - workout_streaks

N-1 테이블 (8개):
  - nutrition_settings
  - foods
  - meal_records
  - meal_record_items
  - water_records
  - daily_nutrition_summary
  - favorite_foods
  - fasting_records
```

---

## 5. 크로스 모듈 연동

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  PC-1   │────▶│  S-1    │     │  C-1    │────▶│  W-1    │
│ 퍼스널   │     │ 피부    │     │ 체형    │     │ 운동    │
│ 컬러    │     │ 분석    │     │ 분석    │     │ 추천    │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     └───────────────┴───────────────┴───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │      N-1        │
                    │   영양/식단      │
                    └─────────────────┘
```

| 연동 | 내용 | 우선순위 |
|------|------|----------|
| C-1 → W-1 | 체형 기반 운동 추천 | 🔴 필수 |
| C-1 → N-1 | 키/체중 → BMR 계산 | 🔴 필수 |
| W-1 → N-1 | 운동 칼로리 → 순 칼로리 | 🟡 권장 |
| S-1 → N-1 | 피부 수분 → 수분 권장 | 🟡 권장 |

---

## 6. 개발 일정 옵션

### 옵션 A: 순차 진행 (권장) ⭐

```
Week 1-2:  W-1 Sprint 1 (기본 UI/UX)
Week 3-4:  W-1 Sprint 2 (AI 연동)
Week 5-6:  W-1 Sprint 3-4 (기록 + 최적화)
Week 7-8:  N-1 Sprint 1 (온보딩 + DB)
Week 9-10: N-1 Sprint 2 (AI 분석 + 기록)
Week 11:   N-1 Sprint 3 (대시보드 + 연동)
Week 12:   버퍼 + QA + 통합 테스트

총 기간: 12주 (3개월)
장점: 집중 개발, 안정적 진행
```

### 옵션 B: 압축 순차 진행

```
Week 1-2: W-1 Sprint 1-2 (기본 + AI)
Week 3-4: W-1 Sprint 3-4 (기록 + 최적화)
Week 5:   N-1 Sprint 1 (온보딩 + DB)
Week 6:   N-1 Sprint 2 (AI 분석 + 기록)
Week 7:   N-1 Sprint 3 (대시보드 + 연동)

총 기간: 7주 (약 2개월)
장점: 빠른 출시
단점: 높은 강도, 버퍼 없음
```

### 옵션 C: 병렬 진행 (고급)

```
총 기간: 5주
장점: 가장 빠름
단점: 컨텍스트 스위칭 비용, 혼란 가능성
```

---

## 7. 시작 전 필수 작업

### 7.1 기존 코드베이스 분석

```
1. C-1 체형 분석 모듈 구조 확인
   - body_analyses 테이블 스키마
   - /api/body/ API 엔드포인트
   - Zustand store 패턴 (있다면)

2. 기존 컴포넌트 패턴 확인
   - components/ui/ 구조
   - 버튼, 카드 스타일링

3. Supabase 연동 패턴 확인
   - lib/supabase/ 클라이언트
   - RLS 정책 패턴
```

### 7.2 DB 마이그레이션

```
1. users 테이블 확장 (gender, birth_date)
2. body_analyses 테이블 확장 (height, weight)
3. W-1/N-1 신규 테이블 생성
```

---

## 8. 결정 필요 사항

1. **개발 일정**: 옵션 A (12주) / 옵션 B (7주) / 옵션 C (5주)?
2. **시작 모듈**: W-1 먼저 (권장) / N-1 먼저?
3. **C-1 수정**: 기존 C-1에 키/체중 입력 추가 필요 → 기존 사용자 처리 방법?
4. **테스트 전략**: TDD 적용 범위?

---

## 9. 다음 단계

Plan 승인 후:

1. 기존 코드베이스 분석 (C-1 패턴 확인)
2. DB 마이그레이션 실행
3. W-1 Sprint 1 시작 (Task 1.0 ~ 1.14)

---

**문서 버전**: v1.0
**작성자**: Claude Code
**관련 문서**: Phase-2-로드맵-v1.0.md, W-1-sprint-backlog-v1.4.md, N-1-sprint-backlog-v1.3.md
