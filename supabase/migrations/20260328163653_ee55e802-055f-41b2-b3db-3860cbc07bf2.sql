
-- Allow game_player to read own profile
CREATE POLICY "game_player_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- Allow game_player to update own profile
CREATE POLICY "game_player_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- Allow game_player to read own aura_records
CREATE POLICY "game_player_read_own_aura_records" ON public.aura_records
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_aura_records" ON public.aura_records
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- reading_sessions
CREATE POLICY "game_player_read_own_reading_sessions" ON public.reading_sessions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_reading_sessions" ON public.reading_sessions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- student_reading_stats
CREATE POLICY "game_player_read_own_reading_stats" ON public.student_reading_stats
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- student_skill_vectors
CREATE POLICY "game_player_read_own_skill_vectors" ON public.student_skill_vectors
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_skill_vectors" ON public.student_skill_vectors
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_skill_vectors" ON public.student_skill_vectors
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- campaign_progress
CREATE POLICY "game_player_read_own_campaign" ON public.campaign_progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_campaign" ON public.campaign_progress
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_campaign" ON public.campaign_progress
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- campaign_battle_sessions
CREATE POLICY "game_player_read_own_battles" ON public.campaign_battle_sessions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_battles" ON public.campaign_battle_sessions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_battles" ON public.campaign_battle_sessions
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- daily_login_rewards
CREATE POLICY "game_player_read_own_rewards" ON public.daily_login_rewards
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_rewards" ON public.daily_login_rewards
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- reading_library (public content)
CREATE POLICY "game_player_read_stories" ON public.reading_library
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'game_player');

-- boss_rush_attempts
CREATE POLICY "game_player_read_own_boss_rush" ON public.boss_rush_attempts
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_boss_rush" ON public.boss_rush_attempts
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_boss_rush" ON public.boss_rush_attempts
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- player_pets
CREATE POLICY "game_player_read_own_pets" ON public.player_pets
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_pets" ON public.player_pets
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_pets" ON public.player_pets
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- player_achievements
CREATE POLICY "game_player_read_own_achievements" ON public.player_achievements
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_achievements" ON public.player_achievements
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_achievements" ON public.player_achievements
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- player_inventory
CREATE POLICY "game_player_read_own_inventory" ON public.player_inventory
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_own_inventory" ON public.player_inventory
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_update_own_inventory" ON public.player_inventory
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

-- story_votes
CREATE POLICY "game_player_read_story_votes" ON public.story_votes
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');

CREATE POLICY "game_player_insert_story_votes" ON public.story_votes
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.get_user_role(auth.uid()) = 'game_player');
