import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Bell, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  created_at: string;
}

const AnnouncementsList = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setAnnouncements(data);
    };

    fetchAnnouncements();

    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'important':
        return <Megaphone className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'important':
        return <Badge className="bg-warning text-warning-foreground">Important</Badge>;
      default:
        return null;
    }
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Latest Notices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {getPriorityIcon(announcement.priority)}
                <h4 className="font-medium text-sm text-foreground">{announcement.title}</h4>
              </div>
              {getPriorityBadge(announcement.priority)}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
              {announcement.content}
            </p>
            <p className="text-xs text-muted-foreground mt-2 ml-6">
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsList;
