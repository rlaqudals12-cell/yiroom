-- ============================================================
-- 소셜 활동 테이블
-- Week 2: 소셜 피드 완성
-- ============================================================

-- 1. social_activities: 사용자 활동 (피드)
CREATE TABLE IF NOT EXISTS social_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
    'workout_complete', 'challenge_join', 'challenge_complete',
    'streak_achieved', 'level_up', 'badge_earned'
  )),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. activity_likes: 활동 좋아요
CREATE TABLE IF NOT EXISTS activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES social_activities(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, clerk_user_id)
);

-- 3. activity_comments: 활동 댓글
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES social_activities(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 인덱스
-- ============================================================

-- social_activities
CREATE INDEX IF NOT EXISTS idx_social_activities_clerk_user_id
  ON social_activities(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_social_activities_type
  ON social_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_social_activities_created_at
  ON social_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_activities_public_feed
  ON social_activities(created_at DESC) WHERE is_public = true;

-- activity_likes
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id
  ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_clerk_user_id
  ON activity_likes(clerk_user_id);

-- activity_comments
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id
  ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_clerk_user_id
  ON activity_comments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at
  ON activity_comments(created_at DESC);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- social_activities 정책
-- 공개 활동은 모든 인증 사용자가 조회 가능
CREATE POLICY "Users can view public activities"
  ON social_activities FOR SELECT
  TO authenticated
  USING (is_public = true);

-- 본인 활동 조회 (비공개 포함)
CREATE POLICY "Users can view own activities"
  ON social_activities FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 활동 생성
CREATE POLICY "Users can create activities"
  ON social_activities FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 본인 활동 수정/삭제
CREATE POLICY "Users can update own activities"
  ON social_activities FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own activities"
  ON social_activities FOR DELETE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- activity_likes 정책
-- 모든 인증 사용자가 좋아요 조회 가능
CREATE POLICY "Users can view likes"
  ON activity_likes FOR SELECT
  TO authenticated
  USING (true);

-- 좋아요 생성
CREATE POLICY "Users can create likes"
  ON activity_likes FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 본인 좋아요 삭제
CREATE POLICY "Users can delete own likes"
  ON activity_likes FOR DELETE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- activity_comments 정책
-- 모든 인증 사용자가 댓글 조회 가능
CREATE POLICY "Users can view comments"
  ON activity_comments FOR SELECT
  TO authenticated
  USING (true);

-- 댓글 생성
CREATE POLICY "Users can create comments"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 본인 댓글 수정/삭제
CREATE POLICY "Users can update own comments"
  ON activity_comments FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own comments"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================================
-- Trigger: 좋아요/댓글 카운트 업데이트
-- ============================================================

-- 좋아요 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION update_activity_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_activities
    SET likes_count = likes_count + 1
    WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_activities
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON activity_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_likes_count();

-- 댓글 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION update_activity_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_activities
    SET comments_count = comments_count + 1
    WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_activities
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_comments_count();

-- 댓글 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_updated_at
  BEFORE UPDATE ON activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- ============================================================
-- 주석
-- ============================================================

COMMENT ON TABLE social_activities IS '사용자 활동 피드 (운동 완료, 챌린지, 뱃지 등)';
COMMENT ON COLUMN social_activities.activity_type IS '활동 유형: workout_complete, challenge_join, challenge_complete, streak_achieved, level_up, badge_earned';
COMMENT ON COLUMN social_activities.metadata IS '활동 유형별 추가 데이터 (JSONB)';
COMMENT ON COLUMN social_activities.is_public IS '피드에 공개 여부';

COMMENT ON TABLE activity_likes IS '활동 좋아요';
COMMENT ON TABLE activity_comments IS '활동 댓글';
