-- 하이브리드 UX/UI 기능 테이블
-- 성분/소재 즐겨찾기, 루틴, 룩북

-- 1. 성분/소재 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('beauty', 'style')),
  item_type TEXT NOT NULL CHECK (item_type IN ('ingredient', 'material')),
  item_name TEXT NOT NULL,
  item_name_en TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT true, -- true = 좋아함, false = 기피
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, domain, item_type, item_name)
);

-- 2. 사용자 루틴 테이블
CREATE TABLE IF NOT EXISTS user_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('beauty', 'style')),
  routine_type TEXT NOT NULL, -- 예: 'skincare_morning', 'outfit_daily'
  items JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 룩북 포스트 테이블
CREATE TABLE IF NOT EXISTS lookbook_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  body_type TEXT CHECK (body_type IN ('S', 'W', 'N')),
  personal_color TEXT CHECK (personal_color IN ('Spring', 'Summer', 'Autumn', 'Winter')),
  outfit_items JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 룩북 좋아요 테이블
CREATE TABLE IF NOT EXISTS lookbook_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES lookbook_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, clerk_user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_domain ON user_favorites(domain, item_type);
CREATE INDEX IF NOT EXISTS idx_user_routines_user ON user_routines(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_domain ON user_routines(domain, routine_type);
CREATE INDEX IF NOT EXISTS idx_lookbook_posts_user ON lookbook_posts(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_lookbook_posts_public ON lookbook_posts(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lookbook_likes_post ON lookbook_likes(post_id);

-- RLS 정책 활성화
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_likes ENABLE ROW LEVEL SECURITY;

-- user_favorites RLS 정책
CREATE POLICY "user_favorites_select_own" ON user_favorites
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_favorites_insert_own" ON user_favorites
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_favorites_update_own" ON user_favorites
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_favorites_delete_own" ON user_favorites
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- user_routines RLS 정책
CREATE POLICY "user_routines_select_own" ON user_routines
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_routines_insert_own" ON user_routines
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_routines_update_own" ON user_routines
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_routines_delete_own" ON user_routines
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- lookbook_posts RLS 정책
CREATE POLICY "lookbook_posts_select_public" ON lookbook_posts
  FOR SELECT USING (is_public = true OR clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "lookbook_posts_insert_own" ON lookbook_posts
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "lookbook_posts_update_own" ON lookbook_posts
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "lookbook_posts_delete_own" ON lookbook_posts
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- lookbook_likes RLS 정책
CREATE POLICY "lookbook_likes_select_all" ON lookbook_likes
  FOR SELECT USING (true);

CREATE POLICY "lookbook_likes_insert_own" ON lookbook_likes
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "lookbook_likes_delete_own" ON lookbook_likes
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 좋아요 카운트 동기화 함수
CREATE OR REPLACE FUNCTION update_lookbook_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lookbook_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lookbook_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 트리거
DROP TRIGGER IF EXISTS trg_lookbook_likes_count ON lookbook_likes;
CREATE TRIGGER trg_lookbook_likes_count
AFTER INSERT OR DELETE ON lookbook_likes
FOR EACH ROW EXECUTE FUNCTION update_lookbook_likes_count();

-- updated_at 자동 업데이트 트리거 (user_routines)
CREATE OR REPLACE FUNCTION update_user_routines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_routines_updated_at ON user_routines;
CREATE TRIGGER trg_user_routines_updated_at
BEFORE UPDATE ON user_routines
FOR EACH ROW EXECUTE FUNCTION update_user_routines_updated_at();
