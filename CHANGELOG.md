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

## Unreleased (v0.3.0)

A ground-up overhaul of the feature taxonomy and of the schema that expresses it.
No group or feature path from 0.2.0 survives unchanged: the taxonomy is now a single recursive tree of 18 top-level categories, named for the question each answers rather than for the technology it describes.
Resolves #19, #28, #29, #30, #32, #35, #39, #65-#103 (as applicable) and #108-#114.

### Changed

#### Schema and tooling

- **Features nest to arbitrary depth.** A taxonomy node is either a **leaf** (`key: "description"`) or a **branch** (`description` plus a `members` mapping of further nodes), and branches and leaves can be siblings. This replaces the fixed group → member layering, in which every capability had to be flattened into a two-level name.
- **`value` and `source` live on leaves only.** A leaf's `value` is a plain scalar and its `source` a plain list of URLs. Capabilities that differ between investment and operation are sibling leaves rather than a qualified single value: `asset.cost.unit` is a branch with `investment` / `operation` leaves. Where one source evidences several sibling leaves, the URL is repeated on each.
- **No `__` in taxonomy names.** Namespaces are expressed as real nesting (`asset__cost__investment.unit` → `asset.cost.unit.investment`, `transmission__opf` → `network.power_flow.optimal_power_flow`, `time__resolution__simplification` → `tractability.dimension_reduction.temporal`). Cross-references inside descriptions use a single dotted path throughout.
- The generator validates the taxonomy directly: branches must declare exactly `description` and `members` with at least two members; member names must be valid identifiers that avoid `__` and the reserved names `source` / `value` / `description` / `members`; and two paths may not generate the same model name.
- Feature values default to the explicit `?` (unknown) rather than a bare `null`, so an unanswered feature is visibly unanswered in a list a maintainer is part-way through filling.
- Generated tool/use-case templates are written in taxonomy order rather than alphabetical order, so the file a maintainer edits reads in the same order as the file they read for reference.
- Generated JSON schemas are roughly half the size they would otherwise be, by using `Field(default_factory=...)` in place of `Field(default=...)` so Pydantic does not inline a fully-materialised default subtree into every `$def`.
- Feature descriptions no longer use "a.k.a."; alternative names will be carried by a separate `also_known_as` option.
- CONTRIBUTING.md documents the nested schema and recommends per-sub-leaf source comments when citing a feature that splits into several sub-leaves.

#### Taxonomy

