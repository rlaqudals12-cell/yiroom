# 📅 Phase 2 전체 로드맵 v1.0
## W-1 운동/피트니스 + N-1 영양/식단 통합 개발 계획

**작성일**: 2025-11-27  
**버전**: v1.0  
**개발자**: 병민  
**개발 도구**: Claude Code (80%) + Cursor (20%)

---

## 1. Phase 2 개요

### 1.1 Phase 1 → Phase 2 전환

```yaml
Phase 1 (완료):
  모듈:
    - PC-1: 퍼스널 컬러 진단
    - S-1: AI 피부 분석
    - C-1: AI 체형 분석
  기간: 8-10주
  상태: 개발 완료 예정

Phase 2 (예정):
  모듈:
    - W-1: AI 운동/피트니스 추천
    - N-1: AI 영양/식단 분석
  기간: 7주 (순차 진행) 또는 5주 (병렬 진행)
  상태: 기획 완료, 개발 대기
```

### 1.2 Phase 2 목표

```yaml
핵심 가치:
  - "Total Wellness" 완성: 피부 + 체형 + 운동 + 영양
  - 크로스 모듈 시너지 극대화
  - 사용자 일일 루틴 완성

비즈니스 목표:
  - DAU 증가: 운동/식단 기록 → 매일 접속
  - 리텐션 강화: Streak + AI 인사이트
  - 프리미엄 전환: 상세 분석 + 맞춤 추천
```

---

## 2. 모듈별 요약

### 2.1 W-1 운동/피트니스

| 항목 | 내용 |
|------|------|
| **기능 스펙** | W-1-feature-spec-template-v1.1.md |
| **Sprint Backlog** | W-1-sprint-backlog-v1.3.md |
| **기간** | 4주 (8주 기준, 하이브리드) |
| **Task 수** | 91개 |
| **Sprint 구성** | Sprint 1-2 (기본), Sprint 3-4 (고급) |

**핵심 기능**:
- 7단계 온보딩 (체형/목표/고민/빈도/장소/시간/스킬)
- C-1 체형 연동 → 맞춤 운동 추천
- 100개 운동 DB + 체형별 매핑
- Gemini AI 인사이트
- 운동 기록 + Streak 시스템
- 크로스 모듈 연동 (S-1, PC-1, N-1)

### 2.2 N-1 영양/식단

| 항목 | 내용 |
|------|------|
| **기능 스펙** | N-1-feature-spec-template-v1.0.3.md |
| **Sprint Backlog** | N-1-sprint-backlog-v1.2.md |
| **기간** | 3주 |
| **Task 수** | 57개 |
| **Sprint 구성** | Sprint 1-3 |

**핵심 기능**:
- 7단계 온보딩 (목표/기본정보/식습관/요리스킬/예산/알레르기/식사횟수)
- BMR/TDEE 자동 계산 (C-1 연동)
- 음식 사진 AI 분석 (Gemini Vision)
- 음식 신호등 시스템 (눔 방식)
- 수분 섭취 추적
- 간헐적 단식 타이머
- 크로스 모듈 연동 (S-1, C-1, W-1)

---

## 3. 개발 일정 옵션

### 옵션 A: 순차 진행 (권장) ⭐

```
┌─────────────────────────────────────────────────────────────┐
│  Week 1-2: W-1 Sprint 1 (기본 UI/UX)                        │
│  Week 3-4: W-1 Sprint 2 (AI 연동)                           │
│  Week 5-6: W-1 Sprint 3-4 (고급 + 최적화)                   │
│  ─────────────────────────────────────────                  │
│  Week 7-8: N-1 Sprint 1 (온보딩 + DB)                       │
│  Week 9-10: N-1 Sprint 2 (AI 분석 + 기록)                   │
│  Week 11: N-1 Sprint 3 (대시보드 + 연동)                    │
│  Week 12: 버퍼 + QA + 통합 테스트                           │
└─────────────────────────────────────────────────────────────┘

총 기간: 12주 (3개월)
장점: 집중 개발, 안정적 진행, 학습 곡선 완만
단점: 기간 길어짐
```

### 옵션 B: 압축 순차 진행

```
┌─────────────────────────────────────────────────────────────┐
│  Week 1-2: W-1 Sprint 1-2 (기본 + AI)                       │
│  Week 3-4: W-1 Sprint 3-4 (고급 + 최적화)                   │
│  ─────────────────────────────────────────                  │
│  Week 5: N-1 Sprint 1 (온보딩 + DB)                         │
│  Week 6: N-1 Sprint 2 (AI 분석 + 기록)                      │
│  Week 7: N-1 Sprint 3 (대시보드 + 연동)                     │
└─────────────────────────────────────────────────────────────┘

총 기간: 7주 (약 2개월)
장점: 빠른 출시
단점: 높은 강도, 버퍼 없음
```

