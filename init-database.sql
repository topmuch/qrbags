-- =============================================
-- Supabase Database Initialization Script
-- =============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', 'inactive')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- Enable Row Level Security
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Profiles Policies
-- =============================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- =============================================
-- Subscriptions Policies
-- =============================================

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" 
ON subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" 
ON subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger for subscriptions updated_at
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- Profile Creation Function
-- =============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE profiles IS 'User profile information';
COMMENT ON TABLE subscriptions IS 'User subscription data from Stripe';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription tier: free, pro, premium';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
COMMENT ON COLUMN subscriptions.current_period_end IS 'When the current billing period ends';
-- qr_lots (pour les agences)
CREATE TABLE qr_lots (
  id TEXT PRIMARY KEY,
  agency_id UUID REFERENCES auth.users(id),
  airline_id UUID, -- optionnel
  total_quantity INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- baggage_items (un par bagage activé)
CREATE TABLE baggage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_lot_id TEXT REFERENCES qr_lots(id),
  baggage_number INT, -- 1, 2, 3...
  owner_email TEXT,
  owner_phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- scans
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baggage_item_id UUID REFERENCES baggage_items(id),
  city TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);

-- RLS
ALTER TABLE qr_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE baggage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Agencies manage own lots" ON qr_lots
  FOR ALL USING (auth.uid() = agency_id);

CREATE POLICY "Owners see their baggage" ON baggage_items
  FOR SELECT USING (auth.uid()::text = owner_email); -- ou via token

CREATE POLICY "Anyone can scan" ON scans
  FOR INSERT WITH CHECK (true);
