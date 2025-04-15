-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add new columns to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS tour_id INTEGER REFERENCES tours(id);
ALTER TABLE shows ADD COLUMN IF NOT EXISTS is_scored BOOLEAN DEFAULT FALSE;

-- Add index for faster show queries by tour_id
CREATE INDEX IF NOT EXISTS idx_shows_tour_id ON shows(tour_id);

-- Insert Spring 2025 Tour
INSERT INTO tours (name, start_date, end_date, description) 
VALUES ('Spring 2025', '2025-04-18', '2025-05-30', 'Spring Tour 2025')
ON CONFLICT (name) DO NOTHING;