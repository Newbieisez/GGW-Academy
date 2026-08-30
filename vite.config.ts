import vinext from "vinext";
import { defineConfig } from "vite";
import path from "node:path";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "/GGW-Academy").replace(/\/$/, "");

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  if (isGithubPagesBuild) {
    return {
      server: {
        host: "0.0.0.0",
        allowedHosts: ["terminal.local"],
      },
      base: `${githubPagesBasePath}/`,
      // GitHub Pages is a static export. The hosted Sites and Cloudflare
      // plugins are intentionally omitted because they provide runtime-only
      // bindings that cannot be evaluated during static pre-rendering.
      plugins: [vinext()],
      resolve: {
        // The server API routes remain in the repository for the hosted
        // deployment. They are skipped by the static exporter, but the
        // server bundle still analyzes their Cloudflare-only import.
        alias: { "cloudflare:workers": path.resolve("build/github-pages-env.ts") },
      },
    };
  }

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
