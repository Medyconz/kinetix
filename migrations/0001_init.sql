CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  activity_time TEXT NOT NULL,
  location TEXT NOT NULL,
  age_group TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_label TEXT NOT NULL DEFAULT 'Contact for pricing',
  option_label TEXT NOT NULL DEFAULT 'Size / color',
  options TEXT NOT NULL DEFAULT '[]',
  image_key TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  activity_choice TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  session_type TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS role_templates (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS role_template_permissions (
  role_key TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_user_id TEXT NOT NULL,
  role_key TEXT NOT NULL,
  PRIMARY KEY (admin_user_id, role_key)
);

CREATE TABLE IF NOT EXISTS admin_user_permission_overrides (
  admin_user_id TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  effect TEXT NOT NULL CHECK (effect IN ('grant','deny')),
  PRIMARY KEY (admin_user_id, permission_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state TEXT DEFAULT '',
  after_state TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  metadata TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO admin_users (id, display_name) VALUES ('owner', 'Owner');
INSERT OR IGNORE INTO role_templates (key, label, description) VALUES ('owner', 'Owner', 'Full administrative access');
INSERT OR IGNORE INTO admin_user_roles (admin_user_id, role_key) VALUES ('owner', 'owner');

INSERT OR IGNORE INTO permissions (key, category, label, description) VALUES
('admin.export_backup_snapshot','security','Export backup snapshot','Download redacted all-data admin backup'),
('user.manage_admin_users','security','Manage admin users','Manage future admin staff records'),
('user.grant_permission','security','Grant permissions','Manage future permission overrides'),
('audit.view_log','security','View audit log','Review and export admin audit history'),
('settings.edit_app_settings','settings','Edit app settings','Manage admin integrations and app settings'),
('site.edit_content','site','Edit site content','Edit public site content'),
('site.upload_media','site','Upload media','Upload site media'),
('activity.view','operations','View activities','Read admin activity list'),
('activity.edit','operations','Edit activities','Create and update activities'),
('activity.delete','operations','Delete activities','Delete activities'),
('activity.export','operations','Export activities','Export activity data'),
('product.view','catalog','View products','Read product catalog'),
('product.edit','catalog','Edit products','Create and update products'),
('product.delete','catalog','Delete products','Delete products'),
('product.upload_image','catalog','Upload product images','Upload product imagery to R2'),
('product.export','catalog','Export products','Export product data'),
('registration.view','operations','View registrations','Read activity registrations'),
('registration.export','operations','Export registrations','Export activity registrations'),
('booking.view','operations','View bookings','Read coaching bookings'),
('booking.export','operations','Export bookings','Export coaching bookings');

INSERT OR IGNORE INTO role_template_permissions (role_key, permission_key)
SELECT 'owner', key FROM permissions;

CREATE INDEX IF NOT EXISTS idx_activities_public ON activities (is_active, activity_date, activity_time);
CREATE INDEX IF NOT EXISTS idx_products_public ON products (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations (created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
