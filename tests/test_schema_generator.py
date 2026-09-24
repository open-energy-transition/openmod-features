# SPDX-FileCopyrightText: openmod-features contributors
#
# SPDX-License-Identifier: MIT

"""Test the schema generator script.

This script was created by Claude Sonnet 4.5 and modified manually.
"""

import copy
import re
import shutil
import subprocess
from collections.abc import Callable
from pathlib import Path

import copier
import jsonschema
import pytest
import yaml


@pytest.fixture(scope="session")
def repo_root() -> Path:
    """Return the repository root directory."""
    return Path(__file__).parent.parent


def run_schema_generator(
    repo_root: Path, tmp_dir: Path, taxonomy: dict | None = None
) -> subprocess.CompletedProcess:
    """Run the schema generator in a copy of the repository layout under `tmp_dir`.

    If `taxonomy` is given, it replaces the real `features.yaml`.
    """
    (tmp_dir / "scripts").mkdir()
    (tmp_dir / "schema").mkdir()
    (tmp_dir / "template").mkdir()
    shutil.copy(repo_root / "scripts" / "schema_generator.py", tmp_dir / "scripts")
    if taxonomy is None:
        shutil.copy(repo_root / "features.yaml", tmp_dir / "features.yaml")
    else:
        (tmp_dir / "features.yaml").write_text(yaml.safe_dump(taxonomy))
    return subprocess.run(
        ["python", str(tmp_dir / "scripts" / "schema_generator.py")],
        cwd=tmp_dir,
        capture_output=True,
        text=True,
    )


def walk_leaves(node: dict):
    """Yield every leaf of a nested feature tree.

    A leaf is a mapping holding `value` (and, for tools, `source`); anything else is a
    branch whose members are themselves nodes.
    """
    for child in node.values():
        if "value" in child:
            yield child
        else:
            yield from walk_leaves(child)


@pytest.fixture(scope="class")
def generated_schemas(
    tmp_path_factory: pytest.TempPathFactory, repo_root: Path
) -> Path:
    """Run the schema generator and return the temporary directory with generated files."""
    tmp_dir = tmp_path_factory.mktemp("schema_gen")
    result = run_schema_generator(repo_root, tmp_dir)

    assert result.returncode == 0, f"Schema generator failed: {result.stderr}"

    return tmp_dir


