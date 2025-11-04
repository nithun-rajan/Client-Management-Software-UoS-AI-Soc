import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Applicant } from '@/types';
import { toast } from 'sonner';

export function useApplicants() {
  return useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/applicants/');  // Added /
      return data as Applicant[];
    },
  });
}

export function useApplicant(id: string) {
  return useQuery({
    queryKey: ['applicants', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/applicants/${id}/`);  // Added /
      return data as Applicant;
    },
    enabled: !!id,
  });
}

export function useCreateApplicant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicantData: Partial<Applicant>) => {
      const { data } = await api.post('/api/v1/applicants/', applicantData);  // Added /
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success('Applicant created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create applicant');
    },
  });
}

export function useUpdateApplicant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...applicantData }: Partial<Applicant> & { id: string }) => {  // Changed to string
      const { data } = await api.put(`/api/v1/applicants/${id}/`, applicantData);  // Added /
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success('Applicant updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update applicant');
    },
  });
}

export function useDeleteApplicant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {  // Changed to string
      await api.delete(`/api/v1/applicants/${id}/`);  // Added /
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success('Applicant deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete applicant');
    },
  });
}