import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AgentStats {
  properties_count: number;
  applicants_count: number;
  landlords_count: number;
  vendors_count: number;
  tasks_count: number;
  viewings_count: number;
  offers_count: number;
  tenancies_count: number;
  asking_price_achievement?: number;
  days_on_market_avg?: number;
  monthly_fees?: number;
  satisfaction_score?: number;
}

export interface Agent {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  organization_id?: string;
  branch_id?: string;
  stats: AgentStats;
  phone?: string;
  position?: string;
  team?: string;
  online_status: boolean;
}

export function useAgents(team?: string, search?: string) {
  return useQuery({
    queryKey: ["agents", team, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (team) params.append("team", team);
      if (search && search.trim()) params.append("search", search.trim());
      
      const url = params.toString() 
        ? `/api/v1/agents/?${params.toString()}`
        : `/api/v1/agents/`;
      
      const { data } = await api.get(url);
      return (data || []) as Agent[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/agents/${agentId}`);
      return data as Agent;
    },
    enabled: !!agentId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export interface ManagedEntity {
  id: string;
  name: string;
  property_count: number;
}

export interface AgentManagedEntities {
  vendors: ManagedEntity[];
  buyers: ManagedEntity[];
  landlords: ManagedEntity[];
  applicants: ManagedEntity[];
  properties: ManagedEntity[];
}

export function useAgentManagedEntities(agentId: string) {
  return useQuery({
    queryKey: ["agent", agentId, "managed"],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/agents/${agentId}/managed`);
      return data as AgentManagedEntities;
    },
    enabled: !!agentId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

