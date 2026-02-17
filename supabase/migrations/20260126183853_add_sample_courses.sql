-- Add sample courses
INSERT INTO public.courses (title, description, is_published, stripe_price_id, order_index) VALUES 
('Kurs Inwestowania dla Początkujących', 'Naucz się podstaw inwestowania w akcje, obligacje i fundusze.', true, 'price_test_123', 1),
('Zaawansowane Strategie Inwestycyjne', 'Głębsze spojrzenie na strategie inwestycyjne i zarządzanie ryzykiem.', true, 'price_test_456', 2);