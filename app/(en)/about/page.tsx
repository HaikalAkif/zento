import { AboutView, aboutMetadata } from '@/app/_views/about';

export const metadata = aboutMetadata('en');

export default function Page() {
  return <AboutView lang="en" />;
}
