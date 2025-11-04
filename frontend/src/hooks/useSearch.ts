import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Property } from "@/types";

export interface SearchFilters {
  bedrooms?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  rent_min?: number;
  rent_max?: number;
  property_type?: string;
  postcode?: string;
  status?: string;
}

export function usePropertySearch(filters: SearchFilters, enabled: boolean = true) {
  return useQuery({
    queryKey: ["propertySearch", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Only add non-empty filter values to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const { data } = await api.get(`/api/v1/search/properties?${params}`);
      return data as Property[];
    },
    enabled:
      enabled &&
      Object.keys(filters).some((key) => {
        const value = filters[key as keyof SearchFilters];
        return value !== undefined && value !== null && value !== "";
      }),
  });
}

export function usePropertySearchCount(
  filters: SearchFilters,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["propertySearchCount", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Only add non-empty filter values to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const { data } = await api.get(`/api/v1/search/properties/count?${params}`);
      return data as { count: number };
    },
    enabled:
      enabled &&
      Object.keys(filters).some((key) => {
        const value = filters[key as keyof SearchFilters];
        return value !== undefined && value !== null && value !== "";
      }),
  });
}
