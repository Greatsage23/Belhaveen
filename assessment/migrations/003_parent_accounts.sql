ALTER TABLE bms_users DROP CONSTRAINT IF EXISTS bms_users_role_check;
ALTER TABLE bms_users ADD CONSTRAINT bms_users_role_check CHECK(role IN ('administrator','headteacher','teacher','student','parent'));
CREATE TABLE IF NOT EXISTS bms_parent_students(
  parent_id uuid NOT NULL REFERENCES bms_users(id),
  student_id uuid NOT NULL REFERENCES bms_students(id),
  PRIMARY KEY(parent_id,student_id)
);
ALTER TABLE bms_parent_students ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bms_parent_students FROM PUBLIC;
