-- Add provider column to user_voices table
ALTER TABLE user_voices ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'minimax';

-- Create index on provider for filtering
CREATE INDEX IF NOT EXISTS user_voices_provider_idx ON user_voices(provider);
