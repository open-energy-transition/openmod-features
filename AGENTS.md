<!--
SPDX-FileCopyrightText: openmod-features contributors

SPDX-License-Identifier: MIT
-->
# Agent instructions

This repository holds feature lists for open energy system modelling tools and use-cases.
All lists use one shared taxonomy, so a use-case's required features map to a tool's available features.

## Repository layout

- [`features.yaml`](./features.yaml): the taxonomy.
  Each leaf description is the definition of that feature.
- [`schema/`](./schema/): JSON schemas generated from the taxonomy (`tool-schema.yaml`, `use-case-schema.yaml`).
  Do not edit them by hand. Run `pixi run update-schema`.
- [`tools/<shortname>/`](./tools/): one tool feature list (`features.yaml`) and its Copier metadata (`.metadata.yml`).
- [`use-cases/<shortname>/`](./use-cases/): one use-case feature list (`features.yaml`) and its Copier metadata (`.metadata.yml`).
- [`template/`](./template/): Copier templates for new lists.
- [`website/`](./website/): the dashboard.
  Its data is generated from the lists.

## Preparing a tool feature list

Follow [AGENT_PROMPTING.md](./AGENT_PROMPTING.md).
It contains the complete task prompt: value definitions, evidence rules, commonly confused leaves, procedure, and report format.
If the user gives no tool coordinates (repository, documentation, version), ask for them before you start.

Key rules, in short:

- Create a new list with `pixi run add-tool <shortname>`.
  Never write the YAML structure by hand.
- Edit only leaf `value` / `source` fields, the `version` field, and comments.
- Never edit `.metadata.yml` by hand. Use `pixi run update-tool-metadata <shortname>`.
- Every `y` needs a source that you opened in the session, pinned to the assessed version.
- If the evidence is not sufficient, use `?`.

## Preparing a use-case feature list

- Create a new list with `pixi run add-use-case <shortname>`.
- A use-case leaf has only a `value`: `y` (required), `n` (not required), or `?`.
  It has no `source`.
- Write the `assumptions` list first.
  Each `y` must follow from an assumption, and each assumption must be specific enough to decide the leaves it affects.
- Read the taxonomy description of each leaf, as for tools.
  Mark a leaf `y` only if the use-case cannot be done without it.
- See the lists in [`use-cases/`](./use-cases/) for style.

## Checks

Run these before you finish:

```bash
pixi run pre-commit run --files <changed files>
pixi run check-links <shortname>   # tool lists only
pixi run test                      # if you changed the taxonomy, schemas, scripts or templates
```

## Rules for all changes

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md).
  Taxonomy changes need an agreed issue first, and must keep the ordering conventions described there.
- Each new file needs an SPDX header (the `reuse-lint-file` hook checks this).
- Use `pixi` to run all commands.
