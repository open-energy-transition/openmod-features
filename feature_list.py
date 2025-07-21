"""Tool tracker core functions."""

import sys
from pathlib import Path

import click
import yaml
from pydantic import ValidationError

from schema import schema_generator


@click.group(invoke_without_command=True)
def cli():
    """Open Energy Modelling Tool Tracker core functions."""
    pass


@cli.command()
@click.option("--name", "-n", prompt=True, help="Tool name")
@click.option(
    "--source_code_url",
    "-sc",
    prompt=True,
    help="Tool git repository source code URL (with leading `https`)",
)
@click.option(
    "--maintainers",
    "-m",
    multiple=True,
    help="Tool feature list maintainer(s), using git login IDs",
)
@click.option(
    "--shortname",
    "-sn",
    default=None,
    help="Tool short name (limited to alphanumeric + `_` or `-`)",
)
@click.option(
    "--docs_url",
    "-d",
    default=None,
    help="Tool docs site URL, if available (with leading `https`)",
)
@click.option(
    "--overwrite",
    "-o",
    is_flag=True,
    help="If given and the tool config file already exists, it will be overwritten with a fresh config populated with default values.",
)
def generate_tool_config(
    name: str,
    shortname: str | None,
    source_code_url: str,
    maintainers: list[str],
    docs_url: str | None,
    overwrite: bool,
):
    """Generate a new tool configuration YAML file."""
    if not maintainers:
        maintainers = click.prompt(
            "Please provide a list of feature list maintainer git login IDs separated with spaces or commas",
            type=list[str],
            value_proc=lambda x: x.replace(",", " ").split(" "),
        )

    if shortname is None:
        shortname = name
    try:
        tool_feature_model = schema_generator.create_feature_model()(
            name=name,
            shortname=shortname,
            source_code=source_code_url,
            docs=docs_url,
            maintainers=maintainers,
        )
    except ValidationError as err:
        click.secho(err, err=True, color=True, fg="red")
        sys.exit(1)

    tool_feature_dict = tool_feature_model.model_dump(mode="json")

    tool_feature_path = (Path("tools") / tool_feature_model.shortname).with_suffix(
        ".yaml"
    )
    if not overwrite and tool_feature_path.exists():
        overwrite = click.prompt(
            f"{shortname}.yaml already exists in the tool list. Do you want to overwrite it (y/n)?",
            type=bool,
            err=True,
        )
        if not overwrite:
            click.secho(
                f"{shortname}.yaml already exists in the tool list; use the `--overwrite` flag to overwrite it with a fresh config.",
                err=True,
                color=True,
                fg="red",
            )
            sys.exit(1)
    header = "# yaml-language-server: $schema=../schema/schema.yaml"
    tool_feature_path.write_text(f"{header}\n{yaml.safe_dump(tool_feature_dict)}")


if __name__ == "__main__":
    cli()
