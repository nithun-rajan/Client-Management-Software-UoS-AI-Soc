import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Landlord } from "@/types";
import { toast } from "sonner";

export function useLandlords() {
  return useQuery({
    queryKey: ["landlords"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/landlords");
      return data as Landlord[];
    },
  });
}

export function useLandlord(id: string) {
  return useQuery({
    queryKey: ["landlords", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/landlords/${id}`);
      return data as Landlord;
    },
    enabled: !!id,
  });
}

export function useCreateLandlord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landlordData: Partial<Landlord>) => {
      const { data } = await api.post("/api/v1/landlords", landlordData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      toast.success("Landlord created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create landlord");
    },
  });
}

export function useUpdateLandlord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...landlordData }: Partial<Landlord> & { id: string }) => {
      const { data } = await api.put(`/api/v1/landlords/${id}`, landlordData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      toast.success("Landlord updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update landlord");
    },
  });
}

export function useDeleteLandlord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/landlords/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      toast.success("Landlord deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete landlord");
    },
  });
}
