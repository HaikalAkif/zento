import '../globals.css';
import { SiteShell, siteMetadata } from '../_views/site';

export const metadata = siteMetadata('ms');
export { viewport } from '../_views/site';

// Bahasa Melayu: every page under /ms
export default function MalayLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="ms">{children}</SiteShell>;
}
