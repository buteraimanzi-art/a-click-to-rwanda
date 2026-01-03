-- Add booking status fields to itineraries table
ALTER TABLE public.itineraries
ADD COLUMN hotel_booked BOOLEAN DEFAULT false,
ADD COLUMN activity_booked BOOLEAN DEFAULT false,
ADD COLUMN all_confirmed BOOLEAN DEFAULT false;

-- Add car_booked at itinerary level (since car is booked once for entire trip)
-- We'll track this separately since car applies to the whole itinerary