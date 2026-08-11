import type { MetadataRoute } from 'next';

const SW_MANIFEST_NAME = 'Wawi Learns';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SW_MANIFEST_NAME,
    short_name: SW_MANIFEST_NAME,
    description: 'Offline-ready child learning shell for Wawi Learns.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0f172a',
    background_color: '#f8fafc',
    icons: [
      {
        src: '/icons/wawi-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/wawi-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
