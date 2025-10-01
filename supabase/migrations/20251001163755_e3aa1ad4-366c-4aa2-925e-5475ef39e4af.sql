-- Create user role enum
CREATE TYPE user_role AS ENUM ('teacher', 'student', 'admin');

-- Users/Profiles table (extending auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classrooms table
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classroom students junction table
CREATE TABLE public.classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- Student profiles (extended info)
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade INTEGER,
  avatar_url TEXT,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game players
CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_winner BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  UNIQUE(game_id, player_id)
);

-- Questions bank
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game rounds
CREATE TABLE public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  round_number INTEGER NOT NULL,
  winner_player_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game answers
CREATE TABLE public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for classrooms
CREATE POLICY "Teachers can view their own classrooms"
  ON public.classrooms FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create classrooms"
  ON public.classrooms FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own classrooms"
  ON public.classrooms FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classrooms they're in"
  ON public.classrooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_students
      WHERE classroom_id = classrooms.id AND student_id = auth.uid()
    )
  );

-- RLS Policies for classroom_students
CREATE POLICY "Teachers can view students in their classrooms"
  ON public.classroom_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = classroom_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own classroom memberships"
  ON public.classroom_students FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can join classrooms"
  ON public.classroom_students FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for student_profiles
CREATE POLICY "Users can view their own student profile"
  ON public.student_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own student profile"
  ON public.student_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own student profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can view student profiles in their classrooms"
  ON public.student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = student_profiles.user_id
      AND c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for games
CREATE POLICY "Users can view games in their classrooms"
  ON public.games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      LEFT JOIN public.classroom_students cs ON cs.classroom_id = c.id
      WHERE c.id = games.classroom_id
      AND (c.teacher_id = auth.uid() OR cs.student_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can create games in their classrooms"
  ON public.games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = classroom_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update games in their classrooms"
  ON public.games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = classroom_id AND teacher_id = auth.uid()
    )
  );

