import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, IndianRupee, CheckCircle, Clock, History, Wallet, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  month_year: string;
  status: string | null;
}

interface Profile {
  monthly_rent: number | null;
}

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentMonthPaid, setCurrentMonthPaid] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('monthly_rent')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (paymentsData) setPayments(paymentsData);

      const currentMonth = format(new Date(), 'yyyy-MM');
      const isPaid = paymentsData?.some(
        (p) => p.month_year === currentMonth && p.status === 'completed'
      );
      setCurrentMonthPaid(isPaid || false);
    };

    fetchData();

    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handlePayment = async (method: string) => {
    if (!user || !profile?.monthly_rent) return;

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { error } = await supabase.from('payments').insert({
      user_id: user.id,
      amount: profile.monthly_rent,
      payment_method: method,
      month_year: format(new Date(), 'yyyy-MM'),
      transaction_id: `TXN${Date.now()}`,
      status: 'completed',
    });

    setIsProcessing(false);
    setIsDialogOpen(false);

    if (error) {
      toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment Successful!', description: `₹${profile.monthly_rent} paid via ${method}` });
      setCurrentMonthPaid(true);
    }
  };

  const rent = profile?.monthly_rent || 0;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingMonths = payments.filter((p) => p.status === 'pending').length;

  return (
    <Layout>
      <div className="p-4 space-y-5">
        <header className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">Manage your rent payments</p>
        </header>

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Monthly Rent</p>
              <p className="text-lg font-bold">₹{rent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                <Wallet className="w-5 h-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-bold">₹{totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Month Status */}
        <Card className={`border-0 shadow-lg ${currentMonthPaid ? 'bg-success/5' : 'bg-warning/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{format(new Date(), 'MMMM yyyy')}</p>
                <p className="text-2xl font-bold">₹{rent.toLocaleString()}</p>
                <Badge className={`mt-2 ${currentMonthPaid ? 'bg-success' : 'bg-warning text-warning-foreground'}`}>
                  {currentMonthPaid ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Paid</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Pending</>
                  )}
                </Badge>
              </div>
              {!currentMonthPaid && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gradient" size="lg">
                      Pay Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Select Payment Method</DialogTitle>
                      <DialogDescription>
                        Pay ₹{rent.toLocaleString()} for {format(new Date(), 'MMMM yyyy')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-4">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-14"
                        onClick={() => handlePayment('UPI')}
                        disabled={isProcessing}
                      >
                        <Smartphone className="w-5 h-5 mr-3 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">UPI</p>
                          <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-14"
                        onClick={() => handlePayment('Card')}
                        disabled={isProcessing}
                      >
                        <CreditCard className="w-5 h-5 mr-3 text-accent" />
                        <div className="text-left">
                          <p className="font-medium">Debit/Credit Card</p>
                          <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-14"
                        onClick={() => handlePayment('Net Banking')}
                        disabled={isProcessing}
                      >
                        <Wallet className="w-5 h-5 mr-3 text-success" />
                        <div className="text-left">
                          <p className="font-medium">Net Banking</p>
                          <p className="text-xs text-muted-foreground">All major banks supported</p>
                        </div>
                      </Button>
                    </div>
                    {isProcessing && (
                      <div className="text-center py-4">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Processing payment...</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payments yet</p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      payment.status === 'completed' ? 'bg-success/10' : 'bg-warning/10'
                    }`}>
                      {payment.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(payment.month_year + '-01'), 'MMMM yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.payment_date), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{Number(payment.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{payment.payment_method}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Payments;
