-- Renomear coluna client_whatsapp para client_email
ALTER TABLE public.reservations RENAME COLUMN client_whatsapp TO client_email;