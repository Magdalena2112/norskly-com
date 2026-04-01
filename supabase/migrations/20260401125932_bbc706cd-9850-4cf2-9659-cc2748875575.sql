
-- activities: recreate policies with TO authenticated
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- vocab_items: recreate all policies
DROP POLICY IF EXISTS "Users can view own vocab" ON public.vocab_items;
DROP POLICY IF EXISTS "Users can insert own vocab" ON public.vocab_items;
DROP POLICY IF EXISTS "Users can update own vocab" ON public.vocab_items;
DROP POLICY IF EXISTS "Users can delete own vocab" ON public.vocab_items;
CREATE POLICY "Users can view own vocab" ON public.vocab_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vocab" ON public.vocab_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vocab" ON public.vocab_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vocab" ON public.vocab_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- grammar_submissions
DROP POLICY IF EXISTS "Users can view own grammar submissions" ON public.grammar_submissions;
DROP POLICY IF EXISTS "Users can insert own grammar submissions" ON public.grammar_submissions;
CREATE POLICY "Users can view own grammar submissions" ON public.grammar_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grammar submissions" ON public.grammar_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- talk_sessions
DROP POLICY IF EXISTS "Users can view own talk sessions" ON public.talk_sessions;
DROP POLICY IF EXISTS "Users can insert own talk sessions" ON public.talk_sessions;
DROP POLICY IF EXISTS "Users can update own talk sessions" ON public.talk_sessions;
DROP POLICY IF EXISTS "Users can delete own talk sessions" ON public.talk_sessions;
CREATE POLICY "Users can view own talk sessions" ON public.talk_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own talk sessions" ON public.talk_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own talk sessions" ON public.talk_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own talk sessions" ON public.talk_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- error_events
DROP POLICY IF EXISTS "Users can view own error events" ON public.error_events;
DROP POLICY IF EXISTS "Users can insert own error events" ON public.error_events;
CREATE POLICY "Users can view own error events" ON public.error_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own error events" ON public.error_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_xp: fix SELECT to authenticated too
DROP POLICY IF EXISTS "Users can view own xp" ON public.user_xp;
CREATE POLICY "Users can view own xp" ON public.user_xp FOR SELECT TO authenticated USING (auth.uid() = user_id);
