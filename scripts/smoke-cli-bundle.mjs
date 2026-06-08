#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const product = "miku-repo-bundle";
const bundlePath = join("bundle", `${product}.mjs`);
const sourcesPath = join("bundle", `${product}-sources.tgz`);

for (const path of [bundlePath, sourcesPath]) {
  if (!existsSync(path)) {
    console.error(`missing bundle artifact: ${path}`);
    process.exit(1);
  }
}

const version = spawnSync(process.execPath, [bundlePath, "--version"], {
  encoding: "utf8",
});

if (version.status !== 0) {
  process.stderr.write(version.stderr);
  process.exit(version.status ?? 1);
}

const expectedVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const actualVersion = version.stdout.trim();

if (actualVersion !== expectedVersion) {
  console.error(`unexpected bundle version: ${actualVersion}, expected ${expectedVersion}`);
  process.exit(1);
}

console.log(`smoke ok: ${bundlePath} --version -> ${actualVersion}`);
