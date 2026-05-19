import ConverterSection from '@/components/ConverterSection';

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
  return (
    <main>
      <ConverterSection heroMode initialAmount={parseAmount(amount)} />
    </main>
  );
}
