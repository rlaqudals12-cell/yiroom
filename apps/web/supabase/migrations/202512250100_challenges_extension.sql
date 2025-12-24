-- ============================================================
-- 챌린지 확장 (10개 추가)
-- Phase H Sprint 2
-- ============================================================

INSERT INTO challenges (code, name, description, icon, domain, duration_days, target, reward_xp, difficulty, sort_order) VALUES
-- 운동 챌린지 추가
('workout_morning_7', '7일 아침 운동', '7일 연속 오전 10시 이전에 운동을 완료하세요.', '🌅', 'workout', 7,
  '{"type": "time_based", "beforeHour": 10, "days": 7}'::jsonb, 60, 'medium', 6),
('workout_variety_7', '7일 다양한 운동', '7일 동안 서로 다른 운동 타입을 5가지 이상 해보세요.', '🎨', 'workout', 7,
  '{"type": "variety", "uniqueTypes": 5}'::jsonb, 70, 'medium', 7),
('workout_strength_10', '10회 근력 운동', '2주 안에 근력 운동을 10회 완료하세요.', '🏋️', 'workout', 14,
  '{"type": "count", "workouts": 10, "category": "strength"}'::jsonb, 90, 'medium', 8),

-- 영양 챌린지 추가
('nutrition_veggie_14', '14일 채소 챌린지', '2주 동안 매일 채소를 섭취하고 기록하세요.', '🥬', 'nutrition', 14,
  '{"type": "daily", "veggieServing": true}'::jsonb, 80, 'medium', 15),
('no_snack_7days', '7일 간식 없이', '7일 동안 간식 없이 식사만으로 영양을 채우세요.', '🚫', 'nutrition', 7,
  '{"type": "restriction", "noSnacks": true}'::jsonb, 60, 'hard', 16),
('water_2l_14days', '14일 물 2L 마시기', '2주 연속 매일 물 2L를 마시세요.', '🌊', 'nutrition', 14,
  '{"type": "daily", "waterMl": 2000}'::jsonb, 70, 'medium', 17),

-- 스킨케어 챌린지 추가
('skincare_21day', '21일 스킨케어 루틴', '3주 동안 매일 아침/저녁 스킨케어 루틴을 완료하세요.', '✨', 'skin', 21,
  '{"type": "routine", "morningEvening": true, "days": 21}'::jsonb, 100, 'medium', 30),

-- 복합 챌린지 추가
('combined_morning_routine', '7일 아침 루틴', '7일 연속 아침 운동 + 건강한 아침식사를 완료하세요.', '🌤️', 'combined', 7,
  '{"type": "combined", "morningWorkout": true, "healthyBreakfast": true}'::jsonb, 80, 'medium', 22),
('combined_wellness_14', '14일 웰니스 마스터', '2주 연속 운동, 영양, 수분 모두 목표를 달성하세요.', '🎖️', 'combined', 14,
  '{"type": "combined", "workout": true, "nutrition": true, "water": true}'::jsonb, 150, 'hard', 23),
('combined_perfect_week', '완벽한 한 주', '7일 연속 운동 + 영양 + 수분 + 수면 목표를 모두 달성하세요.', '💎', 'combined', 7,
  '{"type": "combined", "workout": true, "nutrition": true, "water": true, "sleep": true}'::jsonb, 200, 'hard', 24)

ON CONFLICT (code) DO NOTHING;
