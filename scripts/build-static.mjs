import { cpSync, mkdirSync, rmSync } from "node:fs";

const output = "dist";
const files = [
  "index.html",
  "styles.css",
  "theme.css",
  "donation.css",
  "script.js",
  "supabase-config.js",
  "supabase-client.js",
  "projects.js",
  "project-detail.js",
  "ledger.js",
  "shared-stars.js",
  "star-store.js",
  "donation.js",
  "project.html",
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of files) {
  cpSync(file, `${output}/${file}`);
}

cpSync("assets", `${output}/assets`, { recursive: true });
