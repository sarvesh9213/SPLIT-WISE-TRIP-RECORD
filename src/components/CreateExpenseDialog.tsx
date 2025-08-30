import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId?: string;
  participants: string[];
  onAddExpense: (expense: {
    tripId: string;
    title: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
    category: string;
    date: string;
    description?: string;
  }) => void;
}

const categories = [
  'Transportation',
  'Accommodation',
  'Food',
  'Activities',
  'Shopping',
  'Other'
];

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const CreateExpenseDialog = ({ 
  open, 
  onOpenChange, 
  tripId, 
  participants, 
  onAddExpense 
}: CreateExpenseDialogProps) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [splitBetween, setSplitBetween] = useState<string[]>(participants);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setPaidBy('');
    setCategory('');
    setDescription('');
    setDate(new Date());
    setSplitBetween(participants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tripId || !title || !amount || !paidBy || !category || splitBetween.length === 0) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    onAddExpense({
      tripId,
      title,
      amount: parseFloat(amount),
      paidBy,
      splitBetween,
      category,
      date: date.toISOString(),
      description: description || undefined
    });

    resetForm();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const toggleParticipant = (participant: string) => {
    setSplitBetween(prev => 
      prev.includes(participant)
        ? prev.filter(p => p !== participant)
        : [...prev, participant]
    );
  };

  const amountPerPerson = splitBetween.length > 0 ? parseFloat(amount || '0') / splitBetween.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Expense Title</Label>
            <Input
              id="title"
              placeholder="e.g., Dinner at restaurant"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {splitBetween.length > 0 && amount && (
              <p className="text-sm text-muted-foreground">
                ${amountPerPerson.toFixed(2)} per person ({splitBetween.length} people)
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Paid By */}
          <div className="space-y-2">
            <Label>Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy} required>
              <SelectTrigger>
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant} value={participant}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-gradient-primary text-white">
                          {getInitials(participant)}
                        </AvatarFallback>
                      </Avatar>
                      {participant}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split Between */}
          <div className="space-y-2">
            <Label>Split Between</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant} className="flex items-center space-x-3">
                  <Checkbox
                    id={participant}
                    checked={splitBetween.includes(participant)}
                    onCheckedChange={() => toggleParticipant(participant)}
                  />
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-gradient-sunset text-white">
                        {getInitials(participant)}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor={participant} className="cursor-pointer">
                      {participant}
                    </Label>
                  </div>
                  {splitBetween.includes(participant) && amount && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      ${amountPerPerson.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {splitBetween.length} of {participants.length} people selected
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about this expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
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
              disabled={isSubmitting || !title || !amount || !paidBy || !category || splitBetween.length === 0}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};