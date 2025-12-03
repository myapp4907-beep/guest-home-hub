import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BedDouble, Calendar, IndianRupee, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Profile {
  room_number: string | null;
  bed_number: string | null;
  joining_date: string | null;
  monthly_rent: number | null;
}

const QuickStats = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('room_number, bed_number, joining_date, monthly_rent')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const total = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setTotalPaid(total);
    };

    fetchData();
  }, [user]);

  const daysStayed = profile?.joining_date 
    ? differenceInDays(new Date(), new Date(profile.joining_date))
    : 0;

  const stats = [
    {
      icon: BedDouble,
      label: 'Room',
      value: profile?.room_number ? `${profile.room_number}-${profile.bed_number || 'A'}` : 'Not assigned',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Calendar,
      label: 'Joined',
      value: profile?.joining_date ? format(new Date(profile.joining_date), 'MMM dd, yyyy') : 'N/A',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      icon: Clock,
      label: 'Days',
      value: `${daysStayed} days`,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: IndianRupee,
      label: 'Total Paid',
      value: `₹${totalPaid.toLocaleString()}`,
      color: 'text-foreground',
      bg: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <Card key={stat.label} className={`border-0 shadow-md animate-slide-up opacity-0 stagger-${index + 1}`}>
          <CardContent className="p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-semibold text-foreground truncate">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
