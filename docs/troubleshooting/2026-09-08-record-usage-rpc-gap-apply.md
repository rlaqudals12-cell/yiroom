# 착용 기록 RPC 수동 적용 체크리스트

> 배치 R · 2026-09-08 · 미적용 환경 폴백을 원자 갱신으로 전환

- 정본: `apps/web/supabase/migrations/202609080100_record_inventory_usage.sql`.
- 수동 번들: `c:/tmp/yiroom-gap-apply-bundle-2026-09-01.sql`의 9번.
- 원리/스펙: `docs/principles/security-patterns.md`, ADR-098,
  `docs/specs/SDD-CLOSET-INVENTORY-WEB.md`.
- 실제 DB 적용은 이 배치에서 수행하지 않았다. prod는 SQL Editor에서 수동 gap-apply만 허용한다.

## 적용 전후 검증

1. `user_inventory`, `saved_outfits`의 JWT sub 기반 own SELECT/UPDATE RLS와 authenticated 권한을 확인한다.
2. 9번 SQL만 적용한다. 두 함수는 SECURITY INVOKER이며 PUBLIC 실행 권한을 제거한다.
3. 테스트 사용자 JWT로 중복 아이템 ID가 한 번만 증가하는지, 다른 사용자 아이템은
   `requireAll=true`에서 전체 실패하고 변화가 없는지 확인한다.
4. 코디와 남아 있는 구성 아이템이 함께 증가하는지, 삭제된 아이템은 건너뛰는지 확인한다.
5. 동시 두 요청에서 두 번 증가하는지 확인한다. 권한 오류·트랜잭션 오류에는 앱 폴백이 없어야 한다.
6. 롤백은 migration 말미의 두 DROP FUNCTION을 SQL Editor에서 수동 실행한다.
   롤백 뒤 앱은 기존 경로로 돌아가지만 동시성·부분 성공 위험이 다시 생긴다.

로컬 단위 테스트는 RPC 호출·오류 분기·미적용 폴백을 검증한다.
DB 실행 및 실제 동시 트랜잭션 검증은 이 배치의 검증 결과에 포함하지 않는다.
