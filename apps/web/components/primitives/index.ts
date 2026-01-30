/**
 * Primitives (Atoms) - 이룸 디자인 시스템 기본 요소
 *
 * Atomic Design의 최소 단위 컴포넌트들
 * 다른 컴포넌트에서 조합하여 사용
 */

// Button Variants
export {
  GradientButton,
  gradientButtonVariants,
  LoadingButton,
  loadingButtonVariants,
} from './button-variants';
export type { GradientButtonProps, LoadingButtonProps } from './button-variants';

// Badge Variants
export {
  TrustBadge,
  trustBadgeVariants,
  AdBadge,
  adBadgeVariants,
} from './badge-variants';
export type { TrustBadgeProps, AdBadgeProps } from './badge-variants';

// Progress Variants
export {
  StepProgress,
  stepProgressVariants,
  stepIndicatorVariants,
  stepConnectorVariants,
} from './progress-variants';
export type { StepProgressProps, Step } from './progress-variants';
