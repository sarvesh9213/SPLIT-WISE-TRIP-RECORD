import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, DollarSign, Calendar, MapPin, Plane } from 'lucide-react';
import { ExpenseList } from './ExpenseList';
import { TripPlanning } from './TripPlanning';
import { BalancesSummary } from './BalancesSummary';
import { CreateExpenseDialog } from './CreateExpenseDialog';
import { CreateTripDialog } from './CreateTripDialog';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: string[];
  totalExpenses: number;
  currency: string;
}

interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  category: string;
  date: string;
  description?: string;
}

const mockTrips: Trip[] = [
  {
    id: '1',
    name: 'Bali Adventure',
    destination: 'Bali, Indonesia',
    startDate: '2024-09-15',
    endDate: '2024-09-22',
    participants: ['Alice', 'Bob', 'Charlie', 'Diana'],
    totalExpenses: 2450.50,
    currency: 'USD'
  },
  {
    id: '2',
    name: 'Europe Road Trip',
    destination: 'Paris, France',
    startDate: '2024-10-05',
    endDate: '2024-10-20',
    participants: ['Alice', 'Eve', 'Frank'],
    totalExpenses: 3200.00,
    currency: 'EUR'
  }
];

const mockExpenses: Expense[] = [
  {
    id: '1',
    tripId: '1',
    title: 'Flight Tickets',
    amount: 800.00,
    paidBy: 'Alice',
    splitBetween: ['Alice', 'Bob', 'Charlie', 'Diana'],
    category: 'Transportation',
    date: '2024-09-15',
    description: 'Round trip flights to Bali'
  },
  {
    id: '2',
    tripId: '1',
    title: 'Hotel Accommodation',
    amount: 1200.00,
    paidBy: 'Bob',
    splitBetween: ['Alice', 'Bob', 'Charlie', 'Diana'],
    category: 'Accommodation',
    date: '2024-09-16'
  },
  {
    id: '3',
    tripId: '1',
    title: 'Dinner at Beach Restaurant',
    amount: 150.50,
    paidBy: 'Charlie',
    splitBetween: ['Alice', 'Bob', 'Charlie'],
    category: 'Food',
    date: '2024-09-17'
  }
];

export const TripDashboard = () => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(mockTrips[0]);
  const [trips, setTrips] = useState(mockTrips);
  const [expenses, setExpenses] = useState(mockExpenses);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);

  const selectedTripExpenses = expenses.filter(expense => expense.tripId === selectedTrip?.id);

  const addTrip = (trip: Omit<Trip, 'id' | 'totalExpenses'>) => {
    const newTrip: Trip = {
      ...trip,
      id: Date.now().toString(),
      totalExpenses: 0
    };
    setTrips([...trips, newTrip]);
    setSelectedTrip(newTrip);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString()
    };
    setExpenses([...expenses, newExpense]);
    
    // Update trip total
    const updatedTrips = trips.map(trip => {
      if (trip.id === expense.tripId) {
        return {
          ...trip,
          totalExpenses: trip.totalExpenses + expense.amount
        };
      }
      return trip;
    });
    setTrips(updatedTrips);
    setSelectedTrip(updatedTrips.find(t => t.id === expense.tripId) || selectedTrip);
  };

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
                <Card 
                  key={trip.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-medium ${
                    selectedTrip?.id === trip.id 
                      ? 'ring-2 ring-primary bg-gradient-card shadow-medium' 
                      : 'hover:shadow-soft'
                  }`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{trip.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {trip.currency}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {trip.destination}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center text-muted-foreground">
                      <Users className="w-3 h-3 mr-1" />
                      {trip.participants.length}
                    </span>
                    <span className="font-semibold text-ocean">
                      ${trip.totalExpenses.toFixed(2)}
                    </span>
                  </div>
                </Card>
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
                          {selectedTrip.destination}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(selectedTrip.startDate).toLocaleDateString()} - {new Date(selectedTrip.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {selectedTrip.participants.length} people
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
                      <div className="text-2xl font-bold text-ocean">${selectedTrip.totalExpenses.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Expenses</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-sunset" />
                      <div className="text-2xl font-bold text-sunset">{selectedTrip.participants.length}</div>
                      <div className="text-sm text-muted-foreground">Participants</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 text-center">
                      <Plane className="w-6 h-6 mx-auto mb-2 text-mint" />
                      <div className="text-2xl font-bold text-mint">${(selectedTrip.totalExpenses / selectedTrip.participants.length).toFixed(2)}</div>
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
                    <ExpenseList expenses={selectedTripExpenses} participants={selectedTrip.participants} />
                  </TabsContent>

                  <TabsContent value="balances" className="animate-slide-up">
                    <BalancesSummary expenses={selectedTripExpenses} participants={selectedTrip.participants} />
                  </TabsContent>

                  <TabsContent value="planning" className="animate-slide-up">
                    <TripPlanning trip={selectedTrip} />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-16">
                <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-float" />
                <h3 className="text-xl font-semibold mb-2">No Trip Selected</h3>
                <p className="text-muted-foreground mb-4">Select a trip from the sidebar or create a new one</p>
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
        participants={selectedTrip?.participants || []}
        onAddExpense={addExpense}
      />

      <CreateTripDialog
        open={showCreateTrip}
        onOpenChange={setShowCreateTrip}
        onAddTrip={addTrip}
      />
    </div>
  );
};