// Secrets aren't in wrangler.jsonc, so `wrangler types` only sees them when .dev.vars
// exists locally. Declared here so CI type-checks the same way.
interface Env {
  VAPID_PRIVATE_KEY: string;
}
