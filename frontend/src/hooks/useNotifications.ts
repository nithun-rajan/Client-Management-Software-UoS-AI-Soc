// frontend/src/hooks/useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Notification {
  id: number;
  title: string;
  body?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then(r => r.data),
    refetchInterval: 30_000, // every 30 sec
  });
}