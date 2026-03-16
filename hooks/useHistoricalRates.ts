import { useQuery } from '@tanstack/react-query';
import { getHistoricalRates } from '@/lib/api';

export type Period = '3D' | '7D' | '30D' | '1Y';

const PERIOD_DAYS: Record<Period, number> = {
  '3D': 3,
  '7D': 7,
  '30D': 30,
  '1Y': 365,
};

export function useHistoricalRates(base: string, target: string, period: Period) {
  return useQuery({
    queryKey: ['historical', base, target, period],
    queryFn: () => getHistoricalRates(base, target, PERIOD_DAYS[period]),
    enabled: base !== target,
    staleTime: 5 * 60 * 1000,
  });
}
