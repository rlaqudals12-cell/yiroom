-- 관리자 기능 테이블
-- Feature Flags + Admin Logs

-- ================================================
-- Feature Flags 테이블
-- ================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- RLS 활성화
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자 읽기 가능 (기능 체크용)
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- RLS 정책: 관리자만 수정 가능 (Service Role 사용)
CREATE POLICY "Service role can manage feature flags"
  ON feature_flags FOR ALL
  USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE feature_flags IS '기능 플래그 (Feature Flags)';
COMMENT ON COLUMN feature_flags.key IS '기능 키 (예: workout_module)';
COMMENT ON COLUMN feature_flags.name IS '기능 이름 (예: 운동 모듈)';
COMMENT ON COLUMN feature_flags.enabled IS '활성화 여부';

-- ================================================
-- 초기 Feature Flags 데이터
-- ================================================
INSERT INTO feature_flags (key, name, description, enabled) VALUES
  ('analysis_personal_color', '퍼스널 컬러 분석', 'PC-1 퍼스널 컬러 진단 기능', true),
  ('analysis_skin', '피부 분석', 'S-1 피부 분석 기능', true),
  ('analysis_body', '체형 분석', 'C-1 체형 분석 기능', true),
  ('workout_module', '운동 모듈', 'W-1 운동 온보딩, 기록, 플랜 기능', true),
  ('nutrition_module', '영양 모듈', 'N-1 식단 기록, 칼로리 트래킹 기능', true),
  ('reports_module', '리포트 모듈', 'R-1 주간/월간 리포트 기능', true),
  ('product_recommendations', '제품 추천', '개인화 제품 추천 기능', true),
  ('product_wishlist', '위시리스트', '제품 찜하기 기능', true),
  ('ai_qa', 'AI Q&A', '제품 AI 질의응답 기능', true),
  ('ingredient_warning', '성분 충돌 경고', '영양제/화장품 성분 상호작용 경고', true),
  ('price_crawler', '가격 크롤러', '자동 가격 업데이트 기능', true),
  ('share_results', '결과 공유', '분석 결과 이미지 공유 기능', true)
ON CONFLICT (key) DO NOTHING;

-- ================================================
-- Admin Logs 테이블
-- ================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_logs_clerk_user_id ON admin_logs(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- RLS 활성화
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: Service Role만 접근 가능
CREATE POLICY "Service role can manage admin logs"
  ON admin_logs FOR ALL
  USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE admin_logs IS '관리자 활동 로그';
COMMENT ON COLUMN admin_logs.action IS '액션 (예: product.create, feature.toggle)';
COMMENT ON COLUMN admin_logs.target_type IS '대상 타입 (예: product, feature, user)';
COMMENT ON COLUMN admin_logs.target_id IS '대상 ID';
COMMENT ON COLUMN admin_logs.metadata IS '추가 메타데이터 (JSON)';

-- ================================================
-- Updated At 트리거
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
