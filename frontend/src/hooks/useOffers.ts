import { useState } from 'react';
import api from '@/lib/api';

export interface Offer {
  id: string;
  property_id: string;
  applicant_id: string;
  offered_rent: number;
  proposed_start_date?: string;
  proposed_term_months?: number;
  status: string;
  counter_offer_rent?: number;
  negotiation_notes?: string;
  special_conditions?: string;
  applicant_notes?: string;
  agent_notes?: string;
  holding_deposit_paid: boolean;
  holding_deposit_amount?: number;
  submitted_at: string;
  responded_at?: string;
  accepted_at?: string;
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

export const useOffers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOffer = async (offerData: {
    property_id: string;
    applicant_id: string;
    offered_rent: number;
    proposed_start_date?: string;
    proposed_term_months?: number;
    special_conditions?: string;
    applicant_notes?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/offers/', offerData);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listOffers = async (filters?: {
    property_id?: string;
    applicant_id?: string;
    status?: string;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/offers/', { params: filters });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch offers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOffer = async (offerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/offers/${offerId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOffer = async (offerId: string, updates: {
    status?: string;
    counter_offer_rent?: number;
    negotiation_notes?: string;
    agent_notes?: string;
    holding_deposit_paid?: boolean;
    holding_deposit_amount?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/offers/${offerId}`, updates);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (offerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/offers/${offerId}/accept`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectOffer = async (offerId: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/offers/${offerId}/reject`, null, {
        params: { reason }
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const withdrawOffer = async (offerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/offers/${offerId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to withdraw offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOffer,
    listOffers,
    getOffer,
    updateOffer,
    acceptOffer,
    rejectOffer,
    withdrawOffer,
    loading,
    error
  };
};

