# Phase H: 기능 확장 로드맵

> **작성일**: 2025-12-23
> **목표**: 사용자 리텐션 강화 + 웰니스 경험 확장
> **전제조건**: Phase F 프로덕션 배포 완료 후

---

## 현재 상태 요약

```
Phase 1-3, A, C-G: 100% 완료
Phase B: 83% (B-6 정식 배포 대기 - 2026/01)
Phase F: 95% (프로덕션 배포 대기)
```

---

## Phase H 후보 기능

### H-1: 소셜 & 커뮤니티

**목표**: 사용자 간 동기부여 + 리텐션 강화

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 챌린지 시스템 | 7일/30일 목표 챌린지 참여 | 높음 |
| 친구 기능 | 친구 추가, 진행 상황 공유 | 중 |
| 리더보드 | 운동/영양 랭킹 (주간/월간) | 중 |
| 커뮤니티 피드 | 성공 스토리, 팁 공유 | 낮음 |

```yaml
챌린지 예시:
  - "7일 연속 운동"
  - "30일 물 8잔 마시기"
  - "일주일 칼로리 목표 달성"
  - "피부 루틴 21일 유지"

보상 시스템:
  - 배지 획득
  - 포인트 적립
  - 특별 콘텐츠 해금
```

---

### H-2: 게이미피케이션

**목표**: 지속적인 참여 유도

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 레벨 시스템 | 활동 기반 레벨업 | 높음 |
| 배지 컬렉션 | 업적 배지 수집 | 높음 |
| 데일리 미션 | 매일 달성 목표 | 중 |
| 포인트 리워드 | 활동 포인트 적립 | 낮음 |

```yaml
레벨 시스템:
  Level 1-10: 비기너 (Beginner)
  Level 11-30: 프랙티셔너 (Practitioner)
  Level 31-50: 엑스퍼트 (Expert)
  Level 51+: 마스터 (Master)

배지 카테고리:
  - 스트릭 배지: 7일, 30일, 100일 연속
  - 운동 배지: 첫 운동, 100회 운동
  - 영양 배지: 첫 기록, 균형 식단
  - 분석 배지: 모든 분석 완료
```

---

### H-3: 통합 웰니스 스코어

**목표**: 전체적인 건강 상태 시각화

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 웰니스 스코어 | 종합 건강 점수 (0-100) | 높음 |
| 영역별 분석 | 운동/영양/피부/체형 개별 점수 | 높음 |
| 트렌드 분석 | 주간/월간 변화 추이 | 중 |
| AI 인사이트 | 개선 포인트 제안 | 중 |

```yaml
웰니스 스코어 구성:
  운동 영역 (25%):
    - 스트릭 유지
    - 운동 빈도
    - 목표 달성률

  영양 영역 (25%):
    - 칼로리 목표 달성
    - 영양소 균형
    - 수분 섭취

  피부 영역 (25%):
    - 피부 상태 점수
    - 루틴 준수
    - 제품 매칭도

  체형 영역 (25%):
    - 목표 체중 진행률
    - 운동과 연동
    - BMI 변화
```

---

### H-4: AI 코칭 강화

**목표**: 개인화된 AI 가이드

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 일일 코칭 메시지 | 맞춤 동기부여 알림 | 높음 |
| 대화형 AI 코치 | RAG 기반 Q&A 확장 | 중 |
| 계획 조정 제안 | 진행 상황 기반 플랜 수정 | 중 |
| 전문가 콘텐츠 | AI 큐레이션 팁/가이드 | 낮음 |

```yaml
AI 코칭 시나리오:
  - 목표 미달 시: "어제 운동을 건너뛰셨네요. 오늘 10분 스트레칭으로 시작해볼까요?"
  - 스트릭 유지 시: "7일 연속 기록 중! 이 페이스 유지하면 이번 달 목표 달성 가능해요."
  - 영양 불균형 시: "단백질 섭취가 부족해요. 점심에 닭가슴살을 추가해보세요."
```

---

### H-5: 라이프스타일 확장

**목표**: 종합 웰니스 플랫폼

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 수면 트래킹 | 수면 시간/품질 기록 | 중 |
| 스트레스 체크 | 간단한 스트레스 측정 | 낮음 |
| 마인드풀니스 | 명상/호흡 가이드 | 낮음 |
| 습관 트래커 | 커스텀 습관 기록 | 낮음 |

```yaml
수면 트래킹:
  - 취침/기상 시간 기록
  - 수면 품질 평가 (1-5)
  - 운동/영양과 연동 분석
  - AI 수면 개선 팁
```

---

## 우선순위 매트릭스

| 기능 | 영향도 | 구현 난이도 | 우선순위 |
|------|--------|-------------|----------|
| **챌린지 시스템** | 높음 | 중 | **1순위** |
| **배지/레벨 시스템** | 높음 | 낮음 | **1순위** |
| **웰니스 스코어** | 높음 | 중 | **2순위** |
| **AI 코칭 메시지** | 중 | 낮음 | **2순위** |
| 친구 기능 | 중 | 높음 | 3순위 |
| 수면 트래킹 | 중 | 중 | 3순위 |
| 커뮤니티 피드 | 낮음 | 높음 | 4순위 |

---

## 권장 진행 순서

### Phase H-1: 게이미피케이션 (첫 단계)

```yaml
Sprint 1 (2주):
  - 배지 시스템 DB 설계
  - 배지 컴포넌트 구현
  - 기존 스트릭과 연동

Sprint 2 (2주):
  - 레벨 시스템 구현
  - 프로필 페이지 레벨 표시
  - 레벨업 알림/애니메이션
```

### Phase H-2: 챌린지 시스템

```yaml
Sprint 3 (2주):
  - 챌린지 DB 스키마
  - 챌린지 목록 페이지
  - 챌린지 참여/완료 로직

Sprint 4 (2주):
  - 챌린지 진행 상황 표시
  - 완료 보상 (배지 연동)
  - 공유 기능
```

### Phase H-3: 통합 웰니스 스코어

```yaml
Sprint 5 (2주):
  - 스코어 계산 로직
  - 대시보드 위젯
  - 영역별 상세 분석

Sprint 6 (2주):
  - 트렌드 차트
  - AI 개선 제안
  - 리포트 연동
```

---

## DB 스키마 초안

### 배지 시스템

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- streak, workout, nutrition, analysis
  requirement JSONB NOT NULL, -- 획득 조건
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, badge_id)
);
```

### 챌린지 시스템

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- workout, nutrition, combined
  duration_days INTEGER NOT NULL,
  target JSONB NOT NULL, -- 목표 조건
  reward_badge_id UUID REFERENCES badges(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  challenge_id UUID REFERENCES challenges(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress JSONB, -- 진행 상황
  status TEXT DEFAULT 'in_progress' -- in_progress, completed, failed
);
```

### 웰니스 스코어

```sql
CREATE TABLE wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_score INTEGER, -- 0-100
  workout_score INTEGER,
  nutrition_score INTEGER,
  skin_score INTEGER,
  body_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, date)
);
```

---

## 참고 사항

- 프로덕션 배포 후 사용자 피드백을 기반으로 우선순위 조정
- 각 Phase는 테스트 통과 후 점진적 릴리스
- 게이미피케이션은 과도하지 않게 적정 수준 유지

---

**Status**: 기획 완료, 프로덕션 배포 후 진행 예정
**Version**: 1.0
**Updated**: 2025-12-23
