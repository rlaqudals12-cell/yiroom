# 등급 시스템 스펙 (Level System)

> 이룸 사용자 등급 시스템 설계 문서

## 1. 개요

### 1.1 목적

- **성취감 제공**: 활동량에 따른 등급 상승으로 성취감 부여
- **자기 만족**: 프로필 꾸미기를 통한 자기 표현
- **지속 사용 유도**: 압박 없이 자연스러운 참여 동기 부여
- **확장성**: 추후 수익화 시 등급별 혜택 추가 가능

### 1.2 핵심 원칙

| 원칙          | 설명                               |
| ------------- | ---------------------------------- |
| **하락 없음** | 한번 달성한 등급은 영구 유지       |
| **누적 기반** | 기간 제한 없이 누적 활동으로 승급  |
| **자동 승급** | 별도 신청 없이 조건 달성 시 자동   |
| **압박 제거** | "실패" 개념 없음, 쉬어도 등급 유지 |

### 1.3 디자인 컨셉

- **미니멀**: 채워지는 원형 아이콘
- **색상 진행**: 차가운 색 → 따뜻한 색
- **성별 중립**: 화려한 장식 없이 깔끔한 디자인

---

## 2. 등급 체계

### 2.1 등급 정의

| 등급     | 아이콘 | 색상   | Tailwind     | 조건 (누적 활동) |
| -------- | ------ | ------ | ------------ | ---------------- |
| **Lv.1** | ○      | Slate  | `slate-400`  | 가입 (0회)       |
| **Lv.2** | ◐      | Teal   | `teal-500`   | 30회             |
| **Lv.3** | ◑      | Blue   | `blue-500`   | 100회            |
| **Lv.4** | ◕      | Violet | `violet-500` | 300회            |
| **Lv.5** | ●      | Amber  | `amber-500`  | 1,000회          |

### 2.2 색상 코드

```typescript
export const LEVEL_COLORS = {
  1: { name: 'Slate', hex: '#94A3B8', tailwind: 'slate-400' },
  2: { name: 'Teal', hex: '#14B8A6', tailwind: 'teal-500' },
  3: { name: 'Blue', hex: '#3B82F6', tailwind: 'blue-500' },
  4: { name: 'Violet', hex: '#8B5CF6', tailwind: 'violet-500' },
  5: { name: 'Amber', hex: '#F59E0B', tailwind: 'amber-500' },
} as const;
```

### 2.3 등급 아이콘 (SVG)

```typescript
export const LEVEL_ICONS = {
  1: '○', // 빈 원
  2: '◐', // 왼쪽 반 채움
  3: '◑', // 오른쪽 반 채움
  4: '◕', // 거의 채움
  5: '●', // 꽉 채움
} as const;
```

---

## 3. 활동 카운트 기준

### 3.1 카운트 대상 활동

| 활동 유형      | 카운트 | 비고                    |
| -------------- | ------ | ----------------------- |
| 운동 기록      | +1     | workout_logs 생성 시    |
| 식단 기록      | +1     | meal_records 생성 시    |
| 물 기록        | +1     | water_records 생성 시   |
| 분석 완료      | +2     | \*\_assessments 생성 시 |
| 제품 리뷰 작성 | +3     | product_reviews 생성 시 |
| 체크인 완료    | +1     | daily_checkins 생성 시  |

### 3.2 카운트 규칙

- 같은 날 같은 유형 활동은 **최대 5회**까지만 카운트
- 삭제된 기록은 카운트에서 **차감하지 않음** (하락 없음 원칙)
- 과거 데이터도 소급 적용 (마이그레이션 시)

---

## 4. 데이터베이스 설계

### 4.1 user_levels 테이블 확장

```sql
-- 기존 user_levels 테이블에 컬럼 추가
ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS
  total_activity_count INTEGER DEFAULT 0;

ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS
  level_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_levels_activity_count
  ON user_levels(total_activity_count);
```

### 4.2 activity_logs 테이블 (신규)

