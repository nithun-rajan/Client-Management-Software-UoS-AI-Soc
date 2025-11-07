import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

interface TransitionRequest {
  new_status: string;
  notes?: string;
  metadata?: Record<string, any>;
}

interface TransitionResponse {
  success: boolean;
  message: string;
  previous_status: string;
  new_status: string;
  domain: string;
  entity_id: string;
  side_effects_executed: string[];
  transitions_available: string[];
}

interface AvailableTransitions {
  domain: string;
  entity_id: string;
  current_status: string;
  available_transitions: string[];
  side_effects: Record<string, string[]>;
}

export function useAvailableTransitions(domain: string, entityId: string) {
  return useQuery({
    queryKey: ["workflows", domain, entityId, "transitions"],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/v1/workflows/${domain}/${entityId}/transitions`
      );
      return data as AvailableTransitions;
    },
    enabled: !!domain && !!entityId,
  });
}

export function useTransitionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      domain,
      entityId,
      ...transitionData
    }: TransitionRequest & { domain: string; entityId: string }) => {
      const { data } = await api.post(
        `/api/v1/workflows/${domain}/${entityId}/transitions`,
        transitionData
      );
      return data as TransitionResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.domain, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.entityId],
      });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      
      toast.success(data.message || "Status updated successfully");
      
      // Show side effects if any
      if (data.side_effects_executed.length > 0) {
        toast.info(
          `Automated actions: ${data.side_effects_executed.join(", ")}`
        );
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to update status"
      );
    },
  });
}

