-- ============================================================
-- 공지사항 시스템
-- Sprint D Day 8: 운영 기능
-- ============================================================

-- 1. announcements: 공지사항
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'update', 'event', 'maintenance', 'important')),
  priority INTEGER NOT NULL DEFAULT 0,  -- 높을수록 상단 표시
  is_pinned BOOLEAN NOT NULL DEFAULT false,  -- 상단 고정
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,  -- NULL이면 만료 없음
  author_id VARCHAR(255) NOT NULL,  -- clerk_user_id (관리자)
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. announcement_reads: 공지사항 읽음 표시
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 한 사용자가 같은 공지사항을 중복 읽음 처리 방지
  UNIQUE (announcement_id, clerk_user_id)
);

-- 3. faqs: FAQ 항목
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'account', 'workout', 'nutrition', 'subscription', 'technical')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 인덱스
-- ============================================================

-- announcements 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_category
  ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_published
  ON announcements(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned
  ON announcements(is_pinned DESC, priority DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires
  ON announcements(expires_at);

-- announcement_reads 인덱스
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON announcement_reads(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement
  ON announcement_reads(announcement_id);

-- faqs 인덱스
CREATE INDEX IF NOT EXISTS idx_faqs_category
  ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published
  ON faqs(is_published, sort_order);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- announcements RLS (발행된 공지만 조회 가능)
CREATE POLICY "Anyone can view published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- 관리자 전용 정책은 service_role로 처리

-- announcement_reads RLS
CREATE POLICY "Users can view their own reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can mark as read"
  ON announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- faqs RLS (발행된 FAQ만 조회 가능)
CREATE POLICY "Anyone can view published FAQs"
  ON faqs FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ============================================================
-- Trigger: updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();

-- ============================================================
-- 시드 데이터: FAQ
-- ============================================================

INSERT INTO faqs (category, question, answer, sort_order) VALUES
-- 일반
('general', '이룸은 어떤 앱인가요?', '이룸은 운동, 영양, 피부, 체형 분석을 통합적으로 관리할 수 있는 웰니스 플랫폼입니다. AI 기반 분석과 맞춤형 추천을 제공합니다.', 1),
('general', '이룸 사용에 비용이 드나요?', '기본 기능은 무료로 제공됩니다. 프리미엄 기능을 사용하시려면 구독이 필요합니다.', 2),
('general', '데이터는 어디에 저장되나요?', '모든 데이터는 안전하게 암호화되어 클라우드 서버에 저장됩니다. 개인정보는 철저히 보호됩니다.', 3),

-- 계정
('account', '회원가입은 어떻게 하나요?', '앱 첫 화면에서 이메일, Google, 또는 Apple 계정으로 간편하게 가입할 수 있습니다.', 1),
('account', '비밀번호를 잊어버렸어요.', '로그인 화면에서 "비밀번호 찾기"를 눌러 이메일로 재설정 링크를 받으세요.', 2),
('account', '계정을 삭제하고 싶어요.', '설정 > 계정 > 계정 삭제에서 진행할 수 있습니다. 삭제된 데이터는 복구할 수 없습니다.', 3),

-- 운동
('workout', '운동 분석은 어떻게 받나요?', '운동 온보딩 질문에 답변하면 AI가 당신에게 맞는 운동 타입을 분석해드립니다.', 1),
('workout', '운동 기록은 어떻게 하나요?', '대시보드에서 운동 기록 버튼을 누르고, 오늘 한 운동을 선택하세요.', 2),
('workout', '운동 스트릭은 어떻게 유지하나요?', '매일 최소 1개의 운동을 기록하면 스트릭이 유지됩니다.', 3),

-- 영양
('nutrition', '음식 기록은 어떻게 하나요?', '영양 탭에서 "식사 기록" 버튼을 누르고, 음식을 검색하거나 사진으로 인식할 수 있습니다.', 1),
('nutrition', '칼로리 목표는 어떻게 설정하나요?', '설정 > 영양 설정에서 목표 칼로리, 단백질, 탄수화물, 지방 목표를 설정할 수 있습니다.', 2),
('nutrition', '물 섭취는 왜 중요한가요?', '충분한 수분 섭취는 신진대사, 피부 건강, 운동 성능에 모두 중요합니다. 하루 2L를 목표로 하세요.', 3),

-- 구독
('subscription', '프리미엄에서 제공되는 기능은?', '상세 분석 리포트, AI 맞춤 추천, 무제한 제품 매칭, 광고 제거 등이 포함됩니다.', 1),
('subscription', '구독을 취소하면 어떻게 되나요?', '결제 주기가 끝날 때까지 프리미엄 기능을 사용할 수 있습니다. 이후 무료 버전으로 전환됩니다.', 2),

-- 기술
('technical', '앱이 제대로 작동하지 않아요.', '앱을 완전히 종료하고 다시 시작해보세요. 문제가 지속되면 피드백을 보내주세요.', 1),
('technical', '데이터 동기화가 안 돼요.', '인터넷 연결을 확인하고, 앱을 새로고침해보세요. 문제가 지속되면 재로그인을 시도하세요.', 2)

ON CONFLICT DO NOTHING;

-- ============================================================
-- 주석
-- ============================================================

COMMENT ON TABLE announcements IS '공지사항';
COMMENT ON TABLE announcement_reads IS '공지사항 읽음 표시';
COMMENT ON TABLE faqs IS 'FAQ (자주 묻는 질문)';

COMMENT ON COLUMN announcements.category IS 'general: 일반, update: 업데이트, event: 이벤트, maintenance: 점검, important: 중요';
COMMENT ON COLUMN announcements.priority IS '높을수록 상단 표시';
COMMENT ON COLUMN announcements.is_pinned IS '상단 고정 여부';

COMMENT ON COLUMN faqs.category IS 'general: 일반, account: 계정, workout: 운동, nutrition: 영양, subscription: 구독, technical: 기술';
COMMENT ON COLUMN faqs.helpful_count IS '도움됨 횟수';
