import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Users, DollarSign } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

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

interface ExpenseListProps {
  expenses: Expense[];
  participants: string[];
  currency?: string;
}

const getCategoryColor = (category: string) => {
  const colors = {
    'Transportation': 'bg-ocean text-white',
    'Accommodation': 'bg-sunset text-white',
    'Food': 'bg-mint text-white',
    'Activities': 'bg-coral text-white',
    'Shopping': 'bg-primary text-primary-foreground',
    'Other': 'bg-muted text-muted-foreground'
  };
  return colors[category as keyof typeof colors] || colors.Other;
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const ExpenseList = ({ expenses, participants, currency = 'USD' }: ExpenseListProps) => {
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (expenses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-float" />
        <h3 className="text-lg font-semibold mb-2">No Expenses Yet</h3>
        <p className="text-muted-foreground">Start by adding your first expense for this trip</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedExpenses.map((expense) => (
        <Card key={expense.id} className="p-6 hover:shadow-medium transition-all duration-200 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{expense.title}</h3>
                <Badge className={getCategoryColor(expense.category)}>
                  {expense.category}
                </Badge>
              </div>
              {expense.description && (
                <p className="text-sm text-muted-foreground mb-2">{expense.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  {new Date(expense.date).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Split {expense.splitBetween.length} ways
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-ocean">{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {getCurrencySymbol(currency)}{(expense.amount / expense.splitBetween.length).toFixed(2)} per person
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Paid by</span>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-gradient-primary text-white">
                    {getInitials(expense.paidBy)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{expense.paidBy}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Split between:</span>
              <div className="flex -space-x-2">
                {expense.splitBetween.map((person, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-white">
                    <AvatarFallback className="text-xs bg-gradient-sunset text-white">
                      {getInitials(person)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};