/**
 * 관리자 인증 유틸리티
 * @description Clerk 메타데이터 기반 관리자 권한 체크
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * 관리자 역할 타입
 */
export type AdminRole = 'admin' | 'super_admin';

/**
 * 현재 사용자가 관리자인지 확인
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) return false;

    const role = user.publicMetadata?.role as string | undefined;
    return role === 'admin' || role === 'super_admin';
  } catch {
    return false;
  }
}

/**
 * 현재 사용자의 관리자 역할 조회
 */
export async function getAdminRole(): Promise<AdminRole | null> {
  try {
    const user = await currentUser();
    if (!user) return null;

    const role = user.publicMetadata?.role as string | undefined;
    if (role === 'admin' || role === 'super_admin') {
      return role as AdminRole;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 관리자 권한 필수 체크 (없으면 리다이렉트)
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/');
  }
}

/**
 * 관리자 권한 필수 체크 (없으면 에러)
 */
export async function requireAdminOrThrow(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * 현재 관리자 정보 조회
 */
export async function getAdminInfo() {
  const user = await currentUser();
  if (!user) return null;

  const role = user.publicMetadata?.role as string | undefined;
  if (role !== 'admin' && role !== 'super_admin') {
    return null;
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
    role: role as AdminRole,
    imageUrl: user.imageUrl,
  };
}

/**
 * 특정 사용자 ID가 관리자인지 확인 (서버 사이드)
 * @param clerkUserId Clerk 사용자 ID
 */
export async function isUserAdmin(clerkUserId: string): Promise<boolean> {
  // 현재 사용자와 동일한 경우 빠른 체크
  const { userId } = await auth();
  if (userId === clerkUserId) {
    return isAdmin();
  }

  // 다른 사용자의 경우 Clerk API 호출 필요
  // 실제 구현 시 Clerk Backend API 사용
  // 여기서는 현재 사용자만 체크
  return false;
}
