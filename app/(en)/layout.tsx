import '../globals.css';
import { SiteShell, siteMetadata } from '../_views/site';

export const metadata = siteMetadata('en');
export { viewport } from '../_views/site';

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
