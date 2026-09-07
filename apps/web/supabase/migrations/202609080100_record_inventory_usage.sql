-- Migration: 착용 기록 원자화 RPC (배치 R, 2026-09-08)
-- 적용: prod SQL Editor 수동 gap-apply만. DB 자동 적용 금지.
CREATE OR REPLACE FUNCTION public.record_inventory_usage(
  p_item_ids uuid[],
  p_require_all boolean DEFAULT true
)
RETURNS TABLE (recorded_count integer, recorded_at timestamptz)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user_id text := auth.jwt() ->> 'sub';
  v_ids uuid[];
  v_owned_ids uuid[];
  v_at timestamptz := statement_timestamp();
  v_updated integer := 0;
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Unauthenticated';
  END IF;
  SELECT COALESCE(array_agg(d.id ORDER BY d.id), ARRAY[]::uuid[]) INTO v_ids
  FROM (SELECT DISTINCT u.id FROM unnest(COALESCE(p_item_ids, ARRAY[]::uuid[])) AS u(id)
        WHERE u.id IS NOT NULL) AS d;
  IF cardinality(v_ids) = 0 THEN RETURN QUERY SELECT 0, v_at; RETURN; END IF;
  IF cardinality(v_ids) > 30 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Too many inventory items';
  END IF;
  SELECT COALESCE(array_agg(o.id ORDER BY o.id), ARRAY[]::uuid[]) INTO v_owned_ids
  FROM (SELECT ui.id FROM public.user_inventory AS ui
        WHERE ui.clerk_user_id = v_user_id AND ui.id = ANY(v_ids) FOR UPDATE) AS o;
  IF COALESCE(p_require_all, true) AND cardinality(v_owned_ids) <> cardinality(v_ids) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Item not found';
  END IF;
  IF cardinality(v_owned_ids) > 0 THEN
    UPDATE public.user_inventory AS ui
       SET use_count = COALESCE(ui.use_count, 0) + 1, last_used_at = v_at
     WHERE ui.clerk_user_id = v_user_id AND ui.id = ANY(v_owned_ids);
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  END IF;
  RETURN QUERY SELECT v_updated, v_at;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_inventory_usage(uuid[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_inventory_usage(uuid[], boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_outfit_wear(p_outfit_id uuid)
RETURNS TABLE (outfit_wear_count integer, recorded_item_count integer, recorded_at timestamptz)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user_id text := auth.jwt() ->> 'sub';
  v_item_ids uuid[];
  v_outfit_wear_count integer;
  v_updated_items integer := 0;
  v_at timestamptz := statement_timestamp();
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Unauthenticated';
  END IF;
  UPDATE public.saved_outfits AS so
     SET wear_count = COALESCE(so.wear_count, 0) + 1, last_worn_at = v_at
   WHERE so.id = p_outfit_id AND so.clerk_user_id = v_user_id
  RETURNING so.item_ids, so.wear_count INTO v_item_ids, v_outfit_wear_count;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Outfit not found';
  END IF;
  UPDATE public.user_inventory AS ui
     SET use_count = COALESCE(ui.use_count, 0) + 1, last_used_at = v_at
   WHERE ui.clerk_user_id = v_user_id AND ui.id = ANY(COALESCE(v_item_ids, ARRAY[]::uuid[]));
  GET DIAGNOSTICS v_updated_items = ROW_COUNT;
  RETURN QUERY SELECT v_outfit_wear_count, v_updated_items, v_at;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_outfit_wear(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_outfit_wear(uuid) TO authenticated;

-- Rollback: DROP FUNCTION IF EXISTS public.record_outfit_wear(uuid);
-- DROP FUNCTION IF EXISTS public.record_inventory_usage(uuid[], boolean);
