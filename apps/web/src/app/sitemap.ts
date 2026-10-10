import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/servicios` },
    { url: `${baseUrl}/proyectos` },
    { url: `${baseUrl}/nosotros` },
    { url: `${baseUrl}/contacto` },
    { url: `${baseUrl}/privacidad` },
    { url: `${baseUrl}/terminos` },
  ];
}
