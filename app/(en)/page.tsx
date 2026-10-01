import { HomeView, type HomeProps } from '@/app/_views/home';

export default function Page({ searchParams }: HomeProps) {
  return <HomeView lang="en" searchParams={searchParams} />;
}
