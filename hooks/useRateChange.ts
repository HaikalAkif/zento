import { useQuery } from '@tanstack/react-query';
import { getHistoricalRates } from '@/lib/api';

export interface RateChange {
  percent: number;
  direction: 'up' | 'down' | 'flat';
}

export function useRateChange(base: string, target: string) {
  return useQuery({
    queryKey: ['rate-change', base, target],
    queryFn: async (): Promise<RateChange | null> => {
      const points = await getHistoricalRates(base, target, 3);
      if (points.length < 2) return null;
      const prev = points[points.length - 2].rate;
      const curr = points[points.length - 1].rate;
      if (prev === 0) return null;
      const percent = ((curr - prev) / prev) * 100;
      const direction = percent > 0.005 ? 'up' : percent < -0.005 ? 'down' : 'flat';
      return { percent, direction };
    },
    enabled: base !== target,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
