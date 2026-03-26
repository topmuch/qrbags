-- QRBag Admin User Creation Script
-- Run this SQL directly in the database

-- Insert superadmin user
-- Password is bcrypt hash of 'admin123'
INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin@qrbag.com',
  'SuperAdmin',
  '$2a$10$EqKcp1WFKVQISheBxmXNGexPR.i7QYXOJC.OFfQDT8iSaHuuPdlrW',
  'superadmin',
  datetime('now'),
  datetime('now')
);

-- Insert default settings
INSERT OR IGNORE INTO Setting (id, key, value, updatedAt) VALUES
  ('setting-001', 'company_name', 'QRBag', datetime('now')),
  ('setting-002', 'company_email', 'contact@qrbag.com', datetime('now')),
  ('setting-003', 'company_phone', '+33 7 45 34 93 39', datetime('now'));
