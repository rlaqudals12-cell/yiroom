/**
 * Expo가 번들에 인라인해도 되는 공개 런타임 구성의 단일 진입점.
 *
 * 이름에 secret/key/token 접미사를 쓰지 않아 공개값을 비밀값처럼 오인하거나,
 * 실제 비밀을 EXPO_PUBLIC_*에 넣는 관행이 생기지 않도록 한다.
 */
export const PUBLIC_RUNTIME_CONFIG = Object.freeze({
  clerkPublishable: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE?.trim() ?? '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '',
  supabaseAnon: process.env.EXPO_PUBLIC_SUPABASE_ANON?.trim() ?? '',
});
