#!/usr/bin/env node
import { createRepoBundle } from "./bundler.js";
import { HelpRequestedError, parseArgs, printHelp, printVersion, VersionRequestedError } from "./cli.js";

function main(argv: string[]): number {
  try {
    const options = parseArgs(argv);
    const result = createRepoBundle(options);
    const artifact = result.artifactFileName ? `, artifact=${result.artifactFileName}` : "";
    console.log(`completed: ${result.textBundleFiles.length} text bundle file(s), artifactCopied=${result.artifactCopied}${artifact}, output=${result.outputDirectory}`);
    return 0;
  } catch (error) {
    if (error instanceof HelpRequestedError) {
      printHelp();
      return 0;
    }
    if (error instanceof VersionRequestedError) {
      printVersion();
      return 0;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
