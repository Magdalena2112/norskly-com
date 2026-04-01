
-- Fix 1: has_role - only allow admin_teacher to satisfy admin checks (one-way)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin' AND role = 'admin_teacher')
      )
  )
$$;

-- Fix 2: Force lessons status to 'scheduled' on INSERT
CREATE OR REPLACE FUNCTION public.enforce_lesson_insert_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.status := 'scheduled';
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_lesson_insert_status
  BEFORE INSERT ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.enforce_lesson_insert_status();
