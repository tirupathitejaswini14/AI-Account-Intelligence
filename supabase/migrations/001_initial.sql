-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT,
    headquarters TEXT,
    founded_year INTEGER,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrichments table
CREATE TABLE IF NOT EXISTS public.enrichments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    intent_score NUMERIC(3, 1),
    intent_stage TEXT CHECK (intent_stage IN ('Awareness', 'Evaluation', 'Decision')),
    likely_persona TEXT,
    persona_confidence INTEGER CHECK (persona_confidence >= 0 AND persona_confidence <= 100),
    ai_summary TEXT,
    recommended_actions JSONB,
    tech_stack JSONB,
    business_signals JSONB,
    raw_visitor_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visitors table (optional, for raw logs if needed later)
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    visitor_id TEXT,
    pages_visited JSONB,
    dwell_time_seconds INTEGER,
    visits_this_week INTEGER,
    referral_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts
CREATE POLICY "Users can view their own accounts" 
ON public.accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" 
ON public.accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
ON public.accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.accounts FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for enrichments
CREATE POLICY "Users can view their own enrichments" 
ON public.enrichments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrichments" 
ON public.enrichments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrichments" 
ON public.enrichments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrichments" 
ON public.enrichments FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for visitors
CREATE POLICY "Users can view their own visitors" 
ON public.visitors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visitors" 
ON public.visitors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visitors" 
ON public.visitors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visitors" 
ON public.visitors FOR DELETE 
USING (auth.uid() = user_id);

-- Setup updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrichments_updated_at
BEFORE UPDATE ON public.enrichments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
