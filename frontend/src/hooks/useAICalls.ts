import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AICall, AICallSummary, AICallCreate } from "@/types";
import { toast } from "sonner";

/**
 * Create a new AI call to an applicant
 */
export function useCreateAICall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callData: AICallCreate) => {
      const { data } = await api.post("/api/v1/ai-calls/", callData);
      return data as AICall;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-calls"] });
      queryClient.invalidateQueries({ queryKey: ["ai-calls", "applicant", data.applicant_id] });
      toast.success("AI call initiated successfully! Calling now...");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to initiate AI call");
    },
  });
}

/**
 * Get a specific AI call by ID
 * Supports polling for in-progress calls
 */
export function useAICall(callId: string, options?: { pollingInterval?: number }) {
  return useQuery({
    queryKey: ["ai-calls", callId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/ai-calls/${callId}`);
      return data as AICall;
    },
    enabled: !!callId,
    // Poll every 5 seconds if call is in progress
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "in_progress") {
        return options?.pollingInterval || 5000; // 5 seconds
      }
      return false; // Stop polling when completed/failed
    },
  });
}

/**
 * Get all AI calls for a specific applicant
 */
export function useApplicantAICalls(applicantId: string) {
  return useQuery({
    queryKey: ["ai-calls", "applicant", applicantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/ai-calls/applicant/${applicantId}`);
      return data as AICallSummary[];
    },
    enabled: !!applicantId,
    // Auto-refresh every 10 seconds if there are any in-progress calls
    refetchInterval: (query) => {
      const calls = query.state.data;
      if (calls && calls.some((call: AICallSummary) => call.status === "in_progress")) {
        return 10000; // 10 seconds
      }
      return false; // Stop polling when no in-progress calls
    },
  });
}

/**
 * Apply extracted data from a call to the applicant's profile
 */
export function useApplyCallData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const { data } = await api.post(`/api/v1/ai-calls/${callId}/apply-data`);
      return data;
    },
    onSuccess: (data, callId) => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      queryClient.invalidateQueries({ queryKey: ["ai-calls", callId] });
      toast.success(
        `Successfully applied ${data.fields_updated?.length || 0} fields to applicant profile`
      );
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to apply call data");
    },
  });
}

/**
 * Delete an AI call record
 */
export function useDeleteAICall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      await api.delete(`/api/v1/ai-calls/${callId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-calls"] });
      toast.success("AI call deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete AI call");
    },
  });
}

/**
 * Sync call status and fetch summary from Ultravox
 */
export function useSyncAICall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const { data } = await api.post(`/api/v1/ai-calls/${callId}/sync`);
      return data as AICall;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-calls", data.id] });
      queryClient.invalidateQueries({ queryKey: ["ai-calls", "applicant", data.applicant_id] });
      toast.success("Call summary updated!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to sync call status");
    },
  });
}

/**
 * Auto-sync call status for in-progress calls (silent, no toast)
 */
export function useAutoSyncCall(callId: string, status: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ai-calls", "auto-sync", callId],
    queryFn: async () => {
      const { data } = await api.post(`/api/v1/ai-calls/${callId}/sync`);
      
      // Invalidate queries after successful sync
      queryClient.invalidateQueries({ queryKey: ["ai-calls", callId] });
      queryClient.invalidateQueries({ queryKey: ["ai-calls", "applicant"] });
      
      return data as AICall;
    },
    enabled: enabled && status === "in_progress",
    refetchInterval: 15000, // Check every 15 seconds
    retry: 1,
  });

  return query;
}

