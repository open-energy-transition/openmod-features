"""Tool feature schema generator."""

import subprocess
from collections.abc import Hashable
from pathlib import Path
from typing import Annotated, Any, Literal, TypeVar

import click
import pydantic
import yaml
from annotated_types import Len
from pydantic import AfterValidator, Field, computed_field, create_model
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
    value: Literal["y", "n"] = "n"
    """Whether a feature exists (`y`) or not (`n`) in the tool."""

    source: list[HttpsUrl] = Field(default_factory=list)
    """Link(s) to source to validate the given value.
    This is usually used to validate a `y` but can feasibly be used to validate an `n`."""


class ToolFeatureModel(pydantic.BaseModel):
    """Top-level tool feature fields."""

    model_config = {"extra": "forbid", "use_attribute_docstrings": True}
    name: str
    """Tool full name (i.e. not abbreviated)."""

    shortname: str
    """Tool short name (i.e. abbreviated), often used when referencing the tool when scripting or in the CLI."""

    source_code: HttpsUrl
    """Tool source code git repository URL."""

    docs: HttpsUrl | None = None
    """Tool documentation URL, if available."""

    maintainers: NonEmptyUniqueList
    """
    Feature list maintainers.
    These must be given as valid git host usernames.
    List maintainers need not be the same as tool maintainers.
    """

    @computed_field
    @property
    def feature_list_version(self) -> str:
        """The version of the schema used to validate this tool feature file."""
        return (
            subprocess.check_output(["pixi", "project", "version", "get"])
            .decode()
            .strip()
        )


def create_feature_model() -> type[ToolFeatureModel]:
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
        __base__=ToolFeatureModel,
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
        yaml.safe_dump(feature_model_schema.model_json_schema(mode="serialization"))
    )


if __name__ == "__main__":
    cli()
