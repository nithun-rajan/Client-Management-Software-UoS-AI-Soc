import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Property } from "@/types";
import { toast } from "sonner";

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/properties");
      return data as Property[];
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/properties/${id}`);
      return data as Property;
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyData: Partial<Property>) => {
      const { data } = await api.post("/api/v1/properties", propertyData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "team"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "available"] });
      toast.success("Property created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create property");
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...propertyData }: Partial<Property> & { id: string }) => {
      const { data } = await api.put(`/api/v1/properties/${id}`, propertyData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "team"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "available"] });
      toast.success("Property updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update property");
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "team"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "available"] });
      toast.success("Property deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete property");
    },
  });
}

export function useMyProperties() {
  return useQuery({
    queryKey: ["properties", "my-properties"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/properties/my-properties");
      return data as Property[];
    },
  });
}

export function useTeamProperties(teamAgentIds: string[]) {
  return useQuery({
    queryKey: ["properties", "team", teamAgentIds],
    queryFn: async () => {
      // Fetch properties for each team agent and combine
      const promises = teamAgentIds.map(agentId =>
        api.get(`/api/v1/properties?managed_by=${agentId}`)
      );
      const results = await Promise.all(promises);
      // Combine and deduplicate properties
      const allProperties = results.flatMap(result => result.data as Property[]);
      const uniqueProperties = Array.from(
        new Map(allProperties.map(p => [p.id, p])).values()
      );
      return uniqueProperties;
    },
    enabled: teamAgentIds.length > 0,
  });
}

export function useAvailableProperties() {
  return useQuery({
    queryKey: ["properties", "available"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/search/properties?status=available");
      return data as Property[];
    },
  });
}