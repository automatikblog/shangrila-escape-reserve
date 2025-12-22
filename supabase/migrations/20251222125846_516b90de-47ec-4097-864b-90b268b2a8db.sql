-- Add companions column to client_sessions table
ALTER TABLE public.client_sessions 
ADD COLUMN companions text[] DEFAULT NULL;