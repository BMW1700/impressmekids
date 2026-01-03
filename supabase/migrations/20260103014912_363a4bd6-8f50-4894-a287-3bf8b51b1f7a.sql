-- Create world_backgrounds table to store AI-generated background images
CREATE TABLE public.world_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id INTEGER NOT NULL UNIQUE,
  world_name TEXT NOT NULL,
  image_url TEXT,
  prompt TEXT NOT NULL,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.world_backgrounds ENABLE ROW LEVEL SECURITY;

-- Allow public read access (backgrounds are shared assets)
CREATE POLICY "World backgrounds are publicly readable"
ON public.world_backgrounds
FOR SELECT
USING (true);

-- Only allow updates through edge functions (service role)
-- No insert/update/delete policies for regular users

-- Insert placeholder rows for all 8 worlds with detailed prompts
INSERT INTO public.world_backgrounds (world_id, world_name, prompt) VALUES
  (1, 'Enchanted Forest', 'Fantasy RPG battle scene background, mystical enchanted forest at twilight, giant ancient trees with glowing magical runes, fireflies and floating lights, magical mist, moonbeams filtering through canopy, vibrant greens and purples, 16:9 aspect ratio, highly detailed digital art'),
  (2, 'Frozen Depths', 'Fantasy RPG battle scene background, deep underground ice caverns, massive blue crystals glowing with inner light, aurora borealis reflections on ice walls, frozen waterfalls, stalactites, ethereal cold mist, cyan and deep blue palette, 16:9 aspect ratio, highly detailed digital art'),
  (3, 'Ancient Ruins', 'Fantasy RPG battle scene background, crumbling ancient temple ruins, massive stone pillars with mysterious hieroglyphics, torches with flickering flames, mystical fog, golden sunlight streaming through broken ceiling, warm amber and stone tones, 16:9 aspect ratio, highly detailed digital art'),
  (4, 'Throne Room', 'Fantasy RPG battle scene background, dark gothic castle throne room, massive menacing throne on elevated platform, purple banners with skull emblems, dramatic torchlight, stained glass windows with moonlight, ominous atmosphere, purple and black palette, 16:9 aspect ratio, highly detailed digital art'),
  (5, 'Whispering Caverns', 'Fantasy RPG battle scene background, deep underground cavern system, massive stalactites and stalagmites, bioluminescent mushrooms glowing purple and pink, underground river reflecting lights, echo-inducing vastness, mysterious atmosphere, violet and magenta palette, 16:9 aspect ratio, highly detailed digital art'),
  (6, 'Floating Isles', 'Fantasy RPG battle scene background, magical floating islands in bright blue sky, rainbow bridges connecting islands, fluffy white clouds, floating rocks and crystals, waterfalls cascading into void, bright and hopeful atmosphere, sky blue and white palette, 16:9 aspect ratio, highly detailed digital art'),
  (7, 'Sunken Library', 'Fantasy RPG battle scene background, ancient underwater library ruins, towering bookshelves with waterlogged tomes, streams of bubbles rising, bioluminescent jellyfish and fish, kelp forests, shafts of light from surface, teal and deep blue palette, 16:9 aspect ratio, highly detailed digital art'),
  (8, 'The Void Between', 'Fantasy RPG battle scene background, cosmic void realm, swirling nebulas in purple and black, reality tears showing other dimensions, floating debris and shattered worlds, distant dying stars, eldritch cosmic horror vibes, deep purple and black with star accents, 16:9 aspect ratio, highly detailed digital art');

-- Create storage bucket for world backgrounds
INSERT INTO storage.buckets (id, name, public) 
VALUES ('world-backgrounds', 'world-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to world-backgrounds bucket
CREATE POLICY "World backgrounds are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'world-backgrounds');

-- Allow service role to insert/update (edge functions)
CREATE POLICY "Service role can manage world backgrounds"
ON storage.objects FOR ALL
USING (bucket_id = 'world-backgrounds')
WITH CHECK (bucket_id = 'world-backgrounds');