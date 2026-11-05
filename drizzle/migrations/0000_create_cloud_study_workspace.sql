CREATE TABLE public.profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '', avatar_url text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Edit own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE FUNCTION public.create_student_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.profiles(user_id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Student')); RETURN NEW; END; $$;
CREATE TRIGGER create_student_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();
CREATE TABLE public.study_workspaces (
 user_id uuid PRIMARY KEY,
 data jsonb NOT NULL DEFAULT '{"subjects":[{"id":"prog","name":"Programming","color":"blue"},{"id":"math","name":"Mathematics","color":"pink"},{"id":"eng","name":"English","color":"mint"},{"id":"db","name":"Database Systems","color":"lavender"},{"id":"net","name":"Computer Networks","color":"butter"}],"tasks":[],"sessions":[],"points":0,"pet":{"name":"Mochi","happiness":78,"energy":64,"hunger":40,"xp":0,"level":1,"accessory":"bow"},"settings":{"focus":25,"short":5,"long":15,"longEvery":4,"dailyGoalMin":120},"timer":{"mode":"focus","running":false,"endsAt":null,"remainingMs":1500000,"subjectId":"prog","focusCount":0}}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_workspaces TO authenticated;
GRANT ALL ON public.study_workspaces TO service_role;
ALTER TABLE public.study_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own study workspace" ON public.study_workspaces FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.study_command(command text, payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 uid uuid := auth.uid(); d jsonb; t jsonb; p jsonb; settings jsonb; item jsonb; old_item jsonb;
 stamp bigint := floor(extract(epoch FROM clock_timestamp()) * 1000); remaining bigint; mode text; next_mode text;
 delta integer := 0; xp_gain integer := 0; total_xp integer; lvl integer; count_focus integer;
 minutes integer; before_minutes integer; bonus boolean := false; target text; old_done boolean; changed boolean := false;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 INSERT INTO public.study_workspaces(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
 SELECT data INTO d FROM public.study_workspaces WHERE user_id = uid FOR UPDATE;
 t := d->'timer'; p := d->'pet'; settings := d->'settings';
 IF command = 'read' THEN RETURN jsonb_build_object('state',d); END IF;
 IF command = 'saveTask' THEN
  target := COALESCE(payload->>'id',gen_random_uuid()::text);
  SELECT value INTO old_item FROM jsonb_array_elements(d->'tasks') WHERE value->>'id'=target;
  IF payload ? 'id' AND old_item IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
  IF length(trim(COALESCE(payload->>'title',''))) NOT BETWEEN 1 AND 180 OR payload->>'priority' NOT IN ('low','medium','high') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d->'subjects') WHERE value->>'id'=payload->>'subjectId') THEN RAISE EXCEPTION 'Invalid task'; END IF;
  PERFORM (payload->>'due')::date;
  item := jsonb_build_object('id',target,'title',trim(payload->>'title'),'subjectId',payload->>'subjectId','priority',payload->>'priority','due',payload->>'due','done',COALESCE((old_item->>'done')::boolean,false));
  d := jsonb_set(d,'{tasks}',COALESCE((SELECT jsonb_agg(CASE WHEN value->>'id'=target THEN item ELSE value END) FROM jsonb_array_elements(d->'tasks')),'[]'::jsonb));
  IF old_item IS NULL THEN d := jsonb_set(d,'{tasks}',(d->'tasks') || jsonb_build_array(item)); END IF;
 ELSIF command = 'toggleTask' THEN
  target := payload->>'id';
  SELECT value INTO old_item FROM jsonb_array_elements(d->'tasks') WHERE value->>'id'=target;
  IF old_item IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
  old_done := (old_item->>'done')::boolean;
  delta := CASE WHEN old_done THEN -5 ELSE 5 END;
  d := jsonb_set(d,'{tasks}',(SELECT jsonb_agg(CASE WHEN value->>'id'=target THEN jsonb_set(value,'{done}',to_jsonb(NOT old_done)) ELSE value END) FROM jsonb_array_elements(d->'tasks')));
 ELSIF command = 'deleteTask' THEN
  target := payload->>'id';
  SELECT value INTO old_item FROM jsonb_array_elements(d->'tasks') WHERE value->>'id'=target;
  IF old_item IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
  IF (old_item->>'done')::boolean THEN delta := -5; END IF;
  d := jsonb_set(d,'{tasks}',COALESCE((SELECT jsonb_agg(value) FROM jsonb_array_elements(d->'tasks') WHERE value->>'id'<>target),'[]'::jsonb));
 ELSIF command = 'addTasks' THEN
  IF jsonb_array_length(payload->'tasks') NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Invalid tasks'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'tasks') LOOP
   IF length(trim(COALESCE(item->>'title',''))) NOT BETWEEN 1 AND 180 OR item->>'priority' NOT IN ('low','medium','high') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d->'subjects') WHERE value->>'id'=item->>'subjectId') THEN RAISE EXCEPTION 'Invalid task'; END IF;
   PERFORM (item->>'due')::date;
   d := jsonb_set(d,'{tasks}',(d->'tasks') || jsonb_build_array(item || jsonb_build_object('id',gen_random_uuid()::text,'done',false)));
  END LOOP;
 ELSIF command = 'saveSubject' THEN
  target := COALESCE(payload->>'id',gen_random_uuid()::text);
  IF length(trim(COALESCE(payload->>'name',''))) NOT BETWEEN 1 AND 60 OR payload->>'color' NOT IN ('blue','pink','mint','lavender','butter','peach') THEN RAISE EXCEPTION 'Invalid subject'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(d->'subjects') WHERE lower(value->>'name')=lower(trim(payload->>'name')) AND value->>'id'<>target) THEN RAISE EXCEPTION 'Subject name already exists'; END IF;
  SELECT value INTO old_item FROM jsonb_array_elements(d->'subjects') WHERE value->>'id'=target;
  IF payload ? 'id' AND old_item IS NULL THEN RAISE EXCEPTION 'Subject not found'; END IF;
  item := jsonb_build_object('id',target,'name',trim(payload->>'name'),'color',payload->>'color');
  d := jsonb_set(d,'{subjects}',COALESCE((SELECT jsonb_agg(CASE WHEN value->>'id'=target THEN item ELSE value END) FROM jsonb_array_elements(d->'subjects')),'[]'::jsonb));
  IF old_item IS NULL THEN d := jsonb_set(d,'{subjects}',(d->'subjects') || jsonb_build_array(item)); END IF;
 ELSIF command IN ('renamePet','setAccessory','feed','play','rest') THEN
  IF command='renamePet' THEN
   IF length(trim(COALESCE(payload->>'name',''))) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Invalid pet name'; END IF;
   p := jsonb_set(p,'{name}',to_jsonb(trim(payload->>'name')));
  ELSIF command='setAccessory' THEN
   IF payload->>'accessory' NOT IN ('none','bow','hat','star') THEN RAISE EXCEPTION 'Invalid accessory'; END IF;
   p := jsonb_set(p,'{accessory}',payload->'accessory');
  ELSE
   IF COALESCE((p->>'lastActionAt')::bigint,0) + 1000 > stamp THEN RAISE EXCEPTION 'Give your buddy a moment'; END IF;
   p := p || jsonb_build_object('happiness',least(100,greatest(0,(p->>'happiness')::integer + CASE command WHEN 'feed' THEN 5 WHEN 'play' THEN 12 ELSE 0 END)), 'energy',least(100,greatest(0,(p->>'energy')::integer + CASE command WHEN 'feed' THEN 10 WHEN 'play' THEN -8 ELSE 25 END)), 'hunger',least(100,greatest(0,(p->>'hunger')::integer + CASE command WHEN 'feed' THEN -30 WHEN 'play' THEN 6 ELSE 0 END)), 'lastAction',command,'lastActionAt',stamp);
  END IF;
 ELSIF command='updateSettings' THEN
  IF (t->>'running')::boolean OR COALESCE((t->>'remainingMs')::bigint,0) < (settings->>(t->>'mode'))::integer*60000 THEN RAISE EXCEPTION 'Reset the timer before changing settings'; END IF;
  settings := settings || payload;
  IF (settings->>'focus')::integer NOT BETWEEN 1 AND 90 OR (settings->>'short')::integer NOT BETWEEN 1 AND 30 OR (settings->>'long')::integer NOT BETWEEN 1 AND 60 OR (settings->>'longEvery')::integer NOT BETWEEN 2 AND 8 OR (settings->>'dailyGoalMin')::integer NOT BETWEEN 1 AND 1440 THEN RAISE EXCEPTION 'Invalid settings'; END IF;
  t := jsonb_set(t,'{remainingMs}',to_jsonb((settings->>(t->>'mode'))::integer*60000));
 ELSIF command='setSubject' THEN
  IF (t->>'running')::boolean THEN RAISE EXCEPTION 'Pause the timer first'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(d->'subjects') WHERE value->>'id'=payload->>'subjectId') THEN RAISE EXCEPTION 'Invalid subject'; END IF;
  t := jsonb_set(t,'{subjectId}',payload->'subjectId');
 ELSIF command IN ('start','pause','reset','setMode','tick') THEN
  mode := t->>'mode'; remaining := (t->>'remainingMs')::bigint;
  IF command='start' AND NOT (t->>'running')::boolean THEN t := t || jsonb_build_object('running',true,'endsAt',stamp+remaining);
  ELSIF command='pause' AND (t->>'running')::boolean THEN
   IF (t->>'endsAt')::bigint <= stamp THEN RAISE EXCEPTION 'Complete the session first'; END IF;
   t := t || jsonb_build_object('running',false,'endsAt',NULL,'remainingMs',greatest(0,(t->>'endsAt')::bigint-stamp));
  ELSIF command IN ('reset','setMode') THEN
   IF command='setMode' THEN mode := payload->>'mode'; END IF;
   IF mode NOT IN ('focus','short','long') THEN RAISE EXCEPTION 'Invalid mode'; END IF;
   t := t || jsonb_build_object('mode',mode,'running',false,'endsAt',NULL,'remainingMs',(settings->>mode)::integer*60000);
  ELSIF command='tick' AND (t->>'running')::boolean AND (t->>'endsAt')::bigint <= stamp THEN
   minutes := (settings->>mode)::integer;
   item := jsonb_build_object('id',gen_random_uuid()::text,'subjectId',t->>'subjectId','minutes',minutes,'mode',mode,'endedAt',(t->>'endsAt')::bigint);
   count_focus := (t->>'focusCount')::integer; next_mode := 'focus';
   IF mode='focus' THEN
    SELECT COALESCE(sum((value->>'minutes')::integer),0) INTO before_minutes FROM jsonb_array_elements(d->'sessions') WHERE value->>'mode'='focus' AND (to_timestamp((value->>'endedAt')::bigint/1000.0) AT TIME ZONE 'UTC')::date = (to_timestamp((t->>'endsAt')::bigint/1000.0) AT TIME ZONE 'UTC')::date;
    bonus := before_minutes < (settings->>'dailyGoalMin')::integer AND before_minutes+minutes >= (settings->>'dailyGoalMin')::integer;
    delta := 10 + CASE WHEN bonus THEN 25 ELSE 0 END; xp_gain := 20 + CASE WHEN bonus THEN 30 ELSE 0 END;
    count_focus := count_focus+1; next_mode := CASE WHEN count_focus % (settings->>'longEvery')::integer=0 THEN 'long' ELSE 'short' END;
    p := p || jsonb_build_object('happiness',least(100,(p->>'happiness')::integer+6),'energy',greatest(0,(p->>'energy')::integer-5),'hunger',least(100,(p->>'hunger')::integer+5));
   END IF;
   d := jsonb_set(d,'{sessions}',(d->'sessions') || jsonb_build_array(item));
   t := t || jsonb_build_object('mode',next_mode,'running',false,'endsAt',NULL,'remainingMs',(settings->>next_mode)::integer*60000,'focusCount',count_focus);
   changed := true;
  END IF;
 ELSE RAISE EXCEPTION 'Unknown command'; END IF;
 total_xp := (p->>'xp')::integer+xp_gain; lvl := (p->>'level')::integer;
 WHILE total_xp >= lvl*100 LOOP total_xp := total_xp-lvl*100; lvl := lvl+1; END LOOP;
 p := p || jsonb_build_object('xp',total_xp,'level',lvl);
 d := d || jsonb_build_object('pet',p,'timer',t,'settings',settings,'points',greatest(0,(d->>'points')::integer+delta));
 UPDATE public.study_workspaces SET data=d, updated_at=now() WHERE user_id=uid;
 RETURN jsonb_build_object('state',d,'completed',changed,'mode',mode,'points',delta,'xp',xp_gain,'goalHit',bonus);
END; $$;
REVOKE ALL ON FUNCTION public.study_command(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.study_command(text,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.create_student_profile() FROM PUBLIC, anon, authenticated;