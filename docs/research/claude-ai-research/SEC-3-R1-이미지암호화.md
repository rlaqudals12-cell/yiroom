# SEC-3-R1: 이미지 암호화

> 저장 시 암호화(At Rest) 및 전송 시 암호화(In Transit) 전략

## 1. 리서치 배경

### 1.1 현재 상황

이룸 프로젝트는 사용자 얼굴 이미지를 AI 분석에 사용합니다. 이미지는 민감한 생체 데이터로 분류되며, 저장 및 전송 과정에서 강력한 암호화가 필수입니다.

### 1.2 리서치 목표

- Supabase Storage 암호화 이해
- 클라이언트-서버 전송 암호화
- 이미지 접근 제어 강화

## 2. 전송 시 암호화 (In Transit)

### 2.1 TLS 1.3 강제

```typescript
// next.config.js
module.exports = {
  // HTTPS 강제 (Vercel 자동 적용)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            // HSTS: 2년간 HTTPS 강제, 서브도메인 포함
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
```

### 2.2 이미지 업로드 암호화

```typescript
// lib/upload/secure-upload.ts
interface SecureUploadOptions {
  file: File;
  userId: string;
  purpose: 'analysis' | 'profile';
}

export async function secureImageUpload(
  options: SecureUploadOptions
): Promise<string> {
  const { file, userId, purpose } = options;

  // 1. 클라이언트 사이드 검증
  validateImageFile(file);

  // 2. 이미지 압축 및 리사이즈 (전송 최적화)
  const optimizedImage = await optimizeImage(file, {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
  });

  // 3. FormData로 전송 (TLS로 자동 암호화)
  const formData = new FormData();
  formData.append('image', optimizedImage);
  formData.append('purpose', purpose);

  // 4. 서버로 업로드
  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData,
    // credentials 포함하여 인증 토큰 전송
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const { imageUrl } = await response.json();
  return imageUrl;
}

function validateImageFile(file: File): void {
  // 허용된 MIME 타입
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format');
  }

  // 최대 크기 10MB
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Image too large');
  }
}
```

### 2.3 이미지 최적화

```typescript
// lib/upload/optimize-image.ts
interface OptimizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export async function optimizeImage(
  file: File,
  options: OptimizeOptions
): Promise<Blob> {
  const { maxWidth, maxHeight, quality } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 비율 유지 리사이즈
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Canvas로 리사이즈
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 변환 (EXIF 제거됨)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob conversion failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}
```

## 3. 저장 시 암호화 (At Rest)

### 3.1 Supabase Storage 설정

```typescript
// lib/supabase/storage-config.ts

// Supabase Storage는 기본적으로 AES-256 암호화 적용
// - 서버 사이드 암호화 (SSE-S3)
// - 객체별 암호화 키 자동 관리

export const STORAGE_CONFIG = {
  // 비공개 버킷 (RLS 적용)
  buckets: {
    userImages: {
      name: 'user-images',
      public: false,  // 비공개
      fileSizeLimit: 10 * 1024 * 1024,  // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    analysisResults: {
      name: 'analysis-results',
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
    },
  },

  // 서명된 URL 설정
  signedUrl: {
    expiresIn: 3600,  // 1시간 만료
    download: false,   // 브라우저에서 직접 표시
  },
};
```

### 3.2 Storage RLS 정책

```sql
-- user-images 버킷 RLS 정책

-- 본인 폴더에만 업로드 가능
CREATE POLICY "user_upload_own_folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-images'
    AND (storage.foldername(name))[1] = auth.clerk_user_id()
  );

-- 본인 이미지만 조회 가능
CREATE POLICY "user_view_own_images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-images'
    AND (storage.foldername(name))[1] = auth.clerk_user_id()
  );

-- 본인 이미지만 삭제 가능
CREATE POLICY "user_delete_own_images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-images'
    AND (storage.foldername(name))[1] = auth.clerk_user_id()
  );
```

### 3.3 서버 사이드 업로드

```typescript
// app/api/upload/image/route.ts
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('image') as File;
  const purpose = formData.get('purpose') as string;

  if (!file || !purpose) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  // 파일 검증
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // 고유 파일명 생성 (UUID + 타임스탬프)
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${purpose}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  // Supabase Storage에 업로드 (자동 AES-256 암호화)
  const { data, error } = await supabase.storage
    .from('user-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('[Upload] Storage error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  // 서명된 URL 생성 (1시간 유효)
  const { data: signedData } = await supabase.storage
    .from('user-images')
    .createSignedUrl(data.path, 3600);

  return NextResponse.json({
    success: true,
    path: data.path,
    signedUrl: signedData?.signedUrl,
  });
}
```

## 4. 서명된 URL (Signed URL)

### 4.1 서명된 URL 생성

```typescript
// lib/storage/signed-url.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface SignedUrlOptions {
  path: string;
  expiresIn?: number;  // 초 단위
  download?: boolean;
}

export async function createSignedImageUrl(
  options: SignedUrlOptions
): Promise<string | null> {
  const { path, expiresIn = 3600, download = false } = options;

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from('user-images')
    .createSignedUrl(path, expiresIn, {
      download,
      // transform: 이미지 변환 옵션 (선택)
      // transform: {
      //   width: 400,
      //   height: 400,
      //   resize: 'cover',
      // },
    });

  if (error) {
    console.error('[Storage] Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

// 분석 결과 이미지용 단기 URL
export async function createAnalysisImageUrl(
  path: string
): Promise<string | null> {
  // 분석용 이미지는 5분만 유효 (보안 강화)
  return createSignedImageUrl({
    path,
    expiresIn: 300,
    download: false,
  });
}
```

