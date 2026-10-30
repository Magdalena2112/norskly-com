-- Survey submissions no longer award XP (owner decision 2026-10-30). Applied via dynamic redefinition.
DO $$ DECLARE d text; BEGIN
 d := pg_get_functiondef('public.submit_survey(text,jsonb,text)'::regprocedure);
 d := replace(d, E' bonus := public.award_xp(auth.uid(),50,false,p_language);\n', '');
 d := replace(d, '''points_awarded'',50', '''points_awarded'',0');
 EXECUTE d;
END $$;
