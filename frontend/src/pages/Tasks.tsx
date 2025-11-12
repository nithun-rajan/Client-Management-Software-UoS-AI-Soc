import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useLandlords } from "@/hooks/useLandlords";
import { useVendors } from "@/hooks/useVendors";
import { useApplicants } from "@/hooks/useApplicants";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Task } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Tasks() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const filters: { status?: string; priority?: string } = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (priorityFilter !== "all") filters.priority = priorityFilter;

  const { data: tasks, isLoading } = useTasks(filters);
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: landlords, isLoading: landlordsLoading } = useLandlords();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: applicants, isLoading: applicantsLoading } = useApplicants();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();


  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    due_date: "",
    assigned_to: "",
  });
  
  // State for assigned user search
  const [assignedToInput, setAssignedToInput] = useState("");
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [assignedToInputEdit, setAssignedToInputEdit] = useState("");
  const [showUserSuggestionsEdit, setShowUserSuggestionsEdit] = useState(false);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
      assigned_to: "",
    });
    setAssignedToInput("");
    setShowUserSuggestions(false);
  };
  
  // Combined list of assignable people (users + agents + landlords + vendors + applicants/tenants/buyers)
  const getAllAssignablePeople = () => {
    const people: Array<{ id: string; name: string; type: "user" | "agent" | "landlord" | "vendor" | "applicant" }> = [];
    
    // Add users (including agents)
    users?.forEach((user) => {
      // Check if user is an agent
      const isAgent = user.role === "agent";
      people.push({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        type: isAgent ? "agent" : "user"
      });
    });
    
    // Add landlords
    landlords?.forEach((landlord) => {
      people.push({
        id: landlord.id,
        name: landlord.full_name,
        type: "landlord"
      });
    });
    
    // Add vendors
    vendors?.forEach((vendor) => {
      people.push({
        id: vendor.id,
        name: `${vendor.first_name} ${vendor.last_name}`,
        type: "vendor"
      });
    });
    
    // Add applicants (tenants/buyers)
    applicants?.forEach((applicant) => {
      people.push({
        id: applicant.id,
        name: `${applicant.first_name} ${applicant.last_name}`,
        type: "applicant"
      });
    });
    
    return people;
  };
  
  // Filter assignable people based on input (for create dialog)
  const filteredPeople = getAllAssignablePeople().filter((person) => {
    if (!assignedToInput) return false;
    const searchTerm = assignedToInput.toLowerCase();
    return person.name.toLowerCase().includes(searchTerm);
  });
  
  // Filter assignable people based on input (for edit dialog)
  const filteredPeopleEdit = getAllAssignablePeople().filter((person) => {
    if (!assignedToInputEdit) return false;
    const searchTerm = assignedToInputEdit.toLowerCase();
    return person.name.toLowerCase().includes(searchTerm);
  });

  const handleCreate = () => {
    resetForm();
    setSelectedTask(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    const assignedName = task.assigned_to || "";
    // Convert ISO date to YYYY-MM-DD format for date input
    let dueDate = "";
    if (task.due_date) {
      try {
        const date = new Date(task.due_date);
        if (!isNaN(date.getTime())) {
          dueDate = date.toISOString().split("T")[0];
        }
      } catch (error) {
        console.error("Error converting date:", error);
      }
    }
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: dueDate,
      assigned_to: assignedName,
    });
    setAssignedToInputEdit(assignedName);
    setShowUserSuggestionsEdit(false);
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate assigned person exists if provided (check both users and landlords)
    if (formData.assigned_to) {
      const allPeople = getAllAssignablePeople();
      const personExists = allPeople.some(
        (person) => person.name === formData.assigned_to
      );
      if (!personExists) {
        toast.error(`"${formData.assigned_to}" not found in database. Please enter a valid user, landlord, vendor, or applicant name.`);
        return;
      }
    }

    const taskPayload: Partial<Task> = {
      ...formData,
      // Convert YYYY-MM-DD to ISO string for API
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      assigned_to: formData.assigned_to || undefined,
    };

    if (selectedTask) {
      await updateTask.mutateAsync({ id: selectedTask.id, ...taskPayload });
      setEditDialogOpen(false);
    } else {
      await createTask.mutateAsync(taskPayload);
      setCreateDialogOpen(false);
    }
    resetForm();
  };

  const handleDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask.mutateAsync(taskToDelete);
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  // Helper function to find person by name and get their route
  const getPersonRoute = (name: string): string | null => {
    const allPeople = getAllAssignablePeople();
    const person = allPeople.find((p) => p.name === name);
    if (!person) return null;
    
    switch (person.type) {
      case "landlord":
        return `/landlords/${person.id}`;
      case "vendor":
        return `/vendors/${person.id}`;
      case "applicant":
        return `/applicants/${person.id}`;
      case "user":
      case "agent":
        // Users and agents don't have detail pages, return null
        return null;
      default:
        return null;
    }
  };

  const handleAssignedToClick = (name: string) => {
    const route = getPersonRoute(name);
    if (route) {
      navigate(route);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "cancelled":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  const filteredTasks = tasks?.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div>
        <Header title="Tasks" />
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Tasks" />
      <div className="p-6 space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first task to get started"
            }
            action={
              !searchQuery && statusFilter === "all" && priorityFilter === "all" ? (
                <Button onClick={handleCreate}>Create Task</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {task.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(task.status)}
                    >
                      {task.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Due: {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "No due date"}
                      </span>
                    </div>
                  )}
                  {task.assigned_to && (
                    <div className="text-sm text-muted-foreground">
                      Assigned to:{" "}
                      {getPersonRoute(task.assigned_to) ? (
                        <button
                          onClick={() => handleAssignedToClick(task.assigned_to!)}
                          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
                        >
                          {task.assigned_to}
                        </button>
                      ) : (
                        <span>{task.assigned_to}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to track your work
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter task description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Task["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Task["priority"]) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value || undefined })
                  }
                />
              </div>
              <div className="relative">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Input
                  id="assigned_to"
                  type="text"
                  value={assignedToInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssignedToInput(value);
                    setFormData({ ...formData, assigned_to: value });
                    setShowUserSuggestions(value.length > 0);
                  }}
                  onFocus={() => {
                    if (assignedToInput.length > 0) {
                      setShowUserSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click on suggestion
                    setTimeout(() => setShowUserSuggestions(false), 200);
                  }}
                  placeholder="Type full name"
                />
                {showUserSuggestions && filteredPeople.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                    {filteredPeople.map((person) => (
                      <div
                        key={`${person.type}-${person.id}`}
                        className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAssignedToInput(person.name);
                          setFormData({ ...formData, assigned_to: person.name });
                          setShowUserSuggestions(false);
                        }}
                      >
                        <span>{person.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {person.type === "applicant" ? "tenant/buyer" : person.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTask.isPending}
              >
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Task["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Task["priority"]) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={formData.due_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value || undefined })
                  }
                />
              </div>
              <div className="relative">
                <Label htmlFor="edit-assigned_to">Assigned To</Label>
                <Input
                  id="edit-assigned_to"
                  type="text"
                  value={assignedToInputEdit}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssignedToInputEdit(value);
                    setFormData({ ...formData, assigned_to: value });
                    setShowUserSuggestionsEdit(value.length > 0);
                  }}
                  onFocus={() => {
                    if (assignedToInputEdit.length > 0) {
                      setShowUserSuggestionsEdit(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click on suggestion
                    setTimeout(() => setShowUserSuggestionsEdit(false), 200);
                  }}
                  placeholder="Type full name"
                />
                {showUserSuggestionsEdit && filteredPeopleEdit.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                    {filteredPeopleEdit.map((person) => (
                      <div
                        key={`${person.type}-${person.id}`}
                        className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAssignedToInputEdit(person.name);
                          setFormData({ ...formData, assigned_to: person.name });
                          setShowUserSuggestionsEdit(false);
                        }}
                      >
                        <span>{person.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {person.type === "applicant" ? "tenant/buyer" : person.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTask.isPending}
              >
                {updateTask.isPending ? "Updating..." : "Update Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTaskToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

