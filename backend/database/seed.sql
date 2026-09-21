-- ==============================================================================
-- DATABASE SEED: QR-Based Rental Asset Tracking & Return Management System (RentIQ)
-- Target Database: PostgreSQL 14+
-- Passwords:
-- Admin: Admin@123 (Hash: $2a$10$w8u3ZiqsF73y6t6FhZ3Rk.V3e/0NlP7aE10o9J9c8ZzJek9FqD7i2)
-- Staff: Staff@123 (Hash: $2a$10$Kq1ZpD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2)
-- Borrower: Borrower@123 (Hash: $2a$10$7vN3fD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2)
-- ==============================================================================

-- 1. USERS
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('usr-admin-01', 'Eleanor Vance (Admin)', 'admin@rentiq.com', '$2a$10$w8u3ZiqsF73y6t6FhZ3Rk.V3e/0NlP7aE10o9J9c8ZzJek9FqD7i2', 'ADMIN', 'ACTIVE'),
('usr-staff-01', 'Marcus Brody (Staff)', 'staff1@rentiq.com', '$2a$10$Kq1ZpD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'STAFF', 'ACTIVE'),
('usr-staff-02', 'Sarah Connor (Staff)', 'staff2@rentiq.com', '$2a$10$Kq1ZpD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'STAFF', 'ACTIVE'),
('usr-borr-01', 'Alexander Hayes', 'borrower1@rentiq.com', '$2a$10$7vN3fD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'BORROWER', 'ACTIVE'),
('usr-borr-02', 'Beatrice Morales', 'borrower2@rentiq.com', '$2a$10$7vN3fD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'BORROWER', 'ACTIVE'),
('usr-borr-03', 'Chen Wei', 'borrower3@rentiq.com', '$2a$10$7vN3fD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'BORROWER', 'ACTIVE'),
('usr-borr-04', 'Daria Petrova', 'borrower4@rentiq.com', '$2a$10$7vN3fD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'BORROWER', 'ACTIVE'),
('usr-borr-05', 'Evan Scott', 'borrower5@rentiq.com', '$2a$10$7vN3fD/V7n2iQxHwzX2MhO.5fJc78n4A12r8L0o9D1vJek9FqD7i2', 'BORROWER', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 2. CATEGORIES
INSERT INTO asset_categories (id, name, description) VALUES
('cat-01', 'Computing & Laptops', 'High-performance engineering laptops, workstations, and computing hardware.'),
('cat-02', 'Cameras & Audio-Visual', 'Cinema cameras, DSLR rigs, field audio recorders, and production lighting.'),
('cat-03', 'Drones & Aerial Imaging', 'Aerial mapping drones, 4K/8K inspection UAVs, and remote pilot packages.'),
('cat-04', 'Power Tools & Field Equipment', 'Industrial drills, rotary laser levels, impact drivers, and safety equipment.'),
('cat-05', 'Scientific & Measurement', 'Digital oscilloscopes, thermal cameras, precision calipers, and spectrometers.')
ON CONFLICT (name) DO NOTHING;

-- 3. ASSETS (15 assets)
INSERT INTO assets (id, asset_code, name, category_id, description, specifications, qr_token, status, current_condition, image_url) VALUES
('ast-01', 'AST-COMP-001', 'MacBook Pro 16" (M3 Max / 64GB / 2TB)', 'cat-01', 'Space Black, Apple M3 Max 16-Core, 40-Core GPU, 64GB Unified RAM, 2TB SSD.', '{"cpu":"M3 Max","ram":"64GB","storage":"2TB"}', 'QR-AST-COMP-001-TOKEN', 'AVAILABLE', 'EXCELLENT', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'),
('ast-02', 'AST-COMP-002', 'Dell Precision 5680 Workstation', 'cat-01', 'Intel Core i9-13900H, RTX 4000 Ada 12GB, 32GB DDR5, 1TB NVMe, OLED 4K Touch.', '{"cpu":"i9-13900H","gpu":"RTX 4000 Ada"}', 'QR-AST-COMP-002-TOKEN', 'AVAILABLE', 'GOOD', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'),
('ast-03', 'AST-COMP-003', 'Lenovo ThinkPad P1 Gen 6', 'cat-01', 'Carbon fiber chassis, Intel Core i7, 32GB RAM, RTX 3070Ti, Cellular LTE modem.', '{"cpu":"i7-13800H","ram":"32GB"}', 'QR-AST-COMP-003-TOKEN', 'REQUESTED', 'EXCELLENT', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80'),
('ast-04', 'AST-AV-001', 'Sony FX3 Full-Frame Cinema Camera', 'cat-02', '4K 120p cinema camera with cage, XLR top handle, 2x CFexpress Type A 160GB cards.', '{"sensor":"Full-Frame","recording":"4K 120p"}', 'QR-AST-AV-001-TOKEN', 'ISSUED', 'EXCELLENT', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'),
('ast-05', 'AST-AV-002', 'Canon EOS R5 C Hybrid Cine Camera', 'cat-02', '8K 60p RAW recording, 45MP still sensor, dual pixel CMOS AF II, active cooling fan.', '{"sensor":"45MP","recording":"8K 60p"}', 'QR-AST-AV-002-TOKEN', 'AVAILABLE', 'GOOD', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'),
('ast-06', 'AST-AV-003', 'Rode Wireless PRO Dual-Channel Kit', 'cat-02', 'Dual transmitters, receiver, 32-bit float on-board recording, timecode, Lavalier II.', '{"channels":2,"range":"260m"}', 'QR-AST-AV-003-TOKEN', 'AVAILABLE', 'EXCELLENT', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'),
('ast-07', 'AST-AV-004', 'DJI RS 3 Pro Gimbal Stabilizer', 'cat-02', 'Automated axis locks, extended carbon fiber arms, 4.5kg payload, LiDAR focusing motor.', '{"payload":"4.5kg","batteryLife":"12h"}', 'QR-AST-AV-004-TOKEN', 'AVAILABLE', 'GOOD', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80'),
('ast-08', 'AST-DRN-001', 'DJI Mavic 3 Pro Cine Combo', 'cat-03', 'Triple-camera system (Hasselblad 4/3 CMOS + Dual Tele), Apple ProRes, 1TB SSD.', '{"camera":"Hasselblad 4/3","flightTime":"43min"}', 'QR-AST-DRN-001-TOKEN', 'ISSUED', 'EXCELLENT', 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80'),
('ast-09', 'AST-DRN-002', 'Skydio 2+ Enterprise Autonomous UAV', 'cat-03', '360 degree obstacle avoidance powered by 6 navigation cameras, 4K60 HDR, tablet controller.', '{"avoidance":"Autonomous 360 AI"}', 'QR-AST-DRN-002-TOKEN', 'AVAILABLE', 'FAIR', 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80'),
('ast-10', 'AST-TOOL-001', 'DeWalt 20V MAX XR 5-Tool Combo Kit', 'cat-04', 'Hammer drill, impact driver, circular saw, reciprocating saw, LED worklight.', '{"voltage":"20V MAX"}', 'QR-AST-TOOL-001-TOKEN', 'AVAILABLE', 'GOOD', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'),
('ast-11', 'AST-TOOL-002', 'Bosch GRL 900 Rotary Self-Leveling Laser', 'cat-04', 'Horizontal and vertical self-leveling rotary laser, 300m range with laser receiver.', '{"range":"300m"}', 'QR-AST-TOOL-002-TOKEN', 'AVAILABLE', 'EXCELLENT', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'),
('ast-12', 'AST-TOOL-003', 'Fluke Ti480 PRO Industrial Thermal Camera', 'cat-04', '640x480 resolution thermal imager, SuperResolution up to 1280x960.', '{"irResolution":"640x480"}', 'QR-AST-TOOL-003-TOKEN', 'MAINTENANCE', 'DAMAGED', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80'),
('ast-13', 'AST-SCI-001', 'Keysight InfiniiVision 4-Channel Oscilloscope', 'cat-05', '100MHz 4 analog channels, 1M waveforms/sec update rate, MegaZoom IV.', '{"bandwidth":"100MHz","channels":4}', 'QR-AST-SCI-001-TOKEN', 'AVAILABLE', 'EXCELLENT', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=80'),
('ast-14', 'AST-SCI-002', 'Mitutoyo Digimatic Precision Caliper Set', 'cat-05', '0-200mm digital vernier caliper, AOS electromagnetic induction sensor.', '{"range":"0-200mm"}', 'QR-AST-SCI-002-TOKEN', 'AVAILABLE', 'GOOD', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80'),
('ast-15', 'AST-SCI-003', 'Leica DISTO D810 Touch Laser Measure', 'cat-05', 'Touchscreen laser distance meter with digital Pointfinder camera.', '{"range":"200m"}', 'QR-AST-SCI-003-TOKEN', 'RETURN_INITIATED', 'GOOD', 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80')
ON CONFLICT (asset_code) DO NOTHING;
