import { describe, expect, it, vi } from "vitest";
import { HelpRequestedError, parseArgs, printHelp, VersionRequestedError } from "../src/cli.js";

describe("parseArgs", () => {
  it("parses the main options", () => {
    expect(parseArgs([
      "./repo",
      "--output",
      "out",
      "--artifact",
      "app.jar",
      "--class-index",
      "class-index.jsonl",
      "--docs",
      "docs-a",
      "--docs",
      "docs-b",
      "--entry",
      "com.example.Main",
      "--include-tests",
      "--force",
      "--max-chars",
      "5000",
      "--max-input-file-bytes",
      "9000",
      "--verbose",
    ])).toMatchObject({
      repositoryPath: "./repo",
      outputDirectory: "out",
      artifactPath: "app.jar",
      classIndexPath: "class-index.jsonl",
      docsDirectories: ["docs-a", "docs-b"],
      entryClass: "com.example.Main",
      includeTests: true,
      force: true,
      maxChars: 5000,
      maxInputFileBytes: 9000,
      verbose: true,
    });
  });

  it("requires one repository path and output", () => {
    expect(() => parseArgs(["--output", "out"])).toThrow("exactly one repository path");
    expect(() => parseArgs(["repo"])).toThrow("Please specify --output.");
    expect(() => parseArgs(["repo-a", "repo-b", "--output", "out"])).toThrow("exactly one repository path");
  });

  it("handles help and version requests", () => {
    expect(() => parseArgs(["--help"])).toThrow(HelpRequestedError);
    expect(() => parseArgs(["--version"])).toThrow(VersionRequestedError);
  });

  it("prints AI-agent friendly help without build ownership", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      printHelp();
      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("miku-repo-bundle <repo> --output <dir> [options]");
      expect(output).toContain("--artifact <jar>");
      expect(output).toContain("--class-index <jsonl>");
      expect(output).toContain("miku-javaclass2json-java");
      expect(output).not.toContain("--build");
    } finally {
      log.mockRestore();
    }
  });
});
