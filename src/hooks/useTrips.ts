import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Trip {
  id: string;
  name: string;
  currency: string;
  location: string;
  total_amount: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
}

export interface Participant {
  id: string;
  trip_id: string;
  name: string;
  email?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string;
  created_at: string;
}

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTrips = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Error",
        description: "Failed to load trips",
        variant: "destructive"
      });
    }
  };

  const fetchParticipants = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setParticipants(prev => ({
        ...prev,
        [tripId]: data || []
      }));
      return data || [];
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  };

  const fetchExpenses = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(prev => ({
        ...prev,
        [tripId]: data || []
      }));
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  };

  const createTrip = async (tripData: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    participants: string[];
    currency: string;
  }) => {
    if (!user) return null;

    try {
      // Create the trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: tripData.name,
          currency: tripData.currency,
          location: tripData.destination,
          created_by_user_id: user.id,
          start_date: tripData.startDate,
          end_date: tripData.endDate
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Create participants
      const participantInserts = tripData.participants.map(name => ({
        trip_id: trip.id,
        name,
        email: name === 'You' ? user.email : null
      }));

      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      await fetchTrips();
      await fetchParticipants(trip.id);

      toast({
        title: "Success",
        description: "Trip created successfully"
      });

      return trip;
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: "Failed to create trip",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      setTrips(prev => prev.filter(trip => trip.id !== tripId));
      setParticipants(prev => {
        const newParticipants = { ...prev };
        delete newParticipants[tripId];
        return newParticipants;
      });
      setExpenses(prev => {
        const newExpenses = { ...prev };
        delete newExpenses[tripId];
        return newExpenses;
      });

      toast({
        title: "Success",
        description: "Trip deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive"
      });
    }
  };

  const addExpense = async (expenseData: {
    tripId: string;
    title: string;
    amount: number;
    paidBy: string;
    category: string;
    description?: string;
  }) => {
    try {
      // Find the participant ID for the payer
      const tripParticipants = participants[expenseData.tripId] || [];
      const payer = tripParticipants.find(p => p.name === expenseData.paidBy);
      
      if (!payer) {
        throw new Error('Payer not found');
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          trip_id: expenseData.tripId,
          description: expenseData.title,
          amount: expenseData.amount,
          paid_by: payer.id,
          category: expenseData.category
        });

      if (error) throw error;

      await fetchExpenses(expenseData.tripId);
      await fetchTrips(); // Refresh to get updated totals

      toast({
        title: "Success",
        description: "Expense added successfully"
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive"
      });
    }
  };

  const createDemoData = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('create_demo_data_for_user', {
        user_id: user.id
      });

      if (error) throw error;

      await fetchTrips();
      
      toast({
        title: "Welcome!",
        description: "Demo trips have been created for you"
      });
    } catch (error) {
      console.error('Error creating demo data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrips().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    trips,
    participants,
    expenses,
    loading,
    fetchParticipants,
    fetchExpenses,
    createTrip,
    deleteTrip,
    addExpense,
    createDemoData
  };
};