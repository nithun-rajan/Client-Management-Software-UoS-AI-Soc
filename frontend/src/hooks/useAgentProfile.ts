import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AgentProfile {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  office?: string;
  qualifications?: string;
  avatarUrl?: string;
  kpis?: {
    askingPrice?: string;
    daysOnMarket?: string;
    monthlyFees?: string;
    satisfaction?: string;
  };
}

export function useAgentProfile() {
  return useQuery({
    queryKey: ["agent-profile"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/auth/me/profile");
      return data as AgentProfile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateAgentProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profile: Partial<AgentProfile>) => {
      const { data } = await api.put("/api/v1/auth/me/profile", profile);
      return data as AgentProfile;
    },
    onSuccess: () => {
      // Invalidate and refetch agent profile
      queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
      // Also invalidate user data to get updated profile
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      // Dispatch event for components that listen to localStorage changes
      window.dispatchEvent(new Event("agent-saved"));
    },
  });
}

