-- Migration: Add display_name_en column
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS display_name_en VARCHAR(100);

-- Update display names for English
UPDATE membership_plans SET display_name_en = 'Lite Plan' WHERE name_en = 'lite-monthly';
UPDATE membership_plans SET display_name_en = 'Pro Plan' WHERE name_en = 'pro-monthly';
