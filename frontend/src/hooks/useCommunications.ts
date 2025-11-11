import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

export interface Communication {
  id: string;
  type: string;
  subject?: string;
  content: string;
  direction?: string;
  created_by?: string;
  is_important: boolean;
  is_read: boolean;
  property_id?: string;
  landlord_id?: string;
  applicant_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface CommunicationCreate {
  type: string;
  subject?: string;
  content: string;
  direction?: string;
  created_by?: string;
  is_important?: boolean;
  property_id?: string;
  landlord_id?: string;
  applicant_id?: string;
}

export interface CommunicationStats {
  total: number;
  by_type: Record<string, number>;
  by_entity: {
    properties: number;
    landlords: number;
    applicants: number;
  };
  important: number;
  unread: number;
}

export function useCommunications() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunications = async (filters?: {
    type?: string;
    entity_type?: string;
    entity_id?: string;
    is_important?: boolean;
    is_read?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.entity_type) params.append("entity_type", filters.entity_type);
      if (filters?.entity_id) params.append("entity_id", filters.entity_id);
      if (filters?.is_important !== undefined)
        params.append("is_important", filters.is_important.toString());
      if (filters?.is_read !== undefined)
        params.append("is_read", filters.is_read.toString());

      const response = await axios.get(`${API_URL}/messaging?${params.toString()}`);
      setCommunications(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch communications");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/messaging/stats/summary`);
      setStats(response.data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const createCommunication = async (data: CommunicationCreate) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/messaging`, data);
      await fetchCommunications();
      await fetchStats();
    } catch (err: any) {
      // Handle validation errors properly
      let errorMsg = "Failed to create communication";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          // Pydantic validation errors
          const errorMessages = detail.map((e: any) => {
            const field = e.loc ? e.loc.join('.') : 'field';
            return `${field}: ${e.msg || 'Invalid value'}`;
          });
          errorMsg = errorMessages.join('\n');
        } else if (typeof detail === 'object') {
          errorMsg = detail.msg || detail.message || JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${API_URL}/messaging/${id}`, { is_read: true });
      await fetchCommunications();
      await fetchStats();
    } catch (err: any) {
      console.error("Failed to mark as read:", err);
    }
  };

  const deleteCommunication = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/messaging/${id}`);
      await fetchCommunications();
      await fetchStats();
    } catch (err: any) {
      console.error("Failed to delete communication:", err);
    }
  };

  const getPropertyCommunications = async (propertyId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/messaging/property/${propertyId}`);
      setCommunications(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLandlordCommunications = async (landlordId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/messaging/landlord/${landlordId}`);
      setCommunications(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getApplicantCommunications = async (applicantId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/messaging/applicant/${applicantId}`);
      setCommunications(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    createCommunication,
    markAsRead,
    deleteCommunication,
    getPropertyCommunications,
    getLandlordCommunications,
    getApplicantCommunications,
  };
}
