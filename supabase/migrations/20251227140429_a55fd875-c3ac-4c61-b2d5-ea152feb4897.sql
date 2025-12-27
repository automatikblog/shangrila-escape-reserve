-- Migrate companions column from text[] to jsonb with {name, isChild} structure
-- First, create a temporary column with the new structure
ALTER TABLE public.client_sessions ADD COLUMN companions_new jsonb;

-- Migrate existing data: convert each string to {name: string, isChild: false}
UPDATE public.client_sessions 
SET companions_new = (
  SELECT jsonb_agg(jsonb_build_object('name', elem, 'isChild', false))
  FROM unnest(companions) AS elem
)
WHERE companions IS NOT NULL AND array_length(companions, 1) > 0;

-- Drop the old column
ALTER TABLE public.client_sessions DROP COLUMN companions;

-- Rename the new column
ALTER TABLE public.client_sessions RENAME COLUMN companions_new TO companions;