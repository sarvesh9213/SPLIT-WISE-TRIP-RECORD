import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Users, Trash2 } from 'lucide-react';
import { Trip } from '@/hooks/useTrips';

interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  participantCount: number;
  onSelect: () => void;
  onDelete: () => void;
}

export const TripCard = ({ trip, isSelected, participantCount, onSelect, onDelete }: TripCardProps) => {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-medium ${
        isSelected 
          ? 'ring-2 ring-primary bg-gradient-card shadow-medium' 
          : 'hover:shadow-soft'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm">{trip.name}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {trip.currency}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{trip.name}"? This action cannot be undone and will remove all expenses and participants.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Trip
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2 flex items-center">
        <MapPin className="w-3 h-3 mr-1" />
        {trip.location}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center text-muted-foreground">
          <Users className="w-3 h-3 mr-1" />
          {participantCount}
        </span>
        <span className="font-semibold text-ocean">
          {trip.currency === 'USD' ? '$' : trip.currency === 'EUR' ? '€' : trip.currency + ' '}
          {Number(trip.total_amount).toFixed(2)}
        </span>
      </div>
    </Card>
  );
};