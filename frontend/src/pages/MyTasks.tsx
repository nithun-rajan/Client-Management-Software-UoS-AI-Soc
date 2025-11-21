import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Edit,
  Trash2,
  Calendar,
  Filter,
  Search,
  Clock,
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
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Task } from "@/types";
import { toast } from "sonner";
import { format, isToday, isPast, isFuture } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function MyTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dueTodayFilter, setDueTodayFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Get user's full name (trimmed to handle any whitespace issues)
  const userFullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "";

  // Fetch tasks assigned to current user by full name
  const { data: allTasks, isLoading, error } = useQuery({
    queryKey: ["tasks", "assigned-to", userFullName],
    queryFn: async () => {
      if (!userFullName) return [];
      try {
        const { data } = await api.get(`/api/v1/tasks/assigned-to/${encodeURIComponent(userFullName)}`);
        return (data || []) as Task[];
      } catch (err: any) {
        console.error("Error fetching my tasks:", err);
        // Fallback: fetch all tasks and filter client-side
        const { data: allTasksData } = await api.get(`/api/v1/tasks/`);
        const allTasksList = (allTasksData || []) as Task[];
        return allTasksList.filter((task) => {
          if (!task.assigned_to) return false;
          // Try exact match first
          if (task.assigned_to.trim() === userFullName) return true;
          // Try case-insensitive match
          if (task.assigned_to.trim().toLowerCase() === userFullName.toLowerCase()) return true;
          return false;
        });
      }
    },
    enabled: !!userFullName,
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Form state for editing
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    due_date: "",
  });

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
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
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTask) return;

    const taskPayload: Partial<Task> = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
    };

    await updateTask.mutateAsync({ id: selectedTask.id, ...taskPayload });
    setEditDialogOpen(false);
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];

    let filtered = [...allTasks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filter by "Tasks Due Today" (first filter)
    if (dueTodayFilter === "today") {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        return isToday(new Date(task.due_date));
      });
    } else if (dueTodayFilter === "not-today") {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return true;
        return !isToday(new Date(task.due_date));
      });
    }

    // Filter by urgency (priority)
    if (urgencyFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === urgencyFilter);
    }

    // Filter by deadline
    if (deadlineFilter === "overdue") {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return isPast(dueDate) && !isToday(dueDate) && task.status !== "completed";
      });
    } else if (deadlineFilter === "due-today") {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        return isToday(new Date(task.due_date));
      });
    } else if (deadlineFilter === "due-this-week") {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return dueDate >= today && dueDate <= weekFromNow;
      });
    } else if (deadlineFilter === "due-later") {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return true;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return dueDate > weekFromNow;
      });
    } else if (deadlineFilter === "no-deadline") {
      filtered = filtered.filter((task) => !task.due_date);
    }

    return filtered;
  }, [allTasks, searchQuery, dueTodayFilter, urgencyFilter, deadlineFilter]);

  if (isLoading) {
    return (
      <div>
        <Header title="My Tasks" />
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
      <Header title="My Tasks" />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Tasks Due Today Filter (First Filter) */}
            <Select value={dueTodayFilter} onValueChange={setDueTodayFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Due Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="today">Due Today</SelectItem>
                <SelectItem value="not-today">Not Due Today</SelectItem>
              </SelectContent>
            </Select>

            {/* Urgency Filter */}
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Deadline Filter */}
            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deadlines</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due-today">Due Today</SelectItem>
                <SelectItem value="due-this-week">Due This Week</SelectItem>
                <SelectItem value="due-later">Due Later</SelectItem>
                <SelectItem value="no-deadline">No Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === "development" && userFullName && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            Debug: Looking for tasks assigned to "{userFullName}" | Total tasks found: {allTasks?.length || 0}
          </div>
        )}

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              searchQuery || dueTodayFilter !== "all" || urgencyFilter !== "all" || deadlineFilter !== "all"
                ? "Try adjusting your filters"
                : allTasks && allTasks.length === 0
                ? `You don't have any tasks assigned to you. To generate tasks, run: python generate_my_tasks.py ${user?.email || "your-email@example.com"}`
                : "No tasks match your current filters"
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
                        Due: {format(new Date(task.due_date), "dd/MM/yyyy")}
                        {isToday(new Date(task.due_date)) && (
                          <span className="ml-2 text-orange-600 font-semibold">(Today)</span>
                        )}
                        {isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "completed" && (
                          <span className="ml-2 text-red-600 font-semibold">(Overdue)</span>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
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
