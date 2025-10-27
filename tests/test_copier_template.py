# SPDX-FileCopyrightText: openmod-features contributors
#
# SPDX-License-Identifier: MIT

"""Test suite for the copier template.

This script was created by Claude Sonnet 4.5 and modified manually.
"""

from pathlib import Path

import pytest
import yaml
from copier import run_copy


@pytest.fixture(scope="session")
def template_dir():
    """Return the path to the copier template directory."""
    return Path(__file__).parent.parent


@pytest.fixture(scope="session")
def default_data():
    """Return the default data for the copier template."""
    return {
        "shortname": "testtool",
        "name": "Test Tool",
        "description": "A test tool for testing",
        "maintainers": "testuser",
    }


@pytest.fixture(scope="class")
def run_copier(default_data, template_dir):
    """Run the copier template to generate a feature list."""

    def _run_copier(dst, data):
        run_copy(
            str(template_dir), str(dst), data={**default_data, **data}, vcs_ref="HEAD"
        )

    return _run_copier


class TestToolTemplate:
    """Test the tool template generation."""

    @pytest.fixture(scope="class")
    def tool_minimal_dst(self, run_copier, tmp_path_factory):
        """Generate a minimal tool template and return the destination path."""
        dst = tmp_path_factory.mktemp("tool_minimal") / "test-tool"

        run_copier(
            str(dst),
            data={
                "list_type": "tool",
                "source": "https://github.com/test/testtool",
                "docs": "none",
            },
        )
        return dst

    def test_tool_minimal_files_exist(self, tool_minimal_dst):
        """Test that required files are created."""
        assert (tool_minimal_dst / ".metadata.yml").exists()
        assert (tool_minimal_dst / "features.yaml").exists()

    def test_tool_minimal_metadata(self, tool_minimal_dst):
        """Test metadata content for minimal tool template."""
        metadata = yaml.safe_load((tool_minimal_dst / ".metadata.yml").read_text())
        # Remove internal copier fields for comparison
        metadata_without_copier = {
            k: v for k, v in metadata.items() if not k.startswith("_")
        }
        expected = {
            "list_type": "tool",
            "shortname": "testtool",
            "name": "Test Tool",
            "description": "A test tool for testing",
            "source": "https://github.com/test/testtool",
            "docs": "none",
            "maintainers": "testuser",
        }
        assert metadata_without_copier == expected

    def test_tool_minimal_features_structure(self, tool_minimal_dst):
        """Test features.yaml structure for tool template."""
        features = yaml.safe_load((tool_minimal_dst / "features.yaml").read_text())
        assert "features" in features
        # Tool features have 'source' field
        assert "source" in features["features"]["asset__candidates"]["converters"]
        assert "value" in features["features"]["asset__candidates"]["converters"]

    @pytest.fixture(scope="class")
    def tool_with_docs_dst(self, run_copier, tmp_path_factory):
        """Generate a tool template with docs URL and return the destination path."""
        dst = tmp_path_factory.mktemp("tool_docs") / "test-tool-docs"

        run_copier(
            str(dst),
            data={
                "list_type": "tool",
                "source": "https://github.com/test/testtool",
                "docs": "https://testtool.readthedocs.io",
            },
        )
        return dst

    def test_tool_with_docs_metadata(self, tool_with_docs_dst):
        """Test that docs URL is correctly stored in metadata."""
        metadata = yaml.safe_load((tool_with_docs_dst / ".metadata.yml").read_text())
        assert metadata["docs"] == "https://testtool.readthedocs.io"

    @pytest.fixture(scope="class")
    def tool_multiple_maintainers_dst(self, run_copier, tmp_path_factory):
        """Generate a tool template with multiple maintainers and return the destination path."""
        dst = tmp_path_factory.mktemp("tool_multi") / "test-tool-multi"

        run_copier(
            str(dst),
            data={
                "list_type": "tool",
                "source": "https://github.com/test/testtool",
                "docs": "none",
                "maintainers": "testuser1, testuser2, testuser3",
            },
        )
        return dst

    def test_tool_multiple_maintainers_metadata(self, tool_multiple_maintainers_dst):
        """Test that multiple maintainers are correctly stored in metadata."""
        metadata = yaml.safe_load(
            (tool_multiple_maintainers_dst / ".metadata.yml").read_text()
        )
        assert metadata["maintainers"] == "testuser1, testuser2, testuser3"


