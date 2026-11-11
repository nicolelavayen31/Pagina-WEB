import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { WhatsAppButton } from '@/components/whatsapp-button';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      {/* Inner pages keep a padded column; the home page uses full-width bands (main.home). */}
      <div id="contenido" className="site-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
      {/* Customer contact shortcut: public pages only, not the admin panel. */}
      <WhatsAppButton />
    </div>
  );
}
