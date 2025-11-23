-- ProtoLab 3D Poland - Supabase Database Schema Migration
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  material TEXT NOT NULL,
  color TEXT NOT NULL,
  layer_height DOUBLE PRECISION NOT NULL,
  infill INTEGER NOT NULL CHECK (infill >= 0 AND infill <= 100),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_queue', 'printing', 'finished', 'delivered')),
  material_weight DOUBLE PRECISION CHECK (material_weight >= 0),
  print_time DOUBLE PRECISION CHECK (print_time >= 0),
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('pickup', 'inpost', 'courier')),
  review TEXT,
  tracking_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_rate DOUBLE PRECISION NOT NULL DEFAULT 0.05,
  time_rate DOUBLE PRECISION NOT NULL DEFAULT 10,
  service_fee DOUBLE PRECISION NOT NULL DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default settings
INSERT INTO public.settings (material_rate, time_rate, service_fee)
VALUES (0.05, 10, 5)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to users" ON public.users
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for orders table
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create orders
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to orders" ON public.orders
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for refresh_tokens table
-- Users can view their own tokens
CREATE POLICY "Users can view own refresh tokens" ON public.refresh_tokens
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to refresh tokens" ON public.refresh_tokens
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for settings table
-- Everyone can read settings
CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to settings" ON public.settings
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to automatically delete expired refresh tokens
CREATE OR REPLACE FUNCTION delete_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.refresh_tokens
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired tokens (run daily)
-- Note: This requires pg_cron extension which may need to be enabled in Supabase Dashboard
-- SELECT cron.schedule('delete-expired-tokens', '0 0 * * *', 'SELECT delete_expired_refresh_tokens();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.users, public.orders TO authenticated;
GRANT UPDATE ON public.users, public.orders TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables created: users, orders, refresh_tokens, settings';
  RAISE NOTICE 'Row Level Security enabled with appropriate policies';
END $$;
