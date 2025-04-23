/*
  # Bike Rental Schema

  1. New Tables
    - `stations` - Bike rental stations
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `latitude` (float8)
      - `longitude` (float8)
      - `created_at` (timestamp)
    
    - `bikes` - Individual bikes
      - `id` (uuid, primary key)
      - `station_id` (uuid, foreign key)
      - `status` (text)
      - `created_at` (timestamp)
    
    - `reservations` - Bike reservations
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `bike_id` (uuid, foreign key)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create stations table
CREATE TABLE stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bikes table
CREATE TABLE bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid REFERENCES stations(id),
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  CHECK (status IN ('available', 'reserved', 'in_use', 'maintenance'))
);

-- Create reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  bike_id uuid REFERENCES bikes(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policies for stations
CREATE POLICY "Stations are viewable by everyone"
  ON stations FOR SELECT
  TO public
  USING (true);

-- Policies for bikes
CREATE POLICY "Bikes are viewable by everyone"
  ON bikes FOR SELECT
  TO public
  USING (true);

-- Policies for reservations
CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert sample data
INSERT INTO stations (name, address, phone, latitude, longitude) VALUES
  ('Central Station Bike Rental', 'Stationsplein 1, 1012 AB Amsterdam', '+31 20 123 4567', 52.3791, 4.9003),
  ('Vondelpark Bikes', 'Vondelpark 7, 1071 AA Amsterdam', '+31 20 987 6543', 52.3579, 4.8686),
  ('Museum Quarter Rentals', 'Museumplein 6, 1071 DJ Amsterdam', '+31 20 456 7890', 52.3602, 4.8852);

-- Insert sample bikes (10 bikes per station)
WITH station_ids AS (SELECT id FROM stations)
INSERT INTO bikes (station_id)
SELECT s.id
FROM station_ids s
CROSS JOIN generate_series(1, 10);