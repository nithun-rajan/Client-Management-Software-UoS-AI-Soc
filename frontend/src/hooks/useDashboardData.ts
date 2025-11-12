import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Property } from "@/types";
import { Viewing } from "./useViewings";
import { Task } from "@/types";
import { Applicant } from "@/types";
import { Agent } from "./useAgents";
import { useAuth } from "./useAuth";

// Communication type - matching useCommunications
interface Communication {
  id: string;
  type: string;
  subject?: string;
  content: string;
  direction?: string;
  created_by?: string;
  is_important: boolean;
  is_read: boolean;
  property_id?: string;
  landlord_id?: string;
  applicant_id?: string;
  created_at: string;
  updated_at?: string;
}

// Hook to fetch properties with filters
export function usePropertiesForDashboard() {
  return useQuery({
    queryKey: ["properties", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/properties");
      return data as Property[];
    },
  });
}

// Hook to fetch upcoming viewings (next 7 days)
export function useUpcomingViewings() {
  return useQuery({
    queryKey: ["viewings", "upcoming"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/viewings/");
      const viewings = (data.viewings || data) as any[];
      
      // Filter viewings for next 7 days
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      return viewings
        .filter((viewing) => {
          if (!viewing.scheduled_date) return false;
          const scheduledDate = new Date(viewing.scheduled_date);
          return scheduledDate >= now && scheduledDate <= nextWeek && viewing.status === "scheduled";
        })
        .sort((a, b) => 
          new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        )
        .slice(0, 10) // Limit to 10 most recent
        .map((v) => ({
          id: v.id,
          property_id: v.property_id,
          applicant_id: v.applicant_id,
          scheduled_date: v.scheduled_date,
          status: v.status,
          assigned_agent: v.assigned_agent,
          property: v.property || { address: "Unknown" },
          applicant: v.applicant || { name: "Unknown" },
        })) as Viewing[];
    },
  });
}

// Hook to fetch tasks due today
export function useTasksDueToday() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["tasks", "due-today", user?.id],
    queryFn: async () => {
      // If user is available, use assigned endpoint, otherwise get all tasks
      const endpoint = user?.id 
        ? `/api/v1/tasks/assigned/${user.id}` 
        : "/api/v1/tasks/";
      const { data } = await api.get(endpoint);
      const tasks = Array.isArray(data) ? data : [];
      
      // Filter tasks due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return tasks
        .filter((task: Task) => {
          if (!task.due_date) return false;
          if (task.status === "completed" || task.status === "cancelled") return false;
          
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          // Filter by due date (today)
          return dueDate >= today && dueDate < tomorrow;
        })
        .sort((a: Task, b: Task) => {
          // Sort by priority: urgent > high > medium > low
          const priorityOrder: Record<string, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }) as Task[];
    },
    enabled: true, // Enable even if no user (will fetch all tasks)
  });
}

// Hook to fetch applicants by status for funnel chart
export function useApplicantsForFunnel() {
  return useQuery({
    queryKey: ["applicants", "funnel"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/applicants");
      return data as Applicant[];
    },
  });
}

// Hook to fetch unread communications/enquiries
export function useUnreadEnquiries() {
  return useQuery({
    queryKey: ["communications", "unread"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/v1/messaging?is_read=false");
        const communications = Array.isArray(data) ? data : (data.communications || []);
        return communications
          .filter((comm: any) => !comm.is_read)
          .sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          .slice(0, 5) as Communication[]; // Limit to 5 most recent
      } catch (error) {
        // If endpoint fails, return empty array
        console.error("Error fetching unread enquiries:", error);
        return [] as Communication[];
      }
    },
  });
}

// Hook to fetch agents for leaderboard
export function useAgentsForLeaderboard() {
  return useQuery({
    queryKey: ["agents", "leaderboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/agents/");
      const agents = (data || []) as Agent[];
      
      // Sort by deals closed this month (using tenancies_count as proxy)
      return agents
        .sort((a, b) => (b.stats.tenancies_count || 0) - (a.stats.tenancies_count || 0))
        .slice(0, 5); // Top 5 agents
    },
  });
}

// Hook to fetch properties created in last 7 days
export function useNewPropertiesThisWeek() {
  return useQuery({
    queryKey: ["properties", "new-this-week"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/properties");
      const properties = data as Property[];
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return properties.filter((property) => {
        const createdDate = new Date(property.created_at);
        return createdDate >= weekAgo;
      });
    },
  });
}

