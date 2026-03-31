<!--
SPDX-FileCopyrightText: openmod-features contributors

SPDX-License-Identifier: MIT
-->

<!---
Changelog headings can be any of:

Added: for new features.
Changed: for changes in existing functionality.
Deprecated: for soon-to-be removed features.
Removed: for now removed features.
Fixed: for any bug fixes.
Security: in case of vulnerabilities.

Release headings should be of the form:
## YEAR-MONTH-DAY
-->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Removed

- Removed "a.k.a." in feature descriptions in preparation for a separate `also_known_as` option.

### Changed

- Updated `asset__chaining.stockpiling` feature description to better distinguish it from general storage asset representation (#31).
- Moved `asset__candidates.endogenous` and `asset__candidates.exogenous` to `asset__capacity_representation` and expanded `endogenous` to `continuous_capacity`, `integer_investment_exogenous_capacity`, and `integer_investment_continuous_capacity` (#54).
- Moved `asset__capacity_representation` items into a new `asset__resolution` group to clarify their purpose, as features related to asset detail (#54).
- Default feature value to `null` (i.e., unknown) rather than `n` (i.e. not present).
- Renamed `ldc` -> `load_duration_curve`, `fluid/gas_distribution` -> `fluid_or_gas_distribution`, `fcf` -> `future_cost_function`.
- Simplified `asset__operating_constraints` by grouping features that span the time dimension (ramping, run up, etc.) into a `inter_temporal` feature.
- generalised `asset__operating_constraints.load_rate` into a `asset__operating_constraints.operating` feature for unit-commitment constraints.

### Added

- Added `baseline` for every feature value to differentiate between fundamental and advance feature.
- Pull request template checklist item, to remind contributors to update the changelog.
- README preamble.
- Use-cases and a specific template and schema for them (#16).
- CI workflow to keep CODEOWNERS file up-to-date when changes are made to feature list metadata (#8).
- Added source link checker in CI and as a local, optional `pixi` task.
- Added `asset__operating_constraints.inter_spatial` to capture operating constraints that span spatial regions.
- Added `transmission__opf.transport` to clearly differentiate energy transport flows from DC power flow.
- Added `postprocessing.aggregation` for methods to aggregate model components into broader classifications for dissemination.

## 0.1.0 (2025-10-16)

Initial release.

### Added

- Initial feature set.
- Schema generator.
- Tool feature list generator.
- PyPSA PoC feature list.
