import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Event {
  id: number;
  event: string;
  entity_type: string;
  entity_id: number;
  timestamp: string;
  user: string;
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/events/log");
      return data as Event[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
