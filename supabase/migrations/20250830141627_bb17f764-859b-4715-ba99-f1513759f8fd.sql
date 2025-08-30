-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.update_trip_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.trips 
  SET total_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.expenses 
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_demo_data_for_user(user_id UUID)
RETURNS VOID AS $$
DECLARE
  bali_trip_id UUID;
  europe_trip_id UUID;
  alice_id UUID;
  bob_id UUID;
  charlie_id UUID;
  diana_id UUID;
  eve_id UUID;
  frank_id UUID;
BEGIN
  -- Create Bali Adventure trip
  INSERT INTO public.trips (name, currency, location, created_by_user_id, start_date, end_date)
  VALUES ('Bali Adventure', 'USD', 'Bali, Indonesia', user_id, '2024-09-15', '2024-09-22')
  RETURNING id INTO bali_trip_id;
  
  -- Create Europe Road Trip
  INSERT INTO public.trips (name, currency, location, created_by_user_id, start_date, end_date)
  VALUES ('Europe Road Trip', 'EUR', 'Paris, France', user_id, '2024-10-05', '2024-10-20')
  RETURNING id INTO europe_trip_id;
  
  -- Create participants for Bali trip
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (bali_trip_id, 'You', NULL) RETURNING id INTO alice_id;
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (bali_trip_id, 'Bob', 'bob@example.com') RETURNING id INTO bob_id;
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (bali_trip_id, 'Charlie', 'charlie@example.com') RETURNING id INTO charlie_id;
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (bali_trip_id, 'Diana', 'diana@example.com') RETURNING id INTO diana_id;
  
  -- Create participants for Europe trip
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (europe_trip_id, 'You', NULL) RETURNING id INTO alice_id;
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (europe_trip_id, 'Eve', 'eve@example.com') RETURNING id INTO eve_id;
  INSERT INTO public.participants (trip_id, name, email) VALUES
  (europe_trip_id, 'Frank', 'frank@example.com') RETURNING id INTO frank_id;
  
  -- Create demo expenses for Bali trip
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (bali_trip_id, 'Flight Tickets', 800.00, alice_id, 'Transportation');
  
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (bali_trip_id, 'Hotel Accommodation', 1200.00, bob_id, 'Accommodation');
  
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (bali_trip_id, 'Dinner at Beach Restaurant', 150.50, charlie_id, 'Food');
  
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (bali_trip_id, 'Scuba Diving', 300.00, diana_id, 'Activities');
  
  -- Create demo expenses for Europe trip
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (europe_trip_id, 'Car Rental', 450.00, alice_id, 'Transportation');
  
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (europe_trip_id, 'Hotels', 1200.00, eve_id, 'Accommodation');
  
  INSERT INTO public.expenses (trip_id, description, amount, paid_by, category)
  VALUES (europe_trip_id, 'Gas & Tolls', 280.00, frank_id, 'Transportation');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;