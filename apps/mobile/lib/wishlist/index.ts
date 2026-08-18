/**
 * 위시리스트 레거시 호환 모듈
 *
 * 모바일 전용 API가 생기기 전까지 DB를 우회하지 않고 명시적으로 거부한다.
 *
 * @module lib/wishlist
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface WishlistItem {
  id: string;
  clerk_user_id: string;
  product_type: string;
  product_id: string;
  created_at: string;
}

export interface AddToWishlistInput {
  product_type: string;
  product_id: string;
}

export async function getWishlist(
  _supabase: SupabaseClient,
  _userId: string,
  _limit = 50
): Promise<WishlistItem[]> {
  throw new Error('위시리스트 조회는 현재 지원하지 않아요.');
}

export async function isInWishlist(
  _supabase: SupabaseClient,
  _userId: string,
  _productId: string,
  _productType?: string
): Promise<boolean> {
  throw new Error('위시리스트 조회는 현재 지원하지 않아요.');
}

export async function getWishlistCount(
  _supabase: SupabaseClient,
  _userId: string
): Promise<number> {
  throw new Error('위시리스트 조회는 현재 지원하지 않아요.');
}

function unsupportedWrite(): never {
  throw new Error('위시리스트 저장은 현재 지원하지 않아요.');
}

export async function addToWishlist(
  _supabase: SupabaseClient,
  _userId: string,
  _input: AddToWishlistInput
): Promise<WishlistItem> {
  return unsupportedWrite();
}

export async function removeFromWishlist(
  _supabase: SupabaseClient,
  _userId: string,
  _productId: string
): Promise<void> {
  return unsupportedWrite();
}

export async function toggleWishlist(
  _supabase: SupabaseClient,
  _userId: string,
  _productId: string
): Promise<boolean> {
  return unsupportedWrite();
}

export async function updateWishlistNote(
  _supabase: SupabaseClient,
  _userId: string,
  _productId: string,
  _note: string
): Promise<void> {
  return unsupportedWrite();
}
