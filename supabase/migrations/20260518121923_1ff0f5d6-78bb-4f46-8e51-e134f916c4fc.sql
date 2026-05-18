
ALTER TABLE public.availability_slots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots;
