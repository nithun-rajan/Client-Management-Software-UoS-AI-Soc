import { useState } from "react";
import { useCommunications } from "@/hooks/useCommunications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  MessageSquare,
  StickyNote,
  Calendar,
  Eye,
  Plus,
  Filter,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

// Helper to safely format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return "Invalid date";
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
  email: "bg-blue-100 text-blue-800",
  call: "bg-green-100 text-green-800",
  sms: "bg-purple-100 text-purple-800",
  note: "bg-yellow-100 text-yellow-800",
  task: "bg-orange-100 text-orange-800",
  meeting: "bg-pink-100 text-pink-800",
  viewing: "bg-indigo-100 text-indigo-800",
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
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");

  const [newComm, setNewComm] = useState({
    type: "note",
    subject: "",
    content: "",
    direction: "",
    created_by: "",
    property_id: "",
    landlord_id: "",
    applicant_id: "",
    is_important: false,
  });

  const handleCreate = async () => {
    // Validate that at least one entity is linked
    const hasEntity =
      newComm.property_id || newComm.landlord_id || newComm.applicant_id;
    if (!hasEntity) {
      alert("Please link at least one entity (Property, Landlord, or Applicant)");
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
        type: "note",
        subject: "",
        content: "",
        direction: "",
        created_by: "",
        property_id: "",
        landlord_id: "",
        applicant_id: "",
        is_important: false,
      });
    } catch (err: any) {
      console.error("Failed to create communication:", err);
      const errorMsg =
        err.response?.data?.detail ||
        "Failed to create communication. Please try again.";
      alert(errorMsg);
    }
  };

  const handleFilter = () => {
    const filters: any = {};
    if (filterType !== "all") filters.type = filterType;
    if (filterRead === "unread") filters.is_read = false;
    if (filterRead === "read") filters.is_read = true;
    fetchCommunications(filters);
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communications</h1>
          <p className="mt-1 text-muted-foreground">Activity feed and communication log</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Communication
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
              <DialogDescription>
                Record a call, email, note, or other interaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newComm.type}
                    onValueChange={(value) => setNewComm({ ...newComm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="viewing">Viewing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Direction</Label>
                  <Select
                    value={newComm.direction}
                    onValueChange={(value) =>
                      setNewComm({ ...newComm, direction: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Subject (Optional)</Label>
                <Input
                  value={newComm.subject}
                  onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                  placeholder="Brief subject line"
                />
              </div>

              <div>
                <Label>Content *</Label>
                <Textarea
                  value={newComm.content}
                  onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                  placeholder="Details of the communication..."
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Link to Entity <span className="text-red-500">*</span>
                </Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  At least one entity (Property, Landlord, or Applicant) is required
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Property ID</Label>
                    <Input
                      type="number"
                      value={newComm.property_id}
                      onChange={(e) =>
                        setNewComm({ ...newComm, property_id: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Landlord ID</Label>
                    <Input
                      type="number"
                      value={newComm.landlord_id}
                      onChange={(e) =>
                        setNewComm({ ...newComm, landlord_id: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Applicant ID</Label>
                    <Input
                      type="number"
                      value={newComm.applicant_id}
                      onChange={(e) =>
                        setNewComm({ ...newComm, applicant_id: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Created By</Label>
                <Input
                  value={newComm.created_by}
                  onChange={(e) =>
                    setNewComm({ ...newComm, created_by: e.target.value })
                  }
                  placeholder="Your name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={newComm.is_important}
                  onChange={(e) =>
                    setNewComm({ ...newComm, is_important: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="important" className="cursor-pointer">
                  Mark as important
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !newComm.content ||
                    (!newComm.property_id &&
                      !newComm.landlord_id &&
                      !newComm.applicant_id)
                  }
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && stats.by_entity ? (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Communications"
            value={stats.total || 0}
            icon={MessageSquare}
            color="text-blue-600"
          />
          <StatCard
            title="Unread"
            value={stats.unread || 0}
            icon={Mail}
            color="text-orange-600"
          />
          <StatCard
            title="Important"
            value={stats.important || 0}
            icon={TrendingUp}
            color="text-red-600"
          />
          <StatCard
            title="Properties"
            value={stats.by_entity.properties || 0}
            icon={TrendingUp}
            color="text-green-600"
          />
        </div>
      ) : loading ? (
        <div className="py-4 text-center text-muted-foreground">Loading stats...</div>
      ) : (
        <div className="py-4 text-center text-muted-foreground">Stats not available</div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
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
              <Label>Status</Label>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
            {(filterType !== "all" || filterRead !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterType("all");
                  setFilterRead("all");
                  fetchCommunications();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      {loading ? (
        <div className="py-12 text-center">Loading communications...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600">{error}</div>
      ) : communications.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No communications yet"
          description="Start a conversation by creating your first communication"
          actionLabel="Create Communication"
          onAction={() => {}}
        />
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => {
            const Icon = typeIcons[comm.type] || MessageSquare;
            return (
              <Card
                key={comm.id}
                className={`${!comm.is_read ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""} cursor-pointer transition-shadow hover:shadow-md`}
                onClick={() => !comm.is_read && markAsRead(comm.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 ${typeColors[comm.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={typeColors[comm.type]}>
                              {comm.type}
                            </Badge>
                            {comm.direction && (
                              <Badge variant="secondary">{comm.direction}</Badge>
                            )}
                            {comm.is_important && (
                              <Badge variant="destructive">Important</Badge>
                            )}
                            {!comm.is_read && <Badge>Unread</Badge>}
                          </div>
                          {comm.subject && (
                            <h3 className="mt-2 text-lg font-semibold">
                              {comm.subject}
                            </h3>
                          )}
                        </div>
                        <p className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(comm.created_at)}
                        </p>
                      </div>
                      <p className="mb-2 text-foreground">{comm.content}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {comm.created_by && <span>By: {comm.created_by}</span>}
                        {comm.property_id && <span>Property #{comm.property_id}</span>}
                        {comm.landlord_id && <span>Landlord #{comm.landlord_id}</span>}
                        {comm.applicant_id && (
                          <span>Applicant #{comm.applicant_id}</span>
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
  );
}
