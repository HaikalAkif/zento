import { useQuery } from '@tanstack/react-query';
import { getLatestRate, type RateResponse } from '@/lib/api';

/**
 * @param seed Rates the server already fetched. Used as initial data when it covers
 *   this pair, so the converted amount is in the server-rendered HTML.
 */
export function useCurrencyRate(base: string, target: string, seed?: RateResponse) {
  const seedMatches = seed?.base === base && seed.rates[target] != null;
  return useQuery({
    queryKey: ['rate', base, target],
    queryFn: () => getLatestRate(base, target),
    enabled: base !== target,
    initialData: seedMatches ? seed : undefined,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