- **`processes`** replaces `asset__candidates`: fundamental carrier-flow capabilities defined by mathematical role (`boundary_exchange`, `conversion`, temporal / spatial / delayed / buffered / discrete / state-changing transfer, `explicit_demand`) rather than by named asset types. `conversion` splits by flow topology into `one_to_one`, `multi_carrier_io` (several carriers per process at fixed ratios, e.g. back-pressure CHP), and `flexible_ratio` (optimiser-chosen flow ratios, e.g. extraction-condensing CHP, heat pumps serving heat and cooling). `explicit_demand` splits into `inelastic`, `price_responsive`, and `mobile_storage` (EV fleets / V2G: demand with embedded storage whose grid attachment follows a travel pattern). `system__carriers` is gone: multi-carrier coupling is a property of `conversion`, not a separate feature.
- **`network`** consolidates `transmission__opf`, `transmission__limits`, `transmission__network` and the `power_flow__*` groups into `network.power_flow` (`optimal_power_flow`, `sensitivity_limits`, `network_limits`, `network_devices`, `unbalanced_flows`) alongside a new `network.hydraulic_flow` (`linearised_flow`, `composition_tracking`). `ptdf` is redefined as the input-side flow-based power-flow formulation.
- **`asset`** covers what an asset *is*: `capacity_representation` (including `retrofit`), `operating_representation`, and `cost` (`unit`, `nonlinear`, `threshold_deviation`, `annuitisation`, `inter_temporal`), each sliced `investment` / `operation` where both apply.
- **`constraints`** is the single home for "how can the problem be constrained?", split along two axes: `scope` — what a limit spans (`inter_spatial`, `inter_asset`, `total`, `inter_temporal`, `intra_temporal`, `commitment`, `boundary_conditions`) — and `functional_form` — the mathematical form of relationships between decision variables (`linear_multi_variable`, `quadratic`, `nonlinear`) — plus `path_dependent` (quantities evolving endogenously from cumulative historical decisions, e.g. learning curves, degradation), `dedicated_flow_routing`, and `reliability` (`margin_requirement`, `probabilistic_reliability_limit`, `unserved_demand`, `contingency_constrained`). It absorbs `asset__operating_constraints`, `asset__operating_characteristics` (functional form is a property of the constraints a tool can build, not of an asset), `asset__chaining`, `system__limits`, and the deterministic half of `robustness`.
- **`model_definition`** is new, holding `dimension_groups`, `component_templating`, `configurable_dimensions`, and `extensible_dimensions` — how the model's parameter space can be shaped, grouped, or reused, as distinct from what an asset does.
- **`math`** holds properties of the optimisation problem itself: `formulation_transparency`, `problem_file_export`, `dual_extraction`, `piecewise_formulation`, `user_defined_math`, `soft_constraints`.
- **`interface`** is organised by access mode (`gui`, `api`, `cli`), each sliced by workflow stage (`build` / `run` / `analyse`), plus `remote_execution`, `solver_configuration`, `analysis_templates`, and `visualisation` (`charts`, `network_maps`).
- **`io`** replaces the I/O half of `interface__input` / `interface__output`: `plain_text`, `binary`, `database`, `remote_storage`, `lazy_loading`, and `standardised` (community conventions and ontologies, including network-data formats such as PSSE RAW, matpower and CIM), each sliced `input` / `output`.
- **`tractability`** gathers all simplification and solution-strategy features into `dimension_reduction` (`temporal`, `spatial`, `assets`), `reformulation`, and `algorithm`, replacing `time__resolution__simplification`, `spatial__resolution__simplification` and the solver-side half of `optimisation_problem`.
- **`orchestration`** covers how many model runs happen and how they relate: `rolling_horizon`, `coupled_models`, `simulation_optimisation`, `scenario_runs`, `sampled_runs`.
- **`uncertainty`** is rescoped to stochastic decision methods (`two_stage_stochastic`, `multi_stage_stochastic`, `risk_aversion`, `near_optimal`, `robust_optimisation`), with the deterministic reliability constraints it used to hold moved to `constraints.reliability`.
- **`actors`** replaces `competition`, adding `equilibrium` (computed: Cournot-Nash, Bertrand) and `heuristic_markup` (rule/index-based strategic markups) to `portfolio` and `distributed_objectives`.
- **`pathway`** replaces `time__foresight` and `time__horizon` (`perfect_foresight`, `myopic_foresight`, each sliced `investment` / `operation`); horizon length is no longer a feature.
- **`objective`** is new: `multi_objective_weighted`, `multi_objective_pareto`, `quadratic`.
- **`preprocessing`** adds `resource_conversion` (physical response models turning weather/resource data into availability or demand profiles), `scenario_generation`, `input_validation`, `numeric_scaling`, and `model_catalogue`, with `forecasting` rescoped to scaling and reshaping existing profiles.
- **`postprocessing`** is grouped by what is being reported: `impact_assessment`, `operational`, `financial` (including `levelised_cost`, `marginal_price`, `price_formation`, `contract_settlement`), `network_transfer_metrics`, `aggregation`, `disaggregation`, `scenario_comparison`, and `probabilistic_reliability_assessment` (`loss_of_load`, `unserved_energy`, `capacity_credit`).
- **`transparency`** is new, consolidating debugging and provenance concerns: `run_logs`, `infeasibility_diagnosis`, `metadata_propagation`, `intermediate_access`, `unit_tracking`.

### Removed

- The `baseline` field on every feature. Members are now flat `key: "description"` entries; whether a capability is fundamental or advanced is a property of the tool landscape, not of the taxonomy.
- `time__horizon`: horizon length is no longer a feature, being absorbed into `pathway` and `orchestration.rolling_horizon` (#87).
- `asset__resolution`: `units` / `grouped` are the two sides of `asset.capacity_representation`, while aggregating physical assets is `tractability.dimension_reduction.assets.clustering` and `mixed` generalises to `tractability.reformulation.variable_fidelity`.
- `edge_effects.spatial`, subsumed by `processes.boundary_exchange`.
- `resource_adequacy` and `optimisation_problem` as groups; their members are distributed across `constraints.reliability`, `postprocessing`, `orchestration`, `tractability`, `uncertainty`, `interface`, and `math` according to what they describe rather than what they were used for.
- Features that stated a baseline capability every tool has, rather than a distinguishing one: `system__carriers.decoupled` (single-carrier modelling), `transmission__opf.transport` and `transmission__limits.gtc` (both folded into `processes.spatial_transfer`), `asset__operating_characteristics.static_non_dimensional` / `.static_dimensional` (replaced by `model_definition.configurable_dimensions` / `.extensible_dimensions`, #112), `asset__operating_characteristics.linear` (a linear parameter-to-variable relationship is the LP baseline), and `asset__cost__investment.linear` / `asset__cost__operation.linear` (linear EUR/MW capital and EUR/MWh operating costs are the baseline cost representation).

## 0.2.0 (2026-08-26)

### Removed

- Removed "a.k.a." in feature descriptions in preparation for a separate `also_known_as` option.
- Detailed power-system simulation groups (`transmission__network`, `power_flow__controls`, `power_flow__contingency_analysis`, `power_flow__sensitivity_analysis`, `power_flow__dynamic_simulations`), which are out of scope for a planning-tool feature list.

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
- Use-cases and a specific template and schema for them (#16), with lists for bidding zone review, integrated resource planning, network development planning, policy target setting, and portfolio planning.
- Tool feature lists for GenX, OSeMOSYS, Calliope, and TIMES.
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
