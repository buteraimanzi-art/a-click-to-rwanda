-- Add time fields to itineraries table for daily schedule
ALTER TABLE public.itineraries 
ADD COLUMN wake_time TIME DEFAULT '06:00:00',
ADD COLUMN breakfast_time TIME DEFAULT '07:00:00',
ADD COLUMN lunch_time TIME DEFAULT '12:30:00',
ADD COLUMN dinner_time TIME DEFAULT '19:00:00';