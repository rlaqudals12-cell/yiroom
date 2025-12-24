-- ============================================================
-- 팀 챌린지 테이블
-- Sprint C Day 7: 챌린지 확장
-- ============================================================

-- 1. challenge_teams: 챌린지 팀
CREATE TABLE IF NOT EXISTS challenge_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  leader_id VARCHAR(255) NOT NULL,  -- clerk_user_id
  max_members INTEGER NOT NULL DEFAULT 4 CHECK (max_members >= 2 AND max_members <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. team_members: 팀 멤버
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES challenge_teams(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  joined_at TIMESTAMP WITH TIME ZONE,
  progress JSONB DEFAULT '{"percentage": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 한 팀에 같은 사용자 중복 방지
  UNIQUE (team_id, clerk_user_id)
);

-- 3. challenge_invites: 챌린지 초대
CREATE TABLE IF NOT EXISTS challenge_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES challenge_teams(id) ON DELETE CASCADE,
  inviter_id VARCHAR(255) NOT NULL,  -- clerk_user_id
  invitee_id VARCHAR(255) NOT NULL,  -- clerk_user_id
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 같은 팀에 같은 사용자 중복 초대 방지
  UNIQUE (team_id, invitee_id)
);

-- ============================================================
-- 인덱스
-- ============================================================

-- challenge_teams 인덱스
CREATE INDEX IF NOT EXISTS idx_challenge_teams_challenge_id
  ON challenge_teams(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_teams_leader_id
  ON challenge_teams(leader_id);

-- team_members 인덱스
CREATE INDEX IF NOT EXISTS idx_team_members_team_id
  ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_clerk_user_id
  ON team_members(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status
  ON team_members(status);

-- challenge_invites 인덱스
CREATE INDEX IF NOT EXISTS idx_challenge_invites_team_id
  ON challenge_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_invitee_id
  ON challenge_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_status
  ON challenge_invites(status);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_expires_at
  ON challenge_invites(expires_at);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_invites ENABLE ROW LEVEL SECURITY;

-- challenge_teams RLS
CREATE POLICY "Users can view all teams"
  ON challenge_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create teams"
  ON challenge_teams FOR INSERT
  TO authenticated
  WITH CHECK (leader_id = auth.jwt() ->> 'sub');

CREATE POLICY "Leaders can update their teams"
  ON challenge_teams FOR UPDATE
  TO authenticated
  USING (leader_id = auth.jwt() ->> 'sub');

CREATE POLICY "Leaders can delete their teams"
  ON challenge_teams FOR DELETE
  TO authenticated
  USING (leader_id = auth.jwt() ->> 'sub');

-- team_members RLS
CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Leaders can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_teams
      WHERE id = team_id AND leader_id = auth.jwt() ->> 'sub'
    )
    OR clerk_user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Members can update their own status"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    clerk_user_id = auth.jwt() ->> 'sub'
    OR EXISTS (
      SELECT 1 FROM challenge_teams
      WHERE id = team_id AND leader_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Leaders can remove members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    clerk_user_id = auth.jwt() ->> 'sub'
    OR EXISTS (
      SELECT 1 FROM challenge_teams
      WHERE id = team_id AND leader_id = auth.jwt() ->> 'sub'
    )
  );

-- challenge_invites RLS
CREATE POLICY "Users can view their invites"
  ON challenge_invites FOR SELECT
  TO authenticated
  USING (
    inviter_id = auth.jwt() ->> 'sub'
    OR invitee_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can create invites"
  ON challenge_invites FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.jwt() ->> 'sub');

CREATE POLICY "Invitees can update invite status"
  ON challenge_invites FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.jwt() ->> 'sub');

CREATE POLICY "Inviters can delete invites"
  ON challenge_invites FOR DELETE
  TO authenticated
  USING (inviter_id = auth.jwt() ->> 'sub');

-- ============================================================
-- Trigger: updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION update_challenge_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_challenge_teams_updated_at
  BEFORE UPDATE ON challenge_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_teams_updated_at();

-- ============================================================
-- 주석
-- ============================================================

COMMENT ON TABLE challenge_teams IS '챌린지 팀';
COMMENT ON TABLE team_members IS '팀 멤버';
COMMENT ON TABLE challenge_invites IS '챌린지 초대';

COMMENT ON COLUMN challenge_teams.leader_id IS '팀장 clerk_user_id';
COMMENT ON COLUMN challenge_teams.max_members IS '최대 멤버 수 (2-10)';

COMMENT ON COLUMN team_members.role IS 'leader: 팀장, member: 팀원';
COMMENT ON COLUMN team_members.status IS 'pending: 대기, accepted: 참여, declined: 거절';
COMMENT ON COLUMN team_members.progress IS '개인 진행 상황 JSONB';

COMMENT ON COLUMN challenge_invites.expires_at IS '초대 만료 시간 (기본 7일)';
