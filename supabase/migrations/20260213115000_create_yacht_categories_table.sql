-- Create yacht_categories table
CREATE TABLE IF NOT EXISTS yacht_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO yacht_categories (name) VALUES
  ('Luxury'),
  ('Premium'),
  ('Super')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE yacht_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view yacht categories"
  ON yacht_categories FOR SELECT
  USING (true);

-- Create policy for authenticated users to insert/update/delete
CREATE POLICY "Authenticated users can manage yacht categories"
  ON yacht_categories FOR ALL
  USING (auth.role() = 'authenticated');
