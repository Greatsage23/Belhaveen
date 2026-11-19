-- User-requested recovery from a temporary administrator sign-in lock.
-- Preserve the password, sessions and all election records.
WITH unlocked AS (
 UPDATE bms_users SET failures=0,locked_until=NULL
 WHERE login='administrator' AND role='administrator' AND NOT disabled
 RETURNING id
)
INSERT INTO bms_audit(actor_id,action,target)
SELECT id,'administrator-login-unlocked',id::text FROM unlocked;
