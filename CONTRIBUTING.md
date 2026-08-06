<!--
SPDX-FileCopyrightText: The Good Docs Project
SPDX-FileCopyrightText: openmod-features contributors

SPDX-License-Identifier: MIT
-->
# openmod-features Contributing Guide

## Welcome

Welcome to the Open Energy Modelling Tool Feature List (openmod-features) Contributing Guide, and thank you for your interest.

If you would like to contribute to a specific part of the project, check out the following list of contributions that we accept:

- [Contributing a new tool or use-case feature list](#adding-a-new-tool-or-use-case)
- [Updating an existing tool or use-case feature list](#updating-an-existing-entry)
- [Contributing to the feature list taxonomy](#proposing-taxonomy-changes)
- [Contributing to the project infrastructure and documentation](#general-contributions)

### Adding a new Tool or Use-Case

Tool feature lists specify the features available in a given energy system modelling tool.
Use-case feature lists specify the features required for a given modelling workflow.
Both lists are based on the same underlying feature taxonomy so we are able to map between the features modellers *need* and those that tools have *available*.
Ultimately, this can be used to identify tool **feature gaps**.

1. **Initiate**: [Fork and clone the repository](#fork-and-clone-repositories).
   Run `pixi run add-tool <shortname>` or `pixi run add-use-case <shortname>`
1. **Configure**: Provide tool/use-case metadata and list all maintainers
1. **Complete**: Fill out the feature list in `features.yaml` with sources by updating the `value` key of each feature to `y` (yes) / `n` (no) /`dev` (in development).
   Sources should be links to documentation or source code for any features that are available.
   Features in development could be linked to e.g., Pull Requests or academic publications.
1. **Submit**: Open a PR with your new entry
1. **Review**:
   - All listed maintainers must explicitly approve in PR comments
   - One project maintainer reviews and approves
   - Entry maintainers from the same category may be invited to review
1. **Merge**: Upon approval, entry is merged and list maintainers are added to CODEOWNERS to be automatically notified of proposed updates to the list in future.

>[!NOTE]
>List maintainers do **not** need to be tool maintainers.
>Their sole responsibility is to maintain this list.
>For more information, see our [governance](./GOVERNANCE.md) document.

>[!NOTE]
>You do not *need* a source to validate your response to a feature, whether that response is `y`/`n`/`dev`.
>Features without sources will be flagged accordingly in our feature list platform.
>
>You can also add multiple sources if it will support users to better understand the feature.
>Features with multiple sources will have all those sources linked to that feature in our feature list platform.

>[!NOTE]
>A feature value states that a capability *exists*, not that it performs well at real-world scale.
>Computational performance / tractability at scale cannot be validated against documentation links and is therefore out of scope for feature values; benchmarking of tools at scale is tracked as a separate initiative.

### Updating an Existing Entry

If you are the entry maintainer:

1. Update `features.yaml` directly
2. Run link checker: `pixi run check-links <shortname>`
3. Open PR (auto-assigned to you via CODEOWNERS)
4. Merge after link validation passes

If you are not the entry maintainer:

1. Open an Issue describing the suggested change
1. Entry maintainer reviews and either:
   - Makes the change themselves, or
   - Invites you to submit a PR
1. Entry maintainer reviews and approves PR

### Proposing Taxonomy Changes

The [feature list taxonomy](./schema/features.yaml) is a living document that we aim to improve upon with community contributions.
However, each change will affect all tool and use-case lists and so requires discussion before being implemented.
Therefore, all taxonomy change proposals should begin as an Issue:

1. **Open Issue**: Describe the proposed change with rationale
1. **Discuss and build consensus**: Community and maintainers discuss with the aim of building consensus, reverting to a vote if none can be found (see our [governance document](./GOVERNANCE.md) for more information).
1. **Implementation**: [Fork and clone the repository](#fork-and-clone-repositories) and make your change.
   Then open a Pull Request, referencing the discussion Issue.
1. **Entry Updates**: Entry maintainers will be notified at the next release round to update their lists to the new taxonomy

### General contributions

Documentation, tooling, tests, and other contributions follow this process:

- [Fork and clone the repository](#fork-and-clone-repositories)
- Submit PR with clear description
- One project maintainer approval required
- Auto-merge after CI passes for minor fixes

>[!NOTE]
>Changes to some documents require more rigorous review.
>Refer to our [governance document](./GOVERNANCE.md) for more information.

## openmod-features overview

The purpose of this project is to collate information on the tool features required by energy modellers and those that can be met by open energy system modelling tools.

## Ground rules

Before contributing, read our [Code of Conduct](./CODE_OF_CONDUCT.md) to learn more about our community guidelines and expectations.

## Community engagement

We conduct all community engagement directly on GitHub.
You can find discussions taking place in Issues and Pull Requests and announcements in Discussions.

## Share ideas

To share your new ideas for the project, perform the following actions:

1. Check whether there is an Issue already open which shares the same or similar idea
2. If there is, add to it with a reaction or a comment
3. If there isn't, open your own issue and follow the template to fill in the necessary details.

## Environment setup

To set up your environment, perform the following actions:

- Install [pixi](https://pixi.prefix.dev/latest/)
- Install pre-commit: `pixi run pre-commit install`

## Best practices

Our project uses [PEP 8 style guide](https://peps.python.org/pep-0008/) as our guide for best practice for all Python scripts.
We use the [Google Markdown style guide](https://google.github.io/styleguide/docguide/style.html) for our documentation pages.
Reference the guides to familiarize yourself with the best practices we want contributors to follow.
We have embedded PEP 8 style adherence, and a number of other best practices in our [pre-commit configuration file](./.pre-commit-config.yaml).

## Contribution workflow

### Fork and clone repositories

Refer to the GitHub documentation on how to [fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) and [clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) the repository.

### Report issues and bugs

To report a problem, [open an Issue](https://github.com/open-energy-transition/openmod-features/issues/new/choose).
You will be prompted to select an Issue type and then to fill in specific sections.
Try to provide as much information as possible when reporting a problem.

### Issue management

Issues associated with feature lists should be assigned to the specific list maintainers.
All others should be assigned to the project maintainers.
These may be later triaged during periodic Issue reviews.

### Commit messages

Commit messages should have a concise first line briefly describing the contribution, followed by a bullet point list of short items for additional context.
Contributions will be squashed on merge and these bullet point lists will be combined during that process.

### Branch creation

For new tool / use-case lists, name your branches `add-tool-<tool-name>`/`add-use-case-<use-case>`.
For feature list modifications, prefix your branch names with `feat/`.
For bug fixes, prefix your branch names with `fix/`.

### Pull requests

Pull Requests (PRs) should generally be opened in response to an Issue.
Therefore, the first line of the PR description should reference the Issue being closed by the contribution.

Pull Request descriptions have a standard template.
Contributors should refer to the checklist in the template and ensure they have met the requirements for their contribution.

### Releases

Releases will take place on an approximately quarterly basis.
We follow calendar versioning with our releases.

First, a pre-release version will be created in which the feature list is frozen.
If there have been changes to the feature list since the previous version, list maintainers will be notified to update their lists to conform to the pre-release version.
After one month since pre-release, all lists that updated to the pre-release version will be updated at once to be tagged to the release version and the release will be made.

>[!NOTE]
>Any lists that did not update to the pre-release will not be tagged with the new release version.
>This may mean that they do not appear in the feature list dashboard as their feature schema does not conform to that used on the platform.

---

This Changelog is adapted from the [The Good Docs Project](https://thegooddocsproject.dev/) and is licensed under MIT.
