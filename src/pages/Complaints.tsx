import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Complaint {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string | null;
  created_at: string;
  resolved_at: string | null;
}

const categories = [
  { value: 'electrical', label: 'Electrical', icon: Zap },
  { value: 'plumbing', label: 'Plumbing', icon: Droplets },
  { value: 'wifi', label: 'WiFi/Internet', icon: Wifi },
  { value: 'maintenance', label: 'General Maintenance', icon: Wrench },
  { value: 'other', label: 'Other', icon: AlertCircle },
];

const Complaints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setComplaints(data);
      setLoading(false);
    };

    fetchComplaints();

    const channel = supabase
      .channel('complaints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.category || !formData.subject || !formData.description) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('complaints').insert({
      user_id: user.id,
      category: formData.category,
      subject: formData.subject,
      description: formData.description,
    });

    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Failed to submit', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request Submitted', description: 'We will look into it shortly.' });
      setFormData({ category: '', subject: '', description: '' });
      setIsDialogOpen(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.icon || AlertCircle;
  };

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'in_progress':
        return { color: 'bg-warning text-warning-foreground', icon: Clock, label: 'In Progress' };
      case 'resolved':
        return { color: 'bg-success text-success-foreground', icon: CheckCircle, label: 'Resolved' };
      case 'rejected':
        return { color: 'bg-destructive', icon: XCircle, label: 'Rejected' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Pending' };
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-5">
        <header className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Requests</h1>
            <p className="text-sm text-muted-foreground">Maintenance & complaints</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4 mr-1" /> New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Raise a Request</DialogTitle>
                <DialogDescription>
                  Submit a maintenance request or complaint
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Provide more details about the issue..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-md animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No Requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't raised any maintenance requests yet.
              </p>
              <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Raise Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint, index) => {
              const Icon = getCategoryIcon(complaint.category);
              const statusConfig = getStatusConfig(complaint.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={complaint.id}
                  className={`border-0 shadow-md animate-slide-up opacity-0 stagger-${Math.min(index + 1, 5)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {complaint.subject}
                          </h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="capitalize">{complaint.category}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                          </span>
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

export default Complaints;
