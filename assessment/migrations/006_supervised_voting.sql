-- Preserve legacy identified ballots. New supervised ballots have no student identifiers.
CREATE TABLE bms_vote_settings (
 id integer PRIMARY KEY CHECK(id=1), title text NOT NULL DEFAULT 'Student Leadership Elections',
 mode text NOT NULL DEFAULT 'demo' CHECK(mode IN ('demo','real')), codes_required boolean NOT NULL DEFAULT false,
 revision integer NOT NULL DEFAULT 1
);
INSERT INTO bms_vote_settings(id) VALUES(1);
CREATE TABLE bms_vote_runs (
 mode text PRIMARY KEY CHECK(mode IN ('demo','real')), status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','paused','closed')),
 started_at timestamptz, closed_at timestamptz, generation integer NOT NULL DEFAULT 1
);
INSERT INTO bms_vote_runs(mode) VALUES('demo'),('real');
CREATE TABLE bms_vote_portfolios (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text NOT NULL DEFAULT '',
 position integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true
);
CREATE TABLE bms_vote_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mime text NOT NULL, data bytea NOT NULL CHECK(octet_length(data)<=1048576)
);
CREATE TABLE bms_vote_candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id uuid NOT NULL REFERENCES bms_vote_portfolios(id),
 name text NOT NULL, class_name text NOT NULL, gender text NOT NULL DEFAULT '', number text NOT NULL DEFAULT '',
 photo_id uuid NOT NULL REFERENCES bms_vote_photos(id), UNIQUE(id,portfolio_id)
);
CREATE TABLE bms_vote_ballots (
 id uuid PRIMARY KEY, mode text NOT NULL REFERENCES bms_vote_runs(mode), generation integer NOT NULL,
 digest text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE bms_vote_choices (
 ballot_id uuid NOT NULL REFERENCES bms_vote_ballots(id) ON DELETE CASCADE,
 portfolio_id uuid NOT NULL, candidate_id uuid NOT NULL,
 PRIMARY KEY(ballot_id,portfolio_id), FOREIGN KEY(candidate_id,portfolio_id) REFERENCES bms_vote_candidates(id,portfolio_id)
);
CREATE INDEX bms_vote_ballots_mode ON bms_vote_ballots(mode,generation);
CREATE INDEX bms_vote_choices_candidate ON bms_vote_choices(candidate_id);
-- Codes are not linked to ballots or student identities.
CREATE TABLE bms_vote_codes (hash text PRIMARY KEY, mode text NOT NULL REFERENCES bms_vote_runs(mode), generation integer NOT NULL, used boolean NOT NULL DEFAULT false);
CREATE TABLE bms_vote_audit (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid NOT NULL REFERENCES bms_users(id), action text NOT NULL, detail jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['bms_vote_settings','bms_vote_runs','bms_vote_portfolios','bms_vote_photos','bms_vote_candidates','bms_vote_ballots','bms_vote_choices','bms_vote_codes','bms_vote_audit'] LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t); END LOOP; END $$;
