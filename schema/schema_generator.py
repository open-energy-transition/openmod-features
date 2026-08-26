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


RESERVED_NAMES = frozenset({"source", "value", "description", "members"})
"""Names a taxonomy member may not take, as they collide with schema-level keys."""


def _pascal(name: str) -> str:
    """Convert a `snake_case` taxonomy name into a PascalCase model-name fragment."""
    return name.replace("_", " ").title().replace(" ", "")


def _validate_branch(node: dict, path: tuple[str, ...]) -> dict[str, Any]:
    """Check a branch node's shape and return its members.

    Args:
        node (dict): Branch node, expected to hold exactly `description` and `members`.
        path (tuple[str, ...]): Taxonomy path to the node, for error messages.

    Returns:
        dict[str, Any]: The branch's members.
    """
    label = ".".join(path) or "<root>"
    if set(node) != {"description", "members"}:
        raise ValueError(
            f"`{label}` must declare exactly `description` and `members`; "
            f"got {sorted(node)}."
        )
    members = node["members"]
    if not isinstance(members, dict) or len(members) < 2:
        raise ValueError(
            f"`{label}` declares {len(members) if isinstance(members, dict) else 0} "
            "member(s); a branch must declare at least two members, "
            "otherwise leave it a leaf."
        )
    for member in members:
        if not member.isidentifier() or "__" in member:
            raise ValueError(
                f"`{label}.{member}` is not a valid taxonomy name: names must be "
                "valid Python identifiers and must not contain a double underscore "
                "(nest the members instead)."
            )
        if member in RESERVED_NAMES:
            raise ValueError(
                f"`{label}.{member}` uses the reserved name `{member}`; "
                f"reserved names are {sorted(RESERVED_NAMES)}."
            )
    return members


def build_node(
    node: str | dict,
    path: tuple[str, ...],
    leaf_model: type[pydantic.BaseModel],
    seen: dict[str, tuple[str, ...]],
) -> tuple[type[pydantic.BaseModel], str]:
    """Recursively build a Pydantic model for a taxonomy node.

    A node is either a leaf (a string, which is its description) or a branch
    (a mapping of `description` and `members`, whose members are themselves nodes).

    Args:
        node (str | dict): The taxonomy node to build a model for.
        path (tuple[str, ...]): Taxonomy path to the node, used for model naming and errors.
        leaf_model (type[pydantic.BaseModel]): Model to use for leaves
            (`ToolFeatureModel` or `UseCaseFeatureModel`).
        seen (dict[str, tuple[str, ...]]): Registry of generated model names to the path
            that generated them, used to detect name collisions.

    Returns:
        tuple[type[pydantic.BaseModel], str]: The node's model and its description.
    """
    if isinstance(node, str):
        return leaf_model, node

    members = _validate_branch(node, path)
    name = _pascal("_".join(path)) + "Model" if path else "FeatureSetModel"
    if name in seen:
        raise ValueError(
            f"`{'.'.join(path)}` and `{'.'.join(seen[name])}` both generate the model "
            f"name `{name}`; rename one of them."
        )
    seen[name] = path

    fields: dict[str, Any] = {}
    for member, member_node in members.items():
        member_model, desc = build_node(member_node, (*path, member), leaf_model, seen)
        fields[member] = (
            member_model,
            Field(default_factory=member_model, description=desc),
        )
    return create_model(name, __config__={"extra": "forbid"}, **fields), node[
        "description"
    ]


def create_feature_model(
    feature_model: type[pydantic.BaseModel],
) -> type[pydantic.BaseModel]:
    """Create a Pydantic model to describe the tool feature schema.

    Returns:
        ToolFeatureModel: Tool feature schema.
    """
    feature_set, _ = build_node(
        {"description": "Feature set.", "members": FEATURES}, (), feature_model, {}
    )
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
    feature_template_path.write_text(
        f"{header}\n{yaml.safe_dump(feature_dict, sort_keys=False)}"
    )


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
