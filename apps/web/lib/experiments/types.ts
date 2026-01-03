/**
 * A/B 테스트 실험 시스템 타입 정의
 */

import { z } from 'zod';

export type ExperimentStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Variant {
  id: string;
  name: string;
  description?: string;
  weight: number;
  config: Record<string, unknown>;
  isControl: boolean;
}

export interface Experiment {
  id: string;
  key: string;
  name: string;
  description?: string;
  status: ExperimentStatus;
  variants: Variant[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  experimentKey: string;
  userId: string;
  variantId: string;
  variantName: string;
  assignedAt: string;
  config: Record<string, unknown>;
}

export type ExposureEventType = 'impression' | 'interaction' | 'conversion';

export interface ExposureEvent {
  experimentKey: string;
  variantId: string;
  eventType: ExposureEventType;
  metadata?: Record<string, unknown>;
}

// Zod 스키마
export const VariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().min(0).max(100),
  config: z.record(z.unknown()),
  isControl: z.boolean(),
});

export const ExposureEventSchema = z.object({
  experimentKey: z.string().min(1),
  variantId: z.string().min(1),
  eventType: z.enum(['impression', 'interaction', 'conversion']),
  metadata: z.record(z.unknown()).optional(),
});

// DB Row 타입
export interface ExperimentRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  variants: Variant[];
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperimentAssignmentRow {
  id: string;
  experiment_id: string;
  clerk_user_id: string | null;
  session_id: string | null;
  variant_id: string;
  assigned_at: string;
}
