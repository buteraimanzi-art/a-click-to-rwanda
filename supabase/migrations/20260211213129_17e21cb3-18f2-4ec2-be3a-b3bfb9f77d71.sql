
-- 1. Tour company images table for gallery carousel
CREATE TABLE public.tour_company_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.tour_companies(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_company_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tour company images"
ON public.tour_company_images FOR SELECT USING (true);

CREATE POLICY "Service role can manage tour company images"
ON public.tour_company_images FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 2. Add website column to hotels
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS website TEXT;

-- 3. SOS alerts table to display in staff portal
CREATE TABLE public.sos_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  phone_number TEXT,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  has_voice_recording BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
ON public.sos_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create alerts"
ON public.sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage alerts"
ON public.sos_alerts FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 4. Conversations and messages for in-platform messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT DEFAULT 'General Inquiry',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage conversations"
ON public.conversations FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage messages"
ON public.messages FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Triggers
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
