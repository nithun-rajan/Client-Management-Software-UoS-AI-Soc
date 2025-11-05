import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Applicant } from "@/types";
import { toast } from "sonner";

export function useApplicants() {
  return useQuery({
    queryKey: ["applicants"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/applicants");
      return data as Applicant[];
    },
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
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "detail" in error.response.data
          ? String(error.response.data.detail)
          : "Failed to create applicant";
      toast.error(message);
    },
  });
}

export function useUpdateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...applicantData
    }: Partial<Applicant> & { id: number }) => {
      const { data } = await api.put(`/api/v1/applicants/${id}`, applicantData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "detail" in error.response.data
          ? String(error.response.data.detail)
          : "Failed to update applicant";
      toast.error(message);
    },
  });
}

export function useDeleteApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/applicants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      toast.success("Applicant deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "detail" in error.response.data
          ? String(error.response.data.detail)
          : "Failed to delete applicant";
      toast.error(message);
    },
  });
}
