import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, CheckCircle } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface BalancesSummaryProps {
  expenses: Expense[];
  participants: string[];
  currency?: string;
  tripId?: string;
  tripName?: string;
}

interface Balance {
  person: string;
  balance: number;
  owes: { to: string; amount: number }[];
  owedBy: { from: string; amount: number }[];
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const generateWhatsAppLink = (debtor: string, creditor: string, amount: number, currency: string) => {
  const currencySymbol = getCurrencySymbol(currency);
  const message = `Hi ${debtor}! 💰\n\nJust a friendly reminder that you owe me ${currencySymbol}${amount.toFixed(2)} from our recent trip expenses.\n\nCould you please settle this when you get a chance? Thanks! 😊`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  
  // Open WhatsApp in a new tab
  window.open(whatsappUrl, '_blank');
};

export const BalancesSummary = ({ expenses, participants, currency = 'USD', tripId, tripName }: BalancesSummaryProps) => {
  // Calculate balances
  const calculateBalances = (): Balance[] => {
    const balances: Record<string, Balance> = {};
    
    // Get all unique participants from both participants array and expenses
    const allParticipants = new Set([
      ...participants,
      ...expenses.map(e => e.paidBy),
      ...expenses.flatMap(e => e.splitBetween)
    ]);
    
    // Initialize balances for all participants
    allParticipants.forEach(person => {
      balances[person] = {
        person,
        balance: 0,
        owes: [],
        owedBy: []
      };
    });

    // Calculate expenses and payments
    expenses.forEach(expense => {
      const sharePerPerson = expense.amount / expense.splitBetween.length;
      
      // Person who paid gets credited
      if (balances[expense.paidBy]) {
        balances[expense.paidBy].balance += expense.amount;
      }
      
      // Everyone in the split gets debited their share
      expense.splitBetween.forEach(person => {
        if (balances[person]) {
          balances[person].balance -= sharePerPerson;
        }
      });
    });

    // Calculate who owes whom
    const positiveBalances = Object.values(balances).filter(b => b.balance > 0.01);
    const negativeBalances = Object.values(balances).filter(b => b.balance < -0.01);

    // Simple settlement algorithm
    negativeBalances.forEach(debtor => {
      let remaining = Math.abs(debtor.balance);
      
      positiveBalances.forEach(creditor => {
        if (remaining > 0.01 && creditor.balance > 0.01) {
          const payment = Math.min(remaining, creditor.balance);
          
          debtor.owes.push({ to: creditor.person, amount: payment });
          creditor.owedBy.push({ from: debtor.person, amount: payment });
          
          remaining -= payment;
          creditor.balance -= payment;
        }
      });
    });

    return Object.values(balances);
  };

  const balances = calculateBalances();
  const totalOwed = balances.reduce((sum, balance) => sum + Math.max(0, -balance.balance), 0);
  const currencySymbol = getCurrencySymbol(currency);
  const { toast } = useToast();

  const sendPaymentRequest = async (debtorName: string, creditorName: string, amount: number) => {
    try {
      toast({
        title: "Sending request...",
        description: "Please wait while we send the payment request email.",
      });

      const { data, error } = await supabase.functions.invoke('send-expense-request', {
        body: {
          tripId,
          tripName: tripName || 'Trip',
          currency,
          debtorName,
          creditorName,
          amount
        }
      });

      if (error) {
        console.error('Error sending payment request:', error);
        toast({
          title: "Failed to send request",
          description: error.message || "Could not send payment request email.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request sent!",
        description: `Payment request email sent to ${debtorName}`,
      });

    } catch (error: any) {
      console.error('Error sending payment request:', error);
      toast({
        title: "Failed to send request", 
        description: "Could not send payment request email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-gradient-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-ocean">{currencySymbol}{expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sunset">{currencySymbol}{totalOwed.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Owed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-mint">{balances.filter(b => Math.abs(b.balance) < 0.01).length}</div>
            <div className="text-sm text-muted-foreground">Settled Up</div>
          </div>
        </div>
      </Card>

      {/* Individual Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {balances.map((balance) => (
          <Card key={balance.person} className="p-6 hover:shadow-medium transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {getInitials(balance.person)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{balance.person}</h3>
                  <div className="flex items-center gap-2">
                    {Math.abs(balance.balance) < 0.01 ? (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Settled Up
                      </Badge>
                    ) : balance.balance > 0 ? (
                      <Badge className="bg-mint text-white">
                        <ArrowDownLeft className="w-3 h-3 mr-1" />
                        Gets Back {currencySymbol}{balance.balance.toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge className="bg-coral text-white">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        Owes {currencySymbol}{Math.abs(balance.balance).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* What they owe */}
            {balance.owes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Owes:</h4>
                {balance.owes.map((debt, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-gradient-sunset text-white">
                          {getInitials(debt.to)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{debt.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-red-600">{currencySymbol}{debt.amount.toFixed(2)}</span>
                      <Button 
                        size="sm" 
                        className="h-6 text-xs bg-gradient-primary"
                        onClick={() => sendPaymentRequest(balance.person, debt.to, debt.amount)}
                      >
                        Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* What they're owed */}
            {balance.owedBy.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Owed by:</h4>
                {balance.owedBy.map((credit, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-gradient-success text-white">
                          {getInitials(credit.from)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{credit.from}</span>
                    </div>
                    <span className="font-semibold text-green-600">{currencySymbol}{credit.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Settlement Suggestions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Suggested Settlements</h3>
        <div className="space-y-3">
          {balances
            .filter(balance => balance.owes.length > 0)
            .map((balance) => (
              balance.owes.map((debt, index) => (
                <div key={`${balance.person}-${index}`} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-sunset text-white">
                        {getInitials(balance.person)}
                      </AvatarFallback>
                    </Avatar>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {getInitials(debt.to)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      <strong>{balance.person}</strong> pays <strong>{debt.to}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-ocean">{currencySymbol}{debt.amount.toFixed(2)}</span>
                    <Button size="sm" className="bg-gradient-primary">
                      Record Payment
                    </Button>
                  </div>
                </div>
              ))
            ))}
        </div>
        {balances.every(balance => balance.owes.length === 0) && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success animate-float" />
            <h3 className="text-lg font-semibold mb-2 text-success">All Settled Up!</h3>
            <p className="text-muted-foreground">Everyone has paid their fair share</p>
          </div>
        )}
      </Card>
    </div>
  );
};