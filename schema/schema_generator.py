# SPDX-FileCopyrightText: openmod-features contributors
#
# SPDX-License-Identifier: MIT

"""Tool feature schema generator."""

import textwrap
from pathlib import Path
from typing import Annotated, Any, Literal

import click
import pydantic
import yaml
from pydantic import Field, create_model
from pydantic_core import Url

HttpsUrl = Annotated[
    Url, pydantic.UrlConstraints(max_length=2083, allowed_schemes=["https"])
]
"""A URL that must use the `https` scheme."""

FEATURES = yaml.safe_load((Path(__file__).parent / "features.yaml").read_text())


class AssumptionsModel(pydantic.RootModel):
    """Feature-level fields."""

    model_config = {"use_attribute_docstrings": True}
    root: list[str] = Field(default_factory=list)
    """List of assumptions made when assigning feature values."""


class UseCaseFeatureModel(pydantic.BaseModel):
    """Feature-level fields."""

    model_config = {"extra": "forbid", "use_attribute_docstrings": True}
    value: Literal["y", "n", "?"] = "?"
    """Whether a feature is required (`y`) or not (`n`) in the use-case.
    Defaults to unknown (`?`).
    """


class ToolFeatureModel(pydantic.BaseModel):
    """Feature-level fields."""

    model_config = {"extra": "forbid", "use_attribute_docstrings": True}
    value: Literal["y", "n", "dev", "?"] = "?"
    """Whether a feature exists (`y`) or not (`n`), or is in development (`dev`) in the tool.
    Defaults to unknown (`?`).
    """

    source: list[HttpsUrl] = Field(default_factory=list)
    """Link(s) to source to validate the given value.
    This is usually used to validate a `y` (documentation link) or `dev` (issue or pull request link) but can feasibly be used to validate an `n`."""


def create_feature_model(
    feature_model: type[pydantic.BaseModel],
) -> type[pydantic.BaseModel]:
    """Create a Pydantic model to describe the tool feature schema.

    Returns:
        ToolFeatureModel: Tool feature schema.
    """
    feature_models: dict[str, Any] = {}
    for grp, grp_info in FEATURES.items():
        member_model: dict[str, Any] = {
            feature: (feature_model, Field(default=feature_model(), description=desc))
            for feature, desc in grp_info["members"].items()
        }
        group_model = create_model(
            grp.replace("_", " ").title().replace(" ", "") + "Model",
            __config__={"extra": "forbid"},
            **member_model,
        )
        feature_models[grp] = (
            group_model,
            Field(default=group_model(), description=grp_info["description"]),
        )
    feature_set = create_model("FeatureSetModel", **feature_models)
    return feature_set


def dump_tool_schema(schema_dir: Path) -> type[pydantic.BaseModel]:
    """Create a Pydantic model to describe the tool feature schema.

    Returns:
        ToolFeatureModel: Tool feature schema.
    """
    feature_list_schema = create_feature_model(ToolFeatureModel)
    feature_model_schema = create_model(
        "ToolFeatureModel",
        __config__={"extra": "forbid"},
        features=(
            feature_list_schema,
            Field(default=feature_list_schema(), description="Tool feature set."),
        ),
    )

    schema_path = schema_dir / "tool-schema.yaml"
    schema_path.write_text(yaml.safe_dump(feature_model_schema.model_json_schema()))

    return feature_model_schema


def dump_use_case_schema(schema_dir: Path) -> type[pydantic.BaseModel]:
    """Create a Pydantic model to describe the use-case feature schema.

    Returns:
        UseCaseFeatureModel: Use-case feature schema.
    """
    feature_list_schema = create_feature_model(UseCaseFeatureModel)
    feature_model_schema = create_model(
        "UseCaseFeatureModel",
        __config__={"extra": "forbid"},
        assumptions=(
            AssumptionsModel,
            Field(default=AssumptionsModel(), description="Use-case assumptions."),
        ),
        features=(
            feature_list_schema,
            Field(
                default=feature_list_schema(),
                description="Use-case feature requirements.",
            ),
        ),
    )
    schema_path = schema_dir / "use-case-schema.yaml"
    schema_path.write_text(yaml.safe_dump(feature_model_schema.model_json_schema()))
    return feature_model_schema


def dump_feature_template(
    template_dir: Path,
    feature_model: pydantic.BaseModel,
    list_type: Literal["tool", "use-case"],
):
    """Create a feature YAML template from the given feature model.

    Args:
        template_dir (Path): Directory to write the template to.
        feature_model (pydantic.BaseModel): Feature model to base the template on.
        list_type (Literal["tool", "use-case"]): Type of feature list.
    """
    feature_dict = feature_model.model_dump(mode="json")
    feature_template_path = (
        template_dir
        / f"{{% if list_type == '{list_type}' %}}features.yaml{{% endif %}}.jinja"
    )
    header = textwrap.dedent(f"""
    # SPDX-FileCopyrightText: {list_type}s/{{{{ shortname }}}}/features.yaml CODEOWNERS
    # SPDX-FileCopyrightText: openmod-features contributors
    #
    # SPDX-License-Identifier: CC-BY-4.0

    # yaml-language-server: $schema=https://raw.githubusercontent.com/open-energy-transition/openmod-features/{{{{ _copier_answers._commit }}}}/schema/{list_type}-schema.yaml
    """)
    feature_template_path.write_text(f"{header}\n{yaml.safe_dump(feature_dict)}")


@click.command()
def cli():
    """Create a schema YAML file from the current state of the schema model."""
    cwd = Path(__file__).parent
    schema_dir = cwd
    template_dir = cwd / ".." / "template"

    tool_model = dump_tool_schema(schema_dir)
    dump_feature_template(template_dir, tool_model(), "tool")

    use_case_model = dump_use_case_schema(schema_dir)
    dump_feature_template(template_dir, use_case_model(), "use-case")


if __name__ == "__main__":
    cli()
