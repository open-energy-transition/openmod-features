<!--
SPDX-FileCopyrightText: openmod-features contributors

SPDX-License-Identifier: MIT
-->
# Completing a tool feature list with an AI agent

This guide is for people who use an AI coding agent (for example, Claude) to complete a tool's `features.yaml`.
It gives a ready-to-use prompt.
It tells you what to give the agent with the prompt.
It tells you what to check before you trust the result.

A feature list that an agent completes is a **draft**.
The agent makes the search for evidence in documentation and code faster.
Humans make the final decision on each value, ideally people who know the tool.

## Why the prompt has this structure

Feature lists fail in predictable ways.
The prompt below blocks each failure:

- **Over-claiming.**
  Agents like to say "yes".
  A wrong `y` is worse than a `?`.
  A `?` means "check this later", but a wrong `y` misleads everyone who compares tools.
  Thus, the prompt makes `?` the safe default, and every `y` must have evidence that the agent has read.
- **Using feature names instead of definitions.**
  A taxonomy name is only a short label.
  The descriptions in the [taxonomy](./features.yaml) are the definitions.
  Many descriptions set boundaries ("X is instead feature Z") that the name does not show.
  The prompt makes the agent read the description before each answer.
- **Confusing "the tool can do it" with "a user did it once".**
  A feature is `y` only if it works in a released version without changes to the tool's source code.
  A fork, a custom script, or a one-off academic study does not make the core tool a `y`.
- **Invented links.**
  Agents can make URLs that look correct but do not exist.
  The prompt lets the agent cite only pages that it opened in the session.
- **Generalising across siblings.**
  "The tool has storage, so it has all storage-related leaves" is a frequent mistake.
  Each leaf gets its own verdict and its own evidence.
- **Treating leaves as alternatives.**
  This is the opposite mistake.
  One capability can satisfy several leaves.
  For example, a system-wide annual CO2 cap is both `constraints.scope.temporal.cumulative.operation.impact_budget` and `constraints.scope.spatial.operation`.
  Both leaves get a `y` that cites the same page.

## Before you start

Prepare these items.
Paste them into the prompt, or put them in the agent's working directory:

1. **The taxonomy**: [`features.yaml`](./features.yaml) in the repository root.
   It contains the definitions that the agent must use.
   The JSON schema that validates tool lists is [`schema/tool-schema.yaml`](./schema/tool-schema.yaml).
2. **The pre-filled entry**: run `pixi run add-tool <shortname>`.
   This creates `tools/<shortname>/features.yaml` with each leaf set to `?`, and `tools/<shortname>/.metadata.yml`.
   The agent edits `features.yaml` only.
   It does not change the structure.
3. **Tool coordinates**: the source repository URL, the documentation root URL, and the **exact released version** to assess.
4. **Optional items** that improve coverage: the issue tracker, known forks, companion tools (for example, a GUI or a data pipeline), and academic papers that describe the tool.
5. **Reference lists**: completed lists such as [`tools/calliope/features.yaml`](./tools/calliope/features.yaml) and [`tools/pypsa/features.yaml`](./tools/pypsa/features.yaml) show the expected style of sources and comments.

The agent must be able to read files, run commands, search the web, and fetch web pages.

## The prompt

Copy the block below.
Replace the `{{PLACEHOLDERS}}`.
Give it to your agent.

