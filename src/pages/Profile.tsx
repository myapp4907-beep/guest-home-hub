import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Phone,
  Mail,
  BedDouble,
  Calendar,
  IndianRupee,
  Edit2,
  LogOut,
  UserCircle,
  Users,
  Save,
  X,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Profile {
  full_name: string;
  phone: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  room_number: string | null;
  bed_number: string | null;
  joining_date: string | null;
  monthly_rent: number | null;
}

interface PgSetting {
  setting_key: string;
  setting_value: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pgSettings, setPgSettings] = useState<PgSetting[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditData({
          phone: profileData.phone || '',
          emergency_contact: profileData.emergency_contact || '',
          emergency_phone: profileData.emergency_phone || '',
        });
      }

      const { data: settings } = await supabase.from('pg_settings').select('*');
      if (settings) setPgSettings(settings);
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: editData.phone,
        emergency_contact: editData.emergency_contact,
        emergency_phone: editData.emergency_phone,
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } else {
      setProfile((prev) => (prev ? { ...prev, ...editData } : null));
      setIsEditing(false);
      toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed Out', description: 'See you soon!' });
  };

  const getSetting = (key: string) => pgSettings.find((s) => s.setting_key === key)?.setting_value;
  const rules = getSetting('rules')?.split('|') || [];

  return (
    <Layout>
      <div className="p-4 space-y-5">
        <header className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account details</p>
        </header>

        {/* Profile Header Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-20 gradient-primary" />
          <CardContent className="pt-0 -mt-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-full bg-card border-4 border-card flex items-center justify-center shadow-lg">
                <UserCircle className="w-12 h-12 text-primary" />
              </div>
              <div className="pb-2">
                <h2 className="text-xl font-bold text-foreground">{profile?.full_name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Contact Info</DialogTitle>
                  <DialogDescription>Update your phone and emergency contact details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact Name</Label>
                    <Input
                      value={editData.emergency_contact}
                      onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                      placeholder="Parent/Guardian Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact Phone</Label>
                    <Input
                      value={editData.emergency_phone}
                      onChange={(e) => setEditData({ ...editData, emergency_phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{profile?.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                <p className="text-sm font-medium">
                  {profile?.emergency_contact || 'Not set'}
                  {profile?.emergency_phone && ` (${profile.emergency_phone})`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Room Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Room & Bed</p>
                <p className="text-sm font-medium">
                  Room {profile?.room_number || 'N/A'}, Bed {profile?.bed_number || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joining Date</p>
                <p className="text-sm font-medium">
                  {profile?.joining_date
                    ? format(new Date(profile.joining_date), 'dd MMMM, yyyy')
                    : 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Rent</p>
                <p className="text-sm font-medium">
                  ₹{profile?.monthly_rent?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PG Rules */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              PG Rules & Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="rules" className="border-none">
                <AccordionTrigger className="text-sm py-2">View Rules</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                          {index + 1}
                        </span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
