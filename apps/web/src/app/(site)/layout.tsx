import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { WhatsAppButton } from '@/components/whatsapp-button';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <div id="contenido" className="page-stack" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
      {/* Customer contact shortcut: public pages only, not the admin panel. */}
      <WhatsAppButton />
    </div>
  );
}
