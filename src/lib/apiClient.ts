const FALLBACK_BACKEND_ORIGIN =
  'https://ais-pre-xxwufokm4z6vr72u5doxbk-386224713476.europe-west1.run.app';

/**
 * Fetches an `/api/*` endpoint.
 * When hosted on static CDNs like Netlify (where `/*` may rewrite to `/index.html`
 * with Content-Type `text/html`), automatically falls back to the live backend origin.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  try {
    const primaryRes = await fetch(path, init);
    const contentType = (primaryRes.headers.get('content-type') || '').toLowerCase();

    // If we received a valid JSON response from the local/proxied origin, return it directly
    if (contentType.includes('application/json')) {
      return primaryRes;
    }

    // If running on Netlify or another static host where `/api/*` returned HTML or 404,
    // retry against the live Cloud Run backend origin if we aren't already on it.
    if (
      typeof window !== 'undefined' &&
      window.location.origin !== FALLBACK_BACKEND_ORIGIN &&
      path.startsWith('/api/')
    ) {
      const fallbackRes = await fetch(`${FALLBACK_BACKEND_ORIGIN}${path}`, {
        ...init,
        mode: 'cors',
      });
      return fallbackRes;
    }

    return primaryRes;
  } catch (primaryErr) {
    if (
      typeof window !== 'undefined' &&
      window.location.origin !== FALLBACK_BACKEND_ORIGIN &&
      path.startsWith('/api/')
    ) {
      return fetch(`${FALLBACK_BACKEND_ORIGIN}${path}`, {
        ...init,
        mode: 'cors',
      });
    }
    throw primaryErr;
  }
}
