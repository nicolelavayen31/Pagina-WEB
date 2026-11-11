import { ImageResponse } from 'next/og';

export const alt = 'Mantenimientos Integrales y Construcciones';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Preview image when the site is shared (WhatsApp, Facebook, LinkedIn…). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#0b1730',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 22px)',
          color: '#ffffff',
          borderBottom: '16px solid #19e6c1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              background: '#19e6c1',
              color: '#0b1730',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            MI
          </div>
          <div style={{ fontSize: 30, color: '#19e6c1', fontWeight: 700 }}>Soluciones integrales · Ecuador</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Mantenimientos Integrales y Construcciones</div>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.8)' }}>
            Automatización, electricidad, refrigeración y construcción
          </div>
        </div>
      </div>
    ),
    size,
  );
}