-- RLS Policies for game_players
CREATE POLICY "Users can view game players for games they're in"
  ON public.game_players FOR SELECT
  USING (
    player_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.classrooms c ON c.id = g.classroom_id
      WHERE g.id = game_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can insert game players"
  ON public.game_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update game players"
  ON public.game_players FOR UPDATE
  USING (true);

-- RLS Policies for questions (public read, admin write)
CREATE POLICY "Anyone authenticated can view questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for game_rounds
CREATE POLICY "Users can view rounds for games they're in"
  ON public.game_rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players gp
      WHERE gp.game_id = game_rounds.game_id AND gp.player_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.classrooms c ON c.id = g.classroom_id
      WHERE g.id = game_rounds.game_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can create game rounds"
  ON public.game_rounds FOR INSERT
  WITH CHECK (true);

-- RLS Policies for game_answers
CREATE POLICY "Users can view their own answers"
  ON public.game_answers FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Teachers can view answers for games in their classrooms"
  ON public.game_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_rounds gr
      JOIN public.games g ON g.id = gr.game_id
      JOIN public.classrooms c ON c.id = g.classroom_id
      WHERE gr.id = game_answers.game_round_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Players can submit answers"
  ON public.game_answers FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- Function to generate random join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for games and game_rounds
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;

-- Seed data: Teachers
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'teacher1@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Ms. Johnson", "role": "teacher"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'teacher2@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Mr. Smith", "role": "teacher"}', NOW(), NOW());

-- Seed data: Students  
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'student1@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Alex Chen", "role": "student"}', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'student2@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Maya Patel", "role": "student"}', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'student3@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Jordan Lee", "role": "student"}', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'student4@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Sam Rivera", "role": "student"}', NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'student5@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Taylor Kim", "role": "student"}', NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888', 'student6@impressme.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Casey Brown", "role": "student"}', NOW(), NOW());

-- Profiles are auto-created via trigger, but let's ensure classrooms
INSERT INTO public.classrooms (id, name, teacher_id, join_code)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Math Wizards - 5th Grade', '11111111-1111-1111-1111-111111111111', 'MATH5A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Science Explorers - 4th Grade', '22222222-2222-2222-2222-222222222222', 'SCI4B');

-- Assign students to classrooms
INSERT INTO public.classroom_students (classroom_id, student_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888');

-- Create student profiles
INSERT INTO public.student_profiles (user_id, grade, avatar_url, stats)
VALUES
  ('33333333-3333-3333-3333-333333333333', 5, NULL, '{"games_played": 0, "games_won": 0}'),
  ('44444444-4444-4444-4444-444444444444', 5, NULL, '{"games_played": 0, "games_won": 0}'),
  ('55555555-5555-5555-5555-555555555555', 5, NULL, '{"games_played": 0, "games_won": 0}'),
  ('66666666-6666-6666-6666-666666666666', 4, NULL, '{"games_played": 0, "games_won": 0}'),
  ('77777777-7777-7777-7777-777777777777', 4, NULL, '{"games_played": 0, "games_won": 0}'),
  ('88888888-8888-8888-8888-888888888888', 4, NULL, '{"games_played": 0, "games_won": 0}');

-- Seed questions - Math
INSERT INTO public.questions (subject, grade, question_text, answer_text, metadata)
VALUES
  ('Math', 5, 'What is 12 × 8?', '96', '{"difficulty": "medium", "category": "multiplication"}'),
  ('Math', 5, 'What is the area of a rectangle with length 9 and width 4?', '36', '{"difficulty": "medium", "category": "geometry"}'),
  ('Math', 5, 'Simplify: 3/4 + 1/4', '1', '{"difficulty": "easy", "category": "fractions"}'),
  ('Math', 5, 'What is 144 ÷ 12?', '12', '{"difficulty": "medium", "category": "division"}'),
  ('Math', 5, 'If x + 7 = 15, what is x?', '8', '{"difficulty": "medium", "category": "algebra"}');

-- Seed questions - Science
INSERT INTO public.questions (subject, grade, question_text, answer_text, metadata)
VALUES
  ('Science', 4, 'What is the process by which plants make food using sunlight?', 'Photosynthesis', '{"difficulty": "medium", "category": "biology"}'),
  ('Science', 4, 'What are the three states of matter?', 'Solid, liquid, and gas', '{"difficulty": "easy", "category": "physics"}'),
  ('Science', 4, 'What is the largest planet in our solar system?', 'Jupiter', '{"difficulty": "easy", "category": "astronomy"}'),
  ('Science', 4, 'What is the force that pulls objects toward the Earth?', 'Gravity', '{"difficulty": "easy", "category": "physics"}'),
  ('Science', 4, 'What is the name of the layer of gases surrounding Earth?', 'Atmosphere', '{"difficulty": "medium", "category": "earth science"}');

-- Seed questions - English
INSERT INTO public.questions (subject, grade, question_text, answer_text, metadata)
VALUES
  ('English', 5, 'What is a word that describes a noun called?', 'Adjective', '{"difficulty": "easy", "category": "grammar"}'),
  ('English', 5, 'What is the past tense of "run"?', 'Ran', '{"difficulty": "easy", "category": "grammar"}'),
  ('English', 5, 'What do we call a group of words that contains a subject and a predicate?', 'Sentence', '{"difficulty": "medium", "category": "grammar"}'),
  ('English', 5, 'What is a word that sounds the same as another word but has a different meaning?', 'Homophone', '{"difficulty": "medium", "category": "vocabulary"}'),
  ('English', 5, 'What punctuation mark is used to show possession?', 'Apostrophe', '{"difficulty": "medium", "category": "punctuation"}');

-- Seed questions - History
INSERT INTO public.questions (subject, grade, question_text, answer_text, metadata)
VALUES
  ('History', 5, 'Who was the first President of the United States?', 'George Washington', '{"difficulty": "easy", "category": "american history"}'),
  ('History', 5, 'In what year did Christopher Columbus arrive in the Americas?', '1492', '{"difficulty": "medium", "category": "exploration"}'),
  ('History', 5, 'What document declared American independence from Britain?', 'Declaration of Independence', '{"difficulty": "easy", "category": "american history"}'),
  ('History', 5, 'What ancient civilization built the pyramids?', 'Egyptians', '{"difficulty": "easy", "category": "ancient history"}'),
  ('History', 5, 'Who invented the light bulb?', 'Thomas Edison', '{"difficulty": "easy", "category": "inventions"}');