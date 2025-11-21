import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task } from "@/types";
import { toast } from "sonner";

export function useTasks(filters?: { status?: string; priority?: string }) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      
      const { data } = await api.get(`/api/v1/tasks/?${params.toString()}`);
      return data as Task[];
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/tasks/${id}`);
      return data as Task;
    },
    enabled: !!id,
  });
}

export function useTasksByStatus(status: string) {
  return useQuery({
    queryKey: ["tasks", "status", status],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/tasks/status/${status}`);
      return data as Task[];
    },
  });
}

export function useTasksByPriority(priority: string) {
  return useQuery({
    queryKey: ["tasks", "priority", priority],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/tasks/priority/${priority}`);
      return data as Task[];
    },
  });
}

export function useTasksByUser(userId: string) {
  return useQuery({
    queryKey: ["tasks", "assigned", userId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/tasks/assigned/${userId}`);
      return data as Task[];
    },
    enabled: !!userId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data } = await api.post("/api/v1/tasks/", taskData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: string }) => {
      const { data } = await api.put(`/api/v1/tasks/${id}`, taskData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete task");
    },
  });
}

export function useMyTasks(filters?: { status?: string; priority?: string }) {
  return useQuery({
    queryKey: ["tasks", "my", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      
      const { data } = await api.get(`/api/v1/tasks/my-tasks?${params.toString()}`);
      return data as Task[];
    },
  });
}

