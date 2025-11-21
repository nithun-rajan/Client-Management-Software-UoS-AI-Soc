import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface ViewingSlot {
  datetime: string;
  agent_id: string;
  agent_name: string;
  duration_minutes: number;
  property_id: string;
}

export interface AutoScheduleRequest {
  applicant_id: string;
  property_id: string;
  preferred_times?: Array<{ date: string; time: string }>;
}

export interface AutoScheduleResponse {
  success: boolean;
  viewing: any;
  slot_selected: ViewingSlot;
  auto_confirmed: boolean;
  error?: string;
}

export interface AgentAvailability {
  agent_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  recurrence_type: string;
  valid_from: string;
  valid_to?: string;
}

// Get available viewing slots for a property
export function useAvailableSlots(propertyId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["calendar", "available-slots", propertyId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/v1/calendar/properties/${propertyId}/available-slots`
      );
      return data as ViewingSlot[];
    },
    enabled: enabled && !!propertyId,
  });
}

// Auto-schedule a viewing
export function useAutoSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AutoScheduleRequest) => {
      const { data } = await api.post(
        "/api/v1/calendar/auto-schedule",
        request
      );
      return data as AutoScheduleResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Viewing scheduled successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to schedule viewing"
      );
    },
  });
}

// Set agent availability
export function useSetAgentAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availability: AgentAvailability) => {
      const { data } = await api.post(
        "/api/v1/calendar/agent-availability",
        availability
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Agent availability updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to update availability"
      );
    },
  });
}

