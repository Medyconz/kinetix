INSERT INTO activities (id, title, activity_date, activity_time, location, age_group, description, is_active)
VALUES
  ('speed-agility-circuit', 'Speed & Agility Circuit', '2026-05-24', '6:00 PM', 'Kinetix Field Zone', '14+', 'Acceleration, footwork, direction change, and clean landing mechanics.', 1),
  ('mobility-reset-workshop', 'Mobility Reset Workshop', '2026-05-25', '10:00 AM', 'Kinetix Studio', '16+', 'A focused reset for hips, shoulders, ankles, and controlled range.', 1),
  ('youth-movement-lab', 'Youth Movement Lab', '2026-05-27', '5:30 PM', 'Community Court', '9-13', 'Coordination, sprint basics, balance, and athletic confidence.', 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO products (id, name, description, price_label, option_label, options, sort_order, is_active)
VALUES
  ('performance-tee', 'Kinetix Performance Tee', 'Lightweight training tee for sessions and daily movement.', 'Price: TBA', 'Size / color', '["Black / S","Black / M","White / L","Grey / XL"]', 10, 1),
  ('hoodie', 'Kinetix Hoodie', 'Minimal warm layer for recovery, travel, and cool sessions.', 'Price: TBA', 'Size / color', '["Black / S","Black / M","Grey / L","Grey / XL"]', 20, 1),
  ('cap', 'Kinetix Cap', 'Structured everyday cap with a clean athletic profile.', 'Price: TBA', 'Size / color', '["Black / One size","White / One size","Grey / One size"]', 30, 1),
  ('bottle', 'Kinetix Bottle', 'Training bottle for court, field, studio, and gym.', 'Price: TBA', 'Size / color', '["Matte black / 750ml","White / 750ml","Steel grey / 1L"]', 40, 1)
ON CONFLICT(id) DO NOTHING;
