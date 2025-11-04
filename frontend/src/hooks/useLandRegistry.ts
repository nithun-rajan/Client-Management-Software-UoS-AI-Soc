import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

// ==================== Types ====================

export interface SoldProperty {
  address: string;
  postcode: string;
  price: number;
  date: string;
  property_type: string;
  new_build: boolean;
}

export interface PropertyLookupResult {
  found: boolean;
  house_number: string;
  postcode: string;
  full_address?: string;
  street?: string;
  town?: string;
  property_type?: string;
  latest_sale?: {
    price: number;
    date: string;
    new_build: boolean;
  };
  sales_history?: Array<{
    paon: string;
    saon: string;
    address: string;
    street: string;
    town: string;
    postcode: string;
    price: number;
    date: string;
    property_type: string;
    new_build: boolean;
  }>;
  total_sales?: number;
  price_trend?: {
    change_amount: number;
    change_percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  google_maps_url?: string;
  message?: string;
}

export interface AreaStatistics {
  postcode: string;
  property_type_filter: string | null;
  total_sales: number;
  average_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  property_types: Record<string, number>;
  recent_sales: SoldProperty[];
  time_period: string;
}

export interface ValuationSummary {
  average_price: number;
  median_price: number;
  recommended_range: {
    min: number;
    max: number;
  };
  confidence: string;
}

export interface MarketTrend {
  direction: string;
  percentage_change: number;
  period: string;
}

export interface ValuationPack {
  postcode: string;
  property_type: string;
  bedrooms: number | null;
  generated_at: string;
  valuation_summary: ValuationSummary;
  market_trend: MarketTrend;
  comparables: SoldProperty[];
  area_statistics: AreaStatistics;
  data_quality: {
    total_comparables: number;
    data_period: string;
    source: string;
  };
}

// ==================== Hooks ====================

/**
 * Look up a specific property by house number and postcode (Alto-style!)
 */
export function usePropertyLookup(houseNumber: string, postcode: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['landRegistry', 'lookup', houseNumber, postcode],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/land-registry/lookup-property`, {
        params: {
          house_number: houseNumber,
          postcode: postcode,
        },
      });
      return data.data as PropertyLookupResult;
    },
    enabled: enabled && !!houseNumber && !!postcode && postcode.length >= 5,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * Get sold property prices for a postcode
 */
export function useSoldPrices(postcode: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['landRegistry', 'soldPrices', postcode],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/land-registry/sold-prices`, {
        params: {
          postcode,
          limit: 20,
          months_back: 12,
        },
      });
      return data.data as SoldProperty[];
    },
    enabled: enabled && !!postcode && postcode.length >= 5,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * Get area statistics for a postcode
 */
export function useAreaStatistics(postcode: string, propertyType?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['landRegistry', 'areaStats', postcode, propertyType],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/land-registry/area-stats`, {
        params: {
          postcode,
          property_type: propertyType,
        },
      });
      return data.data as AreaStatistics;
    },
    enabled: enabled && !!postcode && postcode.length >= 5,
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Generate a comprehensive valuation pack
 */
export function useValuationPack() {
  return useMutation({
    mutationFn: async (params: { postcode: string; property_type: string; bedrooms?: number; bathrooms?: number }) => {
      const { data } = await api.post(`/api/v1/land-registry/valuation-pack`, params);
      return data.data as ValuationPack;
    },
  });
}

/**
 * Search properties by town
 */
export function useSearchByTown(
  town: string,
  options?: {
    property_type?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
  },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['landRegistry', 'searchByTown', town, options],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/land-registry/search-by-town`, {
        params: {
          town,
          ...options,
        },
      });
      return data.data as SoldProperty[];
    },
    enabled: enabled && !!town && town.length >= 3,
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Helper: Get suggested rent based on postcode and property specs
 * Returns a recommended rent range based on market data
 */
export function useSuggestedRent(
  postcode: string,
  propertyType?: string,
  bedrooms?: number,
  enabled: boolean = true
) {
  const { data: areaStats, isLoading } = useAreaStatistics(postcode, propertyType, enabled);

  // Calculate suggested rent (monthly rent is typically 4-5% of property value annually)
  // So: (average_price * 0.045) / 12 months
  const suggestedRent = areaStats?.average_price 
    ? Math.round((areaStats.average_price * 0.045) / 12)
    : null;

  const rentRange = suggestedRent
    ? {
        min: Math.round(suggestedRent * 0.9),
        max: Math.round(suggestedRent * 1.1),
        suggested: suggestedRent,
      }
    : null;

  return {
    suggestedRent,
    rentRange,
    areaStats,
    isLoading,
  };
}

/**
 * AI-Powered Rent Estimation Hook
 * Uses OpenAI + comprehensive property data for intelligent rent pricing
 */
export function useAIRentEstimate() {
  return useMutation({
    mutationFn: async (params: { house_number: string; postcode: string }) => {
      const { data } = await api.post(`/api/v1/land-registry/ai-rent-estimate`, null, {
        params: {
          house_number: params.house_number,
          postcode: params.postcode,
        },
      });
      return data;
    },
  });
}
