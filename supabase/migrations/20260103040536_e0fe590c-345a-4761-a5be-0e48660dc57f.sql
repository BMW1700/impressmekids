-- Make syllabus file fields nullable so grade weights can be saved independently
ALTER TABLE public.classroom_syllabus ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE public.classroom_syllabus ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE public.classroom_syllabus ALTER COLUMN file_size DROP NOT NULL;
ALTER TABLE public.classroom_syllabus ALTER COLUMN mime_type DROP NOT NULL;

-- Set default values for file fields
ALTER TABLE public.classroom_syllabus ALTER COLUMN file_url SET DEFAULT NULL;
ALTER TABLE public.classroom_syllabus ALTER COLUMN file_name SET DEFAULT NULL;
ALTER TABLE public.classroom_syllabus ALTER COLUMN file_size SET DEFAULT NULL;
ALTER TABLE public.classroom_syllabus ALTER COLUMN mime_type SET DEFAULT NULL;

-- Update existing empty string values to NULL for cleaner data
UPDATE public.classroom_syllabus SET file_url = NULL WHERE file_url = '';
UPDATE public.classroom_syllabus SET file_name = NULL WHERE file_name = '';
UPDATE public.classroom_syllabus SET mime_type = NULL WHERE mime_type = '';