import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface PropertyMatch {
  property_id: string;
  score: number;
  property: {
    id: string;
    address: string;
    city: string;
    postcode: string;
    bedrooms: number;
    bathrooms: number;
    rent: number | null;
    property_type: string;
    description: string;
    main_photo: string | null;
  };
  personalized_message: string;
  match_reasons: string[];
  viewing_slots: string[];
}

export interface MatchingResponse {
  applicant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    criteria: {
      bedrooms: string;
      budget: string;
      locations: string;
      move_in_date: string | null;
    };
  };
  matches: PropertyMatch[];
  total_matches: number;
  ai_confidence: number;
  generated_at: string;
  next_steps: string[];
}

export function usePropertyMatching(
  limit: number = 5,
  minScore: number = 50
) {
  return useMutation({
    mutationFn: async (applicantId: string) => {
      if (!applicantId) {
        throw new Error("Applicant ID is required");
      }
      const { data } = await api.post(
        `/api/v1/ai/match-proposals?applicant_id=${applicantId}&limit=${limit}&min_score=${minScore}`
      );
      return data as MatchingResponse;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.total_matches} matching properties!`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to find matches");
    },
  });
}

export function useApplicantAnalytics(applicantId: string) {
  return useQuery({
    queryKey: ["applicantAnalytics", applicantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/ai/analytics/applicant/${applicantId}`);
      return data;
    },
    enabled: !!applicantId,
  });
}
