import { useState } from 'react';
import api from '@/lib/api';

export interface MatchHistory {
  id: string;
  sent_at: string;
  send_method: string;
  match_score: number;
  property: {
    id: string;
    address: string;
    rent: number;
    bedrooms: number;
  };
  viewed: boolean;
  responded: boolean;
  response_type: string | null;
  viewing_booked: boolean;
}

export const useMatchSending = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMatches = async (
    applicantId: string,
    propertyIds: string[],
    sendMethod: 'email' | 'sms' | 'whatsapp' = 'email',
    customMessage?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/v1/ai/match-send', {
        applicant_id: applicantId,
        property_ids: propertyIds,
        send_method: sendMethod,
        custom_message: customMessage
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send matches');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMatchHistory = async (applicantId: string, limit: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/ai/match-history/${applicantId}?limit=${limit}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch match history');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recordResponse = async (
    matchId: string,
    responseType: 'interested' | 'not_interested' | 'booked_viewing',
    notes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/api/v1/ai/match-response/${matchId}`, null, {
        params: { response_type: responseType, notes }
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record response');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMatches,
    getMatchHistory,
    recordResponse,
    loading,
    error
  };
};

