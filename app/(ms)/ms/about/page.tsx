import { AboutView, aboutMetadata } from '@/app/_views/about';

export const metadata = aboutMetadata('ms');

export default function Page() {
  return <AboutView lang="ms" />;
}