class TestSchemaGeneration:
    """Test schema and template generation."""

    def test_tool_schema_generated(self, generated_schemas: Path):
        """Test that the tool schema file is generated."""
        tool_schema = generated_schemas / "schema" / "tool-schema.yaml"
        assert tool_schema.exists()

    def test_use_case_schema_generated(self, generated_schemas: Path):
        """Test that the use-case schema file is generated."""
        use_case_schema = generated_schemas / "schema" / "use-case-schema.yaml"
        assert use_case_schema.exists()

    def test_tool_template_generated(self, generated_schemas: Path):
        """Test that the tool template file is generated."""
        tool_template = (
            generated_schemas
            / "template"
            / "{% if list_type == 'tool' %}features.yaml{% endif %}.jinja"
        )
        assert tool_template.exists()

    def test_use_case_template_generated(self, generated_schemas: Path):
        """Test that the use-case template file is generated."""
        use_case_template = (
            generated_schemas
            / "template"
            / "{% if list_type == 'use-case' %}features.yaml{% endif %}.jinja"
        )
        assert use_case_template.exists()

    def test_tool_schema_is_valid_yaml(self, generated_schemas: Path):
        """Test that the generated tool schema is valid YAML."""
        tool_schema = generated_schemas / "schema" / "tool-schema.yaml"
        schema_content = yaml.safe_load(tool_schema.read_text())
        assert isinstance(schema_content, dict)
        assert "$defs" in schema_content
        assert "properties" in schema_content

    def test_use_case_schema_is_valid_yaml(self, generated_schemas: Path):
        """Test that the generated use-case schema is valid YAML."""
        use_case_schema = generated_schemas / "schema" / "use-case-schema.yaml"
        schema_content = yaml.safe_load(use_case_schema.read_text())
        assert isinstance(schema_content, dict)
        assert "$defs" in schema_content
        assert "properties" in schema_content

    def test_tool_template_contains_schema_reference(self, generated_schemas: Path):
        """Test that the tool template contains a schema reference."""
        tool_template = (
            generated_schemas
            / "template"
            / "{% if list_type == 'tool' %}features.yaml{% endif %}.jinja"
        )
        template_content = tool_template.read_text()
        assert "yaml-language-server: $schema=" in template_content
        assert "/schema/tool-schema.yaml" in template_content

    def test_use_case_template_contains_schema_reference(self, generated_schemas: Path):
        """Test that the use-case template contains a schema reference."""
        use_case_template = (
            generated_schemas
            / "template"
            / "{% if list_type == 'use-case' %}features.yaml{% endif %}.jinja"
        )
        template_content = use_case_template.read_text()
        assert "yaml-language-server: $schema=" in template_content
        assert "/schema/use-case-schema.yaml" in template_content

    def test_tool_template_has_features_key(self, generated_schemas: Path):
        """Test that the tool template contains the 'features' key."""
        tool_template = (
            generated_schemas
            / "template"
            / "{% if list_type == 'tool' %}features.yaml{% endif %}.jinja"
        )
        template_content = tool_template.read_text()
        assert "features:" in template_content

    def test_use_case_template_has_features_and_assumptions(
        self, generated_schemas: Path
    ):
        """Test that the use-case template contains both 'assumptions' and 'features' keys."""
        use_case_template = (
            generated_schemas
            / "template"
            / "{% if list_type == 'use-case' %}features.yaml{% endif %}.jinja"
        )
        template_content = use_case_template.read_text()
        assert "assumptions:" in template_content
        assert "features:" in template_content


@pytest.fixture(scope="class")
def tool_project_from_generated_template(
    tmp_path_factory: pytest.TempPathFactory, generated_schemas: Path, repo_root: Path
) -> Path:
    """Generate a tool project using the generated template and return the destination path."""
    dst = tmp_path_factory.mktemp("tool_validation")

    # Copy the generated template and schema to a complete template structure
    template_root = tmp_path_factory.mktemp("template_root")
    shutil.copytree(generated_schemas / "template", template_root / "template")
    shutil.copytree(generated_schemas / "schema", template_root / "schema")

    # Copy other necessary template files from repo
    shutil.copy(repo_root / "copier.yml", template_root / "copier.yml")
    shutil.copy(
        repo_root / "template" / "{{_copier_conf.answers_file}}.jinja",
        template_root / "template" / "{{_copier_conf.answers_file}}.jinja",
    )

    copier.run_copy(
        str(template_root),
        str(dst),
        data={
            "name": "Test Tool",
            "shortname": "test_tool",
            "description": "A test tool",
            "list_type": "tool",
            "maintainers": "johndoe",
            "source": "https://example.com/source",
            "docs": "https://example.com/docs",
        },
        defaults=True,
        unsafe=True,
    )
    return dst


@pytest.fixture(scope="class")
def use_case_project_from_generated_template(
    tmp_path_factory: pytest.TempPathFactory, generated_schemas: Path, repo_root: Path
) -> Path:
    """Generate a use-case project using the generated template and return the destination path."""
    dst = tmp_path_factory.mktemp("use_case_validation")

    # Copy the generated template and schema to a complete template structure
    template_root = tmp_path_factory.mktemp("template_root_uc")
    shutil.copytree(generated_schemas / "template", template_root / "template")
    shutil.copytree(generated_schemas / "schema", template_root / "schema")

    # Copy other necessary template files from repo
    shutil.copy(repo_root / "copier.yml", template_root / "copier.yml")
    shutil.copy(
        repo_root / "template" / "{{_copier_conf.answers_file}}.jinja",
        template_root / "template" / "{{_copier_conf.answers_file}}.jinja",
    )

    copier.run_copy(
        str(template_root),
        str(dst),
        data={
            "name": "Test Use Case",
            "shortname": "test_use_case",
            "description": "A test use case",
            "list_type": "use-case",
            "maintainers": "janesmith",
        },
        defaults=True,
        unsafe=True,
    )
    return dst


