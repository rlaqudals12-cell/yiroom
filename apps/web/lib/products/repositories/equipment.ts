/**
 * 운동 기구 Repository
 * @description 운동 기구 제품 CRUD 함수
 */

import { supabase } from '@/lib/supabase/client';
import type {
  WorkoutEquipment,
  WorkoutEquipmentRow,
  WorkoutEquipmentFilter,
  TargetMuscle,
  ExerciseType,
  SkillLevel,
  UseLocation,
} from '@/types/product';

// 타입 변환 함수
export function mapWorkoutEquipmentRow(row: WorkoutEquipmentRow): WorkoutEquipment {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as WorkoutEquipment['category'],
    subcategory: row.subcategory ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    priceRange: row.price_range as WorkoutEquipment['priceRange'],
    weightKg: row.weight_kg ?? undefined,
    weightRange: row.weight_range ?? undefined,
    material: row.material ?? undefined,
    size: row.size ?? undefined,
    colorOptions: row.color_options ?? undefined,
    targetMuscles: row.target_muscles as TargetMuscle[] | undefined,
    exerciseTypes: row.exercise_types as ExerciseType[] | undefined,
    skillLevel: row.skill_level as SkillLevel | undefined,
    useLocation: row.use_location as UseLocation | undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    features: row.features ?? undefined,
    pros: row.pros ?? undefined,
    cons: row.cons ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 운동 기구 목록 조회
 * @param filter 필터 옵션
 * @param limit 최대 개수 (기본 50)
 */
export async function getWorkoutEquipment(
  filter?: WorkoutEquipmentFilter,
  limit = 50
): Promise<WorkoutEquipment[]> {
  let query = supabase
    .from('workout_equipment')
    .select('*')
    .eq('is_active', true)
    .limit(limit);

  if (filter?.category) {
    query = query.eq('category', filter.category);
  }

  if (filter?.brand) {
    query = query.ilike('brand', `%${filter.brand}%`);
  }

  if (filter?.priceRange) {
    query = query.eq('price_range', filter.priceRange);
  }

  if (filter?.maxPrice) {
    query = query.lte('price_krw', filter.maxPrice);
  }

  if (filter?.skillLevel) {
    query = query.or(`skill_level.eq.${filter.skillLevel},skill_level.eq.all`);
  }

  if (filter?.useLocation) {
    query = query.or(`use_location.eq.${filter.useLocation},use_location.eq.all`);
  }

  if (filter?.minRating) {
    query = query.gte('rating', filter.minRating);
  }

  // 배열 필터 (contains)
  if (filter?.targetMuscles && filter.targetMuscles.length > 0) {
    query = query.overlaps('target_muscles', filter.targetMuscles);
  }

  if (filter?.exerciseTypes && filter.exerciseTypes.length > 0) {
    query = query.overlaps('exercise_types', filter.exerciseTypes);
  }

  const { data, error } = await query.order('rating', { ascending: false });

  if (error) {
    console.error('운동 기구 조회 실패:', error);
    return [];
  }

  return (data as WorkoutEquipmentRow[]).map(mapWorkoutEquipmentRow);
}

/**
 * 운동 기구 단일 조회
 * @param id 제품 ID
 */
export async function getWorkoutEquipmentById(
  id: string
): Promise<WorkoutEquipment | null> {
  const { data, error } = await supabase
    .from('workout_equipment')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('운동 기구 조회 실패:', error);
    return null;
  }

  return mapWorkoutEquipmentRow(data as WorkoutEquipmentRow);
}

/**
 * 운동 타입/근육군 기반 운동 기구 추천
 * @param targetMuscles 타겟 근육군
 * @param exerciseTypes 운동 타입
 * @param skillLevel 스킬 레벨
 * @param useLocation 사용 장소
 */
export async function getRecommendedEquipment(
  targetMuscles?: TargetMuscle[],
  exerciseTypes?: ExerciseType[],
  skillLevel?: SkillLevel,
  useLocation?: UseLocation
): Promise<WorkoutEquipment[]> {
  let query = supabase
    .from('workout_equipment')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(20);

  if (targetMuscles && targetMuscles.length > 0) {
    query = query.overlaps('target_muscles', targetMuscles);
  }

  if (exerciseTypes && exerciseTypes.length > 0) {
    query = query.overlaps('exercise_types', exerciseTypes);
  }

  if (skillLevel) {
    query = query.or(`skill_level.eq.${skillLevel},skill_level.eq.all`);
  }

  if (useLocation) {
    query = query.or(`use_location.eq.${useLocation},use_location.eq.all`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('추천 운동 기구 조회 실패:', error);
    return [];
  }

  return (data as WorkoutEquipmentRow[]).map(mapWorkoutEquipmentRow);
}

/**
 * 운동 기구 브랜드 목록 조회
 */
export async function getWorkoutEquipmentBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('workout_equipment')
    .select('brand')
    .eq('is_active', true);

  if (error) {
    console.error('브랜드 조회 실패:', error);
    return [];
  }

  const brands = [...new Set(data.map((d) => d.brand))];
  return brands.sort();
}
