/**
 * 관리자 인증 유틸리티 테스트
 *
 * @module tests/lib/admin/auth
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 K-5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  isAdmin,
  getAdminRole,
  requireAdmin,
  requireAdminOrThrow,
  getAdminInfo,
  isUserAdmin,
  type AdminRole,
} from '@/lib/admin/auth';

describe('Admin Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================================================
  // isAdmin
  // ============================================================================

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'admin' },
      } as never);

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it('should return true for super_admin role', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'super_admin' },
      } as never);

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it('should return false for regular user', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'user' },
      } as never);

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it('should return false for user without role', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: {},
      } as never);

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it('should return false when no user', async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(currentUser).mockRejectedValue(new Error('Auth error'));

      const result = await isAdmin();
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // getAdminRole
  // ============================================================================

  describe('getAdminRole', () => {
    it('should return admin role', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'admin' },
      } as never);

      const result = await getAdminRole();
      expect(result).toBe('admin');
    });

    it('should return super_admin role', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'super_admin' },
      } as never);

      const result = await getAdminRole();
      expect(result).toBe('super_admin');
    });

    it('should return null for regular user', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'user' },
      } as never);

      const result = await getAdminRole();
      expect(result).toBeNull();
    });

    it('should return null when no user', async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      const result = await getAdminRole();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(currentUser).mockRejectedValue(new Error('Auth error'));

      const result = await getAdminRole();
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // requireAdmin
  // ============================================================================

  describe('requireAdmin', () => {
    it('should not redirect for admin', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'admin' },
      } as never);

      await requireAdmin();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should redirect to home for non-admin', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'user' },
      } as never);

      await requireAdmin();
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect when no user', async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      await requireAdmin();
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  // ============================================================================
  // requireAdminOrThrow
  // ============================================================================

  describe('requireAdminOrThrow', () => {
    it('should not throw for admin', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'admin' },
      } as never);

      await expect(requireAdminOrThrow()).resolves.not.toThrow();
    });

    it('should throw for non-admin', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'user' },
      } as never);

      await expect(requireAdminOrThrow()).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should throw when no user', async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      await expect(requireAdminOrThrow()).rejects.toThrow('Unauthorized: Admin access required');
    });
  });

  // ============================================================================
  // getAdminInfo
  // ============================================================================

  describe('getAdminInfo', () => {
    it('should return admin info for admin user', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
        imageUrl: 'https://example.com/avatar.jpg',
        publicMetadata: { role: 'admin' },
      } as never);

      const result = await getAdminInfo();

      expect(result).toEqual({
        id: 'user_123',
        email: 'admin@example.com',
        name: 'John Doe',
        role: 'admin',
        imageUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('should handle missing lastName', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        firstName: 'John',
        lastName: null,
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
        imageUrl: 'https://example.com/avatar.jpg',
        publicMetadata: { role: 'super_admin' },
      } as never);

      const result = await getAdminInfo();

      expect(result?.name).toBe('John');
      expect(result?.role).toBe('super_admin');
    });

    it('should handle missing firstName', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        firstName: null,
        lastName: null,
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
        imageUrl: null,
        publicMetadata: { role: 'admin' },
      } as never);

      const result = await getAdminInfo();

      expect(result?.name).toBeUndefined();
    });

    it('should return null for non-admin', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'user' },
      } as never);

      const result = await getAdminInfo();
      expect(result).toBeNull();
    });

    it('should return null when no user', async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      const result = await getAdminInfo();
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // isUserAdmin
  // ============================================================================

  describe('isUserAdmin', () => {
    it('should return true when checking current admin user', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'admin' },
      } as never);

      const result = await isUserAdmin('user_123');
      expect(result).toBe(true);
    });

    it('should return false when checking different user', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

      const result = await isUserAdmin('user_456');
      expect(result).toBe(false);
    });

    it('should return false when current user is not admin', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);
      vi.mocked(currentUser).mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'user' },
      } as never);

      const result = await isUserAdmin('user_123');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // 타입 검증
  // ============================================================================

  describe('Type Definitions', () => {
    it('should have correct AdminRole type', () => {
      const adminRole: AdminRole = 'admin';
      const superAdminRole: AdminRole = 'super_admin';

      expect(adminRole).toBe('admin');
      expect(superAdminRole).toBe('super_admin');
    });
  });
});
