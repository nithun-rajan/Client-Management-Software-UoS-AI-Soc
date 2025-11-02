import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { KPIData } from '@/types';

export function useKPIs() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/kpis/');
      return data as KPIData;
    },
  });
}