### 옵션 C: 병렬 진행 (고급)

```
┌─────────────────────────────────────────────────────────────┐
│  Week 1: W-1 Sprint 1 Day 1-3 + N-1 Sprint 1 Day 1-2       │
│  Week 2: W-1 Sprint 1 Day 4-5 + N-1 Sprint 1 Day 3-5       │
│  Week 3: W-1 Sprint 2 + N-1 Sprint 2 (교차)                │
│  Week 4: W-1 Sprint 3 + N-1 Sprint 2 (계속)                │
│  Week 5: W-1 Sprint 4 + N-1 Sprint 3                       │
└─────────────────────────────────────────────────────────────┘

총 기간: 5주
장점: 가장 빠름
단점: 컨텍스트 스위칭 비용, 혼란 가능성
```

---

## 4. 권장 일정: 옵션 A (순차 진행)

### 4.1 W-1 개발 (Week 1-6)

| Week | Sprint | 목표 | Task 수 | 핵심 산출물 |
|------|--------|------|---------|------------|
| 1-2 | Sprint 1 | 기본 UI/UX | 31개 | 온보딩 7단계, 결과 화면 |
| 3-4 | Sprint 2 | AI 연동 | 23개 | Gemini 연동, AI 인사이트 |
| 5 | Sprint 3 | 운동 기록 | 21개 | 기록 CRUD, Streak |
| 6 | Sprint 4 | 최적화 | 16개 | 쇼핑 연동, QA |

**W-1 마일스톤**:
- Week 2 말: 온보딩 → 결과 화면 데모 가능
- Week 4 말: AI 추천 동작 확인
- Week 6 말: W-1 MVP 완성

### 4.2 N-1 개발 (Week 7-11)

| Week | Sprint | 목표 | Task 수 | 핵심 산출물 |
|------|--------|------|---------|------------|
| 7-8 | Sprint 1 | 온보딩 + DB | 20개 | 온보딩 7단계, BMR 계산 |
| 9 | Sprint 2 | AI 분석 | 24개 | 음식 AI 분석, 기록 CRUD |
| 10 | Sprint 2 (계속) | 기록 완성 | - | 수분, 즐겨찾기, 단식 |
| 11 | Sprint 3 | 대시보드 | 13개 | 일일 요약, 크로스 연동 |

**N-1 마일스톤**:
- Week 8 말: 온보딩 → BMR 계산 데모 가능
- Week 10 말: 음식 사진 → AI 분석 동작
- Week 11 말: N-1 MVP 완성

### 4.3 통합 + QA (Week 12)

```yaml
Week 12 목표:
  - W-1 ↔ N-1 크로스 연동 테스트
  - 칼로리 밸런스 (섭취 - 소모) 동작 확인
  - 전체 플로우 QA
  - 버그 수정
  - 성능 최적화
```

---

## 5. 크로스 모듈 연동 맵

### 5.1 데이터 흐름

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  PC-1   │────▶│  S-1    │     │  C-1    │────▶│  W-1    │
│ 퍼스널   │     │ 피부    │     │ 체형    │     │ 운동    │
│ 컬러    │     │ 분석    │     │ 분석    │     │ 추천    │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     │               │               │               │
     ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                        N-1 영양/식단                     │
│                                                         │
│  PC-1: 색상 기반 추천 X (연동 없음)                      │
│  S-1: 피부 수분 → 수분 섭취 권장                         │
│  C-1: 키/체중 → BMR/TDEE 계산                           │
│  W-1: 운동 칼로리 → 순 칼로리 계산                       │
└─────────────────────────────────────────────────────────┘
```

### 5.2 연동 우선순위

| 우선순위 | 연동 | 내용 | 구현 시점 |
|---------|------|------|----------|
| 🔴 필수 | C-1 → W-1 | 체형 기반 운동 추천 | W-1 Sprint 1 |
| 🔴 필수 | C-1 → N-1 | 키/체중 → BMR 계산 | N-1 Sprint 1 |
| 🟡 권장 | W-1 → N-1 | 운동 칼로리 → 순 칼로리 | N-1 Sprint 3 |
| 🟡 권장 | S-1 → N-1 | 피부 수분 → 수분 권장 | N-1 Sprint 3 |
| 🟢 선택 | N-1 → W-1 | 칼로리 초과 → 운동 유도 | Later |
| 🟢 선택 | W-1 → N-1 | 운동 후 식단 추천 | Later |

---

## 6. 기술적 고려사항

### 6.1 공유 인프라

```yaml
공유 DB 테이블:
  - users: 모든 모듈 공통
  - personal_color_analyses: PC-1
  - skin_analyses: S-1
  - body_analyses: C-1
  - workout_*: W-1 전용 (7개)
  - nutrition_*: N-1 전용 (8개)

