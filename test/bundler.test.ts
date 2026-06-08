import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createRepoBundle } from "../src/bundler.js";

function createFakeTextBundleBin(root: string): string {
  const binDir = join(root, "bin");
  mkdirSync(binDir, { recursive: true });
  const binPath = join(binDir, "miku-text-bundle");
  writeFileSync(binPath, `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
const output = process.argv[process.argv.indexOf("--output") + 1];
mkdirSync(output, { recursive: true });
writeFileSync(output + "/text-bundle-000-prompt.md", "# prompt\\n", "utf8");
writeFileSync(output + "/text-bundle-001.md", "# part\\n\\n### repo-metadata.json\\n### class-index.jsonl\\n### artifact-notes.md\\nOriginal file name\\nrepo-artifact.jar\\n### artifact.sha256\\n", "utf8");
writeFileSync(output + "/text-bundle-999-index.md", "# index\\nrepo-metadata.json\\nclass-index.jsonl\\nartifact-notes.md\\nartifact.sha256\\n", "utf8");
`, "utf8");
  chmodSync(binPath, 0o755);
  return binDir;
}

describe("createRepoBundle", () => {
  it("creates a reference folder with text bundle files, manifest, and artifact sidecar", () => {
    const root = mkdtempSync(join(tmpdir(), "miku-repo-bundle-test-"));
    const repo = join(root, "repo");
    mkdirSync(join(repo, "src", "main", "java", "com", "example"), { recursive: true });
    writeFileSync(join(repo, "src", "main", "java", "com", "example", "Main.java"), "class Main {}\n", "utf8");
    writeFileSync(join(repo, "README.md"), "# Repo\n", "utf8");
    writeFileSync(join(repo, "pom.xml"), "<project />\n", "utf8");
    const artifact = join(root, "app.jar");
    writeFileSync(artifact, "jar-bytes", "utf8");
    const classIndex = join(root, "class-index.jsonl");
    writeFileSync(classIndex, "{\"name\":\"Main\"}\n", "utf8");
    const docs = join(root, "external-docs");
    mkdirSync(docs, { recursive: true });
    writeFileSync(join(docs, "guide.md"), "# Guide\n", "utf8");

    const oldPath = process.env.PATH;
    process.env.PATH = `${createFakeTextBundleBin(root)}:${oldPath ?? ""}`;
    try {
      const output = join(root, "out");
      const result = createRepoBundle({
        repositoryPath: repo,
        outputDirectory: output,
        artifactPath: artifact,
        classIndexPath: classIndex,
        docsDirectories: [docs],
        entryClass: "com.example.Main",
        includeTests: false,
        force: false,
        maxChars: 120000,
        maxInputFileBytes: 1_000_000,
        verbose: false,
      });

      expect(result.artifactCopied).toBe(true);
      expect(result.artifactFileName).toBe("repo-artifact.jar");
      expect(existsSync(join(output, "repo-artifact.jar"))).toBe(true);
      expect(existsSync(join(output, "MANIFEST.md"))).toBe(true);
      expect(existsSync(join(output, "text-bundle-000-prompt.md"))).toBe(true);
      expect(readFileSync(join(output, "MANIFEST.md"), "utf8")).toContain("text-bundle-000-prompt.md");
      expect(readFileSync(join(output, "MANIFEST.md"), "utf8")).toContain("repo-artifact.jar");
      expect(readFileSync(join(output, "text-bundle-001.md"), "utf8")).toContain("artifact-notes.md");
    } finally {
      process.env.PATH = oldPath;
    }
  });
});
