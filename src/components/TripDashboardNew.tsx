import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, DollarSign, Calendar, MapPin, Plane } from 'lucide-react';
import { ExpenseList } from './ExpenseList';
import { TripPlanning } from './TripPlanning';
import { BalancesSummary } from './BalancesSummary';
import { CreateExpenseDialog } from './CreateExpenseDialog';
import { CreateTripDialog } from './CreateTripDialog';
import { TripCard } from './TripCard';
import { useTrips, Trip } from '@/hooks/useTrips';
import { useAuth } from '@/contexts/AuthContext';

export const TripDashboard = () => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const { user } = useAuth();
  const { 
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
  } = useTrips();

  // Create demo data for new users
  useEffect(() => {
    if (user && trips.length === 0 && !loading) {
      createDemoData();
    }
  }, [user, trips.length, loading]);

  // Set first trip as selected when trips load
  useEffect(() => {
    if (trips.length > 0 && !selectedTrip) {
      setSelectedTrip(trips[0]);
    }
  }, [trips, selectedTrip]);

  // Load participants and expenses when trip is selected
  useEffect(() => {
    if (selectedTrip) {
      fetchParticipants(selectedTrip.id);
      fetchExpenses(selectedTrip.id);
    }
  }, [selectedTrip]);

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  const handleTripDelete = async (tripId: string) => {
    await deleteTrip(tripId);
    if (selectedTrip?.id === tripId) {
      setSelectedTrip(trips.find(t => t.id !== tripId) || null);
    }
  };

  const handleAddTrip = async (tripData: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    participants: string[];
    currency: string;
  }) => {
    const newTrip = await createTrip(tripData);
    if (newTrip) {
      setSelectedTrip(newTrip);
    }
  };

  const handleAddExpense = async (expenseData: {
    tripId: string;
    title: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
    category: string;
    date: string;
    description?: string;
  }) => {
    await addExpense({
      tripId: expenseData.tripId,
      title: expenseData.title,
      amount: expenseData.amount,
      paidBy: expenseData.paidBy,
      category: expenseData.category,
      description: expenseData.description
    });
  };

  const selectedTripParticipants = selectedTrip ? participants[selectedTrip.id] || [] : [];
  const selectedTripExpenses = selectedTrip ? expenses[selectedTrip.id] || [] : [];

  // Convert expenses to the format expected by ExpenseList
  const formattedExpenses = selectedTripExpenses.map(expense => {
    const payer = selectedTripParticipants.find(p => p.id === expense.paid_by);
    return {
      id: expense.id,
      tripId: expense.trip_id,
      title: expense.description,
      amount: Number(expense.amount),
      paidBy: payer?.name || 'Unknown',
      splitBetween: selectedTripParticipants.map(p => p.name), // For now, split equally
      category: expense.category,
      date: new Date(expense.created_at).toISOString().split('T')[0],
      description: expense.description
    };
  });

  const participantNames = selectedTripParticipants.map(p => p.name);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-large">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">TripSplit</h1>
              <p className="text-primary-foreground/80">Track expenses and plan your perfect trip</p>
            </div>
            <Button 
              onClick={() => setShowCreateTrip(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Trip Selector */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Your Trips</h2>
            <div className="space-y-3">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  isSelected={selectedTrip?.id === trip.id}
                  participantCount={participants[trip.id]?.length || 0}
                  onSelect={() => handleTripSelect(trip)}
                  onDelete={() => handleTripDelete(trip.id)}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedTrip ? (
              <>
                {/* Trip Header */}
                <div className="bg-gradient-card rounded-xl p-6 shadow-soft mb-6 animate-slide-up">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{selectedTrip.name}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedTrip.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(selectedTrip.start_date).toLocaleDateString()} - {new Date(selectedTrip.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {selectedTripParticipants.length} people
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowCreateExpense(true)}
                      className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 rounded-lg p-4 text-center">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-ocean" />
                      <div className="text-2xl font-bold text-ocean">
                        {selectedTrip.currency === 'USD' ? '$' : selectedTrip.currency === 'EUR' ? '€' : selectedTrip.currency + ' '}
                        {Number(selectedTrip.total_amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Expenses</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-sunset" />
                      <div className="text-2xl font-bold text-sunset">{selectedTripParticipants.length}</div>
                      <div className="text-sm text-muted-foreground">Participants</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 text-center">
                      <Plane className="w-6 h-6 mx-auto mb-2 text-mint" />
                      <div className="text-2xl font-bold text-mint">
                        {selectedTrip.currency === 'USD' ? '$' : selectedTrip.currency === 'EUR' ? '€' : selectedTrip.currency + ' '}
                        {(Number(selectedTrip.total_amount) / Math.max(selectedTripParticipants.length, 1)).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Per Person</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="expenses" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white shadow-soft">
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="balances">Balances</TabsTrigger>
                    <TabsTrigger value="planning">Planning</TabsTrigger>
                  </TabsList>

                  <TabsContent value="expenses" className="animate-slide-up">
                    <ExpenseList expenses={formattedExpenses} participants={participantNames} />
                  </TabsContent>

                  <TabsContent value="balances" className="animate-slide-up">
                    <BalancesSummary expenses={formattedExpenses} participants={participantNames} />
                  </TabsContent>

                  <TabsContent value="planning" className="animate-slide-up">
                    <TripPlanning trip={{
                      id: selectedTrip.id,
                      name: selectedTrip.name,
                      destination: selectedTrip.location,
                      startDate: selectedTrip.start_date,
                      endDate: selectedTrip.end_date,
                      participants: participantNames,
                      totalExpenses: Number(selectedTrip.total_amount),
                      currency: selectedTrip.currency
                    }} />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-16">
                <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-float" />
                <h3 className="text-xl font-semibold mb-2">No Trips Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first trip to start tracking expenses</p>
                <Button onClick={() => setShowCreateTrip(true)} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Trip
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateExpenseDialog
        open={showCreateExpense}
        onOpenChange={setShowCreateExpense}
        tripId={selectedTrip?.id}
        participants={participantNames}
        onAddExpense={handleAddExpense}
      />

      <CreateTripDialog
        open={showCreateTrip}
        onOpenChange={setShowCreateTrip}
        onAddTrip={handleAddTrip}
      />
    </div>
  );
};