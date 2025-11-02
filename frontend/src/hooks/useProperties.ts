import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Property } from '@/types';
import { toast } from 'sonner';

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/properties');
      return data as Property[];
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
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
      const { data } = await api.post('/api/v1/properties', propertyData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create property');
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...propertyData }: Partial<Property> & { id: number }) => {
      const { data } = await api.put(`/api/v1/properties/${id}`, propertyData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update property');
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete property');
    },
  });
}
