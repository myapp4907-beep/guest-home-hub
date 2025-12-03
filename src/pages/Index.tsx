import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import RentStatusCard from '@/components/dashboard/RentStatusCard';
import QuickStats from '@/components/dashboard/QuickStats';
import AnnouncementsList from '@/components/dashboard/AnnouncementsList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Home } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('Guest');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data?.full_name) {
        setUserName(data.full_name.split(' ')[0]);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <Layout>
      <div className="p-4 space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="text-2xl font-bold text-foreground">{userName}</h1>
          </div>
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <Home className="w-6 h-6 text-primary-foreground" />
          </div>
        </header>

        {/* Rent Status */}
        <section className="animate-slide-up opacity-0 stagger-1">
          <RentStatusCard />
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Your Stay</h2>
          <QuickStats />
        </section>

        {/* Announcements */}
        <section className="animate-slide-up opacity-0 stagger-3">
          <AnnouncementsList />
        </section>
      </div>
    </Layout>
  );
};

export default Index;
