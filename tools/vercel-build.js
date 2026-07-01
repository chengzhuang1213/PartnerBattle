const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist");
const entries = ["index.html", "play.html", "assets", "src", "styles"];

function ensureInsideRoot(target) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside project root: ${target}`);
  }
}

ensureInsideRoot(outDir);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const from = path.join(root, entry);
  const to = path.join(outDir, entry);
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, to, { recursive: true });
}

console.log(`Static site copied to ${path.relative(root, outDir)}`);
