import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Vendor } from "@/types";
import { toast } from "sonner";

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/vendors");
      return data as Vendor[];
    },
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/vendors/${id}`);
      return data as Vendor;
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorData: Partial<Vendor>) => {
      const { data } = await api.post("/api/v1/vendors", vendorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create vendor");
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...vendorData }: Partial<Vendor> & { id: string }) => {
      const { data } = await api.put(`/api/v1/vendors/${id}`, vendorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update vendor");
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete vendor");
    },
  });
}

export function useVerifyVendorAML() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/v1/vendors/${id}/verify-aml`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor AML verified successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to verify vendor AML");
    },
  });
}