class TestTemplateValidation:
    """Test that generated templates can be used to create valid projects."""

    def test_tool_project_features_file_exists(
        self, tool_project_from_generated_template: Path
    ):
        """Test that features.yaml is created for tool projects."""
        features_file = tool_project_from_generated_template / "features.yaml"
        assert features_file.exists()

    def test_tool_project_features_is_valid_yaml(
        self, tool_project_from_generated_template: Path
    ):
        """Test that the generated tool features.yaml is valid YAML."""
        features_file = tool_project_from_generated_template / "features.yaml"
        features = yaml.safe_load(features_file.read_text())
        assert isinstance(features, dict)
        assert "features" in features

    def test_tool_project_has_schema_reference(
        self, tool_project_from_generated_template: Path
    ):
        """Test that the tool features.yaml contains schema reference."""
        features_file = tool_project_from_generated_template / "features.yaml"
        content = features_file.read_text()
        assert "yaml-language-server: $schema=" in content
        assert "/schema/tool-schema.yaml" in content

    def test_tool_project_features_structure(
        self, tool_project_from_generated_template: Path
    ):
        """Test that the tool features.yaml has expected structure."""
        features_file = tool_project_from_generated_template / "features.yaml"
        features = yaml.safe_load(features_file.read_text())
        assert "features" in features
        assert isinstance(features["features"], dict)
        # Every leaf of the nested feature tree must carry both 'value' and 'source',
        # and nothing else; branches must carry neither.
        for leaf in walk_leaves(features["features"]):
            assert set(leaf) == {"value", "source"}
            assert leaf["value"] == "?"
            assert leaf["source"] == []

    def test_tool_project_nested_feature_scaffolds_all_leaves(
        self, tool_project_from_generated_template: Path
    ):
        """Test that a known nested feature scaffolds every one of its child leaves."""
        features_file = tool_project_from_generated_template / "features.yaml"
        features = yaml.safe_load(features_file.read_text())
        sequential = features["features"]["cost"]["scope"]["temporal"]["sequential"]
        assert sequential == {
            "investment": {"value": "?", "source": []},
            "operation": {
                "start_up": {"value": "?", "source": []},
                "shut_down": {"value": "?", "source": []},
                "ramping": {"value": "?", "source": []},
                "start_state_dependent": {"value": "?", "source": []},
            },
        }

    def test_tool_project_leaf_sibling_of_branch_stays_a_leaf(
        self, tool_project_from_generated_template: Path
    ):
        """Test that a leaf sitting alongside branch siblings stays a plain leaf."""
        features_file = tool_project_from_generated_template / "features.yaml"
        features = yaml.safe_load(features_file.read_text())
        exchange = features["features"]["processes"]["boundary_exchange"]
        assert exchange == {"value": "?", "source": []}

    def test_use_case_project_features_file_exists(
        self, use_case_project_from_generated_template: Path
    ):
        """Test that features.yaml is created for use-case projects."""
        features_file = use_case_project_from_generated_template / "features.yaml"
        assert features_file.exists()

    def test_use_case_project_features_is_valid_yaml(
        self, use_case_project_from_generated_template: Path
    ):
        """Test that the generated use-case features.yaml is valid YAML."""
        features_file = use_case_project_from_generated_template / "features.yaml"
        features = yaml.safe_load(features_file.read_text())
        assert isinstance(features, dict)
        assert "assumptions" in features
        assert "features" in features

    def test_use_case_project_has_schema_reference(
        self, use_case_project_from_generated_template: Path
    ):
        """Test that the use-case features.yaml contains schema reference."""
        features_file = use_case_project_from_generated_template / "features.yaml"
        content = features_file.read_text()
        assert "yaml-language-server: $schema=" in content
        assert "/schema/use-case-schema.yaml" in content

    def test_use_case_project_features_structure(
        self, use_case_project_from_generated_template: Path
    ):
        """Test that the use-case features.yaml has expected structure."""
        features_file = use_case_project_from_generated_template / "features.yaml"
        features = yaml.safe_load(features_file.read_text())
        assert "assumptions" in features
        assert isinstance(features["assumptions"], list)
        assert "features" in features
        assert isinstance(features["features"], dict)
        # Use-case leaves carry 'value' only; there is no 'source' on a use-case list.
        for leaf in walk_leaves(features["features"]):
            assert set(leaf) == {"value"}
            assert leaf["value"] == "?"


