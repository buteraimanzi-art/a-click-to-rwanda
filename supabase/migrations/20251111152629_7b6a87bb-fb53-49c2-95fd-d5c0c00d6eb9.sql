-- Add support for transfer days and origin tracking
ALTER TABLE public.itineraries
ADD COLUMN day_type text NOT NULL DEFAULT 'regular',
ADD COLUMN origin_id text;

-- Add check constraint for day_type
ALTER TABLE public.itineraries
ADD CONSTRAINT day_type_check CHECK (day_type IN ('regular', 'transfer'));

-- Add comment for clarity
COMMENT ON COLUMN public.itineraries.day_type IS 'Type of day: regular (destination with activities) or transfer (travel between locations)';
COMMENT ON COLUMN public.itineraries.origin_id IS 'Origin destination for transfer days';