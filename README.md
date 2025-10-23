<!--
SPDX-FileCopyrightText: openmod-features contributors

SPDX-License-Identifier: MIT
-->

# Open Energy Modelling Tool Feature Inventory

This is a repository containing:

- feature lists for open-source energy system modelling tools.
- feature requirements for typical energy system modelling use-cases.

By matching tool feature lists to use-cases, it is possible to see how well open energy system modelling tools are meeting decision-making needs and to highlight feature gaps.

This repository is community-driven - we rely on tool users and developers to contribute feature lists.
It is also continually evolving as we refine the feature taxonomy and use-cases through stakeholder engagement.
We welcome all contributions, whether to [add](#add-your-tool) or [update](#updating-your-tool) a tool feature list, or to [contribute use-cases](#add-a-use-case).

Some key features of our repository are:

1. A versioned feature taxonomy, with feature lists explicitly linked to a taxonomy version at all times.
1. Tool feature validation, through per-feature URL references to tool documentation, studies, or source code.
1. Explicit feature list maintainers - we distribute responsibility to maintain lists to ensure they can be kept up-to-date.
1. (WIP) Automated pipeline to update feature lists to new taxonomy versions and notify list maintainers of the need to review those changes.

## Installation

1. Clone this repository
1. Install [pixi](https://pixi.sh/latest/).

## Add your tool

You can generate a configuration file for your tool using:

```sh
pixi run add-tool <tool-shortname>
```

>[!NOTE]
>We cannot accept dashes (`-`) in tool shortnames.

You will be prompted to add in your tool name, source code URL, and _feature list_ maintainers.
You can also optionally provide a documentation site URL and a longer description.

>[!NOTE]
>`maintainers` are _not_ the tool maintainers, but those who will be assigned responsibility to review future changes to the feature list in this repository.

## Updating your tool

### Updating features

Once your tool config file has been generated, you will find it under `tools/<tool-shortname>/`.
You will then be able to update your tool's feature list at `tools/<tool-shortname>/features.yaml`.

All tool features default to values of `n`, i.e., not available in your tool.
You should update each to a value of `y` if that feature is available, or `dev` if it is actively in development.
For each, add a `source` key pointing to URL (e.g. in your documentation, a Pull Request, a test) in which that feature is explicitly referenced.
The `source` key is not _required_ but your feature will show as unvalidated if it is missing.

#### Understanding each feature

All feature descriptions are in `schema/features.yaml`.
However, you may find it more useful to have descriptions for each of the features directly when working in your tool's features file.
You can access them as tooltips [in your favourite IDE](https://github.com/redhat-developer/yaml-language-server?tab=readme-ov-file#clients).
Activating tooltips will also provide schema validation highlighting.

#### Checking source links

You can check that all your source links are valid before you commit your changes by running:

```sh
pixi run check-links <tool-shortname>
```

Omitting `<tool-shortname>` will check source links in all tools in our inventory.

>[!NOTE]
>We will also check these links as a Pull Request action, so it isn't mandatory for you to check links locally before committing.

### Updating tool metadata

If you change your mind about any of the answers you gave when [adding your tool](#add-your-tool), you can update them by calling:

```sh
pixi run update-tool-metadata <tool-shortname>
```

### Updating tool to a new feature list

We will periodically update the feature list itself.
To update your project's current list to the newest stable feature release you can call:

```sh
pixi run update-tool <tool-shortname>
```

If you have a specific git tag/commit hash/branch of the feature list you want to update to, you can refer to that version in your call:

```sh
pixi run update-tool <tool-shortname> <version>
```

For instance:

```sh
pixi run update-tool my_tool v0.3.0
```

>[!NOTE]
>You will likely find that on updating your feature list that there are merge conflicts that you will have to resolve.
>This could happen when we change a feature name or reorganise the feature levels.
>Check the project [changelog](./CHANGELOG.md) to help decipher any merge conflicts that are unclear.

## Add a use-case

You can generate a configuration file for your use-case using:

```sh
pixi run add-use-case <use-case-shortname>
```

>[!NOTE]
>We cannot accept dashes (`-`) in shortnames.

You will be prompted to add in your use-case name, description, and _feature list_ maintainers.
You can also optionally provide a documentation site URL.

### Updating your use-case

Updating use-case metadata or feature list version is identical to [updating a tool feature list](#updating-your-tool), except that you run the following `pixi` tasks:

```sh
pixi run update-use-case-metadata <use-case-shortname>
```

```sh
pixi run update-use-case <use-case-shortname>
```

## License

This project uses [REUSE](https://reuse.software/) to manage its licensing.

For a list of all `openmod-features contributors`, see [AUTHORS.md](AUTHORS.md).
For a list of all additional tool-level feature list (`tools/**/features.yaml`) contributors, see the GitHub tags linked to each file in `.github/CODEOWNERS`.

The software in this repository is licensed under the [MIT license](LICENSES/MIT.txt).
The generated output data (`tools/*`, `use-cases/*`, `schema/schema.yaml`) are licensed under the [Creative Commons Attribution 4.0 license](LICENSES/CC-BY-4.0.txt) for easier reuse.
Individual configuration or generic files may be licensed [CC0 1.0 Universal](LICENSES/CC0-1.0.txt); these files are marked explicitly either in the file header or in the [REUSE.toml](REUSE.toml) file.
