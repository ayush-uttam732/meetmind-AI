// Builds the extension into ./dist. Load that folder in chrome://extensions ("Load unpacked").
//   node build.mjs           one build
//   node build.mjs --watch   rebuild the TypeScript on every save (re-run for html/css/manifest changes)
import { build, context } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const watch = process.argv.includes("--watch");

// Content scripts and the service worker must be single self-contained files, so each entry is
// bundled on its own as an IIFE.
const entries = [
  { entryPoints: ["src/sidepanel/sidepanel.ts"], outfile: "dist/sidepanel/sidepanel.js" },
  { entryPoints: ["src/content/meet-captions.ts"], outfile: "dist/content.js" },
  { entryPoints: ["src/background/service-worker.ts"], outfile: "dist/background.js" },
];

const shared = {
  bundle: true,
  format: "iife",
  target: "chrome116",
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
};

async function copyStatic() {
  // public/ first, so an old public/manifest.json can never replace the real manifest.
  if (existsSync("public")) {
    if (existsSync("public/manifest.json")) {
      console.warn("WARNING: public/manifest.json is ignored. The manifest used is ./manifest.json. Delete the one in public/.");
    }
    await cp("public", "dist", { recursive: true });
  }
  await cp("manifest.json", "dist/manifest.json");

  const html = await readFile("src/sidepanel/sidepanel.html", "utf8");
  await writeFile("dist/sidepanel/sidepanel.html", html.replace("./sidepanel.ts", "./sidepanel.js"));
  await cp("src/sidepanel/sidepanel.css", "dist/sidepanel/sidepanel.css");
}

await rm("dist", { recursive: true, force: true });
await mkdir("dist/sidepanel", { recursive: true });
await copyStatic();

if (watch) {
  for (const entry of entries) {
    const ctx = await context({ ...shared, ...entry });
    await ctx.watch();
  }
  console.log("Watching... (Ctrl+C to stop)");
} else {
  await Promise.all(entries.map((entry) => build({ ...shared, ...entry })));
  await verifyManifest();
  console.log("Built into ./dist");
}

// Fails the build early if manifest.json points at a file that is not in dist.
async function verifyManifest() {
  const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
  const files = [
    manifest.background?.service_worker,
    manifest.side_panel?.default_path,
    manifest.action?.default_popup,
    manifest.options_page,
    ...(manifest.content_scripts ?? []).flatMap((cs) => cs.js ?? []),
    ...Object.values(manifest.icons ?? {}),
  ].filter(Boolean);
  const missing = files.filter((f) => !existsSync(`dist/${f}`));
  if (missing.length) {
    console.error("manifest.json refers to files that are not in dist:\n  " + missing.join("\n  "));
    process.exit(1);
  }
}
