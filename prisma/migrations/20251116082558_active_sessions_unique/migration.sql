ALTER TABLE ctive_sessions
  ADD CONSTRAINT ctive_sessions_license_user_device_unique UNIQUE (license_key,user_id,device_id);
