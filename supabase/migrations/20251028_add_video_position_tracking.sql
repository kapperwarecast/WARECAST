-- Migration: Add video position tracking to emprunts table
-- Created: 2025-10-28
-- Description: Adds columns to track video playback position and last watch time

-- Add position_seconds column to store playback position
ALTER TABLE emprunts
ADD COLUMN IF NOT EXISTS position_seconds INTEGER DEFAULT 0;

-- Add last_watched_at column to track when user last watched
ALTER TABLE emprunts
ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMP WITH TIME ZONE;

-- Add constraint to ensure position is non-negative
ALTER TABLE emprunts
ADD CONSTRAINT check_position_positive
CHECK (position_seconds >= 0);

-- Add comment for documentation
COMMENT ON COLUMN emprunts.position_seconds IS 'Current playback position in seconds for resume functionality';
COMMENT ON COLUMN emprunts.last_watched_at IS 'Last time the user watched this rental, used for 30-day expiration';

-- Create index for efficient queries on user's active rentals with positions
CREATE INDEX IF NOT EXISTS idx_emprunts_user_movie_status
ON emprunts(user_id, movie_id, statut)
WHERE statut = 'en_cours';