### 4.2 클라이언트에서 서명된 URL 사용

```typescript
// hooks/useSecureImage.ts
import { useState, useEffect } from 'react';

export function useSecureImage(imagePath: string | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    async function fetchSignedUrl() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/storage/signed-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: imagePath }),
        });

        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }

        const { signedUrl } = await response.json();
        setImageUrl(signedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSignedUrl();

    // 50분마다 URL 갱신 (1시간 만료 전)
    const interval = setInterval(fetchSignedUrl, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [imagePath]);

  return { imageUrl, isLoading, error };
}
```

## 5. 추가 암호화 (애플리케이션 레벨)

### 5.1 민감 메타데이터 암호화

```typescript
// lib/encryption/metadata-encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.METADATA_ENCRYPTION_KEY!, 'hex');

interface EncryptedData {
  iv: string;
  encrypted: string;
  tag: string;
}

export function encryptMetadata(data: object): EncryptedData {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encrypted,
    tag: cipher.getAuthTag().toString('hex'),
  };
}

export function decryptMetadata<T>(data: EncryptedData): T {
  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(data.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
```

### 5.2 이미지 메타데이터 보호

```typescript
// lib/storage/secure-metadata.ts
import { encryptMetadata, decryptMetadata } from '../encryption/metadata-encryption';

interface ImageMetadata {
  originalName: string;
  uploadedAt: string;
  purpose: string;
  analysisId?: string;
}

export async function saveImageWithMetadata(
  supabase: SupabaseClient,
  userId: string,
  imagePath: string,
  metadata: ImageMetadata
): Promise<void> {
  // 메타데이터 암호화
  const encryptedMetadata = encryptMetadata(metadata);

  await supabase
    .from('user_images')
    .insert({
      clerk_user_id: userId,
      storage_path: imagePath,
      metadata_iv: encryptedMetadata.iv,
      metadata_encrypted: encryptedMetadata.encrypted,
      metadata_tag: encryptedMetadata.tag,
    });
}

export async function getImageMetadata(
  supabase: SupabaseClient,
  imagePath: string
): Promise<ImageMetadata | null> {
  const { data } = await supabase
    .from('user_images')
    .select('metadata_iv, metadata_encrypted, metadata_tag')
    .eq('storage_path', imagePath)
    .single();

  if (!data) return null;

  return decryptMetadata<ImageMetadata>({
    iv: data.metadata_iv,
    encrypted: data.metadata_encrypted,
    tag: data.metadata_tag,
  });
}
```

## 6. 이미지 삭제 및 익명화

### 6.1 안전한 이미지 삭제

```typescript
// lib/storage/secure-delete.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function secureDeleteImage(
  userId: string,
  imagePath: string
): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  // 1. 소유권 검증
  if (!imagePath.startsWith(`${userId}/`)) {
    console.error('[Security] Unauthorized delete attempt');
    return false;
  }

  // 2. Storage에서 삭제
  const { error: storageError } = await supabase.storage
    .from('user-images')
    .remove([imagePath]);

  if (storageError) {
    console.error('[Storage] Delete error:', storageError);
    return false;
  }

  // 3. 메타데이터 삭제
  await supabase
    .from('user_images')
    .delete()
    .eq('storage_path', imagePath);

  // 4. 감사 로그
  await logAudit('image.deleted', {
    userId,
    imagePath,
    deletedAt: new Date().toISOString(),
  });

  return true;
}
```

### 6.2 자동 이미지 익명화/삭제

```typescript
// app/api/cron/cleanup-images/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // 30일 이상 미접속 사용자 이미지 익명화
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: inactiveUsers } = await supabase
    .from('user_profiles')
    .select('clerk_user_id')
    .lt('last_active_at', thirtyDaysAgo.toISOString());

  let deletedCount = 0;

  for (const user of inactiveUsers || []) {
    // 사용자 이미지 폴더 삭제
    const { data: files } = await supabase.storage
      .from('user-images')
      .list(user.clerk_user_id);

    if (files?.length) {
      const filePaths = files.map(f => `${user.clerk_user_id}/${f.name}`);
      await supabase.storage.from('user-images').remove(filePaths);
      deletedCount += filePaths.length;
    }
  }

  return NextResponse.json({
    success: true,
    deletedImages: deletedCount,
    processedUsers: inactiveUsers?.length || 0,
  });
}
```

## 7. 구현 체크리스트

### 7.1 P0 (필수 구현)

- [ ] HTTPS (TLS 1.3) 강제 적용
- [ ] Supabase Storage 비공개 버킷 설정
- [ ] Storage RLS 정책 적용
- [ ] 서명된 URL 사용 (1시간 만료)

### 7.2 P1 (권장 구현)

- [ ] 이미지 업로드 전 최적화/리사이즈
- [ ] EXIF 메타데이터 자동 제거
- [ ] 민감 메타데이터 AES-256-GCM 암호화
- [ ] 이미지 삭제 감사 로깅

### 7.3 P2 (고급 구현)

- [ ] 클라이언트 사이드 암호화 (E2E)
- [ ] 30일 미접속 자동 이미지 삭제
- [ ] 이미지 접근 로깅 및 모니터링
- [ ] 워터마크 추가 (유출 추적)

## 8. 참고 자료

- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [AWS S3 Encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
