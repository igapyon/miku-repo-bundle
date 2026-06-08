export type CliOptions = {
  repositoryPath: string;
  outputDirectory: string;
  artifactPath?: string;
  classIndexPath?: string;
  docsDirectories: string[];
  entryClass?: string;
  includeTests: boolean;
  force: boolean;
  maxChars: number;
  maxInputFileBytes: number;
  verbose: boolean;
};

export type RepoMetadata = {
  name: string;
  branch: string;
  commit: string;
  path: string;
};

export type BundleResult = {
  outputDirectory: string;
  textBundleFiles: string[];
  artifactCopied: boolean;
  artifactFileName?: string;
};
