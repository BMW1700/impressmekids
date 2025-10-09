-- Phase 1: Cross-Modal Correlation Engine Schema

-- Add reading comprehension columns to aura_records
ALTER TABLE aura_records 
ADD COLUMN reading_assignment_id UUID REFERENCES assignments(id),
ADD COLUMN highlight_count INTEGER,
ADD COLUMN annotation_quality_score INTEGER CHECK (annotation_quality_score >= 0 AND annotation_quality_score <= 100),
ADD COLUMN comprehension_score INTEGER CHECK (comprehension_score >= 0 AND comprehension_score <= 100),
ADD COLUMN reading_type TEXT DEFAULT 'speaking' CHECK (reading_type IN ('speaking', 'reading')),
ADD COLUMN prosody_comprehension_correlation JSONB DEFAULT '{}'::jsonb;

-- Add cross-modal analytics to student_skill_vectors
ALTER TABLE student_skill_vectors
ADD COLUMN reading_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN cross_modal_risk_score INTEGER CHECK (cross_modal_risk_score >= 0 AND cross_modal_risk_score <= 100),
ADD COLUMN predicted_comprehension_score INTEGER CHECK (predicted_comprehension_score >= 0 AND predicted_comprehension_score <= 100);

-- Create index for faster reading assignment queries
CREATE INDEX idx_aura_records_reading_assignment ON aura_records(reading_assignment_id) WHERE reading_assignment_id IS NOT NULL;

COMMENT ON COLUMN aura_records.reading_type IS 'Type of literacy assessment: speaking (AURA voice) or reading (annotation-based)';
COMMENT ON COLUMN aura_records.prosody_comprehension_correlation IS 'ML correlation data linking speech prosody patterns to reading comprehension performance';
COMMENT ON COLUMN student_skill_vectors.cross_modal_risk_score IS 'Unified literacy risk score combining speaking + reading performance';
COMMENT ON COLUMN student_skill_vectors.predicted_comprehension_score IS 'ML-predicted reading comprehension based on speaking prosody';