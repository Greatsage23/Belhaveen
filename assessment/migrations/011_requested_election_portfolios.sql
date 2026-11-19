-- Add the requested nomination portfolios without changing the open demo ballot.
DO $$
DECLARE requested_name text; requested_position integer := 0; admin_id uuid; created_count integer := 0;
BEGIN
 PERFORM id FROM bms_vote_settings WHERE id=1 FOR UPDATE;
 FOREACH requested_name IN ARRAY ARRAY[
  'School prefect','Head Girl','General prefect','Health prefect',
  'Entertainment prefect','Compound prefect','Sports prefect','Office girl',
  'Organization prefect','Sanitation prefect'
 ] LOOP
  requested_position := requested_position + 1;
  IF NOT EXISTS(SELECT 1 FROM bms_vote_portfolios WHERE lower(btrim(name))=lower(requested_name)) THEN
   INSERT INTO bms_vote_portfolios(name,description,position,active)
   VALUES(requested_name,'',requested_position,false);
   created_count := created_count + 1;
  END IF;
 END LOOP;
 IF (SELECT count(DISTINCT lower(btrim(name))) FROM bms_vote_portfolios WHERE lower(btrim(name)) IN (
  'school prefect','head girl','general prefect','health prefect','entertainment prefect',
  'compound prefect','sports prefect','office girl','organization prefect','sanitation prefect')) <> 10 THEN
  RAISE EXCEPTION 'Requested portfolio verification failed.';
 END IF;
 SELECT id INTO admin_id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1;
 IF admin_id IS NOT NULL THEN
  INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES(admin_id,'requested-portfolios-created',
   jsonb_build_object('source','authorised deployment','created',created_count,'requested',10,'newPortfoliosActive',false));
 END IF;
 -- No ballot revision change: new portfolios are inactive and do not alter student selections.
END $$;
