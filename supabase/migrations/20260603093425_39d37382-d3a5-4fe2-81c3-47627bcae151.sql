REVOKE EXECUTE ON FUNCTION public.purchase_castle_hero_unlock(text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_castle_hero_unlock(text, text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_castle_hero_unlock(text, text, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purchase_castle_hero_level(text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_castle_hero_level(text, text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_castle_hero_level(text, text, integer) TO authenticated;