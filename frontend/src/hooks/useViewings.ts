import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Viewing {
  id: string;
  property_id: string;
  applicant_id: string;
  scheduled_date: string;
  duration_minutes: string;
  status: string;
  assigned_agent?: string;
  agent_notes?: string;
  applicant_attended?: boolean;
  feedback_rating?: string;
  feedback_notes?: string;
  property?: {
    id: string;
    address: string;
    address_line1?: string;
    rent: number;
    bedrooms: number;
  };
  applicant?: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: string;
  };
}

// React Query hook for fetching viewings
export function useViewingsQuery(filters?: {
  property_id?: string;
  applicant_id?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['viewings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.property_id) params.append('property_id', filters.property_id);
      if (filters?.applicant_id) params.append('applicant_id', filters.applicant_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const { data } = await api.get(`/api/v1/viewings?${params.toString()}`);
      return (data?.viewings || data || []) as Viewing[];
    },
  });
}

export const useViewings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createViewing = async (viewingData: {
    property_id: string;
    applicant_id: string;
    scheduled_date: string;
    duration_minutes?: string;
    assigned_agent?: string;
    agent_notes?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/viewings/', viewingData);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create viewing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listViewings = async (filters?: {
    property_id?: string;
    applicant_id?: string;
    status?: string;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/viewings/', { params: filters });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch viewings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getViewing = async (viewingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/viewings/${viewingId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch viewing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateViewing = async (viewingId: string, updates: {
    scheduled_date?: string;
    status?: string;
    agent_notes?: string;
    applicant_attended?: boolean;
    feedback_rating?: string;
    feedback_notes?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/viewings/${viewingId}`, updates);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update viewing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelViewing = async (viewingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/viewings/${viewingId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel viewing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createViewing,
    listViewings,
    getViewing,
    updateViewing,
    cancelViewing,
    loading,
    error
  };
};

