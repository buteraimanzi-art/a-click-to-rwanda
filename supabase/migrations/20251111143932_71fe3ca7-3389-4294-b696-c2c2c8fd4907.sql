-- Add coordinates to destinations and hotels tables
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add some sample coordinates for Rwanda destinations (you can update these with actual coordinates)
-- Kigali
UPDATE public.destinations SET latitude = -1.9441, longitude = 30.0619 WHERE id = 'kigali';
-- Volcanoes National Park
UPDATE public.destinations SET latitude = -1.4667, longitude = 29.5833 WHERE id = 'volcanoes';
-- Akagera National Park
UPDATE public.destinations SET latitude = -1.9000, longitude = 30.7500 WHERE id = 'akagera';
-- Lake Kivu
UPDATE public.destinations SET latitude = -2.0000, longitude = 29.2333 WHERE id = 'lake-kivu';
-- Nyungwe Forest
UPDATE public.destinations SET latitude = -2.4833, longitude = 29.2000 WHERE id = 'nyungwe';