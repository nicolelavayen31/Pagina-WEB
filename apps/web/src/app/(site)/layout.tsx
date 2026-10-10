import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <div id="contenido" className="page-stack" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
