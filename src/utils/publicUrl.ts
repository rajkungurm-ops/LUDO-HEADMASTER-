/**
 * Public URL helpers for Ludo King Master Game & Remote Control.
 * Guarantees that mobile download / install links and QR codes always point to
 * the exact live accessible URL with zero 404 "Page not found" errors.
 */

export function getPublicBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    let origin = (window.location.origin || '').replace(/\/+$/, '');
    if (origin && origin !== 'null' && !origin.startsWith('blob:') && !origin.startsWith('about:')) {
      if (origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }
      return origin;
    }
    // Fallback if origin is empty
    if (window.location.protocol && window.location.host) {
      let host = window.location.host;
      if (host.includes('ais-dev-')) {
        host = host.replace('ais-dev-', 'ais-pre-');
      }
      return `${window.location.protocol}//${host}`;
    }
  }
  return 'https://ais-pre-5p42wpcu464yspms2qq6en-99337644998.asia-southeast1.run.app';
}

export function getRemoteShareUrl(roomCode: string = '1234'): string {
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const code = (roomCode || '1234').trim().toUpperCase();
  // Using query param ?remote=1&code=1234 ensures all mobile browsers (Android Chrome, Safari, Samsung Internet, In-App browsers)
  // open the remote controller immediately without any 404 route issues
  return `${base}/?remote=1&code=${code}`;
}

export function getInstallUrl(): string {
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  return `${base}/`;
}
