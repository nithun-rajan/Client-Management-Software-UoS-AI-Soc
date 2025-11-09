import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Applicant } from "@/types";
import { toast } from "sonner";

export function useApplicants(assignedAgentId?: string) {
  return useQuery({
    queryKey: ["applicants", assignedAgentId],
    queryFn: async () => {
      const params = assignedAgentId ? `?assigned_agent_id=${assignedAgentId}` : "";
      const { data } = await api.get(`/api/v1/applicants${params}`);
      return data as Applicant[];
    },
  });
}

export function useMyApplicants() {
  return useQuery({
    queryKey: ["applicants", "my-applicants"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/applicants/my-applicants");
      return data as Applicant[];
    },
    // Only fetch if user is authenticated (has token)
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useApplicant(id: string) {
  return useQuery({
    queryKey: ["applicants", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/applicants/${id}`);
      return data as Applicant;
    },
    enabled: !!id,
  });
}

export function useCreateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicantData: Partial<Applicant>) => {
      const { data } = await api.post("/api/v1/applicants", applicantData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create applicant");
    },
  });
}

export function useUpdateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...applicantData
    }: Partial<Applicant> & { id: string }) => {
      const { data } = await api.put(`/api/v1/applicants/${id}`, applicantData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update applicant");
    },
  });
}

export function useDeleteApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/applicants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete applicant");
    },
  });
}
