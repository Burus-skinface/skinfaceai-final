-- =============================================================================
-- Skinface security hardening
-- Apply in Supabase SQL Editor BEFORE shipping referral / premium / scan RLS.
-- =============================================================================

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_client_premium_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clients must not set entitlement flags; RevenueCat / referral triggers own this.
  IF TG_OP = 'UPDATE' THEN
    NEW.is_premium := OLD.is_premium;
    NEW.premium_since := OLD.premium_since;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.is_premium := COALESCE(NEW.is_premium, false);
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
      NEW.is_premium := false;
      NEW.premium_since := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_block_premium_write ON public.profiles;
CREATE TRIGGER trg_profiles_block_premium_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_premium_fields();

-- ─── Referral completion + reward grant (server-side only) ───────────────────

CREATE OR REPLACE FUNCTION public.grant_referral_rewards_if_due(p_referrer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completed_count integer;
  reward_count integer;
  deserved integer;
  to_grant integer;
  i integer;
BEGIN
  SELECT COUNT(*)::integer INTO completed_count
  FROM public.referrals
  WHERE referrer_id = p_referrer_id
    AND referred_scan_completed = true;

  SELECT COUNT(*)::integer INTO reward_count
  FROM public.premium_rewards
  WHERE user_id = p_referrer_id
    AND reward_type = 'referral';

  deserved := FLOOR(completed_count / 5.0)::integer;
  to_grant := GREATEST(deserved - COALESCE(reward_count, 0), 0);

  FOR i IN 1..to_grant LOOP
    INSERT INTO public.premium_rewards (
      user_id,
      reward_type,
      days_granted,
      starts_at,
      expires_at
    ) VALUES (
      p_referrer_id,
      'referral',
      3,
      now(),
      now() + interval '3 days'
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_scan_complete_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  UPDATE public.referrals
  SET referred_scan_completed = true
  WHERE referred_id = NEW.user_id
    AND referred_scan_completed = false
  RETURNING referrer_id INTO v_referrer_id;

  IF v_referrer_id IS NOT NULL THEN
    PERFORM public.grant_referral_rewards_if_due(v_referrer_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scans_complete_referral ON public.scans;
CREATE TRIGGER trg_scans_complete_referral
  AFTER INSERT ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.on_scan_complete_referral();

-- ─── RLS: scans ──────────────────────────────────────────────────────────────

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scans_select_own ON public.scans;
CREATE POLICY scans_select_own ON public.scans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS scans_insert_own ON public.scans;
CREATE POLICY scans_insert_own ON public.scans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS scans_update_own ON public.scans;
CREATE POLICY scans_update_own ON public.scans
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS scans_delete_own ON public.scans;
CREATE POLICY scans_delete_own ON public.scans
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─── RLS: referrals ──────────────────────────────────────────────────────────

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_select_involved ON public.referrals;
CREATE POLICY referrals_select_involved ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Only the referred user may create their own referral row (signup).
DROP POLICY IF EXISTS referrals_insert_self ON public.referrals;
CREATE POLICY referrals_insert_self ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    referred_id = auth.uid()
    AND referred_scan_completed = false
  );

-- No client UPDATE/DELETE — completion is trigger-only (SECURITY DEFINER).
DROP POLICY IF EXISTS referrals_update_none ON public.referrals;
DROP POLICY IF EXISTS referrals_delete_none ON public.referrals;

-- ─── RLS: premium_rewards ────────────────────────────────────────────────────

ALTER TABLE public.premium_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS premium_rewards_select_own ON public.premium_rewards;
CREATE POLICY premium_rewards_select_own ON public.premium_rewards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No client INSERT/UPDATE/DELETE — grants are SECURITY DEFINER only.
DROP POLICY IF EXISTS premium_rewards_insert_none ON public.premium_rewards;
DROP POLICY IF EXISTS premium_rewards_update_none ON public.premium_rewards;
DROP POLICY IF EXISTS premium_rewards_delete_none ON public.premium_rewards;

-- ─── Optional: purge biometric images older than 24h (run periodically) ──────

CREATE OR REPLACE FUNCTION public.purge_scan_biometrics_older_than_24h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.scans
  SET
    image_url = NULL,
    face_state = CASE
      WHEN face_state IS NULL THEN NULL
      ELSE (
        face_state
        - 'primaryImageJpegBase64'
        - 'leftAngleImageJpegBase64'
        - 'rightAngleImageJpegBase64'
        - 'retainedCropJpegBase64'
      )
    END
  WHERE created_at < now() - interval '24 hours'
    AND (
      image_url IS NOT NULL
      OR face_state ? 'primaryImageJpegBase64'
      OR face_state ? 'leftAngleImageJpegBase64'
      OR face_state ? 'rightAngleImageJpegBase64'
      OR face_state ? 'retainedCropJpegBase64'
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Example (optional cron / manual):
-- SELECT public.purge_scan_biometrics_older_than_24h();

COMMENT ON FUNCTION public.purge_scan_biometrics_older_than_24h() IS
  'Strips scan images after 24h; scoring/analysis JSON left intact. Call periodically.';
