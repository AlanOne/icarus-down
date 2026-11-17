const ABSOLUTE = /^(?:https?:|mailto:|tel:)/i;

/**
 * Turn a site path into a URL under the configured base.
 * Absolute http(s), mailto: and tel: URLs pass through unchanged.
 */
export function url(path: string): string {
  if (ABSOLUTE.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
