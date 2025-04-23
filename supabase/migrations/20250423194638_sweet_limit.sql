/*
  # Add Reviews and Payments Schema

  1. New Tables
    - `reviews` - User reviews for bike rentals
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `reservation_id` (uuid, foreign key)
      - `rating` (integer)
      - `comment` (text)
      - `created_at` (timestamp)
    
    - `payments` - Payment records
      - `id` (uuid, primary key)
      - `reservation_id` (uuid, foreign key)
      - `amount` (integer)
      - `currency` (text)
      - `status` (text)
      - `stripe_payment_intent_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  reservation_id uuid REFERENCES reservations(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Users can view all reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews for their reservations"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = reservation_id
      AND user_id = auth.uid()
    )
  );

-- Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = reservation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payments for their reservations"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = reservation_id
      AND user_id = auth.uid()
    )
  );