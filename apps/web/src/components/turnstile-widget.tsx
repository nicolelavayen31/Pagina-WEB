'use client';

import Script from 'next/script';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/**
 * Renders Cloudflare Turnstile when a site key is configured. The widget injects a hidden
 * `cf-turnstile-response` field into the surrounding form, which the quote form forwards.
 */
export function TurnstileWidget() {
  if (!SITE_KEY) {
    return null;
  }
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={SITE_KEY} data-language="es" />
    </>
  );
}
