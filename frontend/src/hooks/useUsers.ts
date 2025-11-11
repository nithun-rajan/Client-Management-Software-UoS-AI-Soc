import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  team?: string | null;
}

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      try {
        const params = role ? `?role=${role}` : "";
        const { data } = await api.get(`/api/v1/auth/users${params}`);
        return (data || []) as User[];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [] as User[];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

