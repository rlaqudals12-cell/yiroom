-- ============================================================
-- 피드 시스템 테이블
-- 뷰티 SNS 피드 기능
-- ============================================================

-- 1. feed_posts 테이블 (피드 포스트)
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 콘텐츠
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  product_ids UUID[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',

  -- 포스트 타입
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'review', 'question', 'tip')),

  -- 통계 (denormalized for performance)
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. feed_interactions 테이블 (좋아요, 저장, 공유)
CREATE TABLE IF NOT EXISTS feed_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 인터랙션 타입
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'share')),

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  CONSTRAINT unique_interaction UNIQUE (post_id, clerk_user_id, interaction_type)
);

-- 3. feed_comments 테이블 (댓글)
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 콘텐츠
  content TEXT NOT NULL,

  -- 대댓글 지원
  parent_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,

  -- 통계
  likes_count INT DEFAULT 0,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- feed_posts RLS
DROP POLICY IF EXISTS "Anyone can read posts" ON feed_posts;
CREATE POLICY "Anyone can read posts"
  ON feed_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own posts" ON feed_posts;
CREATE POLICY "Users can create own posts"
  ON feed_posts FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own posts" ON feed_posts;
CREATE POLICY "Users can update own posts"
  ON feed_posts FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own posts" ON feed_posts;
CREATE POLICY "Users can delete own posts"
  ON feed_posts FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- feed_interactions RLS
DROP POLICY IF EXISTS "Anyone can read interactions" ON feed_interactions;
CREATE POLICY "Anyone can read interactions"
  ON feed_interactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own interactions" ON feed_interactions;
CREATE POLICY "Users can create own interactions"
  ON feed_interactions FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own interactions" ON feed_interactions;
CREATE POLICY "Users can delete own interactions"
  ON feed_interactions FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- feed_comments RLS
DROP POLICY IF EXISTS "Anyone can read comments" ON feed_comments;
CREATE POLICY "Anyone can read comments"
  ON feed_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON feed_comments;
CREATE POLICY "Users can create comments"
  ON feed_comments FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own comments" ON feed_comments;
CREATE POLICY "Users can update own comments"
  ON feed_comments FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own comments" ON feed_comments;
CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON feed_posts(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_type ON feed_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_feed_posts_hashtags ON feed_posts USING GIN(hashtags);

CREATE INDEX IF NOT EXISTS idx_feed_interactions_post ON feed_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_user ON feed_interactions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_type ON feed_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON feed_comments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent ON feed_comments(parent_id);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_feed_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feed_posts_updated_at ON feed_posts;
CREATE TRIGGER trigger_feed_posts_updated_at
  BEFORE UPDATE ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_posts_updated_at();

-- ============================================================
-- 카운트 업데이트 함수
-- ============================================================

-- 좋아요 추가 시 likes_count 증가
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'like' THEN
    UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'like' THEN
    UPDATE feed_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON feed_interactions;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON feed_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 저장 추가 시 saves_count 증가
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'save' THEN
    UPDATE feed_posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'save' THEN
    UPDATE feed_posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_saves_count ON feed_interactions;
CREATE TRIGGER trigger_update_post_saves_count
  AFTER INSERT OR DELETE ON feed_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_saves_count();

-- 댓글 추가 시 comments_count 증가
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON feed_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- ============================================================
-- Storage bucket for feed images
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view feed images" ON storage.objects;
CREATE POLICY "Anyone can view feed images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-images');

DROP POLICY IF EXISTS "Authenticated users can upload feed images" ON storage.objects;
CREATE POLICY "Authenticated users can upload feed images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feed-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;
CREATE POLICY "Users can delete own feed images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feed-images' AND auth.uid()::text = (storage.foldername(name))[1]);
