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
  price_label TEXT NOT NULL DEFAULT 'Price: TBA',
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

CREATE INDEX IF NOT EXISTS idx_activities_public ON activities (is_active, activity_date, activity_time);
CREATE INDEX IF NOT EXISTS idx_products_public ON products (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations (created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings (created_at);
