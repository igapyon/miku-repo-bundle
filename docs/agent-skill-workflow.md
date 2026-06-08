# Agent Skill Workflow

This memo records the intended relationship between `miku-repo-bundle` and a
future Agent Skill workflow.

## Position

`miku-repo-bundle` should stay small.

The CLI assembles repository reference material into a predictable output
folder. It should not become a build orchestrator, jar selector, class-index
generator, upload helper, or retry controller.

This narrow CLI responsibility is intentional. The workflow around repository
reference bundling often requires situational judgment, and that is where an
Agent Skill can add the most value.

## CLI Responsibility

The CLI should handle deterministic assembly:

- read repository metadata
- collect source files and repository documents
- include external documentation directories
- copy an explicitly supplied jar as `<repo-name>-artifact.jar`
- include an explicitly supplied `class-index.jsonl`
- generate artifact notes and checksum
- generate `MANIFEST.md`
- invoke `miku-text-bundle` to create `text-bundle-*.md`

The CLI should fail clearly when required inputs or runtime tools are missing.

## Agent Skill Responsibility

An Agent Skill can handle the higher-level workflow:

- inspect the repository shape
- find or recommend jar candidates
- decide whether a build should be attempted outside `miku-repo-bundle`
- run Maven or Gradle when the user explicitly wants that workflow
- run `miku-javaclass2json-java` to generate `class-index.jsonl`
- discover useful external or repository-local docs
- choose `miku-repo-bundle` options
- retry with adjusted `miku-text-bundle` size options when appropriate
- explain the final output folder and suggested AI handoff prompt

These steps require judgment and local context. Keeping them in the Agent Skill
avoids turning the CLI into a large policy engine.

## Intended Flow

```text
Agent Skill
  ├─ inspect repository
  ├─ prepare or select artifact jar
  ├─ generate class-index.jsonl when useful
  ├─ choose docs and size options
  └─ call miku-repo-bundle

miku-repo-bundle
  ├─ collect deterministic reference material
  ├─ call miku-text-bundle
  ├─ write MANIFEST.md
  └─ place <repo-name>-artifact.jar as a sidecar
```

## Design Reasoning

Running the full workflow manually can be tedious. A user may need to inspect
the repository, find the right jar, decide whether to build, generate a class
index, choose documentation directories, tune text bundle sizes, and then pass
the final folder to an AI tool.

Those are useful Agent Skill tasks. The CLI should provide a small, reliable
assembly primitive that the skill can call repeatedly.

This split keeps `miku-repo-bundle` easy to test while still making the overall
workflow convenient.
