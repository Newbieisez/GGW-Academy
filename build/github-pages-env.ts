// Static GitHub Pages builds do not have Cloudflare bindings. The hosted API
// routes are retained for the Cloudflare deployment but are skipped by the
// static exporter, so this empty compatibility module lets the server bundle
// be analyzed without pretending that a D1 database exists.
export const env: Record<string, unknown> = {};
