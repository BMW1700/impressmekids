-- Add Tutorial world background (World 0)
INSERT INTO world_backgrounds (world_id, world_name, prompt) VALUES
(0, 'Tutorial Island', 'Fantasy RPG tutorial training grounds, sunny peaceful meadow with colorful practice dummies, friendly welcoming atmosphere, rainbow in bright blue sky, soft fluffy clouds, green grass and flowers, invitation to learn and play, warm golden sunlight, magical sparkles, 16:9 aspect ratio, highly detailed digital art, Ghibli-inspired, child-friendly')
ON CONFLICT (world_id) DO NOTHING;