import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from './use-toast';

export interface MatchedApplicant {
  applicant_id: string;
  score: number;
  applicant: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    desired_bedrooms: string;
    budget: string;
    move_in_date: string | null;
    status: string;
  };
  personalized_message: string;
  match_reasons: string[];
  already_sent: boolean;
  sent_date: string | null;
}

export interface ApplicantMatchingResponse {
  property: {
    id: string;
    address: string;
    city: string;
    bedrooms: number;
    rent: number;
    property_type: string;
  };
  matches: MatchedApplicant[];
  total_matches: number;
  generated_at: string;
}

export interface SendPropertyResponse {
  success: boolean;
  property: {
    id: string;
    address: string;
    rent: number;
  };
  sent_count: number;
  skipped_count: number;
  send_method: string;
  sent_at: string;
  sent_to: Array<{
    applicant_id: string;
    name: string;
    email: string;
    score: number;
    message_preview: string;
    sent_to: string;
    method: string;
  }>;
  skipped: Array<{
    applicant_id: string;
    name: string;
    reason: string;
  }>;
  message: string;
}

/**
 * Hook to find matching applicants for a property
 */
export function useApplicantMatching(limit: number = 50, minScore: number = 50) {
  const { toast } = useToast();

  return useMutation<ApplicantMatchingResponse, Error, string>({
    mutationFn: async (propertyId: string) => {
      const response = await api.get(
        `/api/v1/ai/match-applicants/${propertyId}?limit=${limit}&min_score=${minScore}`
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Matches Found',
        description: `Found ${data.total_matches} matching applicants for this property.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Finding Matches',
        description: error.response?.data?.detail || 'Failed to find matching applicants',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to send property details to selected applicants
 */
export function useSendPropertyToApplicants() {
  const { toast } = useToast();

  return useMutation<
    SendPropertyResponse,
    Error,
    {
      propertyId: string;
      applicantIds: string[];
      sendMethod?: 'email' | 'sms' | 'whatsapp';
      customMessage?: string;
    }
  >({
    mutationFn: async ({ propertyId, applicantIds, sendMethod = 'email', customMessage }) => {
      const response = await api.post('/api/v1/ai/send-property-to-applicants', {
        property_id: propertyId,
        applicant_ids: applicantIds,
        send_method: sendMethod,
        custom_message: customMessage,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Property Sent Successfully',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Sending Property',
        description: error.response?.data?.detail || 'Failed to send property to applicants',
        variant: 'destructive',
      });
    },
  });
}

