import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  monthly_rent: number | null;
}

interface Payment {
  month_year: string;
}

const RentStatusCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentMonthPaid, setCurrentMonthPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('monthly_rent')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const currentMonth = format(new Date(), 'yyyy-MM');
      const { data: payments } = await supabase
        .from('payments')
        .select('month_year')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .eq('status', 'completed');

      setCurrentMonthPaid(payments && payments.length > 0);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const rent = profile?.monthly_rent || 0;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className={`pb-3 ${currentMonthPaid ? 'bg-success/10' : 'bg-warning/10'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {format(new Date(), 'MMMM')} Rent
          </CardTitle>
          <Badge variant={currentMonthPaid ? 'default' : 'destructive'} className={currentMonthPaid ? 'bg-success' : ''}>
            {currentMonthPaid ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Paid</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> Due</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">₹{rent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Due by 5th of every month
            </p>
          </div>
          {!currentMonthPaid && (
            <Button variant="gradient" size="sm" onClick={() => navigate('/payments')}>
              Pay Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RentStatusCard;
