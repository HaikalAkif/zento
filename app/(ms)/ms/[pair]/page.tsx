import { PairView, pairMetadata } from '@/app/_views/pair';

interface Props {
  params: Promise<{ pair: string }>;
}

export async function generateMetadata({ params }: Props) {
  return pairMetadata('ms', (await params).pair);
}

export default async function Page({ params }: Props) {
  return <PairView lang="ms" slug={(await params).pair} />;
}
