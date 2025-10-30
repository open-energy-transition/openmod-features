# SPDX-FileCopyrightText: openmod-features contributors
#
# SPDX-License-Identifier: MIT

"""Test the YAML schema validation pre-commit hook.

Written with support from Claude Sonnet 4.5.
"""

import subprocess
from collections.abc import Callable
from pathlib import Path

import pytest


@pytest.fixture
def repo_root() -> Path:
    """Return the repository root directory."""
    return Path(__file__).parent.parent


@pytest.fixture
def validator_script(repo_root: Path) -> Path:
    """Return the path to the validator script."""
    return repo_root / ".pre-commit-hooks" / "validate-yaml-schemas.py"


@pytest.fixture
def run_process(repo_root) -> Callable:
    """Run a command at the repo root level."""

    def _run_process(*args: str | Path) -> subprocess.CompletedProcess:
        return subprocess.run(
            [str(arg) for arg in args], cwd=repo_root, capture_output=True, text=True
        )

    return _run_process


def test_validate_all_features_yaml(run_process, validator_script: Path):
    """Test that all features.yaml files validate successfully."""
    result = run_process("python", validator_script)

    assert result.returncode == 0, (
        f"Validation failed:\n{result.stdout}\n{result.stderr}"
    )
    assert "validated successfully" in result.stdout


def test_validate_specific_file(run_process, repo_root: Path, validator_script: Path):
    """Test validating a specific features.yaml file."""
    test_file = repo_root / "tools" / "calliope" / "features.yaml"

    result = run_process("python", validator_script, test_file)

    assert result.returncode == 0, (
        f"Validation failed:\n{result.stdout}\n{result.stderr}"
    )
    assert "[OK]" in result.stdout or "validated successfully" in result.stdout


def test_validate_invalid_file(run_process, tmp_path: Path, validator_script: Path):
    """Test that validation fails for files without schema URL."""
    # Create a test file without schema URL
    test_file = tmp_path / "test-features.yaml"
    test_file.write_text("features:\n  test: value\n")

    result = run_process("python", validator_script, test_file)

    assert result.returncode == 1, "Validation should have failed"
    assert "No schema URL found" in result.stdout


def test_pre_commit_hook(run_process):
    """Test that the pre-commit hook runs successfully."""
    result = run_process("pre-commit", "run", "validate-yaml-schemas", "--all-files")

    # The hook should pass if all files are valid
    assert result.returncode == 0, (
        f"Pre-commit hook failed:\n{result.stdout}\n{result.stderr}"
    )
    assert "Passed" in result.stdout or "passed" in result.stdout.lower()
