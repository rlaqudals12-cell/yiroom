/**
 * Safety 암호화 (모바일 버전)
 *
 * 모바일에서는 암호화 키를 클라이언트에 저장할 수 없으므로
 * 암호화/복호화는 서버 API를 통해 수행해야 합니다.
 *
 * 이 모듈은 인터페이스 호환성만 제공합니다.
 * 실제 암호화가 필요한 작업은 서버 API(/api/safety)를 호출하세요.
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 */

/**
 * 모바일에서는 암호화 불가 (키를 클라이언트에 저장할 수 없음)
 * 서버 API를 통해 암호화된 프로필을 관리하세요.
 */
export function encrypt(_data: string[]): string {
  throw new Error(
    '[Safety] 모바일에서는 클라이언트 암호화를 지원하지 않습니다. 서버 API를 사용하세요.'
  );
}

/**
 * 모바일에서는 복호화 불가
 */
export function decrypt(_encryptedBase64: string): string[] {
  throw new Error(
    '[Safety] 모바일에서는 클라이언트 복호화를 지원하지 않습니다. 서버 API를 사용하세요.'
  );
}

/**
 * 모바일에서는 항상 false (서버 API 사용 필요)
 */
export function isEncryptionAvailable(): boolean {
  return false;
}
