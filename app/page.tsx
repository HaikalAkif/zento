import ConverterSection from '@/components/ConverterSection';
import { detectLocalCurrency, resolveHomePair } from '@/lib/region-server';
import { seedRatesFor } from '@/lib/rates';

interface Props {
  searchParams: Promise<{ amount?: string }>;
}

function parseAmount(raw: string | undefined): string {
  if (!raw) return '1';
  const n = parseFloat(raw);
  return !isNaN(n) && n > 0 ? raw : '1';
}

export default async function HomePage({ searchParams }: Props) {
  const { amount } = await searchParams;
  const localCurrency = await detectLocalCurrency();
  const { from, to } = await resolveHomePair(localCurrency);
  const seedRates = await seedRatesFor(from, to);

  return (
    <main>
      <ConverterSection
        heroMode
        initialFrom={from}
        initialTo={to}
        initialAmount={parseAmount(amount)}
        localCurrency={localCurrency}
        seedRates={seedRates}
      />
    </main>
  );
}
