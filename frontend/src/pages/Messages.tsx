import { useState } from 'react';
import { useCommunications } from '@/hooks/useCommunications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Phone, MessageSquare, StickyNote, Calendar, Eye, Plus, Filter, TrendingUp, Building2, User, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/layout/Header';

// Helper to safely format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Invalid date';
  }
};

const typeIcons: Record<string, any> = {
  email: Mail,
  call: Phone,
  sms: MessageSquare,
  note: StickyNote,
  task: StickyNote,
  meeting: Calendar,
  viewing: Eye,
};

const typeColors: Record<string, string> = {
  email: 'bg-blue-100 text-blue-800',
  call: 'bg-green-100 text-green-800',
  sms: 'bg-purple-100 text-purple-800',
  note: 'bg-yellow-100 text-yellow-800',
  task: 'bg-orange-100 text-orange-800',
  meeting: 'bg-pink-100 text-pink-800',
  viewing: 'bg-indigo-100 text-indigo-800',
};

export default function Messages() {
  const {
    communications,
    stats,
    loading,
    error,
    createCommunication,
    fetchCommunications,
    markAsRead,
  } = useCommunications();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const [newComm, setNewComm] = useState({
    type: 'note',
    subject: '',
    content: '',
    direction: '',
    created_by: '',
    property_id: '',
    landlord_id: '',
    applicant_id: '',
    is_important: false,
  });

  const handleCreate = async () => {
    // Validate that at least one entity is linked
    const hasEntity = newComm.property_id || newComm.landlord_id || newComm.applicant_id;
    if (!hasEntity) {
      alert('Please link at least one entity (Property, Landlord, or Applicant)');
      return;
    }

    try {
      const data: any = {
        type: newComm.type,
        content: newComm.content,
        is_important: newComm.is_important,
      };

      if (newComm.subject) data.subject = newComm.subject;
      if (newComm.direction) data.direction = newComm.direction;
      if (newComm.created_by) data.created_by = newComm.created_by;
      if (newComm.property_id) data.property_id = parseInt(newComm.property_id);
      if (newComm.landlord_id) data.landlord_id = parseInt(newComm.landlord_id);
      if (newComm.applicant_id) data.applicant_id = parseInt(newComm.applicant_id);

      await createCommunication(data);
      setIsDialogOpen(false);
      setNewComm({
        type: 'note',
        subject: '',
        content: '',
        direction: '',
        created_by: '',
        property_id: '',
        landlord_id: '',
        applicant_id: '',
        is_important: false,
      });
    } catch (err: any) {
      console.error('Failed to create communication:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to create communication. Please try again.';
      alert(errorMsg);
    }
  };

  const handleFilter = () => {
    const filters: any = {};
    if (filterType !== 'all') filters.type = filterType;
    if (filterRead === 'unread') filters.is_read = false;
    if (filterRead === 'read') filters.is_read = true;
    fetchCommunications(filters);
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value || 0}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <Header title="Communications" />
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-500 mt-1">Activity feed and communication log</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Communication
          </Button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard 
            title="Total Communications" 
            value={stats?.total || 0} 
            icon={TrendingUp} 
            color="text-blue-600" 
          />
          <StatCard 
            title="Unread" 
            value={stats?.unread || 0} 
            icon={Mail} 
            color="text-red-600" 
          />
          <StatCard 
            title="Properties" 
            value={stats?.by_entity?.properties || 0} 
            icon={Building2} 
            color="text-green-600" 
          />
          <StatCard 
            title="People" 
            value={(stats?.by_entity?.landlords || 0) + (stats?.by_entity?.applicants || 0)} 
            icon={User} 
            color="text-purple-600" 
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="outline" size="sm" onClick={handleFilter}>
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="viewing">Viewing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Read Status</Label>
                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communications List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
            <CardDescription>{communications.length} communication(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-center text-muted-foreground py-8">Loading...</p>}
            {error && <p className="text-center text-red-600 py-8">{error}</p>}
            {!loading && !error && communications.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No communications found</p>
            )}
            {!loading && !error && communications.length > 0 && (
              <div className="space-y-4">
                {communications.map((comm) => {
                  const Icon = typeIcons[comm.type] || StickyNote;
                  return (
                    <div 
                      key={comm.id} 
                      className={`p-4 border rounded-lg ${!comm.is_read ? 'bg-blue-50 border-blue-200' : ''}`}
                      onClick={() => !comm.is_read && markAsRead(comm.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${typeColors[comm.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={typeColors[comm.type] as any}>{comm.type}</Badge>
                              {comm.is_important && (
                                <Badge variant="destructive">Important</Badge>
                              )}
                              {!comm.is_read && (
                                <Badge variant="secondary">Unread</Badge>
                              )}
                            </div>
                            {comm.subject && (
                              <h4 className="font-semibold mb-1">{comm.subject}</h4>
                            )}
                            <p className="text-sm text-muted-foreground">{comm.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {comm.property_id && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Property #{comm.property_id}
                                </span>
                              )}
                              {comm.landlord_id && (
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  Landlord #{comm.landlord_id}
                                </span>
                              )}
                              {comm.applicant_id && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Applicant #{comm.applicant_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comm.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
              <DialogDescription>
                Record a call, email, note, or other interaction
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={newComm.type} onValueChange={(v) => setNewComm({...newComm, type: v})}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="viewing">Viewing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="direction">Direction</Label>
                  <Select value={newComm.direction} onValueChange={(v) => setNewComm({...newComm, direction: v})}>
                    <SelectTrigger id="direction">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject"
                  value={newComm.subject} 
                  onChange={(e) => setNewComm({...newComm, subject: e.target.value})}
                  placeholder="Optional subject line"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea 
                  id="content"
                  value={newComm.content} 
                  onChange={(e) => setNewComm({...newComm, content: e.target.value})}
                  placeholder="Enter communication details..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="created_by">Created By</Label>
                <Input 
                  id="created_by"
                  value={newComm.created_by} 
                  onChange={(e) => setNewComm({...newComm, created_by: e.target.value})}
                  placeholder="Your name"
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-red-600">Linked Entities * (at least one required)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Link this communication to a Property, Landlord, or Applicant
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="property_id">Property ID</Label>
                    <Input 
                      id="property_id"
                      type="number"
                      value={newComm.property_id} 
                      onChange={(e) => setNewComm({...newComm, property_id: e.target.value})}
                      placeholder="Property ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="landlord_id">Landlord ID</Label>
                    <Input 
                      id="landlord_id"
                      type="number"
                      value={newComm.landlord_id} 
                      onChange={(e) => setNewComm({...newComm, landlord_id: e.target.value})}
                      placeholder="Landlord ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicant_id">Applicant ID</Label>
                    <Input 
                      id="applicant_id"
                      type="number"
                      value={newComm.applicant_id} 
                      onChange={(e) => setNewComm({...newComm, applicant_id: e.target.value})}
                      placeholder="Applicant ID"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_important"
                  checked={newComm.is_important}
                  onCheckedChange={(checked) => setNewComm({...newComm, is_important: checked as boolean})}
                />
                <Label htmlFor="is_important" className="cursor-pointer">
                  Mark as important
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={
                  !newComm.content ||
                  (!newComm.property_id && !newComm.landlord_id && !newComm.applicant_id)
                }
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

