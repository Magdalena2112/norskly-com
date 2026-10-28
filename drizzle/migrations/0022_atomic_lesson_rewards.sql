CREATE OR REPLACE FUNCTION public.complete_lesson_exercise(_lesson_id uuid, _code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE
_uid uuid := auth.uid(); _lesson record; _module text; _points integer := 0; _n integer; _count integer; _key text; _oldkey text; _activity uuid; _reward jsonb; _staff boolean;
BEGIN
IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
SELECT id, language, course, cefr_level, lesson_code INTO _lesson FROM public.course_lessons WHERE id=_lesson_id;
IF NOT FOUND OR _lesson.lesson_code NOT IN ('EN-A1-L01','EN-A2-L01','NO-A2-L01','DE-A2-L01','NO-HC-B1-L01','DE-HC-B1-L01') THEN RAISE EXCEPTION 'Invalid lesson'; END IF;
SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('admin','admin_teacher','teacher')) INTO _staff;
IF NOT _staff AND NOT EXISTS(SELECT 1 FROM public.language_profiles WHERE user_id=_uid AND language=_lesson.language AND course_type=_lesson.course AND ( _lesson.course <> 'general' OR substring(level from '[ABC][12]')=_lesson.cefr_level)) THEN RAISE EXCEPTION 'Not enrolled'; END IF;
IF _lesson.lesson_code='EN-A1-L01' AND _code ~ '^(GR|PR|TB|AR)-(0[1-9]|10)$' THEN _module:='grammar'; _points:=1;
ELSIF _lesson.lesson_code='EN-A2-L01' AND (_code ~ '^(PS|PC)-0[1-5]$' OR _code ~ '^MIX-(0[1-9]|1[0-9]|20)$' OR _code ~ '^ST-(0[1-9]|10)$') THEN _module:='grammar'; _points:=1;
ELSIF _lesson.language IN ('no','de') AND _code ~ '^G-(0[1-9]|[12][0-9]|30)$' THEN _module:='grammar'; _n:=right(_code,2)::integer; _points:=CASE WHEN _n<=10 THEN 2 ELSE 1 END;
ELSIF (_lesson.lesson_code<>'EN-A1-L01' AND _code ~ '^VO-(0[1-9]|1[0-9]|20)$') OR (_lesson.lesson_code='EN-A1-L01' AND (_code ~ '^(GI|PCF)-0[1-5]$' OR _code ~ '^CO-0[1-6]$' OR _code ~ '^NUM-0[1-4]$')) THEN _module:='vocabulary'; _points:=1;
ELSIF (_lesson.lesson_code='EN-A1-L01' AND _code ~ '^IZ-(0[1-9]|10)$') OR (_lesson.lesson_code<>'EN-A1-L01' AND _code ~ '^P-(0[1-9]|10)$') THEN _module:='pronunciation'; _points:=1;
ELSIF (_lesson.lesson_code='EN-A1-L01' AND _code ~ '^LI-(0[1-9]|10)$') OR (_lesson.lesson_code<>'EN-A1-L01' AND _code ~ ('^' || _lesson.lesson_code || '-L(0[1-9]|10)$')) THEN _module:='listening'; _points:=1;
ELSIF _code ~ '^WR-0[1-5]$' THEN _n:=right(_code,2)::integer; _count:=CASE WHEN _lesson.lesson_code='EN-A1-L01' THEN 5 ELSE 2 END; IF _n>_count THEN RAISE EXCEPTION 'Invalid writing exercise'; END IF; _module:='writing'; _points:=20/_count;
ELSE RAISE EXCEPTION 'Invalid rewarded exercise'; END IF;
_key:=CASE _module WHEN 'grammar' THEN 'lesson:'||_lesson_id::text||':'||_code WHEN 'vocabulary' THEN 'lesson-vocabulary:'||_lesson_id::text||':'||_code WHEN 'pronunciation' THEN 'lesson_pron_'||_lesson.lesson_code||'_'||_code||'_'||_lesson.language WHEN 'listening' THEN 'lesson_listen_'||_lesson.lesson_code||'_'||_code||'_'||_lesson.language WHEN 'writing' THEN 'lesson_write_'||_lesson.lesson_code||'_'||_code||'_'||_lesson.language END;
PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text||_lesson_id::text,0));
INSERT INTO public.activities(user_id,module,type,points,payload,dedup_key,language) VALUES(_uid,CASE WHEN _module='writing' THEN 'grammar' ELSE _module END,CASE _module WHEN 'grammar' THEN 'lesson_grammar_exercise' WHEN 'vocabulary' THEN 'lesson_vocabulary_exercise' WHEN 'pronunciation' THEN 'lesson_pronunciation' WHEN 'listening' THEN 'lesson_scene' WHEN 'writing' THEN 'lesson_writing' END,_points,jsonb_build_object('lesson_id',_lesson_id,'lesson',_lesson.lesson_code,'code',_code,'xp',_points),_key,_lesson.language) ON CONFLICT(user_id,dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING RETURNING id INTO _activity;
IF _activity IS NOT NULL THEN _reward:=public.award_xp(_uid,_points,false,_lesson.language); ELSE _reward:=jsonb_build_object('points_awarded',0); END IF;
INSERT INTO public.course_lesson_progress(user_id,lesson_id,language,completed_steps,status) VALUES(_uid,_lesson_id,_lesson.language,jsonb_build_array(_code),'in_progress') ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed_steps=(SELECT jsonb_agg(DISTINCT step) FROM jsonb_array_elements(COALESCE(course_lesson_progress.completed_steps,'[]'::jsonb)||EXCLUDED.completed_steps) AS steps(step));
RETURN _reward;
END; $$;
REVOKE ALL ON FUNCTION public.complete_lesson_exercise(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_lesson_exercise(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.complete_medical_vocabulary(_lesson_id uuid,_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ BEGIN IF _code !~ '^VO-(0[1-9]|1[0-9]|20)$' THEN RAISE EXCEPTION 'Invalid vocabulary exercise'; END IF; RETURN public.complete_lesson_exercise(_lesson_id,_code); END; $$;
REVOKE ALL ON FUNCTION public.complete_medical_vocabulary(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_medical_vocabulary(uuid,text) TO authenticated;