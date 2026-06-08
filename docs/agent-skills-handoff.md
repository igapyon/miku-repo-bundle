# Agent Skills Handoff

This handoff is for creating a future `miku-repo-bundle` Agent Skills package.

The Java version is intentionally out of scope for the next step. The immediate
target is an Agent Skill workflow over the current TypeScript / Node.js
`miku-repo-bundle` CLI and related local tools.

## Current CLI Contract

`miku-repo-bundle` is a narrow reference bundle assembler.

It does:

- collect repository metadata
- collect source files and repository documents
- include external documentation directories
- accept an explicitly supplied jar with `--artifact <jar>`
- copy that jar to the final output as `<repo-name>-artifact.jar`
- accept an explicitly supplied class index with `--class-index <jsonl>`
- generate artifact notes and checksum
- call `miku-text-bundle`
- write `MANIFEST.md`

It does not:

- build the repository
- choose a jar automatically
- call `miku-javaclass2json-java`
- upload output to an AI service
- tune size options by trial and error

## Skill Goal

The Agent Skill should fill the operational gap around the small CLI.

The user-facing goal is:

> Given a local repository, prepare an AI-ready repository reference folder with
> source/docs text bundles and an optional binary jar sidecar.

The skill should make the multi-command workflow easy, explicit, and
recoverable.

## Expected Skill Operations

### Inspect Repository

Inspect the target repository and report:

- repository path
- detected build files
- likely Java source roots
- likely documentation directories
- likely jar candidates, if any
- whether `miku-text-bundle` is available
- whether `miku-javaclass2json-java` is available

### Prepare Artifact

If the user supplies a jar, validate it.

If no jar is supplied, the skill may help locate candidates such as:

- `target/*.jar`
- `build/libs/*.jar`
- distribution or all-in-one jars

If the user explicitly wants a build, the skill may run Maven or Gradle outside
`miku-repo-bundle`. The skill should explain that build behavior is outside the
CLI responsibility.

### Prepare Class Index

When an artifact jar is available and `miku-javaclass2json-java` is available,
the skill may generate:

```text
workplace/miku-repo-bundle/class-index.jsonl
```

The generated file should be passed to `miku-repo-bundle` with
`--class-index <jsonl>`.

If class index generation fails, the skill should report the failure and ask
whether to continue without `--class-index`.

### Create Reference Bundle

The skill should call the CLI with a command like:

```bash
miku-repo-bundle ./repo \
  --output ./workplace/miku-repo-bundle/repo-reference \
  --artifact ./repo/target/app.jar \
  --class-index ./workplace/miku-repo-bundle/class-index.jsonl \
  --docs ./external-docs
```

Use `--force` only when replacing a known previous output folder.

Tune `--max-chars` and `--max-input-file-bytes` only when the first run reports
size-related problems. Do not guess large limits without a reason.

### Explain Output

After successful creation, summarize:

- output folder
- text bundle files
- artifact sidecar file name
- whether class index was included
- skipped files or warnings from `text-bundle-999-index.md`
- suggested AI handoff prompt

## Suggested AI Handoff Prompt

```text
This folder is a repository reference bundle.
Read MANIFEST.md first.
The source code is included in text-bundle-001.md and following text bundle
parts.
The repo-name artifact jar is binary reference material. Prefer artifact notes
and the class index, when provided in the text bundle, before reasoning from the
jar.
Do not modify files from this bundle.
```

## Runtime Lookup Order

The skill should prefer explicit user-provided paths first.

Suggested lookup order:

1. User-provided command or path
2. Skill-local bundled runtime artifact, if the future skill ships one
3. Repository-local `node_modules/.bin` or documented local install
4. `PATH`
5. Clear missing-runtime diagnostic

For the first Agent Skills version, it is acceptable to require local CLI
availability instead of bundling runtimes.

## Java Version

Do not start the Java version in this phase.

The future Java version can be considered after the Node CLI and Agent Skill
workflow are stable enough to justify straight conversion or a Java companion.

## References

- [README](../README.md)
- [Agent Skill Workflow](agent-skill-workflow.md)
- [miku-soft Reference](miku-soft-reference.md)
