import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Bed, Camera, Plus, Clock, Trash2 } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

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

interface Itinerary {
  id: string;
  day: number;
  date: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  type: 'transport' | 'accommodation' | 'activity' | 'meal';
  description?: string;
  estimatedCost?: number;
}

interface Accommodation {
  id: string;
  name: string;
  type: string;
  checkIn: string;
  checkOut: string;
  address: string;
  pricePerNight: number;
  amenities: string[];
}

interface TripPlanningProps {
  trip: Trip;
}

const mockItinerary: Itinerary[] = [
  {
    id: '1',
    day: 1,
    date: '2024-09-15',
    activities: [
      {
        id: '1',
        time: '06:00',
        title: 'Flight Departure',
        location: 'JFK Airport',
        type: 'transport',
        description: 'Flight to Bali via Singapore'
      },
      {
        id: '2',
        time: '20:00',
        title: 'Arrival & Hotel Check-in',
        location: 'Ubud Villa Resort',
        type: 'accommodation',
        description: 'Check into our beautiful villa'
      }
    ]
  },
  {
    id: '2',
    day: 2,
    date: '2024-09-16',
    activities: [
      {
        id: '3',
        time: '09:00',
        title: 'Breakfast at Villa',
        location: 'Ubud Villa Resort',
        type: 'meal',
        estimatedCost: 40
      },
      {
        id: '4',
        time: '11:00',
        title: 'Ubud Rice Terraces Tour',
        location: 'Tegallalang Rice Terraces',
        type: 'activity',
        description: 'Guided tour of the famous rice terraces',
        estimatedCost: 120
      },
      {
        id: '5',
        time: '18:00',
        title: 'Traditional Balinese Dinner',
        location: 'Locavore Restaurant',
        type: 'meal',
        estimatedCost: 180
      }
    ]
  }
];

const mockAccommodations: Accommodation[] = [
  {
    id: '1',
    name: 'Ubud Villa Resort',
    type: 'Villa',
    checkIn: '2024-09-15',
    checkOut: '2024-09-19',
    address: 'Jl. Raya Ubud, Bali, Indonesia',
    pricePerNight: 150,
    amenities: ['Pool', 'WiFi', 'Breakfast', 'Spa', 'Garden']
  },
  {
    id: '2',
    name: 'Seminyak Beach Hotel',
    type: 'Hotel',
    checkIn: '2024-09-19',
    checkOut: '2024-09-22',
    address: 'Jl. Pantai Seminyak, Bali, Indonesia',
    pricePerNight: 120,
    amenities: ['Beach Access', 'Pool', 'WiFi', 'Restaurant', 'Bar']
  }
];

const getActivityIcon = (type: Activity['type']) => {
  const icons = {
    transport: '✈️',
    accommodation: '🏨',
    activity: '🎯',
    meal: '🍽️'
  };
  return icons[type];
};

const getActivityColor = (type: Activity['type']) => {
  const colors = {
    transport: 'bg-ocean text-white',
    accommodation: 'bg-sunset text-white',
    activity: 'bg-mint text-white',
    meal: 'bg-coral text-white'
  };
  return colors[type];
};

