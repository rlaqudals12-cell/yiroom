/**
 * DB 스키마 기대값 정의
 *
 * 원격 Supabase에 존재해야 하는 테이블/컬럼 목록.
 * 새 마이그레이션으로 컬럼을 추가할 때 이 파일도 함께 업데이트해야 함.
 *
 * 용도:
 * - /api/health/db-schema 엔드포인트에서 스키마 검증
 * - preflight-check.js에서 서버 시작 전 검증
 */

export interface SchemaExpectation {
  table: string;
  column: string;
  migration: string;
  addedDate: string;
}

// 초기 테이블 생성 이후에 ALTER TABLE로 추가된 컬럼만 추적
// (초기 컬럼은 테이블 존재 여부로 충분히 검증됨)
export const POST_CREATION_COLUMNS: SchemaExpectation[] = [
  // users 테이블 확장
  {
    table: 'users',
    column: 'latest_pc_assessment_id',
    migration: '20260109_users_pc_columns.sql',
    addedDate: '2026-01-09',
  },
  {
    table: 'users',
    column: 'personal_color_season',
    migration: '20260109_users_pc_columns.sql',
    addedDate: '2026-01-09',
  },
  {
    table: 'users',
    column: 'personal_color_undertone',
    migration: '20260109_users_pc_columns.sql',
    addedDate: '2026-01-09',
  },
  {
    table: 'users',
    column: 'face_image_url',
    migration: '20260109_users_pc_columns.sql',
    addedDate: '2026-01-09',
  },
  {
    table: 'users',
    column: 'gender_preference',
    migration: '20260202_users_gender_preference.sql',
    addedDate: '2026-02-02',
  },

  // personal_color_assessments 확장
  {
    table: 'personal_color_assessments',
    column: 'left_image_url',
    migration: '20260113_pc_multi_angle_columns.sql',
    addedDate: '2026-01-13',
  },
  {
    table: 'personal_color_assessments',
    column: 'right_image_url',
    migration: '20260113_pc_multi_angle_columns.sql',
    addedDate: '2026-01-13',
  },
  {
    table: 'personal_color_assessments',
    column: 'images_count',
    migration: '20260113_pc_multi_angle_columns.sql',
    addedDate: '2026-01-13',
  },
  {
    table: 'personal_color_assessments',
    column: 'analysis_reliability',
    migration: '20260113_pc_multi_angle_columns.sql',
    addedDate: '2026-01-13',
  },
  {
    table: 'personal_color_assessments',
    column: 'wrist_image_url',
    migration: '20260115_wrist_image_column.sql',
    addedDate: '2026-01-15',
  },

  // skin_analyses 확장
  {
    table: 'skin_analyses',
    column: 'problem_areas',
    migration: '20260113_skin_problem_areas.sql',
    addedDate: '2026-01-13',
  },

  // body_analyses 다각도 확장
  {
    table: 'body_analyses',
    column: 'left_side_image_url',
    migration: '20260210_body_multi_angle_columns.sql',
    addedDate: '2026-02-10',
  },
  {
    table: 'body_analyses',
    column: 'right_side_image_url',
    migration: '20260210_body_multi_angle_columns.sql',
    addedDate: '2026-02-10',
  },
  {
    table: 'body_analyses',
    column: 'back_image_url',
    migration: '20260210_body_multi_angle_columns.sql',
    addedDate: '2026-02-10',
  },
];

// 핵심 테이블 목록 (존재 여부 확인용)
export const REQUIRED_TABLES = [
  'users',
  'personal_color_assessments',
  'skin_analyses',
  'body_analyses',
  'hair_analyses',
  'makeup_analyses',
  'workout_analyses',
  'nutrition_settings',
  'meal_records',
  'products',
  'image_consents',
] as const;
