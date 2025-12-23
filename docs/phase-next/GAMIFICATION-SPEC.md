# 게이미피케이션 시스템 스펙

## 개요

이룸 앱의 사용자 리텐션 및 동기 부여를 위한 게이미피케이션 시스템.

## 시스템 구성

### 1. 배지 시스템

#### 배지 카테고리

| 카테고리 | 설명 | 배지 수 |
|----------|------|---------|
| streak | 연속 기록 배지 | 10개 |
| workout | 운동 관련 배지 | 4개 |
| nutrition | 영양 관련 배지 | 3개 |
| analysis | 분석 완료 배지 | 4개 |
| special | 특별 배지 | 2개 |
| **합계** | | **23개** |

#### 희귀도

| 희귀도 | 색상 | 설명 |
|--------|------|------|
| common | 회색 | 쉽게 획득 가능 |
| rare | 파랑 | 약간의 노력 필요 |
| epic | 보라 | 상당한 노력 필요 |
| legendary | 골드 | 높은 성취 필요 |

#### 배지 목록

**스트릭 배지 (10개)**
- `workout_streak_3` ~ `workout_streak_100` (6개)
- `nutrition_streak_3` ~ `nutrition_streak_30` (4개)

**운동 배지 (4개)**
- `first_workout` - 첫 운동 완료
- `workout_10sessions` - 운동 10회 완료
- `workout_50sessions` - 운동 50회 완료
- `workout_100sessions` - 운동 100회 완료

**영양 배지 (3개)**
- `first_nutrition` - 첫 식단 기록
- `balanced_week` - 균형 잡힌 식단 일주일
- `water_goal_week` - 수분 섭취 목표 달성 일주일

**분석 배지 (4개)**
- `analysis_pc_complete` - 퍼스널컬러 분석 완료
- `analysis_skin_complete` - 피부 분석 완료
- `analysis_body_complete` - 체형 분석 완료
- `analysis_all_complete` - 전체 분석 완료

**특별 배지 (2개)**
- `early_adopter` - 얼리 어답터
- `wellness_week` - 웰니스 일주일 (운동+식단+분석)

### 2. 레벨 시스템

#### 티어

| 티어 | 레벨 범위 | 필요 XP | 색상 |
|------|-----------|---------|------|
| Beginner | 1-10 | 100~1,000 | 초록 |
| Practitioner | 11-30 | 1,100~3,000 | 파랑 |
| Expert | 31-50 | 3,100~5,000 | 보라 |
| Master | 51+ | 5,100+ | 골드 |

#### XP 획득 방법

| 행동 | XP |
|------|-----|
| 운동 완료 | 5 |
| 식단 기록 | 2 |
| 분석 완료 | 10 |
| 배지 획득 | 배지별 상이 |
| 챌린지 완료 | 챌린지별 상이 |

### 3. 알림 시스템

#### 배지 획득 알림
- Toast 알림 (하단 팝업)
- 배지 이미지 + 이름 + 설명

#### 레벨업 알림
- 전체 화면 모달
- Confetti 애니메이션
- 새 레벨 + 티어 표시

## API 엔드포인트

### 배지 관련

```typescript
// 전체 배지 조회
getAllBadges(supabase): Promise<Badge[]>

// 사용자 배지 조회
getUserBadges(supabase, userId): Promise<UserBadge[]>

// 배지 부여
awardBadge(supabase, userId, badgeCode): Promise<BadgeAwardResult>
```

### 레벨 관련

```typescript
// 레벨 정보 조회
getUserLevelInfo(supabase, userId): Promise<LevelInfo>

// XP 추가
addXp(supabase, userId, amount): Promise<LevelUpResult>
```

## 컴포넌트

| 컴포넌트 | 위치 | 용도 |
|----------|------|------|
| `BadgeCard` | components/gamification/ | 배지 카드 표시 |
| `BadgeGrid` | components/gamification/ | 배지 그리드 (카테고리별) |
| `LevelProgress` | components/gamification/ | 레벨 프로그레스 바 |
| `LevelUpModal` | components/gamification/ | 레벨업 모달 |
| `BadgeToast` | components/gamification/ | 배지 획득 Toast |
| `GamificationWidget` | dashboard/_components/ | 대시보드 위젯 |

## DB 스키마

### badges 테이블

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category badge_category NOT NULL,
  rarity badge_rarity DEFAULT 'common',
  icon_url TEXT,
  xp_reward INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_badges 테이블

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, badge_id)
);
```

### user_levels 테이블

```sql
CREATE TABLE user_levels (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  tier level_tier DEFAULT 'beginner',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 테스트

| 테스트 파일 | 테스트 수 |
|-------------|-----------|
| constants.test.ts | 15 |
| badges.test.ts | 8 |
| levels.test.ts | 9 |
| **합계** | **32** |

---

*Phase H Sprint 1 완료: 2024-12-24*
