import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Communication {
  id: number;
  type: string;
  subject: string | null;
  content: string;
  direction: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  is_important: boolean;
  is_read: boolean;
  property_id: number | null;
  landlord_id: number | null;
  applicant_id: number | null;
}

interface CommunicationStats {
  total: number;
  by_type: Record<string, number>;
  by_entity: {
    properties: number;
    landlords: number;
    applicants: number;
  };
  unread: number;
}

interface CommunicationFilters {
  type?: string;
  entity_type?: string;
  entity_id?: number;
  is_important?: boolean;
  is_read?: boolean;
}

export function useCommunications() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunications = async (filters?: CommunicationFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.entity_type) params.append('entity_type', filters.entity_type);
      if (filters?.entity_id) params.append('entity_id', filters.entity_id.toString());
      if (filters?.is_important !== undefined) params.append('is_important', filters.is_important.toString());
      if (filters?.is_read !== undefined) params.append('is_read', filters.is_read.toString());
      
      const response = await axios.get(`${API_URL}/api/v1/messaging?${params.toString()}`);
      setCommunications(response.data);
    } catch (err: any) {
      console.error('Failed to fetch communications:', err);
      setError(err.message || 'Failed to fetch communications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/messaging/stats/summary`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const createCommunication = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/v1/messaging`, data);
      await fetchCommunications();
      await fetchStats();
      return response.data;
    } catch (err: any) {
      console.error('Failed to create communication:', err);
      setError(err.response?.data?.detail || 'Failed to create communication');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCommunication = async (id: number, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/api/v1/messaging/${id}`, data);
      await fetchCommunications();
      await fetchStats();
      return response.data;
    } catch (err: any) {
      console.error('Failed to update communication:', err);
      setError(err.message || 'Failed to update communication');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCommunication = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/api/v1/messaging/${id}`);
      await fetchCommunications();
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to delete communication:', err);
      setError(err.message || 'Failed to delete communication');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    return updateCommunication(id, { is_read: true });
  };

  useEffect(() => {
    fetchCommunications();
    fetchStats();
  }, []);

  return {
    communications,
    stats,
    loading,
    error,
    fetchCommunications,
    fetchStats,
    createCommunication,
    updateCommunication,
    deleteCommunication,
    markAsRead,
  };
}

