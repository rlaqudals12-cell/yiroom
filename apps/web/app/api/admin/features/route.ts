import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAllFeatureFlags, toggleFeatureFlag } from '@/lib/admin';
import type { FeatureFlagKey } from '@/lib/admin';

// GET: 모든 Feature Flags 조회
export async function GET() {
  try {
    await requireAdmin();
    const flags = await getAllFeatureFlags();
    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Feature Flags 조회 실패:', error);
    if ((error as Error).message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

// PATCH: Feature Flag 토글
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { key, enabled } = body;

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const result = await toggleFeatureFlag(key as FeatureFlagKey, enabled);

    if (!result) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, flag: result });
  } catch (error) {
    console.error('Feature Flag 토글 실패:', error);
    if ((error as Error).message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to toggle feature flag' },
      { status: 500 }
    );
  }
}
