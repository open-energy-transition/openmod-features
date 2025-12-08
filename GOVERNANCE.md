<!--
SPDX-FileCopyrightText: openmod-features contributors

SPDX-License-Identifier: CC-BY-4.0
-->

# openmod-features Governance

## openmod-features Overview

This repository maintains a comprehensive feature inventory for open-source energy system modelling tools and use-cases.
The project is governed by a distributed maintainer model with both project-level maintainers and entry-specific maintainers (for individual tools and use-cases).
We operate on consensus-based decision making with clear processes for contribution and taxonomy evolution.

## openmod-features mission

Our mission is to support the _selection_ and _feature gap filling_ of open-source energy system modelling tools.
We aim to achieve this by providing a comprehensive and objective overview of open-source energy system modelling tools and the modelling workflows in which they are used.

## Team Structure

### Project Maintainers

Project maintainers oversee the repository infrastructure, feature taxonomy, and overall project direction.
An up-to-date list of project maintainers is defined at the project-level in CODEOWNERS.

**Lead Maintainer**: [Bryn Pickering] (@brynpickering)

- **Responsibilities**: Final decision tiebreaker, taxonomy evolution coordination, community leadership
- **Focus Area**: Overall project direction, governance
- **Contact**: [bryn.pickering@openenergytransition.org]

### Entry Maintainers

Entry maintainers are responsible for specific tool or use-case feature lists.
They **do not** need to be developers of the tool for which they are entry maintainers.
Each entry under `tools/` and `use-cases/` has designated maintainers listed in its `.metadata.yml` file and enforced via CODEOWNERS.

**Responsibilities:**

- Review and approve updates to their specific feature list
- Ensure feature sources are valid and up-to-date
- Update their entry when the feature taxonomy evolves
- Respond to issues and questions about their entry
- Participate in taxonomy discussions relevant to their category (tools or use-cases)
- Review new submissions within their category when invited
- Contribute to consensus decisions on taxonomy changes

**Becoming an Entry Maintainer:**

- Submit a new tool or use-case entry via PR
- List yourself and any co-maintainers in the submission
- All listed maintainers must explicitly approve in PR comments
- Upon merge, all listed maintainers become the maintainers for that entry
- Project maintainers may also be entry maintainers.

### Project Maintainer

**Responsibilities:**

Project maintainers share:

- Repository infrastructure maintenance
- Feature taxonomy evolution
- Coordinating taxonomy update notifications to entry maintainers
- Final review of new tool/use-case submissions
- Issue triage and community support
- Release management and versioning
- New contributor mentoring
- Facilitating consensus on taxonomy changes

**Becoming a Project Maintainer:**

A project maintainer should meet the following requirements:

- 3+ months of consistent, quality contributions
- Deep understanding of feature taxonomy and project goals
- Positive community interactions and mentoring
- Availability for ongoing responsibilities (2-4 hours/month)
- Unanimous approval from existing project maintainers

The process for appointing a new project maintainer is:

1. **Proposal**: Any project maintainer can nominate a contributor.
1. **Discussion Period**: 2-week maximum private discussion period
1. **Notification**: All entry maintainers are notified by the project maintainers
1. **Decision**: If approved and the invitation is accepted, the new maintainer will be announced on a GitHub discussion board.
   otherwise, the process will remain private.

## Decision Making Process

Entry and project maintainers should not represent other organisations or open-source projects when contributing to decision-making. Instead, discussion contributions should be based on individual and neutral expertise.
Any potential conflicts of interest should be highlighted when contributing to discussions.

### Consensus Decisions (All project maintainers + participating entry maintainers must agree)

**Feature Taxonomy Changes:**

- Adding, removing, or renaming features in the taxonomy
- Changing feature definitions or categorization
- Major restructuring of the feature hierarchy

**Project Governance Changes:**

- Changes to this governance document
- Adding or removing project maintainers
- Major changes to contribution processes
- License changes

#### Consensus decisions process

1. **Proposal**: Any contributor opens an issue or discussion proposing the change
1. **Discussion Period**: 2-week discussion period unless consensus is reached earlier.
1. **Notification**: All entry maintainers are notified by the project maintainers
1. **Decision**: Project maintainers and entry maintainers discuss and refine.
   If consensus is reached by those participating in the discussion in the minimum period, change is approved
1. **Disagreement**: If consensus cannot be reached after discussion, a formal vote is called.
   Votes are cast as Issue reactions or Pull Request reviews, depending on the stage of the decision.

### Project Maintainer Decisions (1+ project maintainers agree)

**Repository Infrastructure:**

- CI/CD pipeline changes
- Validation tooling updates
- Documentation structure changes
- Release versioning and tagging

**Community Policies:**

- Contribution guideline updates
- Code of conduct enforcement
- Communication channel management

**New Submissions:**

- New use-cases
- New feature lists

#### Project-level decisions process

1. **Proposal**: Any contributor opens an issue or discussion proposing the change
1. **Discussion Period**: No minimum period
1. **Notification**: project maintainers are automatically notified
1. **Decision**: At least one approving Pull Request review from a maintainer that is not the PR author.
   Security, vulnerability, and minor bug fixes may be merged without this review requirement to be met.
1. **Disagreement**: If there is disagreement, the decision will revert to the consensus decision-making process, with entry maintainers invited to contribute.

## Communication Channels

### Project Maintainer Communication

- **Monthly Meetings**: Google meet or Discord (by invitation)
- **Async Discussion**: GitHub Issues
- **Private Channel**: Discord channel (by invitation)
- **Emergency**: Email the [lead maintainer](#project-maintainers)

### Entry Maintainer Communication

Entry maintainers will receive GitHub notifications for:

- PRs affecting their entries
- Issues mentioning their entries
- Taxonomy change proposals
- New submissions in their category (when invited to review)

Discussion happens through GitHub Issues.
Entry maintainers are tagged in relevant issues and PRs.

### Community Communication

Community members use the following channels:

- **Issues**: Bug reports, feature requests, questions about entries, taxonomy proposals, use-case discussions, general feedback
- **Discussions**: Discussions are generally reserved for announcements
- **Pull Requests**: Feature list updates, new submissions
- **Email**: Contact the [lead maintainer](#project-maintainers) for private matters

## Meeting Structure

Entry maintainers are not required to attend regular meetings but will be notified and invited to participate in taxonomy discussions.
Project maintainers will meet monthly to sync on:

- Roadmap review and updates
- Resource allocation
- Community health metrics
- Process improvements
- Governance effectiveness

## Inactive Maintainers

### Inactive Entry Maintainers

If an entry maintainer becomes unresponsive:

1. **Notification**: After 2 weeks of no response to critical issues/PRs
2. **Backup Maintainer**: Other listed maintainers can approve changes
3. **Project Maintainer Intervention**: After 1 month, project maintainers may approve updates
4. **New Maintainer**: Community can propose new maintainer after 3 months
5. **Archival**: Entry may be moved to archive after 6 months of inactivity

### Inactive Project Maintainers

If a project maintainer becomes inactive:

1. **Check-in**: Other maintainers reach out privately
2. **Temporary Leave**: Maintainer can request leave of absence
3. **Resignation**: Voluntary or after 3 months of unresponsiveness
4. **Replacement**: Follow normal process for adding new project maintainer.
   If the lead maintainer becomes inactive, the most senior project maintainer (by time in position) will become the lead maintainer.

---

This governance structure reflects our distributed maintainer model and will be reviewed annually for effectiveness and necessary adjustments.
Last updated: November 2025
