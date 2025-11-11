// frontend/src/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Notification {
  id: string;  // Changed from number to string - backend uses UUID strings
  title: string;
  body?: string;
  type: string;
  priority: string;  // "high" | "medium" | "low"
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/v1/notifications").then(r => r.data),
    refetchInterval: 30_000, // every 30 sec
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.put("/api/v1/notifications/mark-all-read"),
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.delete("/api/v1/notifications"),
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      api.put(`/api/v1/notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}