import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Bell, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  created_at: string;
  expires_at: string | null;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setAnnouncements(data);
      setLoading(false);
    };

    fetchAnnouncements();

    const channel = supabase
      .channel('announcements-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityConfig = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          badge: <Badge variant="destructive">Urgent</Badge>,
        };
      case 'important':
        return {
          icon: Megaphone,
          color: 'text-warning',
          bg: 'bg-warning/10',
          badge: <Badge className="bg-warning text-warning-foreground">Important</Badge>,
        };
      default:
        return {
          icon: Info,
          color: 'text-primary',
          bg: 'bg-primary/10',
          badge: <Badge variant="secondary">Notice</Badge>,
        };
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-5">
        <header className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Latest updates from your PG</p>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-md animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full mb-1" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No Announcements</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement, index) => {
              const config = getPriorityConfig(announcement.priority);
              const Icon = config.icon;

              return (
                <Card
                  key={announcement.id}
                  className={`border-0 shadow-md animate-slide-up opacity-0 stagger-${Math.min(index + 1, 5)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                          {config.badge}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                          </span>
                          {announcement.expires_at && (
                            <span className="text-warning">
                              Expires: {format(new Date(announcement.expires_at), 'dd MMM')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Announcements;