```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'workout', 'meal', 'water', 'analysis', 'review', 'checkin'
  activity_id UUID, -- 원본 레코드 ID (optional)
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_activity_type CHECK (
    activity_type IN ('workout', 'meal', 'water', 'analysis', 'review', 'checkin')
  )
);

-- RLS 정책
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_activity_logs_user ON activity_logs(clerk_user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(clerk_user_id, created_at);
```

### 4.3 레벨 업 트리거 함수

```sql
-- 활동 로그 추가 시 자동으로 레벨 체크
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_total INTEGER;
  current_level INTEGER;
  new_level INTEGER;
BEGIN
  -- 총 활동 수 계산
  SELECT COALESCE(SUM(points), 0) INTO new_total
  FROM activity_logs
  WHERE clerk_user_id = NEW.clerk_user_id;

  -- 현재 레벨 조회
  SELECT level INTO current_level
  FROM user_levels
  WHERE clerk_user_id = NEW.clerk_user_id;

  -- 새 레벨 계산 (하락 없음)
  new_level := CASE
    WHEN new_total >= 1000 THEN 5
    WHEN new_total >= 300 THEN 4
    WHEN new_total >= 100 THEN 3
    WHEN new_total >= 30 THEN 2
    ELSE 1
  END;

  -- 레벨이 상승한 경우에만 업데이트 (하락 방지)
  IF new_level > COALESCE(current_level, 1) THEN
    UPDATE user_levels
    SET level = new_level,
        total_activity_count = new_total,
        level_updated_at = NOW(),
        updated_at = NOW()
    WHERE clerk_user_id = NEW.clerk_user_id;
  ELSE
    -- 활동 수만 업데이트
    UPDATE user_levels
    SET total_activity_count = new_total,
        updated_at = NOW()
    WHERE clerk_user_id = NEW.clerk_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER on_activity_log_insert
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();
```

---

## 5. API 설계

### 5.1 엔드포인트

| Method | Path                   | 설명                          |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/api/user/level`      | 현재 사용자 레벨 조회         |
| GET    | `/api/user/activities` | 활동 로그 조회 (페이지네이션) |
| POST   | `/api/user/activities` | 활동 기록 (내부용)            |

### 5.2 응답 형식

```typescript
// GET /api/user/level
interface UserLevelResponse {
  level: number;           // 1-5
  totalActivityCount: number;
  nextLevelThreshold: number | null;  // 다음 레벨까지 필요한 활동 수
  progress: number;        // 다음 레벨까지 진행률 (0-100)
  levelUpdatedAt: string;  // ISO date
}

// 예시 응답
{
  "level": 3,
  "totalActivityCount": 156,
  "nextLevelThreshold": 300,
  "progress": 52,  // (156-100)/(300-100) * 100
  "levelUpdatedAt": "2025-01-03T10:30:00Z"
}
```

---

## 6. 프론트엔드 컴포넌트

### 6.1 LevelBadge 컴포넌트

```typescript
// components/common/LevelBadge.tsx
interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

**사용 예시**:

```tsx
<LevelBadge level={3} size="md" />
<LevelBadge level={4} size="sm" showLabel />
```

### 6.2 LevelProgress 컴포넌트

```typescript
// components/common/LevelProgress.tsx
interface LevelProgressProps {
  currentCount: number;
  nextThreshold: number;
  level: number;
}
```

### 6.3 프로필 표시

```
┌─────────────────────────────────┐
│  [프로필사진] ◕                 │
│  홍길동                          │
│  Lv.4 · 365회 활동               │
│  ████████░░ 다음 레벨까지 65%    │
└─────────────────────────────────┘
```

---

## 7. 활동 연동

### 7.1 기존 모듈 연동

각 모듈에서 레코드 생성 시 `activity_logs`에 자동 기록:

```typescript
// lib/levels/activity-tracker.ts
export async function trackActivity(
  supabase: SupabaseClient,
  userId: string,
  type: ActivityType,
  activityId?: string
): Promise<void> {
  const points = ACTIVITY_POINTS[type];

  await supabase.from('activity_logs').insert({
    clerk_user_id: userId,
    activity_type: type,
    activity_id: activityId,
    points,
  });
}
```

