import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTrip: (trip: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    participants: string[];
    currency: string;
  }) => void;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const CreateTripDialog = ({ open, onOpenChange, onAddTrip }: CreateTripDialogProps) => {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [currency, setCurrency] = useState('USD');
  const [participants, setParticipants] = useState<string[]>(['You']);
  const [newParticipant, setNewParticipant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDestination('');
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrency('USD');
    setParticipants(['You']);
    setNewParticipant('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !destination || !startDate || !endDate || participants.length === 0) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    onAddTrip({
      name,
      destination,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      participants,
      currency
    });

    resetForm();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const addParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const removeParticipant = (participant: string) => {
    if (participant !== 'You') {
      setParticipants(participants.filter(p => p !== participant));
    }
  };

  const handleParticipantKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipant();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trip</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trip Name */}
          <div className="space-y-2">
            <Label htmlFor="tripName">Trip Name</Label>
            <Input
              id="tripName"
              placeholder="Create your Happy Journey."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="Select your Happy Place."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM dd') : <span>Start</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM dd') : <span>End</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <div className="grid grid-cols-4 gap-2">
              {currencies.slice(0, 4).map((curr) => (
                <Button
                  key={curr.code}
                  type="button"
                  variant={currency === curr.code ? "default" : "outline"}
                  className={`h-12 flex flex-col gap-1 ${
                    currency === curr.code ? 'bg-gradient-primary' : ''
                  }`}
                  onClick={() => setCurrency(curr.code)}
                >
                  <span className="text-lg">{curr.symbol}</span>
                  <span className="text-xs">{curr.code}</span>
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currencies.slice(4).map((curr) => (
                <Button
                  key={curr.code}
                  type="button"
                  variant={currency === curr.code ? "default" : "outline"}
                  className={`h-12 flex flex-col gap-1 ${
                    currency === curr.code ? 'bg-gradient-primary' : ''
                  }`}
                  onClick={() => setCurrency(curr.code)}
                >
                  <span className="text-lg">{curr.symbol}</span>
                  <span className="text-xs">{curr.code}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Trip Participants</Label>
            <p className="text-sm text-muted-foreground">
              Add participant name & also their email address, on which I will be sending the messages so that the particular person will get the emails that he has to pay the remaining balance on time.
            </p>
            
            {/* Current Participants */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-gradient-primary text-white">
                        {getInitials(participant)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant}</span>
                    {participant === 'You' && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  {participant !== 'You' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(participant)}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Participant */}
            <div className="space-y-2">
              <Input
                placeholder="Participant name (e.g., John Doe)"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyPress={handleParticipantKeyPress}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Email address (e.g., john@example.com)"
                  type="email"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addParticipant}
                  disabled={!newParticipant.trim() || participants.includes(newParticipant.trim())}
                  className="bg-gradient-primary"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {participants.length} {participants.length === 1 ? 'person' : 'people'} in this trip
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name || !destination || !startDate || !endDate}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Trip
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};