```text
# TASK

Complete the feature list for the energy system modelling tool "{{TOOL_NAME}}"
by editing tools/{{TOOL_SHORTNAME}}/features.yaml in place, in the
openmod-features repository.

Tool coordinates:
- Source repository: {{REPO_URL}}
- Documentation root: {{DOCS_URL}}
- Version under assessment: {{VERSION_TAG}} (a released version; assess ONLY this version)
- Issue tracker: {{ISSUES_URL}}
- Known forks (may be empty): {{FORK_URLS}}
- Companion tools and their versions (may be empty): {{COMPANION_TOOLS}}
- Relevant publications (may be empty): {{PAPER_URLS_OR_DOIS}}

# FILES

- Taxonomy (the definitions): features.yaml in the repository root.
- JSON schema for tool lists: schema/tool-schema.yaml.
- File you edit: tools/{{TOOL_SHORTNAME}}/features.yaml.
- Do NOT edit tools/{{TOOL_SHORTNAME}}/.metadata.yml. Copier manages it.
- Style references: tools/calliope/features.yaml, tools/pypsa/features.yaml.
- Contribution rules: CONTRIBUTING.md ("Adding a new Tool or Use-Case").

# OUTPUT CONTRACT

- Edit only the `value` and `source` fields on the LEAVES of the existing YAML
  tree, and the top-level `version` field. Never add, remove, or rename keys.
  Never change nesting.
- Set `version` to '{{VERSION_TAG}}' (quoted).
- `value` must be exactly one of: y, n, dev, ?
- `source` must be a YAML list of URLs. Where one URL evidences several leaves,
  repeat it on each leaf.
- Add a short YAML comment above `value` on any leaf where the verdict needs
  context: what the source shows, a partial match, a needed configuration, or
  a companion tool. Do not add comments that only repeat the description.
- Add a header comment below the `yaml-language-server` line. It must state
  the assessed version and its release date, and each companion tool counted
  with its version.
- Keep the SPDX header and the `yaml-language-server` line unchanged.
- The file must stay valid against the schema.

# VALUE DEFINITIONS — apply these rules exactly

y   The feature works in the released version {{VERSION_TAG}} without changes
    to the tool's source code. Configuration, input data, and the tool's own
    documented extension points count as "without changes".
    REQUIRED: at least one source URL that you OPENED IN THIS SESSION and
    that shows the feature (documentation page, source file permalink, or
    test file permalink). Link to the relevant section anchor or line range.
    Pin documentation links to the version (e.g. /en/{{VERSION_TAG}}/) where
    the docs host has versioned pages. Pin source-code links to the version
    tag or a commit hash, never to a default branch.

dev The feature is being actively added: an open pull request, a development
    branch, unreleased changes on the default branch, or an explicit
    roadmap/issue commitment by the maintainers.
    REQUIRED: a source URL to the PR, branch, issue, or roadmap item.

n   You have POSITIVE evidence that the feature is absent. Missing
    documentation alone is not enough. Acceptable evidence: an open feature
    request for it; a fork or third-party extension that exists to add it;
    documentation that states the limitation; or a targeted search of docs
    AND source code AND issue tracker that found nothing (record in your
    notes what you searched for). Cite the feature request or limitation
    statement as `source` where one exists.

?   You could not establish any of the above with confidence. This is the
    correct answer when evidence is missing or ambiguous, or when you could
    not reach a page. A `?` is always acceptable. A wrong `y` or `n` is not.

# EVIDENCE RULES

1. Read the feature DESCRIPTION in the taxonomy before you assign a value.
   The description is the definition. The feature name is NOT.
   Descriptions contain scope boundaries and cross-references in backticks.
   Follow them. "Usually requires `X`" means: check X first; a `y` here with
   an `n` on X needs a comment that explains why.
2. Evidence strength, strongest first:
   a. A test in the tool's test suite that exercises the feature.
   b. Documentation that shows the feature with configuration/API detail.
   c. Source code that implements the feature.
   d. Issue tracker / PRs (primary evidence for `dev` and `n`).
   e. Academic publications: NEVER sufficient alone for `y`. Papers often
      describe custom extensions, couplings, or old versions. A paper may
      only support a `y` that already has docs/code/test evidence, or give
      context for `dev`/`n`. Always check which tool version a paper used.
3. A fork that exists to add a capability is evidence that the capability is
   ABSENT upstream. The core tool is `n` (or `dev` if upstreaming is in
   progress), never `y`.
4. Cite only URLs that you fetched and read in this session. If a page is
   unreachable, the leaves that depend on it stay `?`. Never build a URL from
   a guessed pattern.
5. User-written custom mathematics: if a feature is possible ONLY through
   user-defined constraints, it is `y` for `math.user_defined_math`. It is NOT
   `y` for the specific physical/economic leaf, unless the tool ships it
   natively or documents it as a supported worked example (then add a
   comment that says so).
6. No sibling inference: each leaf gets its own verdict from its own
   evidence, even when siblings differ only by `investment`/`operation`,
   `input`/`output`, `build`/`run`/`analyse`, or
   `temporal`/`spatial`/`assets`/`scenarios`. These splits exist because
   tools differ on them.
7. Leaves are not alternatives: one capability can satisfy several leaves
   (e.g. a constraint leaf in `constraints.scope.temporal.*` AND one in
   `constraints.scope.spatial.*`). Assess each leaf that the capability
   could match.
8. Companion tools (a separate project for use with the tool, e.g. a GUI or
   data pipeline) count only if (a) the companion tool is open source when
   the tool is open source, and (b) the tool's docs reference it, or its own
   docs show it working with the tool. Name the companion tool and its
   assessed version in a comment on each leaf it supports, and pin sources
   to that version. A capability only in an unreleased companion tool is
   `dev`. A capability only in a companion tool that fails (a) or (b) is
   `n`, with a comment that says why.
9. A value states that a capability EXISTS. Performance or tractability at
   real-world scale is out of scope. Do not downgrade a leaf because the
   feature may be slow.

# COMMONLY CONFUSED LEAVES — check both before assigning either

- Endogenous maintenance scheduling (decisions.operation.
  maintenance_scheduling) vs exogenously fixed outage windows
  (constraints.scope.temporal.pointwise.operation.forced_offline).
- Exact unit commitment (decisions.operation.unit_commitment) vs its
  linearised approximation (tractability.reformulation.
  linearised_unit_commitment).
- Simple inter-regional transfer limits (processes.spatial_transfer) vs
  network physics (network.power_flow.*, network.hydraulic_flow.*).
- Generic slack-plus-penalty mechanism (constraints.soft_constraints) vs
  built-in penalty/reward on deviation from a reference level
  (cost.functional_form.threshold_deviation.*).
- Reliability limits INSIDE the optimisation (constraints.reliability.*) vs
  post-hoc reliability metrics (postprocessing.metrics.
  probabilistic_reliability_assessment.*) vs uncertainty-aware problem
  structure (uncertainty.*).
- Batch runs of named scenarios (orchestration.scenario_runs) vs sampled run
  ensembles (orchestration.sampled_runs) vs scenarios inside one stochastic
  problem (uncertainty.two_stage_stochastic, uncertainty.
  multi_stage_stochastic).
- Limits on decisions (constraints.scope.*) vs costs on decisions
  (cost.scope.*). The two branches mirror each other; assess each.
- Generic user extension (math.user_defined_math) vs a built-in feature
  (any other leaf). See evidence rule 5.

# PROCEDURE

1. Read the taxonomy (features.yaml) in full. Note each cross-reference and
   scope boundary relevant to the tool's domain.
2. Read tools/{{TOOL_SHORTNAME}}/features.yaml to learn the exact leaf
   structure. Read one style reference list.
3. Breadth pass: work through the taxonomy one top-level branch at a time,
   in file order (processes, network, decisions, constraints, cost, ...).
   For each leaf: search the documentation first, then source code and
   tests, then the issue tracker. Record for each leaf in a notes file
   OUTSIDE the repository: claim -> evidence URL(s) -> verdict.
4. Verification pass: re-check EACH leaf that you marked `y`. Try to refute
   it: does the cited page show this feature as the taxonomy description
   defines it, in version {{VERSION_TAG}}, without source code changes?
   Downgrade to `?` (or `n`/`dev`) each leaf that does not pass.
5. Write the results into the YAML file. Then run:
     pixi run pre-commit run validate-yaml-schemas --files tools/{{TOOL_SHORTNAME}}/features.yaml
     pixi run check-links {{TOOL_SHORTNAME}}
   Fix all schema errors. For each broken link, find the correct page or
   remove the link; if no evidence remains, set the leaf to `?`.
6. Report: a table of counts per value (y/n/dev/?), a list of each leaf left
   `?` with one line on the missing evidence, and a list of each `y` that you
   are not fully confident in.

# STANCE

You are a skeptical auditor, not an advocate for the tool. The tool's
maintainers will review your output. Unsupported claims damage trust in the
whole list. When you must choose between two values, choose the more
conservative one (`?` over `n`/`dev`, `n`/`dev` over `y`).
```

