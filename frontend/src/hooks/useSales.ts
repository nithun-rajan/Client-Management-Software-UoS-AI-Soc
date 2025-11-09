import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SalesProgression, SalesOffer } from "@/types";
import { toast } from "sonner";

// Sales Progression Hooks
export function useSalesProgression(filters?: {
  property_id?: string;
  vendor_id?: string;
  buyer_id?: string;
  sales_status?: string;
  current_stage?: string;
}) {
  return useQuery({
    queryKey: ["sales-progression", filters],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/sales/progression", { params: filters });
      return data as SalesProgression[];
    },
  });
}

export function useSalesProgressionById(id: string) {
  return useQuery({
    queryKey: ["sales-progression", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/sales/progression/${id}`);
      return data as SalesProgression;
    },
    enabled: !!id,
  });
}

export function useSalesProgressionByProperty(propertyId: string) {
  return useQuery({
    queryKey: ["sales-progression", "property", propertyId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/sales/progression/property/${propertyId}`);
      return data as SalesProgression | null;
    },
    enabled: !!propertyId,
  });
}

export function useCreateSalesProgression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progressionData: Partial<SalesProgression>) => {
      const { data } = await api.post("/api/v1/sales/progression", progressionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-progression"] });
      toast.success("Sales progression created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create sales progression");
    },
  });
}

export function useUpdateSalesProgression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...progressionData }: Partial<SalesProgression> & { id: string }) => {
      const { data } = await api.put(`/api/v1/sales/progression/${id}`, progressionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-progression"] });
      toast.success("Sales progression updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update sales progression");
    },
  });
}

export function useUpdateSalesStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { data } = await api.put(`/api/v1/sales/progression/${id}/stage`, null, {
        params: { stage },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-progression"] });
      toast.success("Sales stage updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update sales stage");
    },
  });
}

export function useDeleteSalesProgression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/sales/progression/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-progression"] });
      toast.success("Sales progression deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete sales progression");
    },
  });
}

// Sales Offers Hooks
export function useSalesOffers(filters?: {
  property_id?: string;
  buyer_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["sales-offers", filters],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/sales/offers", { params: filters });
      return data as SalesOffer[];
    },
  });
}

export function useSalesOfferById(id: string) {
  return useQuery({
    queryKey: ["sales-offers", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/sales/offers/${id}`);
      return data as SalesOffer;
    },
    enabled: !!id,
  });
}

export function useSalesOffersByProperty(propertyId: string) {
  return useQuery({
    queryKey: ["sales-offers", "property", propertyId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/sales/offers/property/${propertyId}`);
      return data as SalesOffer[];
    },
    enabled: !!propertyId,
  });
}

export function useCreateSalesOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerData: Partial<SalesOffer>) => {
      const { data } = await api.post("/api/v1/sales/offers", offerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      toast.success("Offer created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create offer");
    },
  });
}

export function useUpdateSalesOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...offerData }: Partial<SalesOffer> & { id: string }) => {
      const { data } = await api.put(`/api/v1/sales/offers/${id}`, offerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      toast.success("Offer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update offer");
    },
  });
}

export function useUpdateSalesOfferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.put(`/api/v1/sales/offers/${id}/status`, null, {
        params: { status },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      toast.success("Offer status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update offer status");
    },
  });
}

export function useDeleteSalesOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/sales/offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      toast.success("Offer deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete offer");
    },
  });
}

