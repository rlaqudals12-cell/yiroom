-- AI 코치 채팅 히스토리 테이블
-- Phase K: 채팅 기록 저장 및 세션 관리

-- 채팅 세션 테이블
CREATE TABLE IF NOT EXISTS coach_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    title TEXT, -- 세션 제목 (첫 질문 기반 자동 생성)
    category TEXT DEFAULT 'general', -- 주요 카테고리
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_coach_sessions_user FOREIGN KEY (clerk_user_id)
        REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    suggested_questions JSONB, -- 추천 질문 목록
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_coach_sessions_user ON coach_sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_updated ON coach_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_session ON coach_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_created ON coach_messages(created_at);

-- 메시지 수 업데이트 트리거
CREATE OR REPLACE FUNCTION update_coach_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coach_sessions
    SET message_count = (
        SELECT COUNT(*) FROM coach_messages WHERE session_id = NEW.session_id
    ),
    updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_coach_message_count ON coach_messages;
CREATE TRIGGER trigger_coach_message_count
    AFTER INSERT ON coach_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_coach_session_message_count();

-- RLS 정책
ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- coach_sessions RLS
DROP POLICY IF EXISTS "Users can view own coach sessions" ON coach_sessions;
CREATE POLICY "Users can view own coach sessions"
    ON coach_sessions FOR SELECT
    USING (clerk_user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own coach sessions" ON coach_sessions;
CREATE POLICY "Users can insert own coach sessions"
    ON coach_sessions FOR INSERT
    WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own coach sessions" ON coach_sessions;
CREATE POLICY "Users can update own coach sessions"
    ON coach_sessions FOR UPDATE
    USING (clerk_user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can delete own coach sessions" ON coach_sessions;
CREATE POLICY "Users can delete own coach sessions"
    ON coach_sessions FOR DELETE
    USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- coach_messages RLS (세션 소유자만 접근)
DROP POLICY IF EXISTS "Users can view own coach messages" ON coach_messages;
CREATE POLICY "Users can view own coach messages"
    ON coach_messages FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM coach_sessions
            WHERE clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

DROP POLICY IF EXISTS "Users can insert own coach messages" ON coach_messages;
CREATE POLICY "Users can insert own coach messages"
    ON coach_messages FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM coach_sessions
            WHERE clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- 댓글: 30일 이상 된 세션은 자동 정리 가능 (선택적)
COMMENT ON TABLE coach_sessions IS 'AI 코치 채팅 세션';
COMMENT ON TABLE coach_messages IS 'AI 코치 채팅 메시지';
