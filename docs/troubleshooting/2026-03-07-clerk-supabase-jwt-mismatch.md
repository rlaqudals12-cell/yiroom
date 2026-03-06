# Clerk-Supabase JWT 키 불일치로 홈 데이터 미표시

**날짜**: 2026-03-07
**심각도**: Critical (데이터 표시 완전 차단)
**해결 시간**: ~30분

## 증상

- 분석(퍼스널 컬러, 피부) 완료 후 홈 페이지에 결과가 표시되지 않음
- 홈이 계속 New 상태 (분석 0개)로 표시
- 브라우저 콘솔에 에러 없음
- Supabase SQL Editor에서 데이터 존재 확인됨

## 원인

Clerk JWT Template의 **Signing Key**와 Supabase의 **JWT Secret**이 불일치.

### 메커니즘

```
사용자 → Clerk (JWT 발급, Clerk의 Signing Key로 서명)
     → Supabase (JWT 검증, Supabase의 JWT Secret으로 검증)
     → 키 불일치 → JWT 검증 실패 → RLS에서 auth.jwt() = null
     → clerk_user_id 매칭 0건 → 빈 배열 반환 (에러 없음)
```

**핵심**: Supabase는 JWT 검증 실패 시 에러를 던지지 않고 빈 배열을 반환 (RLS Silent Failure).

### 영향 범위

- `useClerkSupabaseClient()` 기반 모든 Client Component 쿼리
- API Route의 `createServiceRoleClient()`는 RLS 우회이므로 영향 없음

## 진단 과정

1. curl → 200 OK (서버 정상)
2. Supabase SQL Editor → 데이터 존재 확인
3. RLS 정책 → `clerk_user_id = (auth.jwt() ->> 'sub'::text)`
4. Clerk JWT Template → 존재, HS256
5. **Signing Key ≠ Supabase JWT Secret** 확인

## 해결

1. Supabase Dashboard → Settings → API → **Legacy JWT Secret** 탭 → 값 복사
2. Clerk Dashboard → JWT Templates → `supabase` → Signing key 편집 → 붙여넣기 → Save
3. 브라우저 로그아웃 → 재로그인
4. 홈 새로고침 → 정상 표시

## 예방 체크리스트

- [ ] Clerk JWT Template `supabase` — Signing key = Supabase Legacy JWT Secret
- [ ] 설정 변경 후 반드시 로그아웃/재로그인으로 검증
- [ ] Client 쿼리가 빈 배열 반환 시 JWT 키 불일치 의심

## 관련 파일

- `apps/web/lib/supabase/clerk-client.ts`
- `apps/web/hooks/useAnalysisStatus.ts`
