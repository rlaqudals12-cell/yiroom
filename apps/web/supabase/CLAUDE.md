# 📊 supabase/CLAUDE.md - Supabase & DB 규칙

## 폴더 구조
```
supabase/
├── config.toml       # Supabase 설정
├── migrations/       # DB 마이그레이션
│   ├── 001_init.sql
│   └── ...
└── functions/        # Edge Functions
```

## 마이그레이션 규칙
```yaml
파일명: [번호]_[설명].sql
예시: 001_create_users_table.sql

순서:
  1. 테이블 생성 (CREATE TABLE)
  2. 인덱스 생성 (CREATE INDEX)
  3. RLS 정책 (CREATE POLICY)
  4. 함수/트리거
```

## 테이블 네이밍
```yaml
테이블: snake_case, 복수형
  예: users, skin_analyses, personal_colors

컬럼: snake_case
  예: user_id, created_at, skin_type

외래키: [참조테이블]_id
  예: user_id, analysis_id
```

## 필수 컬럼
```sql
-- 모든 테이블에 포함
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- 사용자 데이터 테이블
clerk_user_id TEXT NOT NULL  -- Clerk 인증 연동
```

## RLS 정책 (필수!)
```sql
-- 모든 사용자 데이터 테이블에 적용
ALTER TABLE [테이블] ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회
CREATE POLICY "Users can view own data"
ON [테이블] FOR SELECT
USING (clerk_user_id = auth.jwt()->>'sub');

-- 본인 데이터만 수정
CREATE POLICY "Users can update own data"
ON [테이블] FOR UPDATE
USING (clerk_user_id = auth.jwt()->>'sub');
```

## 클라이언트 사용
```typescript
// lib/supabase/client.ts - 클라이언트 사이드
import { createClient } from './client'
const supabase = createClient()

// lib/supabase/server.ts - 서버 사이드
import { createClient } from './server'
const supabase = createClient()
```

## 쿼리 패턴
```typescript
// SELECT
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// INSERT
const { data, error } = await supabase
  .from('skin_analyses')
  .insert({ clerk_user_id, skin_type, ... })
  .select()
  .single()

// UPDATE
const { data, error } = await supabase
  .from('users')
  .update({ name: '새이름' })
  .eq('id', userId)
```

## 로컬 개발
```bash
npx supabase start     # 로컬 Supabase 시작
npx supabase stop      # 중지
npx supabase db reset  # DB 리셋
npx supabase migration new [이름]  # 새 마이그레이션
```

## 주의사항
- ❌ RLS 없이 테이블 생성 금지
- ❌ 프로덕션 DB 직접 수정 금지
- ✅ 모든 변경은 마이그레이션으로
- ✅ clerk_user_id로 사용자 식별
