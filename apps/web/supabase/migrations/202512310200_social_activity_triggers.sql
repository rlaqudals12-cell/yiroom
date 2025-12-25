-- ============================================================
-- 소셜 활동 자동 생성 트리거
-- Week 2: 소셜 피드 - 활동 수집
-- ============================================================

-- ============================================================
-- 1. 운동 완료 시 활동 생성
-- workout_logs INSERT → workout_complete 활동
-- ============================================================

CREATE OR REPLACE FUNCTION create_workout_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_clerk_user_id TEXT;
  v_exercise_name TEXT;
  v_duration INTEGER;
BEGIN
  -- users 테이블에서 clerk_user_id 조회
  SELECT clerk_user_id INTO v_clerk_user_id
  FROM users
  WHERE id = NEW.user_id;

  IF v_clerk_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- exercise_logs에서 첫 번째 운동 이름 추출
  v_exercise_name := NEW.exercise_logs->0->>'exercise_name';
  v_duration := COALESCE(NEW.actual_duration, 0);

  -- 활동 생성
  INSERT INTO social_activities (
    clerk_user_id,
    activity_type,
    title,
    description,
    metadata,
    is_public
  ) VALUES (
    v_clerk_user_id,
    'workout_complete',
    COALESCE(v_exercise_name, '운동') || ' 완료!',
    v_duration || '분 동안 운동했어요',
    jsonb_build_object(
      'workoutLogId', NEW.id,
      'duration', v_duration,
      'calories', COALESCE(NEW.actual_calories, 0),
      'exerciseCount', jsonb_array_length(COALESCE(NEW.exercise_logs, '[]'::jsonb))
    ),
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 운동 완료 시 (completed_at이 설정된 경우만)
CREATE OR REPLACE TRIGGER trigger_workout_activity
  AFTER INSERT ON workout_logs
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION create_workout_activity();

-- ============================================================
-- 2. 뱃지 획득 시 활동 생성
-- user_badges INSERT → badge_earned 활동
-- ============================================================

CREATE OR REPLACE FUNCTION create_badge_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_badge_name TEXT;
  v_badge_icon TEXT;
  v_badge_rarity TEXT;
BEGIN
  -- badges 테이블에서 배지 정보 조회
  SELECT name, icon, rarity INTO v_badge_name, v_badge_icon, v_badge_rarity
  FROM badges
  WHERE id = NEW.badge_id;

  IF v_badge_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- 활동 생성
  INSERT INTO social_activities (
    clerk_user_id,
    activity_type,
    title,
    description,
    metadata,
    is_public
  ) VALUES (
    NEW.clerk_user_id,
    'badge_earned',
    v_badge_icon || ' ' || v_badge_name || ' 뱃지 획득!',
    '새로운 뱃지를 획득했어요',
    jsonb_build_object(
      'badgeId', NEW.badge_id,
      'badgeName', v_badge_name,
      'badgeIcon', v_badge_icon,
      'rarity', v_badge_rarity
    ),
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_badge_activity
  AFTER INSERT ON user_badges
  FOR EACH ROW
  EXECUTE FUNCTION create_badge_activity();

-- ============================================================
-- 3. 레벨업 시 활동 생성
-- user_levels UPDATE (level 증가) → level_up 활동
-- ============================================================

CREATE OR REPLACE FUNCTION create_levelup_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- 레벨이 증가한 경우에만
  IF NEW.level > OLD.level THEN
    INSERT INTO social_activities (
      clerk_user_id,
      activity_type,
      title,
      description,
      metadata,
      is_public
    ) VALUES (
      NEW.clerk_user_id,
      'level_up',
      '레벨 ' || NEW.level || ' 달성!',
      '꾸준한 노력으로 레벨업했어요',
      jsonb_build_object(
        'previousLevel', OLD.level,
        'newLevel', NEW.level,
        'tier', NEW.tier,
        'totalXp', NEW.total_xp
      ),
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_levelup_activity
  AFTER UPDATE ON user_levels
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION create_levelup_activity();

-- ============================================================
-- 4. 챌린지 완료 시 활동 생성
-- user_challenges UPDATE (status = 'completed') → challenge_complete 활동
-- ============================================================

CREATE OR REPLACE FUNCTION create_challenge_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_challenge_name TEXT;
  v_challenge_icon TEXT;
  v_duration_days INTEGER;
BEGIN
  -- 상태가 'completed'로 변경된 경우에만
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- challenges 테이블에서 챌린지 정보 조회
    SELECT name, icon, duration_days INTO v_challenge_name, v_challenge_icon, v_duration_days
    FROM challenges
    WHERE id = NEW.challenge_id;

    IF v_challenge_name IS NULL THEN
      RETURN NEW;
    END IF;

    -- 활동 생성
    INSERT INTO social_activities (
      clerk_user_id,
      activity_type,
      title,
      description,
      metadata,
      is_public
    ) VALUES (
      NEW.clerk_user_id,
      'challenge_complete',
      v_challenge_icon || ' ' || v_challenge_name || ' 챌린지 완료!',
      v_duration_days || '일 챌린지를 성공적으로 완료했어요',
      jsonb_build_object(
        'challengeId', NEW.challenge_id,
        'challengeName', v_challenge_name,
        'durationDays', v_duration_days,
        'completedAt', NEW.completed_at
      ),
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_challenge_activity
  AFTER UPDATE ON user_challenges
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_challenge_activity();

-- ============================================================
-- 5. 연속 기록 달성 시 활동 생성 (선택적)
-- workout_streaks / nutrition_streaks UPDATE → streak_achieved 활동
-- ============================================================

CREATE OR REPLACE FUNCTION create_streak_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_milestones INTEGER[] := ARRAY[7, 14, 30, 60, 100];
  v_milestone INTEGER;
  v_domain TEXT;
BEGIN
  -- 마일스톤 확인 (7, 14, 30, 60, 100일)
  FOREACH v_milestone IN ARRAY v_streak_milestones
  LOOP
    IF NEW.current_streak = v_milestone AND (OLD.current_streak IS NULL OR OLD.current_streak < v_milestone) THEN
      -- 테이블 이름에서 도메인 추출
      v_domain := CASE TG_TABLE_NAME
        WHEN 'workout_streaks' THEN '운동'
        WHEN 'nutrition_streaks' THEN '식단'
        ELSE '활동'
      END;

      INSERT INTO social_activities (
        clerk_user_id,
        activity_type,
        title,
        description,
        metadata,
        is_public
      ) VALUES (
        NEW.clerk_user_id,
        'streak_achieved',
        v_domain || ' ' || v_milestone || '일 연속 달성!',
        '대단해요! ' || v_milestone || '일 연속 ' || v_domain || ' 기록을 달성했어요',
        jsonb_build_object(
          'domain', TG_TABLE_NAME,
          'streakDays', v_milestone,
          'currentStreak', NEW.current_streak,
          'longestStreak', NEW.longest_streak
        ),
        true
      );

      EXIT; -- 하나의 마일스톤만 기록
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- workout_streaks 트리거 (테이블 존재 시)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_streaks') THEN
    DROP TRIGGER IF EXISTS trigger_workout_streak_activity ON workout_streaks;
    CREATE TRIGGER trigger_workout_streak_activity
      AFTER UPDATE ON workout_streaks
      FOR EACH ROW
      EXECUTE FUNCTION create_streak_activity();
  END IF;
END
$$;

-- nutrition_streaks 트리거 (테이블 존재 시)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nutrition_streaks') THEN
    DROP TRIGGER IF EXISTS trigger_nutrition_streak_activity ON nutrition_streaks;
    CREATE TRIGGER trigger_nutrition_streak_activity
      AFTER UPDATE ON nutrition_streaks
      FOR EACH ROW
      EXECUTE FUNCTION create_streak_activity();
  END IF;
END
$$;

-- ============================================================
-- 주석
-- ============================================================

COMMENT ON FUNCTION create_workout_activity IS '운동 완료 시 소셜 활동 자동 생성';
COMMENT ON FUNCTION create_badge_activity IS '뱃지 획득 시 소셜 활동 자동 생성';
COMMENT ON FUNCTION create_levelup_activity IS '레벨업 시 소셜 활동 자동 생성';
COMMENT ON FUNCTION create_challenge_activity IS '챌린지 완료 시 소셜 활동 자동 생성';
COMMENT ON FUNCTION create_streak_activity IS '연속 기록 달성 시 소셜 활동 자동 생성';
