-- Create table for saved AI tour packages
CREATE TABLE public.saved_tour_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  conversation_history JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_tour_packages ENABLE ROW LEVEL SECURITY;

-- Users can view their own packages
CREATE POLICY "Users can view their own packages"
ON public.saved_tour_packages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own packages
CREATE POLICY "Users can create their own packages"
ON public.saved_tour_packages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own packages
CREATE POLICY "Users can delete their own packages"
ON public.saved_tour_packages
FOR DELETE
USING (auth.uid() = user_id);