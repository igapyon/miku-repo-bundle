import type { CliOptions } from "./types.js";

export const CLI_VERSION = "0.1.0";
const DEFAULT_MAX_CHARS = 120000;
const DEFAULT_MAX_INPUT_FILE_BYTES = 1_000_000;

export class HelpRequestedError extends Error {
  constructor() {
    super("Help requested.");
    this.name = "HelpRequestedError";
  }
}

export class VersionRequestedError extends Error {
  constructor() {
    super("Version requested.");
    this.name = "VersionRequestedError";
  }
}

function readRequiredOptionValue(argv: string[], index: number, optionName: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Please specify a value for ${optionName}.`);
  }
  return value;
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

export function parseArgs(argv: string[]): CliOptions {
  const docsDirectories: string[] = [];
  const positional: string[] = [];
  let outputDirectory: string | undefined;
  let artifactPath: string | undefined;
  let classIndexPath: string | undefined;
  let entryClass: string | undefined;
  let includeTests = false;
  let force = false;
  let verbose = false;
  let maxChars = DEFAULT_MAX_CHARS;
  let maxInputFileBytes = DEFAULT_MAX_INPUT_FILE_BYTES;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      throw new HelpRequestedError();
    }
    if (arg === "--version" || arg === "-v") {
      throw new VersionRequestedError();
    }
    if (arg === "--output") {
      outputDirectory = readRequiredOptionValue(argv, index, "--output");
      index += 1;
      continue;
    }
    if (arg === "--artifact") {
      artifactPath = readRequiredOptionValue(argv, index, "--artifact");
      index += 1;
      continue;
    }
    if (arg === "--class-index") {
      classIndexPath = readRequiredOptionValue(argv, index, "--class-index");
      index += 1;
      continue;
    }
    if (arg === "--docs") {
      docsDirectories.push(readRequiredOptionValue(argv, index, "--docs"));
      index += 1;
      continue;
    }
    if (arg === "--entry") {
      entryClass = readRequiredOptionValue(argv, index, "--entry");
      index += 1;
      continue;
    }
    if (arg === "--max-chars") {
      maxChars = parsePositiveInteger(readRequiredOptionValue(argv, index, "--max-chars"), "--max-chars");
      index += 1;
      continue;
    }
    if (arg === "--max-input-file-bytes") {
      maxInputFileBytes = parsePositiveInteger(readRequiredOptionValue(argv, index, "--max-input-file-bytes"), "--max-input-file-bytes");
      index += 1;
      continue;
    }
    if (arg === "--include-tests") {
      includeTests = true;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--verbose") {
      verbose = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length !== 1) {
    throw new Error("Please specify exactly one repository path.");
  }
  if (!outputDirectory) {
    throw new Error("Please specify --output.");
  }

  return {
    repositoryPath: positional[0],
    outputDirectory,
    artifactPath,
    classIndexPath,
    docsDirectories,
    entryClass,
    includeTests,
    force,
    maxChars,
    maxInputFileBytes,
    verbose,
  };
}

export function printHelp(): void {
  console.log(`Usage:
  miku-repo-bundle <repo> --output <dir> [options]
  miku-repo-bundle --help
  miku-repo-bundle --version

Required:
  <repo>
      Path to a cloned repository to package as reference material.

  --output <dir>
      Final output folder. The folder must not already exist unless --force is
      specified.

Recommended:
  --artifact <jar>
      Copy an existing jar into the final output as <repo-name>-artifact.jar.
      Prefer this option whenever possible. miku-repo-bundle does not build the
      repository or choose a jar automatically.

  --class-index <jsonl>
      Include an existing class-index.jsonl in the text bundle input.
      Generate this before running miku-repo-bundle when class metadata is
      useful. Agent Skill workflows may create it with miku-javaclass2json-java.

Documentation:
  --docs <dir>
      Add an external documentation directory. Repeat this option to include
      multiple directories.

Options:
  --entry <class>
      Record the expected entry class in artifact notes and MANIFEST.md.

  --include-tests
      Include src/test/java in addition to src/main/java.

  --max-chars <number>
      Pass the part size limit to miku-text-bundle. Default: 120000.

  --max-input-file-bytes <number>
      Pass the per-file read limit to miku-text-bundle. Default: 1000000.

  --force
      Replace the selected output folder if it already exists.

  --verbose
      Print collection and subprocess progress.

  --help
      Show this help.

  --version
      Show the CLI version.

Output:
  <output>/
    MANIFEST.md
    text-bundle-000-prompt.md
    text-bundle-001.md
    ...
    text-bundle-999-index.md
    <repo-name>-artifact.jar
                            when --artifact is specified

Notes:
  Source code is folded into text-bundle-001.md and following part files.
  The artifact jar is a binary sidecar and is not included in the text bundle.
  miku-text-bundle must be available on PATH at runtime.
`);
}

export function printVersion(): void {
  console.log(CLI_VERSION);
}
