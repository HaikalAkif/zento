// Unmatched URLs. With two root layouts ((en) and (ms)) there is no single layout for
// Next to render a 404 inside, so this one brings its own document. Unknown Malay URLs
// under a known shape (/ms/xxx-to-yyy) get the Malay 404 from app/(ms)/ms/not-found.tsx.

import './globals.css';
import type { Metadata } from 'next';
import { SiteShell } from './_views/site';
import { NotFoundView } from './_views/not-found';

export const metadata: Metadata = {
  title: '404 | Zento',
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <SiteShell lang="en">
      <NotFoundView lang="en" />
    </SiteShell>
  );
}
