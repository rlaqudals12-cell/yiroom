/**
 * cleanup-expired-consents Edge Function
 * 만료된 이미지 저장 동의 자동 정리 (GDPR/PIPA 준수)
 *
 * SDD-VISUAL-SKIN-REPORT.md §4.5 - 자동 만료 처리
 *
 * 실행 주기: 매일 03:00 KST (cron: 0 18 * * *)
 *
 * 처리 로직:
 * 1. retention_until이 지난 동의 레코드 조회
 * 2. 각 레코드의 이미지 스토리지에서 삭제
 * 3. 동의 레코드 soft delete (consent_given = false)
 * 4. 처리 결과 로깅
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 분석 타입별 스토리지 버킷 매핑
const ANALYSIS_STORAGE_BUCKETS: Record<string, string> = {
  skin: 'skin-images',
  body: 'body-images',
  'personal-color': 'personal-color-images',
};

interface ExpiredConsent {
  id: string;
  clerk_user_id: string;
  analysis_type: string;
  retention_until: string;
}

Deno.serve(async (req) => {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성 (Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 만료된 동의 레코드 조회
    const now = new Date().toISOString();
    const { data: expiredConsents, error: fetchError } = await supabase
      .from('image_consents')
      .select('id, clerk_user_id, analysis_type, retention_until')
      .eq('consent_given', true)
      .lt('retention_until', now)
      .limit(100); // 배치 처리 (한 번에 100개)

    if (fetchError) {
      console.error('[Cleanup] Failed to fetch expired consents:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch expired consents' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!expiredConsents || expiredConsents.length === 0) {
      console.log('[Cleanup] No expired consents found');
      return new Response(
        JSON.stringify({ message: 'No expired consents to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Cleanup] Found ${expiredConsents.length} expired consents`);

    // 2. 각 레코드 처리
    let processedCount = 0;
    let deletedImagesCount = 0;
    const errors: string[] = [];

    for (const consent of expiredConsents as ExpiredConsent[]) {
      try {
        const bucketName = ANALYSIS_STORAGE_BUCKETS[consent.analysis_type];

        if (bucketName) {
          // 사용자 이미지 폴더 조회
          const { data: files, error: listError } = await supabase.storage
            .from(bucketName)
            .list(consent.clerk_user_id);

          if (listError) {
            console.warn(`[Cleanup] Storage list error for ${consent.clerk_user_id}:`, listError);
          } else if (files && files.length > 0) {
            // 이미지 삭제
            const filePaths = files.map((file) => `${consent.clerk_user_id}/${file.name}`);
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove(filePaths);

            if (deleteError) {
              console.error(`[Cleanup] Storage delete error:`, deleteError);
            } else {
              deletedImagesCount += filePaths.length;
              console.log(
                `[Cleanup] Deleted ${filePaths.length} images for ${consent.clerk_user_id}`
              );
            }
          }
        }

        // 3. 동의 레코드 soft delete
        const { error: updateError } = await supabase
          .from('image_consents')
          .update({
            consent_given: false,
            withdrawal_at: new Date().toISOString(),
          })
          .eq('id', consent.id);

        if (updateError) {
          console.error(`[Cleanup] Update error for consent ${consent.id}:`, updateError);
          errors.push(`Failed to update consent ${consent.id}`);
        } else {
          processedCount++;
        }
      } catch (err) {
        console.error(`[Cleanup] Error processing consent ${consent.id}:`, err);
        errors.push(`Error processing consent ${consent.id}`);
      }
    }

    // 4. 결과 반환
    const result = {
      message: 'Cleanup completed',
      processed: processedCount,
      deletedImages: deletedImagesCount,
      total: expiredConsents.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[Cleanup] Result:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Cleanup] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
