import { useState } from 'react';
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
    rent: number;
    bedrooms: number;
  };
  applicant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
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

