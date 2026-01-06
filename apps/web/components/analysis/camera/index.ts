/**
 * 다각도 촬영 카메라 컴포넌트
 */

// 얼굴 분석용 (PC-1, S-1)
export { FaceGuideOverlay } from './FaceGuideOverlay';
export { AngleSelector } from './AngleSelector';
export { MultiAngleCapture } from './MultiAngleCapture';

// 체형 분석용 (C-1)
export { BodyGuideOverlay, type BodyAngle } from './BodyGuideOverlay';
export { BodyAngleSelector } from './BodyAngleSelector';
export { MultiAngleBodyCapture, type MultiAngleBodyImages } from './MultiAngleBodyCapture';
