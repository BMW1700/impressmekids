-- Add real-time coaching toggle to assignments
ALTER TABLE assignments ADD COLUMN enable_realtime_coaching BOOLEAN DEFAULT false;

-- Add patentable AI analysis columns to aura_records
ALTER TABLE aura_records ADD COLUMN semantic_clusters JSONB DEFAULT '[]';
ALTER TABLE aura_records ADD COLUMN bloom_taxonomy_distribution JSONB DEFAULT '{}';
ALTER TABLE aura_records ADD COLUMN highlight_patterns JSONB DEFAULT '{}';
ALTER TABLE aura_records ADD COLUMN literacy_transfer_matrix JSONB DEFAULT '{}';
ALTER TABLE aura_records ADD COLUMN coaching_effectiveness NUMERIC;

-- Add annotation sophistication tracking to student_skill_vectors
ALTER TABLE student_skill_vectors ADD COLUMN annotation_sophistication_trend NUMERIC DEFAULT 0;
ALTER TABLE student_skill_vectors ADD COLUMN highlight_strategy_profile JSONB DEFAULT '{}';