
-- Add trigger to enforce score validation on grammar_sessions
-- Forces score to 0 on insert so it can only be set server-side
CREATE OR REPLACE FUNCTION public.enforce_grammar_session_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure score is between 0 and total
  IF NEW.score < 0 THEN
    NEW.score := 0;
  END IF;
  IF NEW.total < 0 THEN
    NEW.total := 0;
  END IF;
  IF NEW.score > NEW.total THEN
    NEW.score := NEW.total;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_grammar_session_score_trigger
BEFORE INSERT OR UPDATE ON public.grammar_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_grammar_session_score();
