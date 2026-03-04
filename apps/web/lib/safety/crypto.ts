/**
 * AES-256-GCM 암호화/복호화
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md — 암호화 전략
 *
 * 환경변수: SAFETY_ENCRYPTION_KEY (32바이트 hex, 서버 전용)
 * 클라이언트 번들에 절대 포함 금지 (NEXT_PUBLIC_ 아님)
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 암호화 키 조회 (서버 전용)
 * @throws 키가 설정되지 않은 경우
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SAFETY_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('[Safety] SAFETY_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.');
  }

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('[Safety] SAFETY_ENCRYPTION_KEY는 32바이트(64자 hex)여야 합니다.');
  }

  return keyBuffer;
}

/**
 * 문자열 배열 → 암호화된 base64 문자열
 *
 * 형식: base64(iv + authTag + ciphertext)
 * - iv: 16바이트 (랜덤, 매 암호화마다 새로 생성)
 * - authTag: 16바이트 (GCM 인증 태그)
 * - ciphertext: 가변 길이
 */
export function encrypt(data: string[]): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const plaintext = JSON.stringify(data);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // iv + authTag + ciphertext 결합
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * 암호화된 base64 문자열 → 문자열 배열
 *
 * @throws 복호화 실패 시 (키 불일치, 데이터 변조)
 */
export function decrypt(encryptedBase64: string): string[] {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('[Safety] 암호화된 데이터 형식이 올바르지 않습니다.');
  }

  // iv, authTag, ciphertext 분리
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return JSON.parse(decrypted.toString('utf8')) as string[];
}

/**
 * 암호화 가능 여부 확인
 * 키가 설정되지 않으면 false 반환 (에러 던지지 않음)
 */
export function isEncryptionAvailable(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
