#!/usr/bin/env node

import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const product = "miku-repo-bundle";
const bundleDir = "bundle";
const bundlePath = join(bundleDir, `${product}.mjs`);
const sourceArchivePath = join(bundleDir, `${product}-sources.tgz`);

const bundleNodeImports = [
  'import { createHash } from "node:crypto";',
  'import { execFileSync, spawnSync } from "node:child_process";',
  'import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";',
  'import { tmpdir } from "node:os";',
  'import { basename, dirname, join, relative, resolve, sep } from "node:path";',
];

const bundledModuleOrder = [
  "cli.js",
  "bundler.js",
  "main.js",
];

const bundleExportNames = [
  "HelpRequestedError",
  "VersionRequestedError",
  "CLI_VERSION",
  "parseArgs",
  "printHelp",
  "printVersion",
  "createRepoBundle",
];

const sourceArchiveEntries = [
  "src",
  "test",
  "docs",
  "README.md",
  "LICENSE",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ...bundledModuleOrder.map((fileName) => join("dist", fileName)),
];

function transformModule(fileName) {
  const content = readFileSync(join("dist", fileName), "utf8")
    .replace(/^#!.*\n/, "")
    .split("\n")
    .filter((line) => !line.match(/^import /))
    .filter((line) => !line.match(/^export \{ .* \} from "\.\/.*\.js";$/))
    .join("\n")
    .replace(/\bexport function\b/g, "function")
    .replace(/\bexport class\b/g, "class")
    .replace(/\bexport const\b/g, "const")
    .replace(/\bexport let\b/g, "let")
    .replace(/\bexport var\b/g, "var");

  return `// ${fileName}\n${content.trim()}\n`;
}

function buildExportsBlock() {
  return `export {\n  ${bundleExportNames.join(",\n  ")},\n};\n`;
}

function buildBundleContent() {
  const body = bundledModuleOrder.map(transformModule).join("\n");
  return `#!/usr/bin/env node\n${bundleNodeImports.join("\n")}\n\n${body}\n${buildExportsBlock()}`;
}

function writeCliBundle() {
  writeFileSync(bundlePath, buildBundleContent(), "utf8");
  chmodSync(bundlePath, 0o755);
}

function createSourceArchive() {
  rmSync(sourceArchivePath, { force: true });

  return spawnSync("tar", ["-czf", sourceArchivePath, ...sourceArchiveEntries], {
    encoding: "utf8",
  });
}

mkdirSync(bundleDir, { recursive: true });
writeCliBundle();

const tar = createSourceArchive();

if (tar.status !== 0) {
  process.stderr.write(tar.stderr);
  process.exit(tar.status ?? 1);
}

console.log(`generated: ${bundlePath}`);
console.log(`generated: ${sourceArchivePath}`);
