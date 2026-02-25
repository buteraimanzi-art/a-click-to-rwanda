
-- Add nationality column to profiles
ALTER TABLE public.profiles ADD COLUMN nationality text DEFAULT 'foreigner';

-- Valid values: 'rwandan', 'east_african', 'foreigner'
