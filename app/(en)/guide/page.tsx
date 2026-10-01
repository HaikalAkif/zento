import { GuideView, guideMetadata } from '@/app/_views/guide';

export const metadata = guideMetadata('en');

export default function Page() {
  return <GuideView lang="en" />;
}
