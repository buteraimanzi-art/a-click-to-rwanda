-- Add display_name column to reviews to hide user_id from public queries
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS display_name text;

-- Create a function to generate anonymous display names
CREATE OR REPLACE FUNCTION public.generate_review_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a pseudonymous display name like "Traveler-ABC123"
  NEW.display_name := 'Traveler-' || UPPER(SUBSTRING(MD5(NEW.user_id::text || NEW.created_at::text) FROM 1 FOR 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate display names on insert
DROP TRIGGER IF EXISTS set_review_display_name ON public.reviews;
CREATE TRIGGER set_review_display_name
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_review_display_name();

-- Update existing reviews with display names
UPDATE public.reviews 
SET display_name = 'Traveler-' || UPPER(SUBSTRING(MD5(user_id::text || created_at::text) FROM 1 FOR 6))
WHERE display_name IS NULL;