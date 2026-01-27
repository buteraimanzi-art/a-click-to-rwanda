-- Add cost tracking columns to itineraries table
ALTER TABLE public.itineraries
ADD COLUMN hotel_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN activity_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN car_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN transport_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN other_cost DECIMAL(10,2) DEFAULT NULL;

-- Add a comment to explain the columns
COMMENT ON COLUMN public.itineraries.hotel_cost IS 'Cost of hotel/accommodation in USD';
COMMENT ON COLUMN public.itineraries.activity_cost IS 'Cost of activity/permit in USD';
COMMENT ON COLUMN public.itineraries.car_cost IS 'Cost of car rental per day in USD';
COMMENT ON COLUMN public.itineraries.transport_cost IS 'Cost of transport/fuel in USD';
COMMENT ON COLUMN public.itineraries.other_cost IS 'Any other costs in USD';