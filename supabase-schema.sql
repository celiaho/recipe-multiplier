-- ============================================================
-- Recipe Multiplier — Supabase Database Schema
-- Run this in the Supabase SQL Editor (supabase.com > your project > SQL Editor)
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT,
  last_name     TEXT,
  company_name  TEXT,
  avatar_url    TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recipes
CREATE TABLE recipes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name                 TEXT NOT NULL,
  source_name          TEXT,
  author               TEXT,
  source_url           TEXT,
  instructions         TEXT,
  chef_notes           TEXT,
  original_ingredients TEXT NOT NULL,
  original_servings    NUMERIC NOT NULL,
  desired_servings     NUMERIC NOT NULL,
  scaled_ingredients   JSONB,
  total_cost           NUMERIC,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on recipe change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Recipe Shares
CREATE TABLE recipe_shares (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  shared_by    UUID REFERENCES public.profiles(id) NOT NULL,
  shared_with  UUID REFERENCES public.profiles(id) NOT NULL,
  shared_email TEXT NOT NULL,
  permission   TEXT CHECK (permission IN ('view', 'edit')) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_id, shared_with)
);

-- Helper: look up a user's UUID by email (used by the sharing API)
-- SECURITY DEFINER allows it to query auth.users without exposing that table directly
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = lower(email_input) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view any profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner full access" ON recipes
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Shared users can read" ON recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE recipe_id = recipes.id AND shared_with = auth.uid()
    )
  );
CREATE POLICY "Shared editors can update" ON recipes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE recipe_id = recipes.id
        AND shared_with = auth.uid()
        AND permission = 'edit'
    )
  );

ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages shares" ON recipe_shares
  FOR ALL USING (shared_by = auth.uid());
CREATE POLICY "Recipient views own share" ON recipe_shares
  FOR SELECT USING (shared_with = auth.uid());

-- ============================================================
-- Storage bucket for avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
