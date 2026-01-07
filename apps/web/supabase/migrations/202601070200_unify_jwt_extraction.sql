-- JWT 추출 방식 통일화 마이그레이션
-- CRITICAL: 구방식 current_setting() → 신방식 auth.jwt() 통일
-- 생성일: 2026-01-07

-- =====================================================
-- 1. personal_color_assessments
-- =====================================================
DROP POLICY IF EXISTS "Users can view own PC assessments" ON personal_color_assessments;
DROP POLICY IF EXISTS "Users can insert own PC assessments" ON personal_color_assessments;
DROP POLICY IF EXISTS "Users can update own PC assessments" ON personal_color_assessments;
DROP POLICY IF EXISTS "Users can delete own PC assessments" ON personal_color_assessments;

CREATE POLICY "Users can view own PC assessments"
  ON personal_color_assessments FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own PC assessments"
  ON personal_color_assessments FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own PC assessments"
  ON personal_color_assessments FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own PC assessments"
  ON personal_color_assessments FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 2. skin_analyses
-- =====================================================
DROP POLICY IF EXISTS "Users can view own skin analyses" ON skin_analyses;
DROP POLICY IF EXISTS "Users can insert own skin analyses" ON skin_analyses;
DROP POLICY IF EXISTS "Users can update own skin analyses" ON skin_analyses;
DROP POLICY IF EXISTS "Users can delete own skin analyses" ON skin_analyses;

CREATE POLICY "Users can view own skin analyses"
  ON skin_analyses FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own skin analyses"
  ON skin_analyses FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own skin analyses"
  ON skin_analyses FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own skin analyses"
  ON skin_analyses FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 3. body_analyses
-- =====================================================
DROP POLICY IF EXISTS "Users can view own body analyses" ON body_analyses;
DROP POLICY IF EXISTS "Users can insert own body analyses" ON body_analyses;
DROP POLICY IF EXISTS "Users can update own body analyses" ON body_analyses;
DROP POLICY IF EXISTS "Users can delete own body analyses" ON body_analyses;

CREATE POLICY "Users can view own body analyses"
  ON body_analyses FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own body analyses"
  ON body_analyses FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own body analyses"
  ON body_analyses FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own body analyses"
  ON body_analyses FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 4. users
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 5. nutrition_settings
-- =====================================================
DROP POLICY IF EXISTS "Users can view own nutrition settings" ON nutrition_settings;
DROP POLICY IF EXISTS "Users can insert own nutrition settings" ON nutrition_settings;
DROP POLICY IF EXISTS "Users can update own nutrition settings" ON nutrition_settings;

CREATE POLICY "Users can view own nutrition settings"
  ON nutrition_settings FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own nutrition settings"
  ON nutrition_settings FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own nutrition settings"
  ON nutrition_settings FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 6. daily_nutrition_summary
-- =====================================================
DROP POLICY IF EXISTS "Users can view own daily summaries" ON daily_nutrition_summary;
DROP POLICY IF EXISTS "Users can insert own daily summaries" ON daily_nutrition_summary;
DROP POLICY IF EXISTS "Users can update own daily summaries" ON daily_nutrition_summary;

CREATE POLICY "Users can view own daily summaries"
  ON daily_nutrition_summary FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own daily summaries"
  ON daily_nutrition_summary FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own daily summaries"
  ON daily_nutrition_summary FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 7. favorite_foods
-- =====================================================
DROP POLICY IF EXISTS "Users can view own favorite foods" ON favorite_foods;
DROP POLICY IF EXISTS "Users can insert own favorite foods" ON favorite_foods;
DROP POLICY IF EXISTS "Users can delete own favorite foods" ON favorite_foods;

CREATE POLICY "Users can view own favorite foods"
  ON favorite_foods FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own favorite foods"
  ON favorite_foods FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own favorite foods"
  ON favorite_foods FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 8. meal_records
-- =====================================================
DROP POLICY IF EXISTS "Users can view own meal records" ON meal_records;
DROP POLICY IF EXISTS "Users can insert own meal records" ON meal_records;
DROP POLICY IF EXISTS "Users can update own meal records" ON meal_records;
DROP POLICY IF EXISTS "Users can delete own meal records" ON meal_records;

CREATE POLICY "Users can view own meal records"
  ON meal_records FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own meal records"
  ON meal_records FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own meal records"
  ON meal_records FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own meal records"
  ON meal_records FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 9. nutrition_streaks