## After the agent finishes

Do not merge the output without review.
Do these checks:

1. **Validate**: run the schema and link checks from step 5 of the prompt.
2. **Spot-check the risky verdicts**, in this order:
   - each `y` whose only source is a paper, a repository landing page, or a documentation home page. These are the most likely over-claims.
   - each `n`. Make sure that the evidence shows absence, not only missing documentation.
   - each leaf that cites a companion tool. Make sure that the companion tool meets the conditions in [CONTRIBUTING.md](./CONTRIBUTING.md).
   - a random sample of other `y` values. Open the link and make sure that it shows the feature as the taxonomy *description* defines it, not as the feature *name* suggests.
3. **Use the `?` list as a to-do list**: send these questions to the tool's developers.
   They can often answer them in minutes.
4. **Record the version**: the agent assessed one released version.
   Make sure that the `version` field and the header comment state it, and state it in your pull request.

## Tips

- **Run it in parts if necessary.** The taxonomy has more than two hundred leaves.
  If the agent's context is too small, run the same prompt once per top-level branch ("complete only the `constraints` branch").
  Keep one shared notes file between runs.
- **Use a second agent for verification.** For more rigour, give a second agent only step 4 of the procedure on the first agent's output.
  Tell it to try to refute each `y`.
- **Tool developers get better results.** The prompt works for third parties.
  But a person who knows the tool can pre-fill the easy verdicts and let the agent focus on finding sources.