class TestTaxonomyValidation:
    """Test that the generator rejects malformed taxonomy definitions."""

    @pytest.fixture
    def run_generator(
        self, tmp_path_factory: pytest.TempPathFactory, repo_root: Path
    ) -> Callable:
        """Run the generator against a taxonomy and return the completed process."""

        def _run_generator(taxonomy: dict) -> subprocess.CompletedProcess:
            # A filler sibling keeps the root itself valid, so the assertion under test is
            # what fails rather than the root's own two-member rule.
            taxonomy = {
                **taxonomy,
                "filler": {"description": "Filler.", "members": {"a": "A", "b": "B"}},
            }
            return run_schema_generator(
                repo_root, tmp_path_factory.mktemp("bad_schema"), taxonomy
            )

        return _run_generator

    def _branch(self, **members) -> dict:
        return {"description": "A branch.", "members": members}

    def test_single_member_branch_rejected(self, run_generator: Callable):
        """A branch with fewer than two members should be a leaf instead."""
        result = run_generator({"grp": self._branch(only=self._branch(a="A", b="B"))})
        assert result.returncode != 0
        assert "at least two members" in result.stderr

    def test_reserved_member_name_rejected(self, run_generator: Callable):
        """A member may not take a name that collides with a schema-level key."""
        result = run_generator({"grp": self._branch(value="V", other="O")})
        assert result.returncode != 0
        assert "reserved name `value`" in result.stderr

    def test_double_underscore_member_name_rejected(self, run_generator: Callable):
        """`__` in a name must be expressed as nesting instead."""
        result = run_generator({"grp": self._branch(a__b="AB", other="O")})
        assert result.returncode != 0
        assert "double underscore" in result.stderr

    def test_model_name_collision_rejected(self, run_generator: Callable):
        """Two paths that generate the same PascalCase model name are rejected."""
        result = run_generator(
            {
                "a": self._branch(b_c=self._branch(x="X", y="Y"), other="O"),
                "a_b": self._branch(c=self._branch(x="X", y="Y"), other="O"),
            }
        )
        assert result.returncode != 0
        assert "generate the model name `ABCModel`" in result.stderr

    def test_missing_members_key_rejected(self, run_generator: Callable):
        """A branch must declare exactly `description` and `members`."""
        result = run_generator({"grp": {"description": "No members."}})
        assert result.returncode != 0
        assert "must declare exactly" in result.stderr