class TestUseCaseTemplate:
    """Test the use-case template generation."""

    @pytest.fixture(scope="class")
    def use_case_minimal_dst(self, run_copier, tmp_path_factory):
        """Generate a minimal use-case template and return the destination path."""
        dst = tmp_path_factory.mktemp("use_case_minimal") / "test-use-case"

        run_copier(
            str(dst),
            data={
                "list_type": "use-case",
                "shortname": "test_usecase",
                "name": "Test Use Case",
                "description": "A test use case for testing",
            },
        )
        return dst

    def test_use_case_minimal_files_exist(self, use_case_minimal_dst):
        """Test that required files are created."""
        assert (use_case_minimal_dst / ".metadata.yml").exists()
        assert (use_case_minimal_dst / "features.yaml").exists()

    def test_use_case_minimal_metadata(self, use_case_minimal_dst):
        """Test metadata content for minimal use-case template."""
        metadata = yaml.safe_load((use_case_minimal_dst / ".metadata.yml").read_text())
        # Remove internal copier fields for comparison
        metadata_without_copier = {
            k: v for k, v in metadata.items() if not k.startswith("_")
        }
        expected = {
            "list_type": "use-case",
            "shortname": "test_usecase",
            "name": "Test Use Case",
            "description": "A test use case for testing",
            "maintainers": "testuser",
        }
        assert metadata_without_copier == expected
        # Use cases should not have source/docs fields
        assert "source" not in metadata
        assert "docs" not in metadata

    def test_use_case_minimal_features_structure(self, use_case_minimal_dst):
        """Test features.yaml structure for use-case template."""
        features = yaml.safe_load((use_case_minimal_dst / "features.yaml").read_text())
        assert "features" in features
        assert "assumptions" in features
        # Use-case features do NOT have 'source' field
        assert "source" not in features["features"]["asset__candidates"]["converters"]
        assert "value" in features["features"]["asset__candidates"]["converters"]