-- =====================================================
DROP POLICY IF EXISTS "Users can view own nutrition streaks" ON nutrition_streaks;
DROP POLICY IF EXISTS "Users can insert own nutrition streaks" ON nutrition_streaks;
DROP POLICY IF EXISTS "Users can update own nutrition streaks" ON nutrition_streaks;

CREATE POLICY "Users can view own nutrition streaks"
  ON nutrition_streaks FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own nutrition streaks"
  ON nutrition_streaks FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own nutrition streaks"
  ON nutrition_streaks FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 10. water_records
-- =====================================================
DROP POLICY IF EXISTS "Users can view own water records" ON water_records;
DROP POLICY IF EXISTS "Users can insert own water records" ON water_records;
DROP POLICY IF EXISTS "Users can update own water records" ON water_records;
DROP POLICY IF EXISTS "Users can delete own water records" ON water_records;

CREATE POLICY "Users can view own water records"
  ON water_records FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own water records"
  ON water_records FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own water records"
  ON water_records FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own water records"
  ON water_records FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 11. wishlist
-- =====================================================
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlist;

CREATE POLICY "Users can view own wishlist"
  ON wishlist FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own wishlist"
  ON wishlist FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own wishlist"
  ON wishlist FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 12. daily_checkins
-- =====================================================
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;

CREATE POLICY "Users can view own checkins"
  ON daily_checkins FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own checkins"
  ON daily_checkins FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own checkins"
  ON daily_checkins FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 13. user_levels (gamification)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own level" ON user_levels;
DROP POLICY IF EXISTS "Users can insert own level" ON user_levels;
DROP POLICY IF EXISTS "Users can update own level" ON user_levels;

CREATE POLICY "Users can view own level"
  ON user_levels FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own level"
  ON user_levels FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own level"
  ON user_levels FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 14. user_badges (gamification)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;

CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 15. challenge_participations
-- =====================================================
DROP POLICY IF EXISTS "Users can view own participations" ON challenge_participations;
DROP POLICY IF EXISTS "Users can insert own participations" ON challenge_participations;
DROP POLICY IF EXISTS "Users can update own participations" ON challenge_participations;

CREATE POLICY "Users can view own participations"
  ON challenge_participations FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own participations"
  ON challenge_participations FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own participations"
  ON challenge_participations FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 16. wellness_scores
-- =====================================================
DROP POLICY IF EXISTS "Users can view own wellness scores" ON wellness_scores;
DROP POLICY IF EXISTS "Users can insert own wellness scores" ON wellness_scores;
DROP POLICY IF EXISTS "Users can update own wellness scores" ON wellness_scores;

CREATE POLICY "Users can view own wellness scores"
  ON wellness_scores FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own wellness scores"
  ON wellness_scores FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own wellness scores"
  ON wellness_scores FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 17. friendships
-- =====================================================
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    requester_id = auth.jwt() ->> 'sub' OR
    addressee_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can insert friendships"
  ON friendships FOR INSERT
  WITH CHECK (requester_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (
    requester_id = auth.jwt() ->> 'sub' OR
    addressee_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (
    requester_id = auth.jwt() ->> 'sub' OR
    addressee_id = auth.jwt() ->> 'sub'
  );

-- =====================================================
-- 18. leaderboard_cache
-- =====================================================
DROP POLICY IF EXISTS "Users can view leaderboard" ON leaderboard_cache;

CREATE POLICY "Users can view leaderboard"
  ON leaderboard_cache FOR SELECT
  USING (true); -- 리더보드는 공개

-- =====================================================
-- 19. product_reviews
-- =====================================================
DROP POLICY IF EXISTS "Users can view all reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;

CREATE POLICY "Users can view all reviews"
  ON product_reviews FOR SELECT
  USING (true); -- 리뷰는 공개

CREATE POLICY "Users can insert own reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 20. feed_posts (소셜 피드)
-- =====================================================
DROP POLICY IF EXISTS "Users can view public feed posts" ON feed_posts;
DROP POLICY IF EXISTS "Users can insert own feed posts" ON feed_posts;
DROP POLICY IF EXISTS "Users can update own feed posts" ON feed_posts;
DROP POLICY IF EXISTS "Users can delete own feed posts" ON feed_posts;

CREATE POLICY "Users can view public feed posts"
  ON feed_posts FOR SELECT
  USING (
    visibility = 'public' OR
    clerk_user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can insert own feed posts"
  ON feed_posts FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own feed posts"
  ON feed_posts FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own feed posts"
  ON feed_posts FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- 코멘트
-- =====================================================
COMMENT ON EXTENSION IF EXISTS "pg_stat_statements" IS NULL;

-- 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE 'JWT extraction method unified to auth.jwt() for all RLS policies';
END $$;