### 7.2 연동 위치

| 모듈     | 파일                      | 트리거 시점          |
| -------- | ------------------------- | -------------------- |
| W-1 운동 | `lib/api/workout.ts`      | createWorkoutLog 후  |
| N-1 영양 | `lib/api/nutrition.ts`    | createMealRecord 후  |
| 물 기록  | `lib/api/water.ts`        | createWaterRecord 후 |
| 분석     | 각 분석 API               | 분석 완료 후         |
| 리뷰     | `lib/products/reviews.ts` | createReview 후      |

---

## 8. 마이그레이션

### 8.1 기존 데이터 소급 적용

```sql
-- 기존 활동 데이터를 activity_logs로 마이그레이션
INSERT INTO activity_logs (clerk_user_id, activity_type, activity_id, points, created_at)
SELECT clerk_user_id, 'workout', id, 1, created_at FROM workout_logs
UNION ALL
SELECT clerk_user_id, 'meal', id, 1, created_at FROM meal_records
UNION ALL
SELECT clerk_user_id, 'water', id, 1, created_at FROM water_records
-- ... 기타 활동들

-- 레벨 재계산
UPDATE user_levels ul
SET total_activity_count = (
  SELECT COALESCE(SUM(points), 0)
  FROM activity_logs al
  WHERE al.clerk_user_id = ul.clerk_user_id
),
level = CASE
  WHEN (SELECT COALESCE(SUM(points), 0) FROM activity_logs WHERE clerk_user_id = ul.clerk_user_id) >= 1000 THEN 5
  WHEN (SELECT COALESCE(SUM(points), 0) FROM activity_logs WHERE clerk_user_id = ul.clerk_user_id) >= 300 THEN 4
  WHEN (SELECT COALESCE(SUM(points), 0) FROM activity_logs WHERE clerk_user_id = ul.clerk_user_id) >= 100 THEN 3
  WHEN (SELECT COALESCE(SUM(points), 0) FROM activity_logs WHERE clerk_user_id = ul.clerk_user_id) >= 30 THEN 2
  ELSE 1
END;
```

---

## 9. 추후 확장 (수익화 시)

### 9.1 등급별 혜택 예시

| 등급  | 추가 혜택 (예정)                      |
| ----- | ------------------------------------- |
| Lv.3+ | 유료 기능 5% 할인                     |
| Lv.4+ | 유료 기능 10% 할인 + 신기능 조기 접근 |
| Lv.5  | 유료 기능 20% 할인 + 1:1 컨설팅       |

### 9.2 프로필 꾸미기 확장

| 요소      | 설명                        |
| --------- | --------------------------- |
| 프레임    | 등급별 프로필 사진 테두리   |
| 테마      | 마이페이지 배경 색상        |
| 뱃지 진열 | 획득한 뱃지 표시 (최대 5개) |

---

## 10. 테스트 케이스

### 10.1 단위 테스트

- [ ] 활동 포인트 계산 정확성
- [ ] 레벨 계산 로직 (경계값)
- [ ] 하락 방지 로직
- [ ] 일일 최대 카운트 제한

### 10.2 통합 테스트

- [ ] 활동 기록 → 레벨 업데이트 플로우
- [ ] 마이그레이션 정확성
- [ ] API 응답 형식

---

## 부록: 용어 정의

| 용어                  | 정의                                  |
| --------------------- | ------------------------------------- |
| 활동 (Activity)       | 앱 내에서 사용자가 수행하는 기록 행위 |
| 포인트 (Points)       | 활동당 부여되는 점수                  |
| 레벨 (Level)          | 누적 포인트에 따른 등급 (1-5)         |
| 프로그레스 (Progress) | 다음 레벨까지의 진행률                |

---

**Version**: 1.0
**Created**: 2025-01-05
**Author**: Claude Code
