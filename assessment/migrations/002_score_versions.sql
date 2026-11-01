-- Existing records retain the original four-exercise scheme and stored totals.
ALTER TABLE bms_scores ADD COLUMN IF NOT EXISTS scheme_version integer NOT NULL DEFAULT 1 CHECK(scheme_version IN (1,2));
ALTER TABLE bms_scores ALTER COLUMN scheme_version SET DEFAULT 2;
ALTER TABLE bms_scores ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
