# SPDX-FileCopyrightText: openmod-features contributors
#
# SPDX-License-Identifier: MIT

"""Pre-commit hook to validate YAML files against their referenced schemas.

This script:
1. Finds all features.yaml files in tools/** and use-cases/** directories
2. Extracts the schema URL from the yaml-language-server comment
3. Downloads the schema from the URL
4. Validates the YAML file against the schema

The hook runs automatically on commit for any modified `features.yaml` files in the `tools/` or `use-cases/` directories.

You can also run it manually:

```bash
# Validate all features.yaml files
pixi run python .pre-commit-hooks/validate-yaml-schemas.py

# Validate specific files
pixi run python .pre-commit-hooks/validate-yaml-schemas.py tools/calliope/features.yaml

# Run via pre-commit
pixi run pre-commit run validate-yaml-schemas --all-files
```

Written with support from Claude Sonnet 4.5.
"""

import functools
import re
import sys
import textwrap
from pathlib import Path

import click
import jsonschema
import requests
import yaml


def extract_schema_url(yaml_file: Path) -> str | None:
    """Extract the schema URL from the yaml-language-server comment."""
    for line in yaml_file.read_text().splitlines():
        if match := re.search(r"# yaml-language-server: \$schema=(\S+)", line):
            # Extract URL from comment like:
            # `# yaml-language-server: $schema=https://example.com/schema.yaml`
            return match.group(1)
    return None


@functools.lru_cache(maxsize=32)
def download_schema(url: str) -> dict:
    """Download schema from URL and return as dict."""
    response = requests.get(url)
    response.raise_for_status()
    schema = yaml.safe_load(response.text)
    return schema


def validate_yaml_file(yaml_file: Path) -> tuple[bool, str]:
    """Validate a YAML file against its referenced schema.

    Returns:
        Tuple of (success, error_message)
    """
    # Extract schema URL
    schema_url = extract_schema_url(yaml_file)
    if not schema_url:
        return False, f"No schema URL found in {yaml_file}"

    # Download schema
    try:
        schema = download_schema(schema_url)
    except Exception as e:
        return False, f"Failed to download schema from {schema_url}: {e}"

    # Load YAML file
    try:
        data = yaml.safe_load(yaml_file.read_text())
    except Exception as e:
        return False, f"Failed to parse YAML file {yaml_file}: {e}"

    # Validate against schema
    try:
        validator = jsonschema.Draft202012Validator(schema)
        errors = list(validator.iter_errors(data))  # get all validation errors
        if errors:
            error_messages = [f"Validation error(s) in {yaml_file}:"]
            for error in errors:
                error_path = (
                    " -> ".join(str(p) for p in error.path) if error.path else "root"
                )
                error_messages.append(f"{error_path}: {error.message}")
            return False, "\n".join(error_messages)
        else:
            return True, ""

    except Exception as e:
        return False, f"Validation failed for {yaml_file}: {e}"


@click.command()
@click.argument(
    "files",
    nargs=-1,
    type=click.Path(dir_okay=False, file_okay=True, exists=True, path_type=Path),
)
def main(files: tuple[Path, ...]):
    """Validate YAML files against their referenced schemas.

    If no FILES are provided, checks all tools/**/features.yaml and
    use-cases/**/features.yaml files.
    """
    # Determine which files to check
    if files:
        yaml_files = list(files)
    else:
        # Find all features.yaml files in tools/** and use-cases/**
        repo_root = Path(__file__).parent.parent
        yaml_files = []
        yaml_files.extend(repo_root.glob("tools/**/features.yaml"))
        yaml_files.extend(repo_root.glob("use-cases/**/features.yaml"))

    if not yaml_files:
        click.echo("No YAML files to validate")
        sys.exit(0)

    # Validate each file
    errors = []
    for yaml_file in yaml_files:
        click.echo(f"Validating {yaml_file}...", nl=False)
        success, error_msg = validate_yaml_file(yaml_file)

        if success:
            click.echo(" ✓")
        else:
            click.echo(" ✗")
            errors.append(error_msg)

    # Report results
    if errors:
        separator = "=" * 80
        error_report = textwrap.dedent(f"""
            {separator}
            VALIDATION ERRORS:
            {separator}
        """).strip()

        errors_text = "\n\n".join(errors)

        click.echo(f"\n{error_report}\n\n{errors_text}\n\n{separator}")
        sys.exit(1)
    else:
        click.echo(f"\nAll {len(yaml_files)} file(s) validated successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
