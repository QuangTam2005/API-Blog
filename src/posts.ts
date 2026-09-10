export const PUBLIC_POST_SLUGS = new Set(['api-comparison']);

export function isValidPostSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
