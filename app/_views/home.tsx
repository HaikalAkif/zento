import ConverterSection from '@/components/ConverterSection';
import { detectLocalCurrency, resolveHomePair } from '@/lib/region-server';
import { seedRatesFor } from '@/lib/rates';
import { defaultAmount } from '@/lib/format';
import type { Lang } from '@/lib/i18n';

export interface HomeProps {
  searchParams: Promise<{ amount?: string }>;
}

const HEADING: Record<Lang, string> = {
  en: 'Currency converter',
  ms: 'Penukar mata wang',
};

function parseAmount(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const n = parseFloat(raw);
  return !isNaN(n) && n > 0 ? raw : fallback;
}

export async function HomeView({ lang, searchParams }: HomeProps & { lang: Lang }) {
  const { amount } = await searchParams;
  const localCurrency = await detectLocalCurrency();
  const { from, to } = await resolveHomePair(localCurrency);
  const seedRates = await seedRatesFor(from, to);

  return (
    <main>
      <ConverterSection
        heading={HEADING[lang]}
        initialFrom={from}
        initialTo={to}
        initialAmount={parseAmount(amount, defaultAmount(seedRates?.rates[to]))}
        localCurrency={localCurrency}
        seedRates={seedRates}
      />
    </main>
  );
}
