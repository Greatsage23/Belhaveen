-- One-time, user-authorised opening of the Library Prefect practice ballot.
-- Exact IDs deliberately prevent this operation from affecting another election.
DO $$
DECLARE admin_id uuid;
BEGIN
 PERFORM id FROM bms_vote_settings WHERE id=1 FOR UPDATE;
 IF (SELECT count(*) FROM bms_vote_portfolios WHERE id IN (
  '7eacdeb2-b71e-48b2-aa47-7833542e46fa',
  '6147f002-d2a6-43eb-8319-6586e4b104b1',
  'c7990c52-eeb2-4697-a7ca-9e23d8e65abb')) <> 3 THEN
  RETURN; -- New installations have no matching election to change.
 END IF;
 IF (SELECT mode FROM bms_vote_settings WHERE id=1) <> 'demo'
    OR (SELECT status FROM bms_vote_runs WHERE mode='demo') <> 'draft' THEN
  RAISE EXCEPTION 'Election state changed; library demo activation requires review.';
 END IF;
 IF EXISTS(SELECT 1 FROM bms_vote_ballots)
    OR EXISTS(SELECT 1 FROM bms_vote_runs WHERE mode='real' AND started_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Voting has already started; nomination changes are not permitted.';
 END IF;
 IF EXISTS(SELECT 1 FROM bms_vote_portfolios WHERE active AND id NOT IN (
  '7eacdeb2-b71e-48b2-aa47-7833542e46fa',
  '6147f002-d2a6-43eb-8319-6586e4b104b1',
  'c7990c52-eeb2-4697-a7ca-9e23d8e65abb')) THEN
  RAISE EXCEPTION 'Additional active portfolios require review before opening library-only voting.';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM bms_vote_candidates WHERE portfolio_id='7eacdeb2-b71e-48b2-aa47-7833542e46fa') THEN
  RAISE EXCEPTION 'Library Prefect needs a candidate before opening.';
 END IF;
 SELECT id INTO admin_id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1;
 IF admin_id IS NULL THEN RAISE EXCEPTION 'An active administrator is required.'; END IF;
 UPDATE bms_vote_portfolios SET active=false WHERE id IN (
  '6147f002-d2a6-43eb-8319-6586e4b104b1',
  'c7990c52-eeb2-4697-a7ca-9e23d8e65abb');
 UPDATE bms_vote_portfolios SET active=true WHERE id='7eacdeb2-b71e-48b2-aa47-7833542e46fa';
 UPDATE bms_vote_runs SET status='open',started_at=now() WHERE mode='demo';
 UPDATE bms_vote_settings SET revision=revision+1 WHERE id=1;
 INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES(admin_id,'open-library-demo',
  '{"source":"authorised deployment","mode":"demo","activePortfolio":"Library Prefect","temporarilyInactive":["School Prefect","Compound Prefect"]}'::jsonb);
END $$;
