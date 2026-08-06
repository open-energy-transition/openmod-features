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

### v0.3 taxonomy restructure

A breaking restructure of the feature taxonomy (~33 groups / ~140 members), resolving issues #19, #28, #29, #30, #32, #35, #39, #65-#103 (as applicable) and #108-#113.
All tool and use-case lists have been migrated; entries whose old feature dissolved without a clean successor are flagged with `?` values and `TODO: re-review` comments for maintainer re-validation.
Where merges absorbed previously explicit features, inline `absorbed:` comments in `schema/features.yaml` record the old keys so they can be reintroduced later as feature slices (#114).

#### Removed

- The per-member `baseline` field — members are now flat `key: "description"` entries.
- `time__horizon` group, absorbed into `time__pathway` / `orchestration.rolling_horizon` (#87).
- `system__carriers` group: `decoupled` was a universal baseline; `coupled`/`non_energy` are folded into `system__processes` descriptions (#88).
- `asset__operating_characteristics.static_non_dimensional` / `.static_dimensional`, replaced by `configurable_dimensions` / `extensible_dimensions` (#112).
- `transmission__opf.transport` and `transmission__limits.gtc`, folded into the `system__processes.spatial_transfer` baseline (#28).

#### Changed

- `asset__candidates` replaced by `system__processes`: fundamental carrier-flow capabilities (boundary_exchange, conversion, temporal/spatial/delayed/state-changing transfer, discrete transport, explicit demand) instead of named asset types (#86, #29, #85).
- `robustness` split into `system__reliability` (deterministic in-optimisation constraints: `margin_requirement`, `probabilistic_reliability_limit`, `unserved_demand` (ex-`voll`)) and a rescoped `uncertainty` group (stochastic decision methods, incl. new `risk_aversion` and `robust_optimisation`) (#98, #95, #96, #97); `asset_outages` merged into `asset__operating_constraints.operating` (#32).
- `transmission__opf` + `transmission__limits` consolidated into `network__electricity`, with merged `network_limits`, new `network_devices`, and `ptdf` redefined as the input-side flow-based (PTDF) power-flow formulation (#28).
- Tractability/simplification features reorganised into `tractability__temporal` / `__spatial` / `__structural` / `__reformulation` / `__algorithm` (#30, #73, #79, #81, #84, #89, #90, #93); `asset__resolution.mixed` generalised to `tractability__reformulation.variable_fidelity`.
- `optimisation_problem` dissolved into `orchestration`, `tractability__algorithm`, `uncertainty.near_optimal`, `interface__run.solver_configuration`, and `interface__math` (#73, #74, #75, #97).
- Interfaces split by workflow stage: `interface__build` / `interface__run` / `interface__analysis` / `interface__math`; `no_code` renamed `config_files`, `interface__build.scripting` renamed `interface__build.api` (parity with `interface__run.api`), new `interface__run.remote_execution` (cloud/HPC/hosted dispatch), `standardised` redefined as community convention/ontology (`standardised_data`) (#65, #67, #71, #75, #102, #110).
- `competition` renamed `actors`, with new `equilibrium` and `aggregated_prosumers` members (#77, #78).
- `subsidy/penalty` renamed `threshold_deviation` in both cost groups (#92).
- `time__foresight` rescoped to `time__pathway` (`perfect_foresight`, `myopic_foresight`, new `backcasting`) (#76, #87).
- `asset__chaining` (`stockpiling` + `asset_linking`) merged into `asset__operating_constraints.reserved_flows`.
- `resource_adequacy` group dissolved: `lolp`+`eens` merged into new `postprocessing.probabilistic_reliability_assessment`; `elcc` moved to `postprocessing`; `maintenance_scheduling` moved to `asset__operating_representation` (endogenous, co-optimised with operation); `monte_carlo`/`sampling` generalised into `orchestration.sampled_runs` (#83, #99, #103).
- `workflow` debugging/provenance concerns consolidated as `workflow__transparency` (`run_logs` (ex-`interface__output.logs`), `infeasibility_diagnosis`, `metadata_propagation`, `intermediate_access`, `unit_tracking`) (#66, #69).
- `postprocessing`: `gtc`+`ptdf`+`lodf` merged into `network_transfer_metrics`; `lcoe` folded into `financial`.

#### Added

- `asset__investment_constraints` group (`minimum_size`, `inter_period`, `total`, `brownfield`) (#19, #94).
- `interface__build.component_groups` and `interface__build.component_templating` (#113).
- `optimisation__objective` group (`multi_objective_weighted`, `multi_objective_pareto`, `quadratic`) (#39, #72).
- `data__io` group (`plain_text` and `binary` format members, plus `database`, `remote_storage`, `lazy_loading`) (#70).
- `asset__operating_characteristics.quadratic` (#39) and `.path_dependent` (storage/asset degradation, #108).
- `asset__cost__operation.inter_temporal` (ramping costs, #109).
- `interface__math.soft_constraints` (generic slack-plus-penalty reformulation, #110) and `.problem_file_export` (#67).
- `postprocessing.contract_settlement` (post-hoc CfD/PPA settlement, #111), `.scenario_comparison` (#83), and `.disaggregation` (#82).
- `preprocessing.input_validation` (#68), `.scenario_generation` (#99), and `.model_catalogue`.
- `postprocessing.elcc` (#103).

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
