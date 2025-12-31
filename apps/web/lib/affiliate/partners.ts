/**
 * 어필리에이트 파트너 Repository
 * @description 파트너 설정 CRUD
 */

import { supabase } from '@/lib/supabase/client';
import { affiliateLogger } from '@/lib/utils/logger';
import type {
  AffiliatePartner,
  AffiliatePartnerRow,
  AffiliatePartnerName,
  AffiliateSyncStatus,
} from '@/types/affiliate';

/**
 * DB Row → 앱 타입 변환
 */
function mapPartnerRow(row: AffiliatePartnerRow): AffiliatePartner {
  return {
    id: row.id,
    name: row.name as AffiliatePartnerName,
    displayName: row.display_name,
    logoUrl: row.logo_url ?? undefined,
    apiType: row.api_type,
    apiEndpoint: row.api_endpoint ?? undefined,
    commissionRateMin: row.commission_rate_min ?? undefined,
    commissionRateMax: row.commission_rate_max ?? undefined,
    cookieDurationDays: row.cookie_duration_days ?? undefined,
    syncFrequencyHours: row.sync_frequency_hours,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
    syncStatus: row.sync_status,
    syncErrorMessage: row.sync_error_message ?? undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 모든 활성 파트너 조회
 */
export async function getAffiliatePartners(): Promise<AffiliatePartner[]> {
  const { data, error } = await supabase
    .from('affiliate_partners')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    affiliateLogger.error('파트너 조회 실패:', error);
    return [];
  }

  return (data as AffiliatePartnerRow[]).map(mapPartnerRow);
}

/**
 * 파트너 이름으로 조회
 */
export async function getAffiliatePartnerByName(
  name: AffiliatePartnerName
): Promise<AffiliatePartner | null> {
  const { data, error } = await supabase
    .from('affiliate_partners')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    affiliateLogger.error('파트너 조회 실패:', error);
    return null;
  }

  return mapPartnerRow(data as AffiliatePartnerRow);
}

/**
 * 파트너 ID로 조회
 */
export async function getAffiliatePartnerById(id: string): Promise<AffiliatePartner | null> {
  const { data, error } = await supabase
    .from('affiliate_partners')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    affiliateLogger.error('파트너 조회 실패:', error);
    return null;
  }

  return mapPartnerRow(data as AffiliatePartnerRow);
}

/**
 * 동기화 상태 업데이트 (Service Role 필요)
 */
export async function updatePartnerSyncStatus(
  partnerId: string,
  status: AffiliateSyncStatus,
  errorMessage?: string
): Promise<boolean> {
  const updateData: Partial<AffiliatePartnerRow> = {
    sync_status: status,
    sync_error_message: errorMessage ?? null,
  };

  if (status === 'success') {
    updateData.last_synced_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('affiliate_partners')
    .update(updateData)
    .eq('id', partnerId);

  if (error) {
    affiliateLogger.error('동기화 상태 업데이트 실패:', error);
    return false;
  }

  return true;
}
