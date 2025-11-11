import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Event {
<<<<<<< HEAD
  id: number;
  event: string;
  entity_type: string;
  entity_id: number;
  timestamp: string;
  user: string;
=======
  id: string;
  event: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  user: string;
  description?: string;
  entity_name?: string;
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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
