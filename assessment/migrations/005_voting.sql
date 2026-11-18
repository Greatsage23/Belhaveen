CREATE TABLE bms_elections(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','closed')));
CREATE TABLE bms_candidates(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),election_id uuid NOT NULL REFERENCES bms_elections(id),name text NOT NULL,statement text NOT NULL DEFAULT '',votes integer NOT NULL DEFAULT 0 CHECK(votes>=0));
CREATE TABLE bms_voters(election_id uuid REFERENCES bms_elections(id),student_id uuid REFERENCES bms_students(id),PRIMARY KEY(election_id,student_id));
ALTER TABLE bms_elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_voters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bms_elections,bms_candidates,bms_voters FROM PUBLIC;
