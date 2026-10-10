import './globals.css';
import type { Metadata } from 'next';
import { WhatsAppButton } from '@/components/whatsapp-button';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Mantenimientos Integrales y Construcciones',
    template: '%s | Mantenimientos Integrales y Construcciones',
  },
  description: 'Plataforma corporativa para mantenimientos, construcciones y proyectos integrales.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
