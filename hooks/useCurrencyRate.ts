import { useQuery } from '@tanstack/react-query';
import { getLatestRate } from '@/lib/api';

export function useCurrencyRate(base: string, target: string) {
  return useQuery({
    queryKey: ['rate', base, target],
    queryFn: () => getLatestRate(base, target),
    enabled: base !== target,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
