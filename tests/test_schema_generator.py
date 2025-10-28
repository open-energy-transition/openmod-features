# SPDX-FileCopyrightText: openmod-features contributors
#
# SPDX-License-Identifier: MIT

"""Test the schema generator script.

This script was created by Claude Sonnet 4.5 and modified manually.
"""

import shutil
import subprocess
from pathlib import Path

import copier
import pytest
import yaml


@pytest.fixture(scope="session")
def repo_root() -> Path:
    """Return the repository root directory."""
    return Path(__file__).parent.parent


@pytest.fixture(scope="class")
def generated_schemas(
    tmp_path_factory: pytest.TempPathFactory, repo_root: Path
) -> Path:
    """Run the schema generator and return the temporary directory with generated files."""
    # Create temporary directory structure
    tmp_dir = tmp_path_factory.mktemp("schema_gen")
    schema_dir = tmp_dir / "schema"
    template_dir = tmp_dir / "template"

    # Copy necessary files
    shutil.copytree(repo_root / "schema", schema_dir)
    template_dir.mkdir()

    # Run the schema generator in the temporary directory
    result = subprocess.run(
        ["python", str(schema_dir / "schema_generator.py")],
        cwd=schema_dir,
        capture_output=True,
        text=True,
    )

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
        # Check that features have the expected structure with 'value' and 'source'
        for group in features["features"].values():
            if isinstance(group, dict):
                for feature_data in group.values():
                    if isinstance(feature_data, dict):
                        assert "value" in feature_data
                        assert "source" in feature_data
                        assert feature_data["value"] == "?"

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
        # Check that features have the expected structure with 'value' only
        for group in features["features"].values():
            if isinstance(group, dict):
                for feature_data in group.values():
                    if isinstance(feature_data, dict):
                        assert "value" in feature_data
                        assert feature_data["value"] == "?"
