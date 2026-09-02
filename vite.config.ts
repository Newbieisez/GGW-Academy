import vinext from "vinext";
import { defineConfig } from "vite";
import path from "node:path";
import { sites } from "./build/sites-vite-plugin";

const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "/GGW-Academy").replace(/\/$/, "");
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig(async () => {
  if (isGithubPagesBuild) {
    return {
      server: {
        host: "0.0.0.0",
        allowedHosts: ["terminal.local"],
      },
      base: `${githubPagesBasePath}/`,
      plugins: [vinext()],
      resolve: {
        alias: { "cloudflare:workers": path.resolve("build/github-pages-env.ts") },
      },
    };
  }

  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

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
      }),
    ],
  };
});
