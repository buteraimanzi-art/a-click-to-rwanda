-- Create destinations table
CREATE TABLE IF NOT EXISTS public.destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS public.hotels (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
CREATE TABLE IF NOT EXISTS public.cars (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_id TEXT NOT NULL,
  hotel_id TEXT,
  car_id TEXT,
  activity_id TEXT,
  date DATE NOT NULL,
  notes TEXT,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom requests table for exclusive tours
CREATE TABLE IF NOT EXISTS public.custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itineraries
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for reviews (everyone can read, only logged-in can write)
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for custom requests
CREATE POLICY "Users can view their own requests"
  ON public.custom_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create requests"
  ON public.custom_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.destinations (id, name, description) VALUES
  ('musanze', 'Musanze', 'Gateway to the Volcanoes National Park'),
  ('kigali', 'Kigali', 'The vibrant capital city of Rwanda'),
  ('nyungwe', 'Nyungwe National Park', 'Home to chimpanzees and rich biodiversity'),
  ('akagera', 'Akagera National Park', 'A savannah park with the Big Five'),
  ('lake-kivu', 'Lake Kivu', 'Relaxing beaches and beautiful views'),
  ('huye', 'Huye', 'A city rich in culture and history')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hotels (id, destination_id, name) VALUES
  ('hotel-a', 'musanze', 'Mountain View Lodge'),
  ('hotel-b', 'musanze', 'Five Volcanoes Boutique Hotel'),
  ('hotel-c', 'kigali', 'Kigali Serena Hotel'),
  ('hotel-d', 'kigali', 'Radisson Blu Hotel'),
  ('hotel-e', 'nyungwe', 'One&Only Nyungwe House'),
  ('hotel-f', 'akagera', 'Akagera Game Lodge'),
  ('hotel-g', 'lake-kivu', 'Kivu Serena Hotel'),
  ('hotel-h', 'huye', 'Ibis Hotel Huye')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cars (id, destination_id, name) VALUES
  ('car-a', 'musanze', 'Toyota RAV4'),
  ('car-b', 'musanze', 'Land Cruiser Prado'),
  ('car-c', 'kigali', 'Toyota Corolla'),
  ('car-d', 'kigali', 'Mini Van'),
  ('car-e', 'nyungwe', '4x4 SUV'),
  ('car-f', 'akagera', 'Safari Vehicle'),
  ('car-g', 'lake-kivu', 'Sedan'),
  ('car-h', 'huye', 'Toyota Rush')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.activities (id, destination_id, name) VALUES
  ('act-a', 'musanze', 'Gorilla Trekking'),
  ('act-b', 'musanze', 'Golden Monkey Trekking'),
  ('act-c', 'kigali', 'Kigali Genocide Memorial'),
  ('act-d', 'kigali', 'City Tour'),
  ('act-e', 'nyungwe', 'Chimpanzee Trekking'),
  ('act-f', 'nyungwe', 'Canopy Walk'),
  ('act-g', 'akagera', 'Game Drive'),
  ('act-h', 'akagera', 'Boat Safari'),
  ('act-i', 'lake-kivu', 'Kayaking'),
  ('act-j', 'lake-kivu', 'Boat Ride to Islands'),
  ('act-k', 'huye', 'Ethnographic Museum'),
  ('act-l', 'huye', 'King''s Palace Museum')
ON CONFLICT (id) DO NOTHING;