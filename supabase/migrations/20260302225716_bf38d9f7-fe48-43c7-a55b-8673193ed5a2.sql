
-- Availability slots
CREATE TABLE public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view slots"
  ON public.availability_slots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert slots"
  ON public.availability_slots FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update slots"
  ON public.availability_slots FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete slots"
  ON public.availability_slots FOR DELETE TO authenticated
  USING (true);

-- Lessons
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slot_id UUID NOT NULL REFERENCES public.availability_slots(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  student_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view lessons"
  ON public.lessons FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own lessons"
  ON public.lessons FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lessons"
  ON public.lessons FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can update all lessons"
  ON public.lessons FOR UPDATE TO authenticated
  USING (true);

CREATE UNIQUE INDEX idx_lessons_slot_active ON public.lessons (slot_id) WHERE status = 'scheduled';
