-- Enable RLS on public tables that don't have it
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies to allow everyone to read these public data tables
CREATE POLICY "Anyone can view destinations" 
ON public.destinations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view hotels" 
ON public.hotels 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view cars" 
ON public.cars 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view activities" 
ON public.activities 
FOR SELECT 
USING (true);