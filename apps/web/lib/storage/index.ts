/**
 * 스토리지 모듈 공개 API
 *
 * @module lib/storage
 * @description 비공개 버킷 이미지 값(경로/레거시 전체 URL)을 서명 URL로 해석
 */
export { extractStoragePath, resolveSignedImageUrl } from './resolve-image-url';
