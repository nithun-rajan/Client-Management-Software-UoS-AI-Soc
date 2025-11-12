import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Offer } from "@/types";
import { toast } from "sonner";

export function useOffers(filters?: { property_id?: string; applicant_id?: string; status?: string }) {
  return useQuery({
    queryKey: ["offers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.property_id) params.append("property_id", filters.property_id);
      if (filters?.applicant_id) params.append("applicant_id", filters.applicant_id);
      if (filters?.status) params.append("status", filters.status);
      
      const { data } = await api.get(`/api/v1/offers/?${params.toString()}`);
      // API returns {offers: [...], total: ...}
      return (data.offers || data) as Offer[];
    },
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ["offers", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/offers/${id}`);
      return data as Offer;
    },
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerData: Partial<Offer>) => {
      const { data } = await api.post("/api/v1/offers/", offerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create offer");
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...offerData }: Partial<Offer> & { id: string }) => {
      const { data } = await api.put(`/api/v1/offers/${id}`, offerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update offer");
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/v1/offers/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer accepted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to accept offer");
    },
  });
}

export function useRejectOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(`/api/v1/offers/${id}/reject`, null, {
        params: { reason },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer rejected successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to reject offer");
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer withdrawn successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to withdraw offer");
    },
  });
}

export function useMyOffers(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["offers", "my", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      
      const { data } = await api.get(`/api/v1/offers/my-offers?${params.toString()}`);
      return (data.offers || data) as Offer[];
    },
  });
}