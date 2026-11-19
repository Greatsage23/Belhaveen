-- User-authorised replacement of the Library Prefect practice ballot.
DO $$
DECLARE library_id uuid := '7eacdeb2-b71e-48b2-aa47-7833542e46fa';
 admin_id uuid; removed_ballots integer; library_photos uuid[];
 names text[] := ARRAY['school prefect','head girl','general prefect','health prefect','entertainment prefect','compound prefect','sports prefect','office girl','organization prefect','sanitation prefect'];
BEGIN
 PERFORM id FROM bms_vote_settings WHERE id=1 FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM bms_vote_portfolios WHERE id=library_id) THEN RETURN; END IF;
 IF (SELECT mode FROM bms_vote_settings WHERE id=1)<>'demo'
    OR EXISTS(SELECT 1 FROM bms_vote_runs WHERE mode='real' AND started_at IS NOT NULL)
    OR EXISTS(SELECT 1 FROM bms_vote_ballots WHERE mode='real') THEN
  RAISE EXCEPTION 'Real election activity requires review before replacing the demo ballot.';
 END IF;
 IF (SELECT count(*) FROM bms_vote_portfolios WHERE lower(btrim(name))=ANY(names))<>10
    OR EXISTS(SELECT 1 FROM bms_vote_portfolios p WHERE lower(btrim(p.name))=ANY(names) AND NOT EXISTS(SELECT 1 FROM bms_vote_candidates c WHERE c.portfolio_id=p.id)) THEN
  RAISE EXCEPTION 'All ten requested portfolios must exist and have candidates.';
 END IF;
 IF EXISTS(SELECT 1 FROM bms_vote_choices v JOIN bms_vote_ballots b ON b.id=v.ballot_id WHERE b.mode='demo' AND v.portfolio_id<>library_id) THEN
  RAISE EXCEPTION 'Demo votes for other portfolios require review before deletion.';
 END IF;
 IF EXISTS(SELECT 1 FROM bms_vote_portfolios WHERE active AND id<>library_id AND NOT(lower(btrim(name))=ANY(names))) THEN
  RAISE EXCEPTION 'Unexpected active portfolio requires review.';
 END IF;
 SELECT id INTO admin_id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1;
 IF admin_id IS NULL THEN RAISE EXCEPTION 'An active administrator is required.'; END IF;
 SELECT array_agg(photo_id) INTO library_photos FROM bms_vote_candidates WHERE portfolio_id=library_id;
 DELETE FROM bms_vote_ballots WHERE mode='demo';
 GET DIAGNOSTICS removed_ballots = ROW_COUNT;
 DELETE FROM bms_vote_codes WHERE mode='demo';
 DELETE FROM bms_vote_candidates WHERE portfolio_id=library_id;
 DELETE FROM bms_vote_portfolios WHERE id=library_id;
 DELETE FROM bms_vote_photos p WHERE p.id=ANY(library_photos) AND NOT EXISTS(SELECT 1 FROM bms_vote_candidates c WHERE c.photo_id=p.id);
 UPDATE bms_vote_portfolios SET active=true WHERE lower(btrim(name))=ANY(names);
 UPDATE bms_vote_runs SET status='open',started_at=now(),closed_at=NULL,generation=generation+1 WHERE mode='demo';
 UPDATE bms_vote_settings SET revision=revision+1 WHERE id=1;
 INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES(admin_id,'replace-library-demo',jsonb_build_object('source','authorised deployment','removedDemoBallots',removed_ballots,'activePortfolios',10,'mode','demo','libraryPracticeDataRemoved',true));
END $$;
