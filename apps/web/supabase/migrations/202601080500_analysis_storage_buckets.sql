-- Analysis Storage Buckets 생성 및 RLS 정책 설정
-- SDD-VISUAL-SKIN-REPORT.md Phase 2: 이미지 저장 동의 시스템
-- 분석 타입별 이미지 저장 버킷 (skin, body, personal-color)

-- 1. skin-images 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skin-images',
  'skin-images',
  false,  -- private bucket
  10485760,  -- 10MB 제한 (10 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. body-images 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'body-images',
  'body-images',
  false,  -- private bucket
  10485760,  -- 10MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. personal-color-images 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personal-color-images',
  'personal-color-images',
  false,  -- private bucket
  10485760,  -- 10MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- =============================================================================
-- skin-images RLS 정책
-- =============================================================================

-- INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
DROP POLICY IF EXISTS "Users can upload skin images" ON storage.objects;
CREATE POLICY "Users can upload skin images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'skin-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- SELECT: 인증된 사용자만 자신의 파일 조회 가능
DROP POLICY IF EXISTS "Users can view own skin images" ON storage.objects;
CREATE POLICY "Users can view own skin images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'skin-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- DELETE: 인증된 사용자만 자신의 파일 삭제 가능
DROP POLICY IF EXISTS "Users can delete own skin images" ON storage.objects;
CREATE POLICY "Users can delete own skin images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'skin-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- =============================================================================
-- body-images RLS 정책
-- =============================================================================

-- INSERT
DROP POLICY IF EXISTS "Users can upload body images" ON storage.objects;
CREATE POLICY "Users can upload body images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'body-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- SELECT
DROP POLICY IF EXISTS "Users can view own body images" ON storage.objects;
CREATE POLICY "Users can view own body images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'body-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- DELETE
DROP POLICY IF EXISTS "Users can delete own body images" ON storage.objects;
CREATE POLICY "Users can delete own body images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'body-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- =============================================================================
-- personal-color-images RLS 정책
-- =============================================================================

-- INSERT
DROP POLICY IF EXISTS "Users can upload pc images" ON storage.objects;
CREATE POLICY "Users can upload pc images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal-color-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- SELECT
DROP POLICY IF EXISTS "Users can view own pc images" ON storage.objects;
CREATE POLICY "Users can view own pc images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personal-color-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- DELETE
DROP POLICY IF EXISTS "Users can delete own pc images" ON storage.objects;
CREATE POLICY "Users can delete own pc images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal-color-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- =============================================================================
-- Service Role은 모든 버킷에 접근 가능 (기본 설정으로 이미 허용됨)
-- 동의 철회 시 이미지 삭제에 사용
-- =============================================================================
