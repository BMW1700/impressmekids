-- Drop unique constraint on user_id so users can re-submit verification requests after denial
ALTER TABLE public.account_verification_requests DROP CONSTRAINT account_verification_requests_user_id_key;

-- Clean up the stale denied row so the user can submit a new request
DELETE FROM public.account_verification_requests WHERE user_id = '6830af47-7a29-4699-8507-ec584877aac6' AND status = 'denied';