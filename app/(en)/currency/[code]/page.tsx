import { CurrencyView, currencyMetadata } from '@/app/_views/currency';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props) {
  return currencyMetadata('en', (await params).code);
}

export default async function Page({ params }: Props) {
  return <CurrencyView lang="en" slug={(await params).code} />;
}
