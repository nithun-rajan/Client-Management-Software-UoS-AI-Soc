import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { MaintenanceIssue } from "@/types";
import { toast } from "sonner";

export function useMaintenance(filters?: {
  status?: string;
  priority?: string;
  issue_type?: string;
  property_id?: string;
  tenancy_id?: string;
  is_emergency?: boolean;
  is_complaint?: boolean;
}) {
  return useQuery({
    queryKey: ["maintenance", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.issue_type) params.append("issue_type", filters.issue_type);
      if (filters?.property_id) params.append("property_id", filters.property_id);
      if (filters?.tenancy_id) params.append("tenancy_id", filters.tenancy_id);
      if (filters?.is_emergency !== undefined) params.append("is_emergency", String(filters.is_emergency));
      if (filters?.is_complaint !== undefined) params.append("is_complaint", String(filters.is_complaint));

      const { data } = await api.get(`/api/v1/maintenance/?${params.toString()}`);
      return data as MaintenanceIssue[];
    },
  });
}

export function useMaintenanceIssue(id: string) {
  return useQuery({
    queryKey: ["maintenance", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/maintenance/${id}`);
      return data as MaintenanceIssue;
    },
    enabled: !!id,
  });
}

export function useMaintenanceByProperty(propertyId: string) {
  return useQuery({
    queryKey: ["maintenance", "property", propertyId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/maintenance/property/${propertyId}`);
      return data as MaintenanceIssue[];
    },
    enabled: !!propertyId,
  });
}

export function useEmergencyMaintenance() {
  return useQuery({
    queryKey: ["maintenance", "emergency"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/maintenance/emergency/active");
      return data as MaintenanceIssue[];
    },
  });
}

export function useOverdueMaintenance() {
  return useQuery({
    queryKey: ["maintenance", "overdue"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/maintenance/overdue/list");
      return data as MaintenanceIssue[];
    },
  });
}

export function useMaintenanceRequiresAttention() {
  return useQuery({
    queryKey: ["maintenance", "requires-attention"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/maintenance/requires-attention/list");
      return data as MaintenanceIssue[];
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceData: Partial<MaintenanceIssue>) => {
      const { data } = await api.post("/api/v1/maintenance/", maintenanceData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Maintenance issue created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create maintenance issue");
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...maintenanceData }: Partial<MaintenanceIssue> & { id: string }) => {
      const { data } = await api.patch(`/api/v1/maintenance/${id}`, maintenanceData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance", variables.id] });
      toast.success("Maintenance issue updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update maintenance issue");
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Maintenance issue deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete maintenance issue");
    },
  });
}

