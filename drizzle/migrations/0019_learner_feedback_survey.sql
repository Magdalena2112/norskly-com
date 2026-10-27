CREATE TABLE public.survey_responses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, language text NOT NULL CHECK (language IN ('no','en','de')), course text NOT NULL CHECK (course IN ('general','health')), level text NOT NULL, answers jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,language,course)
);
GRANT SELECT ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own feedback" ON public.survey_responses FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Admins read feedback" ON public.survey_responses FOR SELECT TO authenticated USING (public.is_strict_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.submit_survey(p_language text, p_answers jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enrollment public.language_profiles; response_id uuid; bonus jsonb; k text; modules jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Prijavi se da pošalješ anketu.'; END IF;
 SELECT * INTO enrollment FROM public.language_profiles WHERE user_id=auth.uid() AND language=p_language AND onboarding_completed=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Anketa je dostupna za kurs na koji si upisan/a.'; END IF;
 IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Neispravni odgovori.'; END IF;
 FOREACH k IN ARRAY ARRAY['engagement','pace','ai'] LOOP
 IF NOT (p_answers ? k) OR jsonb_typeof(p_answers->k) IS DISTINCT FROM 'number' OR (p_answers->>k)::numeric NOT IN (1,2,3,4,5) THEN RAISE EXCEPTION 'Ocene moraju biti od 1 do 5.'; END IF;
 END LOOP;
 IF NOT (p_answers ? 'recommend') OR jsonb_typeof(p_answers->'recommend') IS DISTINCT FROM 'number' OR (p_answers->>'recommend')::numeric NOT IN (1,2,3,4,5,6,7,8,9,10) THEN RAISE EXCEPTION 'Preporuka mora biti od 1 do 10.'; END IF;
 IF COALESCE(p_answers->>'difficulty','') NOT IN ('easy','right','hard') OR COALESCE(p_answers->>'accessibility','') NOT IN ('smooth','minor','problems') OR COALESCE(p_answers->>'device','') NOT IN ('phone','computer','tablet') THEN RAISE EXCEPTION 'Izaberi ponuđene odgovore.'; END IF;
 modules := p_answers->'modules';
 IF jsonb_typeof(modules) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Izaberi najviše dva modula.'; END IF;
 IF jsonb_array_length(modules) NOT BETWEEN 1 AND 2 OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(modules) m WHERE m NOT IN ('talk','pronunciation','writing','listening','reading','vocabulary','grammar')) OR (SELECT count(DISTINCT m) FROM jsonb_array_elements_text(modules) m) <> jsonb_array_length(modules) THEN RAISE EXCEPTION 'Izaberi jedan ili dva različita modula.'; END IF;
 IF length(COALESCE(p_answers->>'frustration',''))>2000 OR length(COALESCE(p_answers->>'suggestion',''))>2000 OR length(trim(COALESCE(p_answers->>'suggestion','')))=0 OR length(COALESCE(p_answers->>'email',''))>254 THEN RAISE EXCEPTION 'Proveri dužinu odgovora i upiši predlog.'; END IF;
 IF COALESCE(p_answers->>'email','')<>'' AND (p_answers->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Proveri mejl adresu.'; END IF;
 INSERT INTO public.survey_responses(user_id,language,course,level,answers) VALUES(auth.uid(),p_language,enrollment.course_type,enrollment.level,p_answers) ON CONFLICT(user_id,language,course) DO NOTHING RETURNING id INTO response_id;
 IF response_id IS NULL THEN SELECT id INTO response_id FROM public.survey_responses WHERE user_id=auth.uid() AND language=p_language AND course=enrollment.course_type; RETURN jsonb_build_object('id',response_id,'points_awarded',0,'already_submitted',true); END IF;
 bonus := public.award_xp(auth.uid(),50,false,p_language);
 RETURN jsonb_build_object('id',response_id,'points_awarded',50,'already_submitted',false);
END; $$;
REVOKE ALL ON FUNCTION public.submit_survey(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_survey(text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_survey(text,jsonb) TO service_role;