export const TripPlanning = ({ trip }: TripPlanningProps) => {
  const [itinerary, setItinerary] = useState(mockItinerary);
  const [accommodations] = useState(mockAccommodations);

  const totalDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currencySymbol = getCurrencySymbol(trip.currency);

  const addActivity = (dayId: string) => {
    // Mock adding activity - in real app, this would open a dialog
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      time: '12:00',
      title: 'New Activity',
      location: 'To be determined',
      type: 'activity',
      description: 'Click to edit details'
    };
    
    setItinerary(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, activities: [...day.activities, newActivity] }
        : day
    ));
  };

  const removeActivity = (dayId: string, activityId: string) => {
    setItinerary(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, activities: day.activities.filter(activity => activity.id !== activityId) }
        : day
    ));
  };

  const addDay = () => {
    const lastDay = Math.max(...itinerary.map(d => d.day));
    const newDayDate = new Date(trip.startDate);
    newDayDate.setDate(newDayDate.getDate() + lastDay);
    
    const newDay: Itinerary = {
      id: `day-${Date.now()}`,
      day: lastDay + 1,
      date: newDayDate.toISOString().split('T')[0],
      activities: []
    };
    
    setItinerary(prev => [...prev, newDay]);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="itinerary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-soft">
          <TabsTrigger value="itinerary">Daily Itinerary</TabsTrigger>
          <TabsTrigger value="accommodations">Accommodations</TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary" className="space-y-6">
          {/* Trip Overview */}
          <Card className="p-6 bg-gradient-card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <Calendar className="w-6 h-6 mx-auto mb-2 text-ocean" />
                <div className="text-2xl font-bold text-ocean">{totalDays}</div>
                <div className="text-sm text-muted-foreground">Days</div>
              </div>
              <div>
                <MapPin className="w-6 h-6 mx-auto mb-2 text-sunset" />
                <div className="text-2xl font-bold text-sunset">{itinerary.length}</div>
                <div className="text-sm text-muted-foreground">Planned Days</div>
              </div>
              <div>
                <Camera className="w-6 h-6 mx-auto mb-2 text-mint" />
                <div className="text-2xl font-bold text-mint">
                  {itinerary.reduce((sum, day) => sum + day.activities.filter(a => a.type === 'activity').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Activities</div>
              </div>
              <div>
                <Bed className="w-6 h-6 mx-auto mb-2 text-coral" />
                <div className="text-2xl font-bold text-coral">{accommodations.length}</div>
                <div className="text-sm text-muted-foreground">Hotels</div>
              </div>
            </div>
          </Card>

          {/* Daily Itinerary */}
          <div className="space-y-6">
            {itinerary.map((day) => (
              <Card key={day.id} className="p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Day {day.day}</h3>
                    <p className="text-muted-foreground">{new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addActivity(day.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </div>

                <div className="space-y-3">
                  {day.activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:shadow-soft transition-shadow">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className={`${getActivityColor(activity.type)} text-lg px-2 py-1`}>
                          {getActivityIcon(activity.type)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono">{activity.time}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mb-1 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {activity.location}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {activity.estimatedCost && (
                          <div className="text-right mr-2">
                            <div className="text-lg font-bold text-ocean">{currencySymbol}{activity.estimatedCost}</div>
                            <div className="text-xs text-muted-foreground">estimated</div>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeActivity(day.id, activity.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {day.activities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No activities planned for this day</p>
                    <Button size="sm" className="mt-2" variant="outline" onClick={() => addActivity(day.id)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Plan Activities
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            {/* Add More Days */}
            <Card className="p-6 text-center border-dashed border-2 border-muted">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-float" />
              <h3 className="text-lg font-semibold mb-2">Plan More Days</h3>
              <p className="text-muted-foreground mb-4">Add itinerary for the remaining {totalDays - itinerary.length} days</p>
              <Button className="bg-gradient-primary" onClick={addDay}>
                <Plus className="w-4 h-4 mr-2" />
                Add Day
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accommodations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accommodations.map((accommodation) => (
              <Card key={accommodation.id} className="p-6 hover:shadow-medium transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{accommodation.name}</h3>
                    <Badge className="bg-sunset text-white mb-2">{accommodation.type}</Badge>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {accommodation.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-ocean">{currencySymbol}{accommodation.pricePerNight}</div>
                    <div className="text-sm text-muted-foreground">per night</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      Check-in: {new Date(accommodation.checkIn).toLocaleDateString()}
                    </span>
                    <span className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      Check-out: {new Date(accommodation.checkOut).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {accommodation.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {Math.ceil((new Date(accommodation.checkOut).getTime() - new Date(accommodation.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                      </span>
                      <div className="font-bold text-ocean">
                        Total: {currencySymbol}{accommodation.pricePerNight * Math.ceil((new Date(accommodation.checkOut).getTime() - new Date(accommodation.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add More Accommodations */}
            <Card className="p-6 text-center border-dashed border-2 border-muted flex items-center justify-center">
              <div>
                <Bed className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-float" />
                <h3 className="text-lg font-semibold mb-2">Add Accommodation</h3>
                <p className="text-muted-foreground mb-4">Book hotels, hostels, or vacation rentals</p>
                <Button className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stay
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};