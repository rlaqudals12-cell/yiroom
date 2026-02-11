-- Migration: Complete RLS Policies for All Tables
-- Purpose: OWASP Top 5 (Broken Access Control) 준수 - 모든 테이블 RLS 완료
-- Date: 2026-01-15
-- Related: P0-5, P0-7 보안 강화

-- ============================================
-- JWT에서 사용자 ID 추출 함수 (통일)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$;

-- ============================================
-- 1. 게이미피케이션 테이블 RLS
-- ============================================

-- user_levels
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own level" ON user_levels;
CREATE POLICY "Users can view own level" ON user_levels
  FOR SELECT
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can update own level" ON user_levels;
CREATE POLICY "Users can update own level" ON user_levels
  FOR UPDATE
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Service role full access on user_levels" ON user_levels;
CREATE POLICY "Service role full access on user_levels" ON user_levels
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Service role full access on user_badges" ON user_badges;
CREATE POLICY "Service role full access on user_badges" ON user_badges
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- wellness_scores
ALTER TABLE wellness_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wellness scores" ON wellness_scores;
CREATE POLICY "Users can view own wellness scores" ON wellness_scores
  FOR SELECT
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can insert own wellness scores" ON wellness_scores;
CREATE POLICY "Users can insert own wellness scores" ON wellness_scores
  FOR INSERT
  WITH CHECK (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Service role full access on wellness_scores" ON wellness_scores;
CREATE POLICY "Service role full access on wellness_scores" ON wellness_scores
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 2. 소셜 테이블 RLS
-- ============================================

-- friendships (양방향 조회 가능, 컬럼: requester_id/addressee_id)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friendships they are part of" ON friendships;
CREATE POLICY "Users can view friendships they are part of" ON friendships
  FOR SELECT
  USING (
    requester_id = public.get_user_id()
    OR addressee_id = public.get_user_id()
  );

DROP POLICY IF EXISTS "Users can insert friendship requests" ON friendships;
CREATE POLICY "Users can insert friendship requests" ON friendships
  FOR INSERT
  WITH CHECK (requester_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can update friendships they are part of" ON friendships;
CREATE POLICY "Users can update friendships they are part of" ON friendships
  FOR UPDATE
  USING (
    requester_id = public.get_user_id()
    OR addressee_id = public.get_user_id()
  );

DROP POLICY IF EXISTS "Users can delete friendships they created" ON friendships;
CREATE POLICY "Users can delete friendships they created" ON friendships
  FOR DELETE
  USING (requester_id = public.get_user_id() OR addressee_id = public.get_user_id());

-- leaderboard_cache (공개 조회)
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaderboard is publicly viewable" ON leaderboard_cache;
CREATE POLICY "Leaderboard is publicly viewable" ON leaderboard_cache
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage leaderboard" ON leaderboard_cache;
CREATE POLICY "Service role can manage leaderboard" ON leaderboard_cache
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 3. 챌린지 테이블 RLS
-- ============================================

-- challenges (공개 조회)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenges are publicly viewable" ON challenges;
CREATE POLICY "Challenges are publicly viewable" ON challenges
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage challenges" ON challenges;
CREATE POLICY "Service role can manage challenges" ON challenges
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- challenge_participations (참가자만 조회)
-- 테이블명이 user_challenges일 수 있음 — 조건부 적용
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenge_participations') THEN
    ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own challenge participations" ON challenge_participations;
    CREATE POLICY "Users can view own challenge participations" ON challenge_participations
      FOR SELECT
      USING (clerk_user_id = public.get_user_id());

    DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participations;
    CREATE POLICY "Users can join challenges" ON challenge_participations
      FOR INSERT
      WITH CHECK (clerk_user_id = public.get_user_id());

    DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participations;
    CREATE POLICY "Users can update own participation" ON challenge_participations
      FOR UPDATE
      USING (clerk_user_id = public.get_user_id());

    DROP POLICY IF EXISTS "Users can leave challenges" ON challenge_participations;
    CREATE POLICY "Users can leave challenges" ON challenge_participations
      FOR DELETE
      USING (clerk_user_id = public.get_user_id());
  END IF;
END $$;

-- ============================================
-- 4. 어필리에이트 테이블 RLS
-- ============================================

-- affiliate_clicks (본인만 조회)
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own clicks" ON affiliate_clicks;
CREATE POLICY "Users can view own clicks" ON affiliate_clicks
  FOR SELECT
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can record clicks" ON affiliate_clicks;
CREATE POLICY "Users can record clicks" ON affiliate_clicks
  FOR INSERT
  WITH CHECK (clerk_user_id = public.get_user_id() OR clerk_user_id IS NULL);

DROP POLICY IF EXISTS "Service role full access on affiliate_clicks" ON affiliate_clicks;
CREATE POLICY "Service role full access on affiliate_clicks" ON affiliate_clicks
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 5. 운영 테이블 RLS
-- ============================================

-- announcements (공개 조회)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements are publicly viewable" ON announcements;
CREATE POLICY "Announcements are publicly viewable" ON announcements
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Service role can manage announcements" ON announcements;
CREATE POLICY "Service role can manage announcements" ON announcements
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- faqs (공개 조회)
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FAQs are publicly viewable" ON faqs;
CREATE POLICY "FAQs are publicly viewable" ON faqs
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Service role can manage faqs" ON faqs;
CREATE POLICY "Service role can manage faqs" ON faqs
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- feedback (본인만 조회)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT
  WITH CHECK (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Service role full access on feedback" ON feedback;
CREATE POLICY "Service role full access on feedback" ON feedback
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 6. 알림 테이블 RLS
-- ============================================

-- user_notification_settings (본인만 접근)
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification settings" ON user_notification_settings;
CREATE POLICY "Users can view own notification settings" ON user_notification_settings
  FOR SELECT
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can update own notification settings" ON user_notification_settings;
CREATE POLICY "Users can update own notification settings" ON user_notification_settings
  FOR ALL
  USING (clerk_user_id = public.get_user_id());

-- user_push_tokens (본인만 접근)
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push tokens" ON user_push_tokens;
CREATE POLICY "Users can manage own push tokens" ON user_push_tokens
  FOR ALL
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Service role full access on push tokens" ON user_push_tokens;
CREATE POLICY "Service role full access on push tokens" ON user_push_tokens
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 7. 제품 테이블 RLS (공개 조회)
-- ============================================

-- cosmetic_products
ALTER TABLE cosmetic_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cosmetic products are publicly viewable" ON cosmetic_products;
CREATE POLICY "Cosmetic products are publicly viewable" ON cosmetic_products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage cosmetic products" ON cosmetic_products;
CREATE POLICY "Service role can manage cosmetic products" ON cosmetic_products
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- supplement_products
ALTER TABLE supplement_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supplement products are publicly viewable" ON supplement_products;
CREATE POLICY "Supplement products are publicly viewable" ON supplement_products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage supplement products" ON supplement_products;
CREATE POLICY "Service role can manage supplement products" ON supplement_products
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- health_foods
ALTER TABLE health_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Health foods are publicly viewable" ON health_foods;
CREATE POLICY "Health foods are publicly viewable" ON health_foods
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage health foods" ON health_foods;
CREATE POLICY "Service role can manage health foods" ON health_foods
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- workout_equipment
ALTER TABLE workout_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workout equipment is publicly viewable" ON workout_equipment;
CREATE POLICY "Workout equipment is publicly viewable" ON workout_equipment
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage workout equipment" ON workout_equipment;
CREATE POLICY "Service role can manage workout equipment" ON workout_equipment
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 8. 리뷰 테이블 RLS
-- ============================================

-- product_reviews (공개 조회, 본인만 수정/삭제)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly viewable" ON product_reviews;
CREATE POLICY "Reviews are publicly viewable" ON product_reviews
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
CREATE POLICY "Users can create reviews" ON product_reviews
  FOR INSERT
  WITH CHECK (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
CREATE POLICY "Users can update own reviews" ON product_reviews
  FOR UPDATE
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;
CREATE POLICY "Users can delete own reviews" ON product_reviews
  FOR DELETE
  USING (clerk_user_id = public.get_user_id());

-- review_helpful (본인만 수정)
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review helpful votes are viewable" ON review_helpful;
CREATE POLICY "Review helpful votes are viewable" ON review_helpful
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpful;
CREATE POLICY "Users can vote on reviews" ON review_helpful
  FOR INSERT
  WITH CHECK (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can change own votes" ON review_helpful;
CREATE POLICY "Users can change own votes" ON review_helpful
  FOR UPDATE
  USING (clerk_user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can remove own votes" ON review_helpful;
CREATE POLICY "Users can remove own votes" ON review_helpful
  FOR DELETE
  USING (clerk_user_id = public.get_user_id());

-- ============================================
-- 9. 팬트리 테이블 RLS
-- ============================================

-- pantry_items (본인만 접근) — 테이블 존재 여부 확인 후 적용
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pantry_items') THEN
    ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage own pantry" ON pantry_items;
    CREATE POLICY "Users can manage own pantry" ON pantry_items
      FOR ALL
      USING (clerk_user_id = public.get_user_id());
  END IF;
END $$;

-- ============================================
-- 10. 추가 테이블 RLS (누락 가능성)
-- ============================================

-- challenge_teams (팀원만 조회)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenge_teams') THEN
    ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Team members can view team" ON challenge_teams;
    CREATE POLICY "Team members can view team" ON challenge_teams
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS "Service role can manage teams" ON challenge_teams;
    CREATE POLICY "Service role can manage teams" ON challenge_teams
      FOR ALL
      USING (current_setting('role', true) = 'service_role');
  END IF;
END $$;

-- affiliate_partners (공개 조회)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_partners') THEN
    ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Affiliate partners are publicly viewable" ON affiliate_partners;
    CREATE POLICY "Affiliate partners are publicly viewable" ON affiliate_partners
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS "Service role can manage partners" ON affiliate_partners;
    CREATE POLICY "Service role can manage partners" ON affiliate_partners
      FOR ALL
      USING (current_setting('role', true) = 'service_role');
  END IF;
END $$;

-- affiliate_products (공개 조회)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_products') THEN
    ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Affiliate products are publicly viewable" ON affiliate_products;
    CREATE POLICY "Affiliate products are publicly viewable" ON affiliate_products
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS "Service role can manage affiliate products" ON affiliate_products;
    CREATE POLICY "Service role can manage affiliate products" ON affiliate_products
      FOR ALL
      USING (current_setting('role', true) = 'service_role');
  END IF;
END $$;

-- affiliate_daily_stats (서비스만 접근)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_daily_stats') THEN
    ALTER TABLE affiliate_daily_stats ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role only for daily stats" ON affiliate_daily_stats;
    CREATE POLICY "Service role only for daily stats" ON affiliate_daily_stats
      FOR ALL
      USING (current_setting('role', true) = 'service_role');
  END IF;
END $$;
