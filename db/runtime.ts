import { env } from "cloudflare:workers";

export function getD1(): D1Database {
  if (!env.DB) {
    throw new Error("D1 binding DB is not available.");
  }
  return env.DB;
}
