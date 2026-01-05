/**
 * 사용자 선호/기피 도메인별 요약 API
 *
 * GET /api/preferences/summary - 도메인별 선호/기피 개수 요약
 *
 * @see docs/SDD-USER-PREFERENCES.md
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getPreferenceSummary } from '@/lib/preferences';

/**
 * GET /api/preferences/summary
 * 도메인별 선호/기피 항목 개수 요약
 *
 * @returns {
 *   success: boolean,
 *   data: {
 *     beauty: { favorites: number, avoids: number },
 *     style: { favorites: number, avoids: number },
 *     nutrition: { favorites: number, avoids: number },
 *     workout: { favorites: number, avoids: number },
 *     color: { favorites: number, avoids: number }
 *   }
 * }
 */
export async function GET(_req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();

    const summary = await getPreferenceSummary(supabase, userId);

    return NextResponse.json(
      {
        success: true,
        data: summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Preferences] Summary error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