공유 컴포넌트:
  - UI 컴포넌트: Button, Card, Input
  - 공통 레이아웃: Header, Navigation
  - 차트 컴포넌트: ProgressCircle, BarChart

공유 유틸:
  - lib/supabase.ts
  - lib/gemini.ts (확장)
  - lib/utils.ts
```

### 6.2 Gemini API 확장

```yaml
현재 (Phase 1):
  - 피부 이미지 분석
  - 체형 이미지 분석
  - 퍼스널 컬러 분석

Phase 2 추가:
  - W-1: AI 운동 인사이트 (텍스트 기반)
  - N-1: 음식 이미지 분석 (Vision)

프롬프트 파일:
  - lib/ai/prompts/skinAnalysis.ts (기존)
  - lib/ai/prompts/bodyAnalysis.ts (기존)
  - lib/ai/prompts/workoutInsight.ts (W-1 추가)
  - lib/ai/prompts/foodAnalysis.ts (N-1 추가)
  - lib/ai/prompts/nutritionInsight.ts (N-1 추가)
```

### 6.3 DB 스키마 확장

```yaml
Phase 1 테이블: 기존 유지
  - users
  - personal_color_analyses
  - skin_analyses
  - body_analyses

Phase 2 W-1 테이블 (7개):
  - workout_types
  - exercises
  - exercise_body_type_mappings
  - workout_inputs
  - workout_results
  - workout_logs
  - workout_streaks

Phase 2 N-1 테이블 (8개):
  - nutrition_settings
  - foods
  - meal_records
  - meal_record_items
  - water_records
  - daily_nutrition_summary
  - favorite_foods
  - fasting_records
  - nutrition_streaks

DB 스키마 버전: v2.5 → v3.0
```

---

## 7. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| W-1 개발 지연 | 중 | 중 | Sprint 3-4 압축 가능 |
| N-1 개발 지연 | 중 | 중 | 간헐적 단식 Later로 이동 가능 |
| Gemini API 비용 초과 | 낮 | 중 | 일일 호출 제한 설정 |
| 크로스 연동 버그 | 중 | 중 | Week 12 버퍼 활용 |
| 데이터 마이그레이션 | 낮 | 낮 | 신규 테이블만 추가 |

---

## 8. 산출물 체크리스트

### Phase 2 기획 문서 (완료)

| 문서 | 상태 | 파일명 |
|------|------|--------|
| W-1 기능 스펙 | ✅ v1.1 | W-1-feature-spec-template-v1.1.md |
| W-1 Sprint Backlog | ✅ v1.3 | W-1-sprint-backlog-v1.3.md |
| N-1 기능 스펙 | ✅ v1.0.3 | N-1-feature-spec-template-v1.0.3.md |
| N-1 Sprint Backlog | ✅ v1.2 | N-1-sprint-backlog-v1.2.md |
| Phase 2 로드맵 | ✅ v1.0 | Phase-2-로드맵-v1.0.md (본 문서) |

### Phase 2 개발 산출물 (예정)

```yaml
W-1 산출물:
  Sprint 1: 공통 컴포넌트 4개, 온보딩 화면 7개, 결과 화면 1개
  Sprint 2: AI 연동 3개, 인사이트 컴포넌트 4개, API 5개
  Sprint 3: 기록 시스템 8개, Streak 2개, 테스트 1개
  Sprint 4: 쇼핑 연동 4개, 최적화 3개

N-1 산출물:
  Sprint 1: 환경 설정 2개, DB 3개, 온보딩 8개, API 1개, 타입 1개
  Sprint 2: DB 6개, AI 2개, API 6개, 컴포넌트 8개, 테스트 1개
  Sprint 3: 로직 3개, API 2개, 화면 1개, 컴포넌트 6개, 테스트 1개
```

---

## 9. 다음 단계

### 즉시 실행

1. ✅ Phase 2 로드맵 작성 (본 문서)
2. ⬜ N-1 문서 정리 (yiroom-final-docs/N-1/)
3. ⬜ yiroom-final-docs 최종 구조 확인

### 개발 시작 전

4. ⬜ Claude Code에서 W-1 Sprint 1 시작
5. ⬜ 기존 코드베이스 구조 확인 (Plan 모드)
6. ⬜ C-1 연동 검토

---

## 10. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-11-27 | 초안 작성: Phase 2 전체 로드맵 |

---

**문서 버전**: v1.0  
**최종 수정일**: 2025-11-27  
**관련 문서**: W-1-sprint-backlog-v1.3.md, N-1-sprint-backlog-v1.2.md
