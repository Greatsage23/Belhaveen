CREATE TABLE bms_auth_secrets (
 name text PRIMARY KEY,
 value text NOT NULL CHECK(length(value)>=32)
);
ALTER TABLE bms_auth_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bms_auth_secrets FROM PUBLIC;
