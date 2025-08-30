-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  location TEXT,
  total_amount NUMERIC DEFAULT 0,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_date DATE,
  end_date DATE
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create policies for trips
CREATE POLICY "Users can view their own trips" 
ON public.trips 
FOR SELECT 
USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own trips" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete their own trips" 
ON public.trips 
FOR DELETE 
USING (auth.uid() = created_by_user_id);

-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Create policies for participants
CREATE POLICY "Users can view participants of their trips" 
ON public.participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = participants.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create participants for their trips" 
ON public.participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = participants.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update participants of their trips" 
ON public.participants 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = participants.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete participants of their trips" 
ON public.participants 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = participants.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by UUID NOT NULL REFERENCES public.participants(id),
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Users can view expenses of their trips" 
ON public.expenses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = expenses.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create expenses for their trips" 
ON public.expenses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = expenses.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update expenses of their trips" 
ON public.expenses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = expenses.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete expenses of their trips" 
ON public.expenses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = expenses.trip_id 
    AND trips.created_by_user_id = auth.uid()
  )
);

-- Create expense_splits table to track who shares each expense
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expense_id, participant_id)
);

-- Enable Row Level Security
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_splits
CREATE POLICY "Users can view expense splits of their trips" 
ON public.expense_splits 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.trips t ON t.id = e.trip_id
    WHERE e.id = expense_splits.expense_id 
    AND t.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create expense splits for their trips" 
ON public.expense_splits 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.trips t ON t.id = e.trip_id
    WHERE e.id = expense_splits.expense_id 
    AND t.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update expense splits of their trips" 
ON public.expense_splits 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.trips t ON t.id = e.trip_id
    WHERE e.id = expense_splits.expense_id 
    AND t.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete expense splits of their trips" 
ON public.expense_splits 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.trips t ON t.id = e.trip_id
    WHERE e.id = expense_splits.expense_id 
    AND t.created_by_user_id = auth.uid()
  )
);

-- Create function to update trip total when expenses change
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
$$ LANGUAGE plpgsql;

-- Create trigger to update trip total automatically
CREATE TRIGGER update_trip_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_total();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on trips
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create demo data for new users
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
$$ LANGUAGE plpgsql;