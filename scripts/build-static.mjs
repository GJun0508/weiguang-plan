import { cpSync, mkdirSync, rmSync } from "node:fs";

const output = "dist";
const files = [
  "index.html",
  "styles.css",
  "theme.css",
  "donation.css",
  "auth.css",
  "script.js",
  "supabase-config.js",
  "supabase-client.js",
  "auth.js",
  "projects.js",
  "project-detail.js",
  "project-follows.js",
  "ledger.js",
  "admin.js",
  "shared-stars.js",
  "star-store.js",
  "donation.js",
  "auth.html",
  "account.html",
  "project.html",
  "admin.html",
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of files) {
  cpSync(file, `${output}/${file}`);
}

cpSync("assets", `${output}/assets`, { recursive: true });
