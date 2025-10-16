"""Tool feature schema generator."""

from collections.abc import Hashable
from pathlib import Path
from typing import Annotated, Any, Literal, TypeVar

import click
import pydantic
import yaml
from annotated_types import Len
from pydantic import AfterValidator, Field, create_model
from pydantic_core import PydanticCustomError, Url

HttpsUrl = Annotated[
    Url, pydantic.UrlConstraints(max_length=2083, allowed_schemes=["https"])
]
"""A URL that must use the `https` scheme."""

# ===
# Modified from https://github.com/calliope-project/calliope/blob/9127604d7840d51486a66d12882b5e58d5aa4793/src/calliope/schemas/general.py
T = TypeVar("T", bound=Hashable | list)


def _validate_unique_list(v: list) -> list:
    try:
        unique = set(v)
    except TypeError:
        unique = set([tuple(i) for i in v])
    if len(v) != len(unique):
        raise PydanticCustomError("unique_list", "List must be unique")
    return v


UniqueList = Annotated[
    list[T],
    AfterValidator(_validate_unique_list),
    Field(json_schema_extra={"uniqueItems": True}),
]
"""A list with no repeated values."""
NonEmptyList = Annotated[list[T], Len(min_length=1)]
"""A list with at least one value in it."""
NonEmptyUniqueList = Annotated[UniqueList[T], Len(min_length=1)]
"""A list with at least one value in it and no repeated values."""
# ==

FEATURES = yaml.safe_load((Path(__file__).parent / "features.yaml").read_text())


class FeatureModel(pydantic.BaseModel):
    """Feature-level fields."""

    model_config = {"extra": "forbid", "use_attribute_docstrings": True}
    value: Literal["y", "n", "dev"] = "n"
    """Whether a feature exists (`y`) or not (`n`), or is in development (`dev`) in the tool."""

    source: list[HttpsUrl] = Field(default_factory=list)
    """Link(s) to source to validate the given value.
    This is usually used to validate a `y` (documentation link) or `dev` (issue or pull request link) but can feasibly be used to validate an `n`."""


def create_feature_model() -> type[pydantic.BaseModel]:
    """Create a Pydantic model to describe the tool feature schema.

    Returns:
        ToolFeatureModel: Tool feature schema.
    """
    feature_models: dict[str, Any] = {}
    for grp, grp_info in FEATURES.items():
        member_model: dict[str, Any] = {
            feature: (FeatureModel, Field(default=FeatureModel(), description=desc))
            for feature, desc in grp_info["members"].items()
        }
        group_model = create_model(
            grp.replace("_", " ").title().replace(" ", "") + "Model", **member_model
        )
        feature_models[grp] = (
            group_model,
            Field(default=group_model(), description=grp_info["description"]),
        )
    feature_set = create_model("FeatureSetModel", **feature_models)
    return create_model(
        "ToolFeatureModel",
        __config__={"extra": "forbid", "use_attribute_docstrings": True},
        features=(
            feature_set,
            Field(default=feature_set(), description="Tool feature set."),
        ),
    )


@click.command()
def cli():
    """Create a schema YAML file from the current state of the schema model."""
    feature_model_schema = create_feature_model()
    (Path(__file__).parent / "schema.yaml").write_text(
        yaml.safe_dump(feature_model_schema.model_json_schema())
    )

    tool_feature_dict = feature_model_schema().model_dump(mode="json")

    tool_feature_path = Path("template/features.yaml.jinja")
    header = "# yaml-language-server: $schema=https://raw.githubusercontent.com/open-energy-transition/openmod-features/{{ _copier_answers._commit }}/schema/schema.yaml"
    tool_feature_path.write_text(f"{header}\n{yaml.safe_dump(tool_feature_dict)}")


if __name__ == "__main__":
    cli()