class TestNestedFeatureValidation:
    """Test that the generated tool schema enforces the nested feature structure.

    These checks run `jsonschema` directly against the generated schema, mirroring how the
    `validate-yaml-schemas` pre-commit hook validates real `features.yaml` files (as opposed to
    Pydantic's runtime validation, which is not exercised by that hook).
    """

    @pytest.fixture(scope="class")
    def tool_schema(self, generated_schemas: Path) -> dict:
        """Load the generated tool JSON schema."""
        return yaml.safe_load(
            (generated_schemas / "schema" / "tool-schema.yaml").read_text()
        )

    @pytest.fixture(scope="class")
    def valid_features(self, tool_project_from_generated_template: Path) -> dict:
        """Load a fully-scaffolded, schema-valid tool features.yaml."""
        features_file = tool_project_from_generated_template / "features.yaml"
        return yaml.safe_load(features_file.read_text())

    def test_scaffolded_template_is_valid(
        self, valid_features: dict, tool_schema: dict
    ):
        """Sanity check: the freshly generated template must itself validate."""
        jsonschema.validate(valid_features, tool_schema)

    def test_deep_leaf_accepts_value_and_source(
        self, valid_features: dict, tool_schema: dict
    ):
        """A leaf nested three levels deep accepts a filled-in `value` and `source`."""
        features = copy.deepcopy(valid_features)
        features["features"]["cost"]["functional_form"]["fixed_charge"]["operation"] = {
            "value": "y",
            "source": ["https://example.com/a"],
        }
        jsonschema.validate(features, tool_schema)

    def test_omitted_leaf_is_valid(self, valid_features: dict, tool_schema: dict):
        """A leaf left out of the data entirely is valid; it falls back to its default."""
        features = copy.deepcopy(valid_features)
        del features["features"]["cost"]["functional_form"]["fixed_charge"]["operation"]
        jsonschema.validate(features, tool_schema)

    def test_unknown_member_rejected(self, valid_features: dict, tool_schema: dict):
        """A member name not declared in the taxonomy is rejected at any depth."""
        features = copy.deepcopy(valid_features)
        features["features"]["cost"]["functional_form"]["fixed_charge"]["bogus"] = {
            "value": "y",
            "source": [],
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(features, tool_schema)

    def test_leaf_fields_on_branch_rejected(
        self, valid_features: dict, tool_schema: dict
    ):
        """`value`/`source` on a branch are rejected: they belong on leaves only."""
        features = copy.deepcopy(valid_features)
        features["features"]["cost"]["functional_form"]["fixed_charge"]["value"] = "y"
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(features, tool_schema)

    def test_branch_shape_on_leaf_rejected(
        self, valid_features: dict, tool_schema: dict
    ):
        """A leaf cannot be given child members."""
        features = copy.deepcopy(valid_features)
        features["features"]["constraints"]["dedicated_flow_routing"] = {
            "investment": {"value": "y", "source": []}
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(features, tool_schema)


def _walk_branches(node: str | dict, path: tuple[str, ...] = ()):
    """Yield every branch's path and members, recursively.

    A branch is a mapping of `description` and `members`; a leaf is a plain string
    and has no members to yield.
    """
    if isinstance(node, str):
        return
    yield path, node["members"]
    for member, member_node in node["members"].items():
        yield from _walk_branches(member_node, (*path, member))


def _walk_paths(node: str | dict, path: tuple[str, ...] = ()) -> set[str]:
    """Return every taxonomy path reachable from `node`, including `node` itself."""
    paths = {".".join(path)} if path else set()
    if isinstance(node, str):
        return paths
    for member, member_node in node["members"].items():
        paths |= _walk_paths(member_node, (*path, member))
    return paths


class TestAxisConsistency:
    """Test that cross-cutting axes (e.g. `investment`/`operation`) are never partially used.

    Several unrelated branches independently re-slice by the same small set of concepts
    (lifecycle stage, data direction, workflow stage, dimension kind). Nothing in the
    generator enforces that a branch using one member of such an axis uses all of them,
    so a future edit could silently add e.g. an `io` format with only an `input` member.
    """

    #: Each axis in its canonical order, which every branch using it must follow.
    KNOWN_AXES = [
        ("investment", "operation"),
        ("input", "output"),
        ("build", "run", "analyse"),
        ("temporal", "spatial", "assets", "scenarios"),
    ]

    #: Branches allowed to use only part of an axis.
    #:
    #: `tractability.dimension_reduction` is sliced method-over-dimension, and a method
    #: is only listed against the dimensions it can act on: assets and scenarios have no
    #: natural adjacency, so neither takes `adjacency_aggregation`. Partial use is the
    #: point here, so these branches opt out while the rule still holds everywhere else.
    #:
    #: `constraints.scope` and `cost.scope` omit `scenarios`, because a limit or cost
    #: spanning scenarios requires a scenario-indexed decision problem, which is already
    #: recorded by `uncertainty`.
    PARTIAL_AXIS_BRANCHES = frozenset(
        {
            "tractability.dimension_reduction.adjacency_aggregation",
            "tractability.dimension_reduction.similarity_aggregation",
            "tractability.dimension_reduction.equivalencing",
            "tractability.dimension_reduction.filtering",
            "tractability.dimension_reduction.non_contiguity_handling",
            "constraints.scope",
            "cost.scope",
        }
    )

    @pytest.fixture(scope="class")
    def taxonomy(self, repo_root: Path) -> dict:
        """Load the real taxonomy (not a generator-mutated copy)."""
        return yaml.safe_load((repo_root / "features.yaml").read_text())

    def test_axis_members_are_complete(self, taxonomy: dict):
        """A branch that uses part of a known axis must use all of it."""
        violations = []
        for name, node in taxonomy.items():
            for path, members in _walk_branches(node, (name,)):
                if ".".join(path) in self.PARTIAL_AXIS_BRANCHES:
                    continue
                names = frozenset(members)
                for axis in map(frozenset, self.KNOWN_AXES):
                    if names & axis and names != axis:
                        violations.append(
                            f"`{'.'.join(path)}` has {sorted(names)}; "
                            f"axis is {sorted(axis)}"
                        )
        assert not violations, "\n".join(violations)

    def test_axis_members_follow_canonical_order(self, taxonomy: dict):
        """Axis members must appear in the axis's canonical order wherever they are used.

        This holds for partial-axis branches too, and axis members may be interleaved
        with other members (e.g. `constraints.scope.assets` alongside `spanning`).
        """
        violations = []
        for name, node in taxonomy.items():
            for path, members in _walk_branches(node, (name,)):
                for axis in self.KNOWN_AXES:
                    used = [member for member in members if member in axis]
                    expected = [member for member in axis if member in used]
                    if used != expected:
                        violations.append(
                            f"`{'.'.join(path)}` orders {used}; expected {expected}"
                        )
        assert not violations, "\n".join(violations)

    def test_partial_axis_exemptions_are_live(self, taxonomy: dict):
        """Every exempted path must still name a real branch.

        An exemption left behind after a rename would silently stop the axis rule
        applying to whatever later takes that path.
        """
        branches = {
            ".".join(path)
            for name, node in taxonomy.items()
            for path, _ in _walk_branches(node, (name,))
        }
        assert not self.PARTIAL_AXIS_BRANCHES - branches


class TestCrossReferences:
    """Test that dotted cross-references inside descriptions resolve to real taxonomy paths.

    Descriptions point at other features with backticked dotted paths (e.g. `` `io.standardised` ``).
    Nothing validates these against the taxonomy, so a rename or move can silently strand a
    reference. This is exactly the failure mode a taxonomy restructure risks.
    """

    @pytest.fixture(scope="class")
    def taxonomy_text(self, repo_root: Path) -> str:
        """Return the raw text of the real taxonomy file."""
        return (repo_root / "features.yaml").read_text()

    @pytest.fixture(scope="class")
    def taxonomy(self, taxonomy_text: str) -> dict:
        """Load the real taxonomy (not a generator-mutated copy)."""
        return yaml.safe_load(taxonomy_text)

    def test_cross_references_resolve(self, taxonomy: dict, taxonomy_text: str):
        """Every backticked dotted path in a description must name a real taxonomy node."""
        all_paths = set()
        for name, node in taxonomy.items():
            all_paths |= _walk_paths(node, (name,))

        refs = set(re.findall(r"`([a-zA-Z_]+(?:\.[a-zA-Z_]+)+)`", taxonomy_text))
        unresolved = {r for r in refs if r not in all_paths}
        assert not unresolved, f"Unresolvable cross-references: {sorted(unresolved)}"