class TestValidators:
    """Test copier template validators."""

    def test_source_validator_invalid_url(self, run_copier, tmp_path):
        """Test that source validator rejects non-HTTPS URLs."""
        dst = tmp_path / "test-invalid-source"

        with pytest.raises(ValueError, match="Source code must be hosted"):
            run_copier(
                str(dst),
                data={
                    "list_type": "tool",
                    "source": "http://github.com/test/testtool",  # HTTP not HTTPS
                    "docs": "none",
                },
            )

    def test_source_validator_no_url(self, run_copier, tmp_path):
        """Test that source validator rejects non-URL values."""
        dst = tmp_path / "test-invalid-source2"

        with pytest.raises(ValueError, match="Source code must be hosted"):
            run_copier(
                str(dst),
                data={"list_type": "tool", "source": "not-a-url", "docs": "none"},
            )

    def test_docs_validator_invalid_url(self, run_copier, tmp_path):
        """Test that docs validator rejects non-HTTPS URLs."""
        dst = tmp_path / "test-invalid-docs"

        with pytest.raises(ValueError, match="Documentation must be hosted"):
            run_copier(
                str(dst),
                data={
                    "list_type": "tool",
                    "source": "https://github.com/test/testtool",
                    "docs": "http://testtool.readthedocs.io",  # HTTP not HTTPS
                },
            )

    @pytest.fixture(scope="class")
    def docs_none_dst(self, run_copier, tmp_path_factory):
        """Generate a tool template with docs='none' and return the destination path."""
        dst = tmp_path_factory.mktemp("docs_none") / "test-docs-none"

        run_copier(
            str(dst),
            data={
                "list_type": "tool",
                "source": "https://github.com/test/testtool",
                "docs": "none",
            },
        )
        return dst

    def test_docs_validator_allows_none(self, docs_none_dst):
        """Test that docs validator allows 'none' value."""
        metadata = yaml.safe_load((docs_none_dst / ".metadata.yml").read_text())
        assert metadata["docs"] == "none"

    def test_maintainers_validator_invalid_format(self, run_copier, tmp_path):
        """Test that maintainers validator rejects invalid formats."""
        dst = tmp_path / "test-invalid-maintainers"

        with pytest.raises(ValueError, match="Use only GitHub usernames"):
            run_copier(
                str(dst),
                data={
                    "list_type": "tool",
                    "source": "https://github.com/test/testtool",
                    "docs": "none",
                    "maintainers": "@testuser",  # Should not include @
                },
            )

    @pytest.fixture(scope="class")
    def hyphens_dst(self, run_copier, tmp_path_factory):
        """Generate a tool template with hyphenated entries and return the destination path."""
        dst = tmp_path_factory.mktemp("hyphens") / "test-hyphens"

        run_copier(
            str(dst),
            data={
                "list_type": "tool",
                "source": "https://github.com/test/test-tool",
                "docs": "https://test.github.io/test-tool",
                "maintainers": "test-user, another-user-123",
            },
        )
        return dst

    def test_maintainers_validator_with_hyphens(self, hyphens_dst):
        """Test that maintainers validator accepts usernames with hyphens."""
        metadata = yaml.safe_load((hyphens_dst / ".metadata.yml").read_text())
        assert metadata["maintainers"] == "test-user, another-user-123"

    def test_source_validator_with_hyphens(self, hyphens_dst):
        """Test that source validator accepts hyphenated URLs."""
        metadata = yaml.safe_load((hyphens_dst / ".metadata.yml").read_text())
        assert metadata["source"] == "https://github.com/test/test-tool"

    def test_docs_validator_with_hyphens(self, hyphens_dst):
        """Test that docs validator accepts hyphenated URLs."""
        metadata = yaml.safe_load((hyphens_dst / ".metadata.yml").read_text())
        assert metadata["docs"] == "https://test.github.io/test-tool"


class TestFileGeneration:
    """Test that the correct files are generated based on list_type."""

    @pytest.fixture(scope="class")
    def tool_features_dst(self, run_copier, tmp_path_factory):
        """Generate a tool template and return the destination path."""
        dst = tmp_path_factory.mktemp("tool_features") / "test-tool-features"

        run_copier(
            str(dst),
            data={
                "list_type": "tool",
                "source": "https://github.com/test/testtool",
                "docs": "none",
            },
        )
        return dst

    def test_tool_features_schema_reference(self, tool_features_dst):
        """Test that tool list_type references tool-schema.yaml."""
        content = (tool_features_dst / "features.yaml").read_text()
        assert "tool-schema.yaml" in content

    def test_tool_features_codeowners(self, tool_features_dst):
        """Test that tool features have CODEOWNERS pointing to tools/."""
        content = (tool_features_dst / "features.yaml").read_text()
        assert "tools/testtool/features.yaml" in content

    @pytest.fixture(scope="class")
    def use_case_features_dst(self, run_copier, tmp_path_factory):
        """Generate a use-case template and return the destination path."""
        dst = tmp_path_factory.mktemp("use_case_features") / "test-usecase-features"

        run_copier(
            str(dst),
            data={
                "list_type": "use-case",
                "shortname": "test_usecase",
                "name": "Test Use Case",
                "description": "A test use case",
            },
        )
        return dst

    def test_use_case_features_schema_reference(self, use_case_features_dst):
        """Test that use-case list_type references use-case-schema.yaml."""
        content = (use_case_features_dst / "features.yaml").read_text()
        assert "use-case-schema.yaml" in content

    def test_use_case_features_codeowners(self, use_case_features_dst):
        """Test that use-case features have CODEOWNERS pointing to use-cases/."""
        content = (use_case_features_dst / "features.yaml").read_text()
        assert "use-cases/test_usecase/features.yaml" in content

    def test_use_case_features_assumptions(self, use_case_features_dst):
        """Test that use-case features have assumptions field."""
        features = yaml.safe_load((use_case_features_dst / "features.yaml").read_text())
        assert "assumptions" in features
        assert isinstance(features["assumptions"], list)
